import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    author: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      default: 0,
    },

    pdfUrl: {
      type: String,
      required: true,
    },

    cover: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    publisher: {
      type: String,
      default: "Unknown Publisher",
    },

    publishedDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);


const Book = mongoose.model("Book", bookSchema);
export default Book;