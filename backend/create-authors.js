import mongoose from "mongoose";
import dotenv from "dotenv";
import Author from "./models/authors.model.js";
import fs from "fs";
import path from "path";

dotenv.config();

const createAuthors = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore';
    await mongoose.connect(mongoURI);

    // Check if authors already exist
    const existingCount = await Author.countDocuments();
    if (existingCount > 0) {
      console.log(`✅ ${existingCount} authors already exist!`);
      console.log("Skipping seeding to avoid duplicates.");
      process.exit(0);
    }

    // Read data from authors.json
    const authorsDataPath = path.join(process.cwd(), '../front/src/data/authors.json');
    const rawData = fs.readFileSync(authorsDataPath, 'utf8');
    const jsonData = JSON.parse(rawData);

    // Insert authors
    const authors = jsonData.authors.map(item => ({
      username: item.username,
      name: item.name,
      avatar: item.avatar || "",
      verified: item.verified || false,
      bio: item.bio || "",
      location: item.location || "",
      website: item.website || "",
      email: item.email,
      social: {
        github: item.social?.github || "",
        linkedin: item.social?.linkedin || "",
        twitter: item.social?.twitter || "",
        youtube: item.social?.youtube || "",
        facebook: item.social?.facebook || "",
        instagram: item.social?.instagram || ""
      },
      status: item.status || 'active'
    }));

    await Author.insertMany(authors);

    console.log(`✅ Successfully seeded ${authors.length} authors!`);

  } catch (error) {
    console.error("❌ Error seeding authors:", error);
  } finally {
    mongoose.connection.close();
  }
};

createAuthors();




