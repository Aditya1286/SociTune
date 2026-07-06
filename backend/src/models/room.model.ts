import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    hostId: {
      type: String,
      required: true,
      index: true,
    },
    coverUrl: {
      type: String,
      default: "/albums/default.jpg",
    },
    moodTags: [
      {
        type: String,
      },
    ],
    visibility: {
      type: String,
      enum: ["public", "followers", "private"],
      default: "public",
    },
    invitedUsers: [
      {
        type: String,
      },
    ],
    isLive: {
      type: Boolean,
      default: false,
    },
    scheduledStartTime: {
      type: Date,
      default: null,
    },
    reminderLeadTime: {
      type: Number,
      default: 15,
    },
    currentSong: {
      songId: String,
      title: String,
      artist: String,
      imageUrl: String,
      audioUrl: String,
      duration: Number,
      progress: { type: Number, default: 0 },
      isPlaying: { type: Boolean, default: false },
      startedAt: Date,
    },
    listeners: [
      {
        type: String,
      },
    ],
    coDjs: [
      {
        type: String,
      },
    ],
    queue: [
      {
        songId: String,
        title: String,
        artist: String,
        imageUrl: String,
        audioUrl: String,
        duration: Number,
        requestedBy: String, // clerkId or Name
        votes: { type: Number, default: 0 },
      },
    ],
    requests: [
      {
        songId: String,
        title: String,
        artist: String,
        imageUrl: String,
        audioUrl: String,
        duration: Number,
        requestedBy: String,
        votes: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

export const Room = mongoose.model("Room", roomSchema);
