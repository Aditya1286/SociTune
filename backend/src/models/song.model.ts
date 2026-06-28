import mongoose from "mongoose";
const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    artist: {
      type: String,
      required: true,
    },
    external_ids: {
      isrc_id: String,
      spotify_id: String,
      yt_id: String,
      fuzzy_id: {
        //This is my system generated id -> check in helper/genenrateSongID. Last Fallback
        type: String,
        required: true,
      },
    },
    imageUrl: {
      type: String,
      required: true,
    },
    audioUrl: {
      type: String,
      required: false,
    },
    duration: {
      type: Number,
      required: true,
    },
    audio_details: {
      tempo: {
        type: Number,
      },
      energy: {
        type: Number,
      },
      valence: {
        type: Number,
      },
      acousticness: {
        type: Number,
      },
      danceability: {
        type: Number,
      },
    },
    genre: {
      type: String,
      default: "unknown",
    },
    albumId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
      required: false,
    },
    artists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Artist",
      },
    ],
    lyrics: {
      type: String,
      default: null,
    },
    lyricsSource: {
      type: String,
      default: null,
    },
    lyricsFetchedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export const Song = mongoose.model("Song", songSchema);
