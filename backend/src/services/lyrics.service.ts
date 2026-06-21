import { Song } from "../models/song.model.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

class LyricsService {
    public cleanLyrics(lyrics: string): string {
        if (!lyrics) return "";
        // Remove LRC timestamps (e.g. [00:12.34] or [01:23.456] or [02:10])
        let cleaned = lyrics.replace(/\[\d+:\d+(?:\.\d+)?\]/g, "");
        // Normalize newlines
        cleaned = cleaned.replace(/\r\n/g, "\n");
        // Trim lines and remove duplicate empty lines
        return cleaned
            .split("\n")
            .map(line => line.trim())
            .filter((line, index, arr) => line !== "" || (index > 0 && arr[index - 1] !== ""))
            .join("\n")
            .trim();
    }

    public async getLyricsFromAI(songName: string, artistName: string): Promise<string | null> {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.log("[LyricsService] No GEMINI_API_KEY provided, bypassing AI generation.");
            return null;
        }

        try {
            console.log(`[LyricsService] Querying Gemini AI for lyrics of: ${songName} - ${artistName}`);
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `Write the lyrics for the song "${songName}" by "${artistName}".
If you know the official lyrics, please write the official lyrics exactly.
If you do not know the official lyrics or if it is an instrumental/indie song, write high-quality, creative, and beautiful song lyrics in the style of "${artistName}".
Do not include any introduction, explanations, meta-commentary, or markdown formatting (like \`\`\` or \`\`\`lyrics). Just return the plain text lyrics directly.`;

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            if (text && text.trim().length > 0) {
                return text.trim();
            }
        } catch (error) {
            console.error("[LyricsService] Error generating lyrics with Gemini AI:", error);
        }
        return null;
    }

    public async getLyrics(songName: string, artistName: string): Promise<{ lyrics: string; source: string } | null> {
        try {
            console.log(`[LyricsService] Attempting to fetch lyrics for: ${songName} - ${artistName}`);

            // 1. Try Gemini AI first
            const aiLyrics = await this.getLyricsFromAI(songName, artistName);
            if (aiLyrics) {
                console.log(`[LyricsService] Successfully generated lyrics via Gemini AI`);
                return {
                    lyrics: aiLyrics,
                    source: "Gemini AI"
                };
            }

            console.log(`[LyricsService] Gemini AI failed or bypassed. Trying LRCLIB search...`);

            // 2. Try LRCLIB search endpoint by track_name & artist_name
            const lrclibUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(songName)}&artist_name=${encodeURIComponent(artistName)}`;
            const lrclibResponse = await fetch(lrclibUrl, {
                headers: { "User-Agent": "SociTune/1.0.0 (https://github.com/Aditya1286/SociTune)" },
                signal: AbortSignal.timeout(10000)
            });

            if (lrclibResponse.ok) {
                const results = (await lrclibResponse.json()) as any;
                if (Array.isArray(results) && results.length > 0) {
                    // Find first record with lyrics
                    const record = results.find(r => r.plainLyrics || r.syncedLyrics);
                    if (record) {
                        const rawLyrics = record.plainLyrics || record.syncedLyrics;
                        if (rawLyrics) {
                            console.log(`[LyricsService] Found lyrics on LRCLIB via search (specific)`);
                            return {
                                lyrics: this.cleanLyrics(rawLyrics),
                                source: "LRCLIB"
                            };
                        }
                    }
                }
            }

            // 3. Try LRCLIB search with general query 'artist song'
            const lrclibGeneralUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${artistName} ${songName}`)}`;
            const lrclibGeneralResponse = await fetch(lrclibGeneralUrl, {
                headers: { "User-Agent": "SociTune/1.0.0 (https://github.com/Aditya1286/SociTune)" },
                signal: AbortSignal.timeout(10000)
            });

            if (lrclibGeneralResponse.ok) {
                const results = (await lrclibGeneralResponse.json()) as any;
                if (Array.isArray(results) && results.length > 0) {
                    const record = results.find(r => r.plainLyrics || r.syncedLyrics);
                    if (record) {
                        const rawLyrics = record.plainLyrics || record.syncedLyrics;
                        if (rawLyrics) {
                            console.log(`[LyricsService] Found lyrics on LRCLIB via search (general)`);
                            return {
                                lyrics: this.cleanLyrics(rawLyrics),
                                source: "LRCLIB"
                            };
                        }
                    }
                }
            }

            // 4. Fallback to Lyrics.ovh API
            console.log(`[LyricsService] Lyrics not found on LRCLIB. Trying Lyrics.ovh...`);
            const ovhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(artistName)}/${encodeURIComponent(songName)}`;
            const ovhResponse = await fetch(ovhUrl, {
                signal: AbortSignal.timeout(10000)
            });

            if (ovhResponse.ok) {
                const data = (await ovhResponse.json()) as any;
                if (data && data.lyrics) {
                    console.log(`[LyricsService] Found lyrics on Lyrics.ovh`);
                    return {
                        lyrics: this.cleanLyrics(data.lyrics),
                        source: "Lyrics.ovh"
                    };
                }
            }
        } catch (error) {
            console.error(`[LyricsService] Error fetching lyrics:`, error);
        }

        console.log(`[LyricsService] No lyrics found for ${songName} - ${artistName} (attempted fallback)`);
        return null;
    }

    public async fetchAndSaveLyrics(songId: string): Promise<void> {
        try {
            const song = await Song.findById(songId);
            if (!song) {
                console.log(`[LyricsService] Song not found: ${songId}`);
                return;
            }

            // Avoid duplicate API calls if we already have valid lyrics
            if (song.lyrics !== null && song.lyrics !== "" && song.lyricsSource !== "None") {
                console.log(`[LyricsService] Valid lyrics already exist in DB for: ${song.title}`);
                return;
            }

            const result = await this.getLyrics(song.title, song.artist);
            if (result) {
                await Song.findByIdAndUpdate(songId, {
                    lyrics: result.lyrics,
                    lyricsSource: result.source,
                    lyricsFetchedAt: new Date()
                });
                console.log(`[LyricsService] Cached lyrics in MongoDB for: ${song.title}`);
            } else {
                // Save empty lyrics to mark that we attempted to fetch, preventing future calls
                await Song.findByIdAndUpdate(songId, {
                    lyrics: "",
                    lyricsSource: "None",
                    lyricsFetchedAt: new Date()
                });
                console.log(`[LyricsService] Marked lyrics as unavailable in DB for: ${song.title}`);
            }
        } catch (error) {
            console.error(`[LyricsService] Failed in fetchAndSaveLyrics for song ${songId}:`, error);
        }
    }
}

export default LyricsService;
