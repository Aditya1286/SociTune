import mongoose from 'mongoose';

const MONGO_URI = "mongodb+srv://aishwaryaaditya2_db_user:9doNtS2LDp2bYUMz@cluster0.kftztus.mongodb.net/SociTune?appName=Cluster0";

const NotificationSchema = new mongoose.Schema({
  userId: String,
  type: String,
  title: String,
  message: String,
  isRead: Boolean,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Notification = mongoose.model('Notification', NotificationSchema);

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const count = await Notification.countDocuments();
    console.log(`Total notifications count: ${count}`);

    const sample = await Notification.find().limit(5);
    console.log("Sample notifications:", JSON.stringify(sample, null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
