import mongoose from "mongoose";

const downloadSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  bookId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  cover: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    default: 0
  },
  isFree: {
    type: Boolean,
    default: false
  },
  pdfUrl: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  notDownloaded: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

const Download = mongoose.model("Download", downloadSchema, "downloads");

export default Download;
