import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const ArtistSchema = new mongoose.Schema({
  name: String,
  imageUrl: String,
  bio: String
});

const Artist = mongoose.model('Artist', ArtistSchema);

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const artists = await Artist.find({});
  console.log("Seeded Artists in DB:");
  artists.forEach(a => {
    console.log(`Name: ${a.name}`);
    console.log(`Image: ${a.imageUrl}`);
    console.log(`Bio: ${a.bio}`);
    console.log("-------------------");
  });
  await mongoose.disconnect();
}

run();
