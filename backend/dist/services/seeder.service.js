import { Song } from "../models/song.model.js";
import { Album } from "../models/album.model.js";
const searchTerms = ["pop", "synthwave", "lofi", "hiphop", "electronic"];
export async function seedDatabaseOnStartup() {
    try {
        console.log("[SeederService] Checking if database needs seeding...");
        const hasItunesSongs = await Song.exists({ audioUrl: /itunes\.apple\.com/ });
        if (hasItunesSongs) {
            console.log("[SeederService] iTunes songs already seeded. Skipping auto-seeding.");
            return;
        }
        console.log("[SeederService] No iTunes songs found. Clearing old database and starting iTunes Search API auto-seeding...");
        await Album.deleteMany({});
        await Song.deleteMany({});
        const allTracks = [];
        for (const term of searchTerms) {
            const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=15`;
            try {
                const response = await fetch(url);
                if (response.ok) {
                    const data = (await response.json());
                    if (data.results && Array.isArray(data.results)) {
                        console.log(`[SeederService] Fetched ${data.results.length} tracks for term "${term}"`);
                        allTracks.push(...data.results);
                    }
                }
                else {
                    console.error(`[SeederService] Failed to fetch for term "${term}": Status ${response.status}`);
                }
            }
            catch (err) {
                console.error(`[SeederService] Error fetching for term "${term}":`, err);
            }
        }
        // Deduplicate and filter tracks
        const uniqueSongsMap = new Map();
        for (const track of allTracks) {
            if (!track.trackName || !track.artistName || !track.previewUrl)
                continue;
            const key = `${track.trackName.toLowerCase()}-${track.artistName.toLowerCase()}`;
            if (!uniqueSongsMap.has(key)) {
                uniqueSongsMap.set(key, track);
            }
        }
        const uniqueTracks = Array.from(uniqueSongsMap.values());
        console.log(`[SeederService] Deduplicated to ${uniqueTracks.length} unique tracks.`);
        // Group tracks by collectionName (album)
        const albumsMap = new Map();
        for (const track of uniqueTracks) {
            const albumName = track.collectionName || "Single Hits";
            if (!albumsMap.has(albumName)) {
                albumsMap.set(albumName, []);
            }
            albumsMap.get(albumName).push(track);
        }
        console.log(`[SeederService] Grouping tracks into ${albumsMap.size} albums...`);
        // Insert albums and songs
        for (const [albumName, tracks] of albumsMap.entries()) {
            const firstTrack = tracks[0];
            const albumArtist = firstTrack.artistName || "Various Artists";
            const rawImageUrl = firstTrack.artworkUrl100 || "";
            const albumImageUrl = rawImageUrl.replace("100x100bb", "600x600bb") || "/albums/default.jpg";
            const releaseDateStr = firstTrack.releaseDate || "";
            const releaseYear = releaseDateStr ? new Date(releaseDateStr).getFullYear() : 2024;
            // Create Album
            const albumDoc = new Album({
                title: albumName,
                artist: albumArtist,
                imageUrl: albumImageUrl,
                releaseYear: releaseYear,
                songs: []
            });
            await albumDoc.save();
            const songIds = [];
            // Create and Save Songs for this Album
            for (const track of tracks) {
                const trackImageUrl = (track.artworkUrl100 || "").replace("100x100bb", "600x600bb") || "/cover-images/default.jpg";
                const durationSec = track.trackTimeMillis ? Math.round(track.trackTimeMillis / 1000) : 30;
                const songDoc = new Song({
                    title: track.trackName,
                    artist: track.artistName,
                    imageUrl: trackImageUrl,
                    audioUrl: track.previewUrl,
                    duration: durationSec,
                    genre: track.primaryGenreName || "Pop",
                    albumId: albumDoc._id,
                    // Random attributes for recommendation service / matches
                    tempo: Math.floor(Math.random() * (180 - 60 + 1) + 60),
                    energy: Math.random(),
                    valence: Math.random(),
                    acousticness: Math.random(),
                    danceability: Math.random(),
                    lyrics: null,
                    lyricsSource: null,
                    lyricsFetchedAt: null
                });
                await songDoc.save();
                songIds.push(songDoc._id);
            }
            // Link saved song IDs back to the Album
            albumDoc.songs = songIds;
            await albumDoc.save();
        }
        console.log("[SeederService] Auto-seeding completed successfully!");
    }
    catch (error) {
        console.error("[SeederService] Error during auto-seeding:", error);
    }
}
