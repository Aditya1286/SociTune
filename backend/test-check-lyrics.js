import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const songSchema = new mongoose.Schema({
  title: String,
  artist: String,
  lyrics: mongoose.Schema.Types.Mixed,
  lyricsSource: String
});

const Song = mongoose.model('Song', songSchema);

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const total = await Song.countDocuments();
  const sample = await Song.findOne();
  console.log("Total Songs:", total);
  console.log("Sample Song:", sample);
  console.log("Sample Song lyrics type:", typeof sample.lyrics);
  console.log("Sample Song lyrics val:", JSON.stringify(sample.lyrics));
  await mongoose.disconnect();
}

run();
