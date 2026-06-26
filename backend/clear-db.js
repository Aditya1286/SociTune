import mongoose from "mongoose";

async function clear() {
  await mongoose.connect("mongodb+srv://aishwaryaaditya2_db_user:9doNtS2LDp2bYUMz@cluster0.kftztus.mongodb.net/SociTune?appName=Cluster0");
  await mongoose.connection.db.collection("songs").deleteMany({});
  await mongoose.connection.db.collection("albums").deleteMany({});
  console.log("DB Cleared!");
  process.exit(0);
}
clear();
