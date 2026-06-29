import { Request, Response, NextFunction } from "express";
import { Song } from "../models/song.model.js";
import { Album } from "../models/album.model.js";
import cloudinary from "../services/cloudinary.service.js";
import Singleton from "../utils/Singleton.js";
import LyricsService from "../services/lyrics.service.js";
import { generateSongId } from "../helpers/generateSongId.js";

// helper function for cloudinary uploads
const uploadToCloudinary = async (file: any) => {
    try {
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
            resource_type: "auto",
        });
        return result.secure_url;
    } catch (error) {
        console.log("Error in uploadToCloudinary", error);
        throw new Error("Error uploading to cloudinary");
    }
};

class AdminController {

    //Controller -> Services -> DAO CALL Architecture
    //Adding generic songId function
    public async createSong(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.files || !req.files.audioFile || !req.files.imageFile) {
                return res.status(400).json({ message: "Please upload all files" });
            }

            const { title, artist, albumId, duration } = req.body;
            //Need to test this parameter , despite the fact the route won't be used
            //This is the fuzzyId
            const song_id = generateSongId(title,artist);
            const audioFile = req.files.audioFile;
            const imageFile = req.files.imageFile;

            console.log("songId",song_id)

            const audioUrl = await uploadToCloudinary(audioFile);
            const imageUrl = await uploadToCloudinary(imageFile);

            const song = new Song({
                title,
                artist,
                song_id,
                audioUrl,
                imageUrl,
                duration,
                albumId: albumId || null,
            });

            await song.save();

            // if song belongs to an album, update the album's songs array
            if (albumId) {
                await Album.findByIdAndUpdate(albumId, {
                    $push: { songs: song._id },
                });
            }

            // Asynchronously fetch and save lyrics in the background (do not await)
            const lyricsService = Singleton.instance<LyricsService>(LyricsService);
            lyricsService.fetchAndSaveLyrics(song._id.toString()).catch(err => { 
                console.error("Error fetching lyrics in background:", err);
            });

            res.status(201).json(song);
        } catch (error) {
            console.log("Error in createSong", error);
            next(error);
        }
    }

    public async deleteSong(req: Request, res: Response, next: NextFunction) {
        try {
            //How are you getting this id from req.params? 
            const { id } = req.params;

            const song = await Song.findById(id);

            if (song && song.albumId) {
                await Album.findByIdAndUpdate(song.albumId, {
                    $pull: { songs: song._id },
                });
            }

            await Song.findByIdAndDelete(id);

            res.status(200).json({ message: "Song deleted successfully" });
        } catch (error) {
            console.log("Error in deleteSong", error);
            next(error);
        }
    }

    public async createAlbum(req: Request, res: Response, next: NextFunction) {
        try {
            //Okish
            const { title, artist, releaseYear } = req.body;
            const { imageFile } = req.files as any;

            const imageUrl = await uploadToCloudinary(imageFile);

            const album = new Album({
                title,
                artist,
                imageUrl,
                releaseYear,
            });

            await album.save();

            res.status(201).json(album);
        } catch (error) {
            console.log("Error in createAlbum", error);
            next(error);
        }
    }

    public async deleteAlbum(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            await Song.deleteMany({ albumId: id });
            await Album.findByIdAndDelete(id);
            res.status(200).json({ message: "Album deleted successfully" });
        } catch (error) {
            console.log("Error in deleteAlbum", error);
            next(error);
        }
    }

    public async checkAdmin(req: Request, res: Response, next: NextFunction) {
        res.status(200).json({ admin: true });
    }
}

export default AdminController;