import mongoose from "mongoose";
import { Song } from "../models/song.model.js";
import { Album } from "../models/album.model.js";
import { Artist } from "../models/artist.model.js";
import { parseArtistNames } from "../utils/artistParser.js";
import LyricsService from "./lyrics.service.js";
import ArtistEnrichmentService from "./artistEnrichment.service.js";
import Singleton from "../utils/Singleton.js";
import { generateSongId } from "../helpers/generateSongId.js";

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
const lyricsService = new LyricsService();

const getSpotifyToken = async () => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
        throw new Error("Missing Spotify credentials in environment variables.");
    }

    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
        },
        body: "grant_type=client_credentials",
    });

    if (!response.ok) {
        throw new Error(`Failed to get Spotify token: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.access_token;
};

const getItunesPreview = async (trackName: string, artistName: string) => {
    try {
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(trackName + " " + artistName)}&media=music&limit=1`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json() as any;
            if (data.results && data.results.length > 0) {
                return data.results[0].previewUrl || null;
            }
        }
    } catch (e) {
        // ignore
    }
    return null;
};

const getSaavnPreview = async (trackName: string, artistName: string) => {
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
                const data = await res.json() as any;
                const results = data?.data?.results || data?.results;
                if (results && results.length > 0) {
                    const song = results[0];
                    const downloadUrls = song.downloadUrl || song.media_preview_url;
                    if (Array.isArray(downloadUrls)) {
                        const link = downloadUrls.find((d: any) => d.quality === "320kbps") || downloadUrls[0];
                        if (link && link.link) return link.link;
                        if (link && link.url) return link.url;
                    } else if (typeof downloadUrls === 'string') {
                        return downloadUrls;
                    }
                }
            }
        } catch (e) {
            // ignore
        }
    }
    return null;
};

export async function seedDatabaseOnStartup() {
    try {
        console.log("[SeederService] Checking if database needs seeding...");
        // Check if songs exist to avoid re-seeding on every startup
        const hasSongs = await Song.exists({});
        if (hasSongs) {
            console.log("[SeederService] Songs already seeded. Skipping auto-seeding.");
            await migrateArtists();
            return;
        }

        console.log("[SeederService] No songs found. Clearing old database and starting Spotify auto-seeding...");
        await Album.deleteMany({});
        await Song.deleteMany({});

        const token = await getSpotifyToken();
        console.log("[SeederService] Obtained Spotify Access Token.");

        const allTracks: any[] = [];
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
                        const data = await response.json() as any;
                        const tracks = data.tracks?.items || [];
                        console.log(`[SeederService] Fetched ${tracks.length} tracks for query "${query}" (offset ${offset})`);
                        allTracks.push(...tracks);
                    } else {
                        const errorText = await response.text();
                        console.error(`[SeederService] Failed to fetch for query "${query}" (offset ${offset}): Status ${response.status}`, errorText);
                    }
                } catch (err) {
                    console.error(`[SeederService] Error fetching for query "${query}":`, err);
                }
            }
        }

        // Deduplicate tracks by ID
        const uniqueTracksMap = new Map<string, any>();
        for (const track of allTracks) {
            if (!track || !track.id) continue;
            uniqueTracksMap.set(track.id, track);
        }

        const uniqueTracks = Array.from(uniqueTracksMap.values());
        console.log(`[SeederService] Deduplicated to ${uniqueTracks.length} unique tracks.`);

        // Group by Album
        const albumsMap = new Map<string, any[]>();
        for (const track of uniqueTracks) {
            const albumId = track.album?.id;
            if (!albumId) continue;
            if (!albumsMap.has(albumId)) {
                albumsMap.set(albumId, []);
            }
            albumsMap.get(albumId)!.push(track);
        }

        console.log(`[SeederService] Grouping tracks into ${albumsMap.size} albums...`);

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

            const songIds: mongoose.Types.ObjectId[] = [];

            for (const track of tracks) {
                const durationSec = Math.round((track.duration_ms || 30000) / 1000);
                const trackArtist = track.artists?.map((a: any) => a.name).join(", ") || albumArtist;
                const trackName = track.name;

                let audioUrl = track.preview_url;
                if (!audioUrl) {
                    audioUrl = await getItunesPreview(trackName, trackArtist);
                }
                if (!audioUrl) {
                    audioUrl = await getSaavnPreview(trackName, trackArtist);
                }

                if (!audioUrl) {
                    audioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
                }

                const imageUrl = track.album?.images?.[0]?.url || rawImageUrl;

                console.log(`[SeederService] Fetching lyrics for ${trackName} by ${trackArtist}...`);
                const lyricsResult = await lyricsService.getLyrics(trackName, trackArtist);

                const songDoc = new Song({
                    title: trackName,
                    artist: trackArtist,
                    imageUrl: imageUrl,
                    audioUrl: audioUrl,
                    duration: durationSec,
                    genre: "Hip Hop",
                    albumId: albumDoc._id,
                    tempo: Math.floor(Math.random() * (180 - 60 + 1) + 60),
                    energy: Math.random(),
                    valence: Math.random(),
                    acousticness: Math.random(),
                    danceability: Math.random(),
                    lyrics: lyricsResult ? lyricsResult.lyrics : "",
                    lyricsSource: lyricsResult ? lyricsResult.source : "None",
                    lyricsFetchedAt: new Date(),
                    external_ids: {
                        spotify_id: track.id,
                        fuzzy_id: generateSongId(trackName, trackArtist)
                    }
                });

                await songDoc.save();
                songIds.push(songDoc._id as mongoose.Types.ObjectId);
                songCount++;
            }

            albumDoc.songs = songIds;
            await albumDoc.save();
        }

        await migrateArtists();
        console.log(`[SeederService] Auto-seeding completed successfully! Inserted ${songCount} songs across ${albumsMap.size} albums.`);
    } catch (error) {
        console.error("[SeederService] Error during auto-seeding:", error);
    }
}

