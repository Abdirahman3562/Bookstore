import mongoose from "mongoose";
import dotenv from "dotenv";
import Blog from "./models/blogs.model.js";
import fs from "fs";
import path from "path";

dotenv.config();

const createBlogs = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore';
    await mongoose.connect(mongoURI);

    // Check if blogs already exist
    const existingCount = await Blog.countDocuments();
    if (existingCount > 0) {
      console.log(`✅ ${existingCount} blogs already exist!`);
      console.log("Skipping seeding to avoid duplicates.");
      process.exit(0);
    }

    // Read data from blogs.json
    const blogsDataPath = path.join(process.cwd(), '../front/src/data/blogs.json');
    const rawData = fs.readFileSync(blogsDataPath, 'utf8');
    const jsonData = JSON.parse(rawData);

    // Get blogs array
    const blogsArray = jsonData.blogs || jsonData || [];

    // Insert blogs
    const blogs = blogsArray.map(item => ({
      title: item.title,
      category: item.category,
      authorId: item.authorId, // Will be converted to ObjectId if it's a number/string
      publishedDate: item.publishedDate || new Date().toISOString().split('T')[0],
      thumbnail: item.thumbnail || "",
      content: item.content || "",
      comments: item.comments || [],
      status: item.status || 'draft'
    }));

    await Blog.insertMany(blogs);

    console.log(`✅ Successfully seeded ${blogs.length} blogs!`);

  } catch (error) {
    console.error("❌ Error seeding blogs:", error);
  } finally {
    mongoose.connection.close();
  }
};

createBlogs();




