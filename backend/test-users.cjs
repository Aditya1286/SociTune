const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://aishwaryaaditya2_db_user:9doNtS2LDp2bYUMz@cluster0.kftztus.mongodb.net/SociTune?appName=Cluster0";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db("SociTune");
    const usersCount = await db.collection("users").countDocuments();
    console.log("Total users in DB:", usersCount);
  } finally {
    await client.close();
  }
}
run().catch(console.error);
