import mongoose from "mongoose";
import dotenv from "dotenv";
import Purchased from "./models/purchased.model.js";
import fs from "fs";
import path from "path";

dotenv.config();

const createPurchased = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore';
    await mongoose.connect(mongoURI);

    // Check if purchased items already exist
    const existingCount = await Purchased.countDocuments();
    if (existingCount > 0) {
      console.log(`✅ ${existingCount} purchased items already exist!`);
      console.log("Skipping seeding to avoid duplicates.");
      process.exit(0);
    }

    // Read data from purchased.json
    const purchasedDataPath = path.join(process.cwd(), '../front/src/data/purchased.json');
    const rawData = fs.readFileSync(purchasedDataPath, 'utf8');
    const jsonData = JSON.parse(rawData);

    // Insert purchased items
    const purchasedItems = jsonData.purchased.map(item => ({
      ...item,
      _id: undefined // Let MongoDB generate the ID
    }));

    await Purchased.insertMany(purchasedItems);

    console.log(`✅ Successfully seeded ${purchasedItems.length} purchased items!`);

  } catch (error) {
    console.error("❌ Error seeding purchased items:", error);
  } finally {
    mongoose.connection.close();
  }
};

createPurchased();
