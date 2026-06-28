import mongoose from "mongoose";
import { Song } from "../models/song.model.js";
import { Album } from "../models/album.model.js";
import { config } from "dotenv";
config();
const searchTerms = ["pop", "synthwave", "lofi", "hiphop", "electronic"];
const seedDatabase = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");
        // Clear existing data
        console.log("Clearing existing songs and albums...");
        await Album.deleteMany({});
        await Song.deleteMany({});
        console.log("Existing data cleared.");
        const allTracks = [];
        console.log("Fetching tracks from iTunes Search API...");
        for (const term of searchTerms) {
            const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=15`;
            try {
                const response = await fetch(url);
                if (response.ok) {
                    const data = (await response.json());
                    if (data.results && Array.isArray(data.results)) {
                        console.log(`Fetched ${data.results.length} tracks for term "${term}"`);
                        allTracks.push(...data.results);
                    }
                }
                else {
                    console.error(`Failed to fetch for term "${term}": Status ${response.status}`);
                }
            }
            catch (err) {
                console.error(`Error fetching for term "${term}":`, err);
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
        console.log(`Deduplicated to ${uniqueTracks.length} unique tracks.`);
        // Group tracks by collectionName (album)
        const albumsMap = new Map();
        for (const track of uniqueTracks) {
            const albumName = track.collectionName || "Single Hits";
            if (!albumsMap.has(albumName)) {
                albumsMap.set(albumName, []);
            }
            albumsMap.get(albumName).push(track);
        }
        console.log(`Grouping tracks into ${albumsMap.size} albums...`);
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
        console.log("Database seeded successfully with iTunes songs and albums!");
    }
    catch (error) {
        console.error("Error seeding database:", error);
    }
    finally {
        mongoose.connection.close();
        console.log("Database connection closed.");
    }
};
seedDatabase();
