import { Song } from "../models/song.model.js";
class LyricsService {
    cleanLyrics(lyrics) {
        if (!lyrics)
            return "";
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
    async getLyrics(songName, artistName) {
        try {
            console.log(`[LyricsService] Attempting to fetch lyrics for: ${songName} - ${artistName}`);
            // 1. Try LRCLIB search endpoint by track_name & artist_name
            const lrclibUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(songName)}&artist_name=${encodeURIComponent(artistName)}`;
            const lrclibResponse = await fetch(lrclibUrl, {
                headers: { "User-Agent": "SociTune/1.0.0 (https://github.com/Aditya1286/SociTune)" },
                signal: AbortSignal.timeout(1500)
            });
            if (lrclibResponse.ok) {
                const results = await lrclibResponse.json();
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
            // 2. Try LRCLIB search with general query 'artist song'
            const lrclibGeneralUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${artistName} ${songName}`)}`;
            const lrclibGeneralResponse = await fetch(lrclibGeneralUrl, {
                headers: { "User-Agent": "SociTune/1.0.0 (https://github.com/Aditya1286/SociTune)" },
                signal: AbortSignal.timeout(1500)
            });
            if (lrclibGeneralResponse.ok) {
                const results = await lrclibGeneralResponse.json();
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
            // 3. Fallback to Lyrics.ovh API
            console.log(`[LyricsService] Lyrics not found on LRCLIB. Trying Lyrics.ovh...`);
            const ovhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(artistName)}/${encodeURIComponent(songName)}`;
            const ovhResponse = await fetch(ovhUrl, {
                signal: AbortSignal.timeout(1500)
            });
            if (ovhResponse.ok) {
                const data = await ovhResponse.json();
                if (data && data.lyrics) {
                    console.log(`[LyricsService] Found lyrics on Lyrics.ovh`);
                    return {
                        lyrics: this.cleanLyrics(data.lyrics),
                        source: "Lyrics.ovh"
                    };
                }
            }
        }
        catch (error) {
            console.error(`[LyricsService] Error fetching lyrics:`, error);
        }
        console.log(`[LyricsService] No lyrics found for ${songName} - ${artistName}`);
        return null;
    }
    async fetchAndSaveLyrics(songId) {
        try {
            const song = await Song.findById(songId);
            if (!song) {
                console.log(`[LyricsService] Song not found: ${songId}`);
                return;
            }
            // Avoid duplicate API calls
            if (song.lyrics !== null) {
                console.log(`[LyricsService] Lyrics already exist in DB for: ${song.title}`);
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
            }
            else {
                // Save empty lyrics to mark that we attempted to fetch, preventing future calls
                await Song.findByIdAndUpdate(songId, {
                    lyrics: "",
                    lyricsSource: "None",
                    lyricsFetchedAt: new Date()
                });
                console.log(`[LyricsService] Marked lyrics as unavailable in DB for: ${song.title}`);
            }
        }
        catch (error) {
            console.error(`[LyricsService] Failed in fetchAndSaveLyrics for song ${songId}:`, error);
        }
    }
}
export default LyricsService;
