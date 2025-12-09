import mongoose from "mongoose";
import dotenv from "dotenv";
import Testimonial from "./models/testimonials.model.js";
import fs from "fs";
import path from "path";

dotenv.config();

const createTestimonials = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore';
    await mongoose.connect(mongoURI);

    // Check if testimonials already exist
    const existingCount = await Testimonial.countDocuments();
    if (existingCount > 0) {
      console.log(`✅ ${existingCount} testimonials already exist!`);
      console.log("Skipping seeding to avoid duplicates.");
      process.exit(0);
    }

    // Read data from Testimonials.json
    const testimonialsDataPath = path.join(process.cwd(), '../front/src/data/Testimonials.json');
    const rawData = fs.readFileSync(testimonialsDataPath, 'utf8');
    const jsonData = JSON.parse(rawData);

    // Insert testimonials
    const testimonials = jsonData.Testimonials.map(item => ({
      ...item,
      _id: undefined, // Let MongoDB generate the ID
      status: 'approved' // Set all seeded testimonials to approved
    }));

    await Testimonial.insertMany(testimonials);

    console.log(`✅ Successfully seeded ${testimonials.length} testimonials!`);

  } catch (error) {
    console.error("❌ Error seeding testimonials:", error);
  } finally {
    mongoose.connection.close();
  }
};

createTestimonials();





