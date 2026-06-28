import mongoose from "mongoose";
const songSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    artist:{
        type:String,
        required:true,
    },
    imageUrl:{
        type:String,
        required:true,
    },
    audioUrl:{
        type:String,
        required:true,
    },
    duration:{
        type:Number,
        required:true,
    },
    tempo: {
        type: Number,
        default: () => Math.floor(Math.random() * (180 - 60 + 1) + 60) // Random default 60-180 BPM
    },
    energy: {
        type: Number,
        default: () => Math.random()
    },
    valence: {
        type: Number,
        default: () => Math.random()
    },
    acousticness: {
        type: Number,
        default: () => Math.random()
    },
    danceability: {
        type: Number,
        default: () => Math.random()
    },
    genre: {
        type: String,
        default: "Pop"
    },
    albumId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Album',
        required:false,
    },
    artists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist'
    }],
    lyrics: {
        type: String,
        default: null
    },
    lyricsSource: {
        type: String,
        default: null
    },
    lyricsFetchedAt: {
        type: Date,
        default: null
    }
},{timestamps:true});

export const Song = mongoose.model('Song',songSchema);