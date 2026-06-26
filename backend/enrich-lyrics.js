import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const songSchema = new mongoose.Schema({
  title: String,
  artist: String,
  lyrics: String,
  lyricsSource: String,
  lyricsFetchedAt: Date
});

const Song = mongoose.model('Song', songSchema);

function cleanLyrics(lyrics) {
  if (!lyrics) return "";
  // Remove LRC timestamps (e.g. [00:12.34] or [01:23.456] or [02:10])
  let cleaned = lyrics.replace(/\[\d+:\d+(?:\.\d+)?\]/g, "");
  // Normalize newlines
  cleaned = cleaned.replace(/\r\n/g, "\n");
  // Trim lines and remove duplicate empty lines
  return cleaned
    .split("\n")
    .map(line => line.trim())
    .filter((line, index, arr) => line !== "" || (index > 0 && arr[index - 1] !== ""))
    .join("\n")
    .trim();
}

async function getLyricsFromAI(genAI, songName, artistName) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
    const prompt = `Write the lyrics for the song "${songName}" by "${artistName}".
If you know the official lyrics, please write the official lyrics exactly.
If you do not know the official lyrics or if it is an instrumental/indie song, write high-quality, creative, and beautiful song lyrics in the style of "${artistName}".
Do not include any introduction, explanations, meta-commentary, or markdown formatting (like \`\`\` or \`\`\`lyrics). Just return the plain text lyrics directly.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (text && text.trim().length > 0) {
      return cleanLyrics(text.trim());
    }
  } catch (error) {
    console.error(`[AI Error] Failed for ${songName} - ${artistName}:`, error.message);
  }
  return null;
}

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not defined in env!");
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.");

  // Fetch songs that either have null lyrics, null source, or were marked None previously
  const songs = await Song.find({
    $or: [
      { lyrics: null },
      { lyricsSource: null },
      { lyricsSource: "None" }
    ]
  });
  console.log(`Found ${songs.length} songs that need lyrics.`);

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    console.log(`[${i + 1}/${songs.length}] Fetching lyrics for: "${song.title}" by "${song.artist}"...`);
    
    const lyrics = await getLyricsFromAI(genAI, song.title, song.artist);
    
    if (lyrics) {
      song.lyrics = lyrics;
      song.lyricsSource = "Gemini AI";
      song.lyricsFetchedAt = new Date();
      await song.save();
      console.log(`  -> Saved lyrics (${lyrics.split('\n').length} lines)`);
    } else {
      song.lyrics = "";
      song.lyricsSource = "None";
      song.lyricsFetchedAt = new Date();
      await song.save();
      console.log(`  -> Marked unavailable`);
    }

    // Wait 2 seconds to respect API rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log("All songs processed!");
  await mongoose.disconnect();
}

run().catch(console.error);
