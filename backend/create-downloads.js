import mongoose from "mongoose";
import dotenv from "dotenv";
import Download from "./models/downloads.model.js";
import fs from "fs";
import path from "path";

dotenv.config();

const createDownloads = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore';
    await mongoose.connect(mongoURI);

    // Check if downloads already exist
    const existingCount = await Download.countDocuments();
    if (existingCount > 0) {
      console.log(`✅ ${existingCount} downloads already exist!`);
      console.log("Skipping seeding to avoid duplicates.");
      process.exit(0);
    }

    // Read data from downloads.json
    const downloadsDataPath = path.join(process.cwd(), '../front/src/data/downloads.json');
    const rawData = fs.readFileSync(downloadsDataPath, 'utf8');
    const jsonData = JSON.parse(rawData);

    // Insert downloads
    const downloads = jsonData.downloads.map(item => ({
      ...item,
      _id: undefined // Let MongoDB generate the ID
    }));

    await Download.insertMany(downloads);

    console.log(`✅ Successfully seeded ${downloads.length} downloads!`);

  } catch (error) {
    console.error("❌ Error seeding downloads:", error);
  } finally {
    mongoose.connection.close();
  }
};

createDownloads();

