import mongoose from "mongoose";
export const connectDB = async () => {
  try {
    const connection = await mongoose
      .connect(process.env.LOCAL_MONGO_DB_URI)
      .then(() => console.log("connected to the MongoDB"));
  } catch (error) {
    console.log(error.message);
    process.exit(i);
  }
};
