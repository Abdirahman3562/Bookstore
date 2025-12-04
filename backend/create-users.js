import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/users.model.js";
import fs from "fs";
import path from "path";

dotenv.config();

const createUsers = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore';
    await mongoose.connect(mongoURI);

    // Check if users already exist
    const existingCount = await User.countDocuments();
    if (existingCount > 0) {
      console.log(`✅ ${existingCount} users already exist!`);
      console.log("Skipping seeding to avoid duplicates.");
      process.exit(0);
    }

    // Read data from users.json
    const usersDataPath = path.join(process.cwd(), '../front/src/data/users.json');
    const rawData = fs.readFileSync(usersDataPath, 'utf8');
    const jsonData = JSON.parse(rawData);

    // Insert users
    const users = jsonData.users.map(item => ({
      name: item.name,
      email: item.email,
      password: item.password,
      avatar: item.avatar || "",
      status: 'active', // Default status
      role: 'regular' // Default role, will be updated based on purchases
    }));

    await User.insertMany(users);

    console.log(`✅ Successfully seeded ${users.length} users!`);

  } catch (error) {
    console.error("❌ Error seeding users:", error);
  } finally {
    mongoose.connection.close();
  }
};

createUsers();
