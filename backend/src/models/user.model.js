import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
    fullName: {
        type:String,
        required:true
    },
    imageUrl: {
        type:String,
        required:true,
    },
    clerkId: {
        type:String,
        required:true,
        unique:true
    },
    username: {
        type:String,
        unique:true,
        sparse: true,
    },
    bio: {
        type: String,
        default: "",
    },
    favoriteSong: {
        type: String,
        default: "",
    },
    favoriteArtist: {
        type: String,
        default: "",
    },
    friends: [{
        type: String, // array of clerkIds
    }],
    pendingRequests: [{
        type: String, // received requests
    }],
    sentRequests: [{
        type: String, // sent requests
    }],
    lastSeen: {
        type: Date,
        default: Date.now
    },
    lastActivity: {
        type: String,
        default: "Offline"
    }
},{timestamps:true});

export const User = mongoose.model("User",userSchema);
