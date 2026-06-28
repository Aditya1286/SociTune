import { Song } from "../models/song.model.js";
import { Album } from "../models/album.model.js";
import cloudinary from "../services/cloudinary.service.js";
import Singleton from "../utils/Singleton.js";
import LyricsService from "../services/lyrics.service.js";
// helper function for cloudinary uploads
const uploadToCloudinary = async (file) => {
    try {
        const result = await cloudinary.uploader.upload(file.tempFilePath, {
            resource_type: "auto",
        });
        return result.secure_url;
    }
    catch (error) {
        console.log("Error in uploadToCloudinary", error);
        throw new Error("Error uploading to cloudinary");
    }
};
class AdminController {
    async createSong(req, res, next) {
        try {
            if (!req.files || !req.files.audioFile || !req.files.imageFile) {
                return res.status(400).json({ message: "Please upload all files" });
            }
            const { title, artist, albumId, duration } = req.body;
            const audioFile = req.files.audioFile;
            const imageFile = req.files.imageFile;
            const audioUrl = await uploadToCloudinary(audioFile);
            const imageUrl = await uploadToCloudinary(imageFile);
            const song = new Song({
                title,
                artist,
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
            const lyricsService = Singleton.instance(LyricsService);
            lyricsService.fetchAndSaveLyrics(song._id.toString()).catch(err => {
                console.error("Error fetching lyrics in background:", err);
            });
            res.status(201).json(song);
        }
        catch (error) {
            console.log("Error in createSong", error);
            next(error);
        }
    }
    async deleteSong(req, res, next) {
        try {
            const { id } = req.params;
            const song = await Song.findById(id);
            if (song && song.albumId) {
                await Album.findByIdAndUpdate(song.albumId, {
                    $pull: { songs: song._id },
                });
            }
            await Song.findByIdAndDelete(id);
            res.status(200).json({ message: "Song deleted successfully" });
        }
        catch (error) {
            console.log("Error in deleteSong", error);
            next(error);
        }
    }
    async createAlbum(req, res, next) {
        try {
            const { title, artist, releaseYear } = req.body;
            const { imageFile } = req.files;
            const imageUrl = await uploadToCloudinary(imageFile);
            const album = new Album({
                title,
                artist,
                imageUrl,
                releaseYear,
            });
            await album.save();
            res.status(201).json(album);
        }
        catch (error) {
            console.log("Error in createAlbum", error);
            next(error);
        }
    }
    async deleteAlbum(req, res, next) {
        try {
            const { id } = req.params;
            await Song.deleteMany({ albumId: id });
            await Album.findByIdAndDelete(id);
            res.status(200).json({ message: "Album deleted successfully" });
        }
        catch (error) {
            console.log("Error in deleteAlbum", error);
            next(error);
        }
    }
    async checkAdmin(req, res, next) {
        res.status(200).json({ admin: true });
    }
}
export default AdminController;