export async function migrateArtists() {
    try {
        console.log("[Migration] Running artist relationship migration...");
        
        // Heal database: populate missing fuzzy_id for existing songs
        const needsFuzzyIdHealing = await Song.exists({
            $or: [
                { "external_ids.fuzzy_id": { $exists: false } },
                { "external_ids.fuzzy_id": null },
                { "external_ids.fuzzy_id": "" }
            ]
        });

        if (needsFuzzyIdHealing) {
            const songsMissingFuzzyId = await Song.find({
                $or: [
                    { "external_ids.fuzzy_id": { $exists: false } },
                    { "external_ids.fuzzy_id": null },
                    { "external_ids.fuzzy_id": "" }
                ]
            });
            console.log(`[Migration] Healing ${songsMissingFuzzyId.length} songs missing fuzzy_id...`);
            for (const song of songsMissingFuzzyId) {
                const fuzzyId = generateSongId(song.title, song.artist);
                const existingExt = song.external_ids || {};
                await Song.updateOne(
                    { _id: song._id },
                    { 
                        $set: { 
                            external_ids: {
                                ...existingExt,
                                fuzzy_id: fuzzyId
                            }
                        } 
                    }
                );
            }
            console.log(`[Migration] Successfully healed ${songsMissingFuzzyId.length} songs.`);
        }

        // Check if we actually need to migrate songs or albums
        const needsSongArtistMigration = await Song.exists({
            $and: [
                { artist: { $nin: ["Various Artists", "various artists", ""] } },
                {
                    $or: [
                        { artists: { $exists: false } },
                        { artists: { $size: 0 } }
                    ]
                }
            ]
        });

        const needsAlbumArtistMigration = await Album.exists({
            $and: [
                { artist: { $nin: ["Various Artists", "various artists", ""] } },
                {
                    $or: [
                        { artists: { $exists: false } },
                        { artists: { $size: 0 } }
                    ]
                }
            ]
        });

        if (!needsSongArtistMigration && !needsAlbumArtistMigration) {
            console.log("[Migration] All songs and albums already have artist relationships. Skipping migration.");
            
            // Start background enrichment for unenriched artists
            const unenrichedArtists = await Artist.find({ enriched: false });
            if (unenrichedArtists.length > 0) {
                console.log(`[Migration] Found ${unenrichedArtists.length} unenriched artists. Starting background enrichment...`);
                (async () => {
                    const enrichmentService = Singleton.instance<ArtistEnrichmentService>(ArtistEnrichmentService);
                    for (const artist of unenrichedArtists) {
                        try {
                            // Wait 4 seconds between requests to avoid exceeding rate limits
                            await new Promise(resolve => setTimeout(resolve, 4000));
                            console.log(`[Migration] Background enriching artist: ${artist.name}`);
                            await enrichmentService.enrichArtist(artist.name);
                        } catch (err) {
                            console.error(`[Migration] Failed to background enrich artist ${artist.name}:`, err);
                        }
                    }
                    console.log("[Migration] Background enrichment process complete!");
                })();
            }
            return;
        }

        // 1. Get all songs
        const songs = await Song.find({});
        console.log(`[Migration] Processing ${songs.length} songs...`);
        
        for (const song of songs) {
            const artistNames = parseArtistNames(song.artist);
            if (artistNames.length === 0) continue;
            
            const artistIds: mongoose.Types.ObjectId[] = [];
            
            for (const name of artistNames) {
                // Find or create artist
                const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                let artist = await Artist.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, "i") } });
                if (!artist) {
                    artist = new Artist({
                        name: name,
                        imageUrl: song.imageUrl || "/albums/default.jpg",
                        monthlyListeners: Math.floor(Math.random() * (1200000 - 15000 + 1) + 15000),
                        followers: Math.floor(Math.random() * (600000 - 8000 + 1) + 8000),
                        genres: ["Indian Hip Hop", "Pop", "Desi Hip Hop"],
                        bio: `${name} is a featured artist on SociTune.`,
                        verified: Math.random() > 0.5
                    });
                    await artist.save();
                }
                
                // Add song to artist if not already present
                const songIdStr = song._id.toString();
                const artistSongIds = (artist.songs || []).map(id => id.toString());
                if (!artistSongIds.includes(songIdStr)) {
                    artist.songs.push(song._id as any);
                    await artist.save();
                }
                artistIds.push(artist._id as any);
            }
            
            // Only update and save song if artists array actually changed
            const existingArtistIds = (song.artists || []).map(id => id.toString());
            const newArtistIds = artistIds.map(id => id.toString());
            const arraysMatch = existingArtistIds.length === newArtistIds.length && 
                               existingArtistIds.every((val, index) => val === newArtistIds[index]);
            
            if (!arraysMatch) {
                await Song.updateOne({ _id: song._id }, { $set: { artists: artistIds } });
            }
        }
        
        // 2. Get all albums
        const albums = await Album.find({});
        console.log(`[Migration] Processing ${albums.length} albums...`);
        
        for (const album of albums) {
            const artistNames = parseArtistNames(album.artist);
            if (artistNames.length === 0) continue;
            
            const artistIds: mongoose.Types.ObjectId[] = [];
            
            for (const name of artistNames) {
                const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                let artist = await Artist.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, "i") } });
                if (!artist) {
                    artist = new Artist({
                        name: name,
                        imageUrl: album.imageUrl || "/albums/default.jpg",
                        monthlyListeners: Math.floor(Math.random() * (1200000 - 15000 + 1) + 15000),
                        followers: Math.floor(Math.random() * (600000 - 8000 + 1) + 8000),
                        genres: ["Indian Hip Hop", "Pop"],
                        bio: `${name} is an artist featured on SociTune.`,
                        verified: Math.random() > 0.5
                    });
                    await artist.save();
                }
                
                // Add album to artist if not already present
                const albumIdStr = album._id.toString();
                const artistAlbumIds = (artist.albums || []).map(id => id.toString());
                if (!artistAlbumIds.includes(albumIdStr)) {
                    artist.albums.push(album._id as any);
                    await artist.save();
                }
                artistIds.push(artist._id as any);
            }
            
            // Only update and save album if artists array actually changed
            const existingArtistIds = (album.artists || []).map(id => id.toString());
            const newArtistIds = artistIds.map(id => id.toString());
            const arraysMatch = existingArtistIds.length === newArtistIds.length && 
                               existingArtistIds.every((val, index) => val === newArtistIds[index]);
            
            if (!arraysMatch) {
                await Album.updateOne({ _id: album._id }, { $set: { artists: artistIds } });
            }
        }
        
        console.log("[Migration] Artist relationship migration completed successfully!");
        
        // Start background enrichment for unenriched artists
        const unenrichedArtists = await Artist.find({ enriched: false });
        if (unenrichedArtists.length > 0) {
            console.log(`[Migration] Found ${unenrichedArtists.length} unenriched artists. Starting background enrichment...`);
            
            (async () => {
                const enrichmentService = Singleton.instance<ArtistEnrichmentService>(ArtistEnrichmentService);
                for (const artist of unenrichedArtists) {
                    try {
                        // Wait 4 seconds between requests to avoid exceeding rate limits
                        await new Promise(resolve => setTimeout(resolve, 4000));
                        console.log(`[Migration] Background enriching artist: ${artist.name}`);
                        await enrichmentService.enrichArtist(artist.name);
                    } catch (err) {
                        console.error(`[Migration] Failed to background enrich artist ${artist.name}:`, err);
                    }
                }
                console.log("[Migration] Background enrichment process complete!");
            })();
        }
    } catch (err) {
        console.error("[Migration] Error during artist migration:", err);
    }
}
