import mongoose from "mongoose";
import { Song } from "../models/song.model.js";
import { Album } from "../models/album.model.js";
import { config } from "dotenv";
config();
const CLIENT_ID = "617916d6e0f740fb8539fb3645709a83";
const CLIENT_SECRET = "e34ae0720fb34abcbcfb9df7ba3c4bf8";
const searchQueries = [
    "nanku",
    "arpit bala",
    "seedhe maut",
    "chaardiwaari",
    "ihh ep",
    "ihh",
    "kendrick lamar",
    "kanye west graduation ep"
];
const getSpotifyToken = async () => {
    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
        },
        body: "grant_type=client_credentials",
    });
    if (!response.ok) {
        throw new Error(`Failed to get Spotify token: ${response.statusText}`);
    }
    const data = await response.json();
    return data.access_token;
};
const getItunesPreview = async (trackName, artistName) => {
    try {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(trackName + " " + artistName)}&media=music&limit=1`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                return data.results[0].previewUrl || null;
            }
        }
    }
    catch (e) {
        // ignore
    }
    return null;
};
const getSaavnPreview = async (trackName, artistName) => {
    const apis = [
        "https://saavn.me/search/songs?query=",
        "https://jiosaavn-api-privatecvc2.vercel.app/search/songs?query=",
        "https://saavn.dev/api/search/songs?query="
    ];
    for (const baseUrl of apis) {
        try {
            const url = `${baseUrl}${encodeURIComponent(trackName + " " + artistName)}`;
            const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
            if (res.ok) {
                const data = await res.json();
                const results = data?.data?.results || data?.results;
                if (results && results.length > 0) {
                    const song = results[0];
                    const downloadUrls = song.downloadUrl || song.media_preview_url;
                    if (Array.isArray(downloadUrls)) {
                        const link = downloadUrls.find((d) => d.quality === "320kbps") || downloadUrls[0];
                        if (link && link.link)
                            return link.link;
                        if (link && link.url)
                            return link.url;
                    }
                    else if (typeof downloadUrls === 'string') {
                        return downloadUrls;
                    }
                }
            }
        }
        catch (e) {
            // ignore
        }
    }
    return null;
};
const seedDatabase = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");
        console.log("Clearing existing songs and albums...");
        await Album.deleteMany({});
        await Song.deleteMany({});
        console.log("Existing data cleared.");
        const token = await getSpotifyToken();
        console.log("Obtained Spotify Access Token.");
        const allTracks = [];
        console.log("Fetching tracks from Spotify API...");
        for (const query of searchQueries) {
            for (const offset of [0, 10, 20, 30]) {
                const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&offset=${offset}`;
                try {
                    const response = await fetch(url, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        const tracks = data.tracks?.items || [];
                        console.log(`Fetched ${tracks.length} tracks for query "${query}" (offset ${offset})`);
                        allTracks.push(...tracks);
                    }
                    else {
                        const errorText = await response.text();
                        console.error(`Failed to fetch for query "${query}" (offset ${offset}): Status ${response.status}`, errorText);
                    }
                }
                catch (err) {
                    console.error(`Error fetching for query "${query}":`, err);
                }
            }
        }
        // Deduplicate tracks by ID
        const uniqueTracksMap = new Map();
        for (const track of allTracks) {
            if (!track || !track.id)
                continue;
            uniqueTracksMap.set(track.id, track);
        }
        const uniqueTracks = Array.from(uniqueTracksMap.values());
        console.log(`Deduplicated to ${uniqueTracks.length} unique tracks.`);
        // Group by Album
        const albumsMap = new Map();
        for (const track of uniqueTracks) {
            const albumId = track.album?.id;
            if (!albumId)
                continue;
            if (!albumsMap.has(albumId)) {
                albumsMap.set(albumId, []);
            }
            albumsMap.get(albumId).push(track);
        }
        console.log(`Grouping tracks into ${albumsMap.size} albums...`);
        let songCount = 0;
        for (const [albumId, tracks] of albumsMap.entries()) {
            const albumData = tracks[0].album;
            const albumArtist = albumData.artists?.[0]?.name || "Unknown Artist";
            const rawImageUrl = albumData.images?.[0]?.url || "/albums/default.jpg";
            const releaseYear = albumData.release_date ? new Date(albumData.release_date).getFullYear() : new Date().getFullYear();
            // Create Album
            const albumDoc = new Album({
                title: albumData.name || "Unknown Album",
                artist: albumArtist,
                imageUrl: rawImageUrl,
                releaseYear: releaseYear,
                songs: []
            });
            await albumDoc.save();
            const songIds = [];
            for (const track of tracks) {
                const durationSec = Math.round((track.duration_ms || 30000) / 1000);
                const trackArtist = track.artists?.map((a) => a.name).join(", ") || albumArtist;
                let audioUrl = track.preview_url;
                if (!audioUrl) {
                    audioUrl = await getItunesPreview(track.name, trackArtist);
                }
                if (!audioUrl) {
                    audioUrl = await getSaavnPreview(track.name, trackArtist);
                }
                if (!audioUrl) {
                    audioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
                }
                const imageUrl = track.album?.images?.[0]?.url || rawImageUrl;
                const songDoc = new Song({
                    title: track.name,
                    artist: trackArtist,
                    imageUrl: imageUrl,
                    audioUrl: audioUrl,
                    duration: durationSec,
                    genre: "Hip Hop", // Default or you can determine based on query if you want
                    albumId: albumDoc._id,
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
                songCount++;
            }
            albumDoc.songs = songIds;
            await albumDoc.save();
        }
        console.log(`Database seeded successfully with ${songCount} Spotify songs across ${albumsMap.size} albums!`);
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
