import mongoose from "mongoose";

const artistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    monthlyListeners: {
        type: Number,
        default: 0
    },
    followers: {
        type: Number,
        default: 0
    },
    genres: [{
        type: String
    }],
    country: {
        type: String,
        default: "India"
    },
    bio: {
        type: String,
        default: ""
    },
    verified: {
        type: Boolean,
        default: false
    },
    instagram: {
        type: String,
        default: ""
    },
    youtube: {
        type: String,
        default: ""
    },
    spotify: {
        type: String,
        default: ""
    },
    website: {
        type: String,
        default: ""
    },
    moreSongs: [{
        title: { type: String, required: true },
        isInformationalOnly: { type: Boolean, default: true }
    }],
    similarArtists: [{
        type: String
    }],
    songs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Song"
    }],
    albums: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Album"
    }],
    enriched: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export const Artist = mongoose.model("Artist", artistSchema);
