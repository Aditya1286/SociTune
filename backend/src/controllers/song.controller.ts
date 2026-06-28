import { Request, Response, NextFunction } from "express";
import { Song } from "../models/song.model.js";
import { Album } from "../models/album.model.js";
import { Artist } from "../models/artist.model.js";
import ArtistEnrichmentService from "../services/artistEnrichment.service.js";
import Singleton from "../utils/Singleton.js";
import LyricsService from "../services/lyrics.service.js";

class SongController {
    public async getAllSongs(req: Request, res: Response, next: NextFunction) {
        try {
            //Valid
            const songs = await Song.find().sort({ createdAt: -1 });
            res.json(songs);
        } catch (error) {
            next(error);
        }
    }

    public async getFeaturedSongs(req: Request, res: Response, next: NextFunction) {
        try {
            const songs = await Song.aggregate([
                { $sample: { size: 6 } }, 
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        artist: 1,
                        imageUrl: 1,
                        audioUrl: 1,
                        duration: 1
                    }
                }
            ]);
            res.json(songs);
        } catch (error) {
            next(error);
        }
    }

    public async getMadeForYouSongs(req: Request, res: Response, next: NextFunction) {
        try {
            const songs = await Song.aggregate([
                { $sample: { size: 12 } }, //NAAHH -> Invalidate this logic, fine for you even you know it ADI
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        artist: 1,
                        imageUrl: 1,
                        audioUrl: 1,
                        duration: 1
                    }
                }
            ]);
            res.json(songs);
        } catch (error) {
            next(error);
        }
    }

    public async getTrendingSongs(req: Request, res: Response, next: NextFunction) {
        try {
            const songs = await Song.aggregate([ //These api's will be improved
                { $sample: { size: 12 } },
                {
                    $project: {
                        _id: 1,
                        title: 1,
                        artist: 1,
                        imageUrl: 1,
                        audioUrl: 1,
                        duration: 1
                    }
                }
            ]);
            res.json(songs);
        } catch (error) {
            next(error);
        }
    }

    public async searchSongs(req: Request, res: Response, next: NextFunction) {
        try {
            const { q } = req.query; 
            if (!q) return res.json([]);
            
            const songs = await Song.find({
                $or: [
                    { title: { $regex: q as string, $options: "i" } },
                    { artist: { $regex: q as string, $options: "i" } }
                ]
            }).limit(10);
            res.json(songs);
        } catch (error) {
            next(error);
        }
    }

    public async getSongLyrics(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const song = await Song.findById(id);
            if (!song) {
                return res.status(404).json({ message: "Song not found" });
            }

            // If lyrics are not cached, or previously failed/empty, fetch and save them on-the-fly
            if (song.lyrics === null || song.lyrics === "" || song.lyricsSource === "None") {
                console.log(`[SongController] Lyrics not cached for "${song.title}". Fetching on-the-fly...`);
                const lyricsService = Singleton.instance<LyricsService>(LyricsService);
                await lyricsService.fetchAndSaveLyrics(id as string);

                // Reload the song document to get the newly generated lyrics
                const updatedSong = await Song.findById(id);
                if (updatedSong) {
                    return res.json({
                        lyrics: updatedSong.lyrics || null,
                        lyricsSource: updatedSong.lyricsSource || null,
                        lyricsFetchedAt: updatedSong.lyricsFetchedAt || null
                    });
                }
            }

            res.json({
                lyrics: song.lyrics || null,
                lyricsSource: song.lyricsSource || null,
                lyricsFetchedAt: song.lyricsFetchedAt || null
            });
        } catch (error) {
            next(error);
        }
    }

    public async getSongById(req: Request, res: Response, next: NextFunction) {
        try {
            //Again, how are you gettinig songs by id -> is the frontend sending us music id? 
            const { id } = req.params;
            const song = await Song.findById(id);
            if (!song) {
                return res.status(404).json({ message: "Song not found" });
            }
            res.json(song);
        } catch (error) {
            next(error);
        }
    }

    public async globalSearch(req: Request, res: Response, next: NextFunction) {
        try {
            const { q } = req.query;
            if (!q) {
                return res.json({ songs: [], albums: [], artists: [], playlists: [] });
            }

            const searchRegex = { $regex: q as string, $options: "i" };

            // 1. Search Songs
            const songs = await Song.find({
                $or: [
                    { title: searchRegex },
                    { artist: searchRegex }
                ]
            }).limit(10);

            // 2. Search Albums
            const albums = await Album.find({
                $or: [
                    { title: searchRegex },
                    { artist: searchRegex }
                ]
            }).limit(10);

            // 3. Search Artists using the Mongoose Artist collection
            const artists = await Artist.find({
                name: searchRegex
            }).limit(10);

            // 4. Mock Playlists 
            //Okish for now
            const playlists = [
                { id: "liked-songs", title: "Liked Songs", imageUrl: "https://images.unsplash.com/photo-1513829096960-ef04324d32f4?w=500", artist: "You" },
                { id: "ihh-essentials", title: "IHH Essentials", imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500", artist: "SociTune" },
                { id: "chill-vibes", title: "Chill Vibes", imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500", artist: "SociTune" },
                { id: "retro-classics", title: "Retro Classics", imageUrl: "https://images.unsplash.com/photo-1487180142328-0c4e37023af5?w=500", artist: "SociTune" }
            ].filter(p => p.title.toLowerCase().includes((q as string).toLowerCase()));

            res.json({ songs, albums, artists, playlists });
        } catch (error) {
            next(error);
        }
    }

    public async getArtistDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const artistName = req.params.artistName as string;
            
            // 1. Find the artist in the collection (case-insensitive)
            const escapedName = artistName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            let artist = await Artist.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, "i") } });
            
            // If the artist doesn't exist in our Artist database, create a skeletal record
            // based on any matching songs so they have a place to land.
            if (!artist) {
                const songMatches = await Song.find({ artist: { $regex: escapedName, $options: "i" } });
                if (songMatches.length === 0) {
                    return res.status(404).json({ message: "Artist not found" });
                }
                
                artist = new Artist({
                    name: artistName,
                    imageUrl: songMatches[0].imageUrl || "/albums/default.jpg",
                    monthlyListeners: Math.floor(Math.random() * (1200000 - 15000 + 1) + 15000),
                    followers: Math.floor(Math.random() * (600000 - 8000 + 1) + 8000),
                    genres: ["Indian Hip Hop"],
                    bio: `${artistName} is an artist featured on SociTune.`
                });
                await artist.save();
            }

            // 2. Trigger lazy Gemini enrichment if not already enriched
            if (!artist.enriched) {
                console.log(`[SongController] Artist "${artist.name}" is not enriched. Triggering Gemini enrichment...`);
                const enrichmentService = Singleton.instance<ArtistEnrichmentService>(ArtistEnrichmentService);
                const enrichedArtist = await enrichmentService.enrichArtist(artist.name);
                if (enrichedArtist) {
                    artist = enrichedArtist;
                }
            }

            // 3. Fetch all local songs linked via the many-to-many artists field or plain artist name
            const songs = await Song.find({
                $or: [
                    { artists: artist._id },
                    { artist: { $regex: artistName, $options: "i" } }
                ]
            }).sort({ createdAt: -1 });

            // 4. Fetch all local albums linked
            const albums = await Album.find({
                $or: [
                    { artists: artist._id },
                    { artist: { $regex: artistName, $options: "i" } }
                ]
            }).sort({ releaseYear: -1 });

            res.json({
                _id: artist._id,
                name: artist.name,
                imageUrl: artist.imageUrl,
                monthlyListeners: artist.monthlyListeners,
                followers: artist.followers,
                genres: artist.genres,
                bio: artist.bio,
                verified: artist.verified,
                instagram: artist.instagram,
                youtube: artist.youtube,
                spotify: artist.spotify,
                website: artist.website,
                moreSongs: artist.moreSongs || [],
                similarArtists: artist.similarArtists || [],
                songs: songs,
                albums: albums
            });
        } catch (error) {
            next(error);
        }
    }

    //Not of our use case for the time being
    public async getTrendingArtists(req: Request, res: Response, next: NextFunction) {
        try {
            // Find artists in database, sorted by monthly listeners or followers
            const artists = await Artist.find({}).sort({ monthlyListeners: -1 }).limit(6);
            res.json(artists);
        } catch (error) {
            next(error);
        }
    }
}

export default SongController;