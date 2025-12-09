import mongoose from "mongoose";

const authorSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: ""
  },
  verified: {
    type: Boolean,
    default: false
  },
  bio: {
    type: String,
    default: ""
  },
  location: {
    type: String,
    default: ""
  },
  website: {
    type: String,
    default: ""
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  social: {
    github: {
      type: String,
      default: ""
    },
    linkedin: {
      type: String,
      default: ""
    },
    twitter: {
      type: String,
      default: ""
    },
    youtube: {
      type: String,
      default: ""
    },
    facebook: {
      type: String,
      default: ""
    },
    instagram: {
      type: String,
      default: ""
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

const Author = mongoose.model("Author", authorSchema, "authors");

export default Author;







