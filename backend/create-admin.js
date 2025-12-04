import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "./models/admin.model.js";

dotenv.config();

const createAdmin = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore';
    await mongoose.connect(mongoURI);

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: "admin@bookstore.com" });
    if (existingAdmin) {
      console.log("Admin user already exists!");
      console.log("Email: admin@bookstore.com");
      console.log("Password: admin123");
      process.exit(0);
    }

    // Create admin user
    const admin = new Admin({
      email: "admin@bookstore.com",
      password: "admin123" // In production, this should be hashed
    });

    await admin.save();

    console.log("✅ Admin user created successfully!");
    console.log("Email: admin@bookstore.com");
    console.log("Password: admin123");
    console.log("Please change the password in production!");

  } catch (error) {
    console.error("❌ Error creating admin:", error);
  } finally {
    mongoose.connection.close();
  }
};

createAdmin();

