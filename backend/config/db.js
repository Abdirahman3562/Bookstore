import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bookstore';
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.log("⚠️  MongoDB connection failed, but server will continue:", error.message);
    console.log("💡 Make sure MongoDB is running or check your .env file");
    // Don't exit - let the server continue without database
  }
};
