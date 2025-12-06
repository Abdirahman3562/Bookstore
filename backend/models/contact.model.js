import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  userAvatar: {
    type: String,
    default: ""
  },
  message: {
    type: String,
    required: true,
    maxLength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'read', 'replied'],
    default: 'pending'
  }
}, {
  timestamps: true
});

const Contact = mongoose.model("Contact", contactSchema, "contacts");

export default Contact;

