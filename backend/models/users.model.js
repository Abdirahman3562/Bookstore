import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  statusManuallySet: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['regular', 'premium'],
    default: 'regular'
  },
  adminRole: {
    type: String,
    enum: ['admin', 'author', null],
    default: null
  },
  permissions: {
    dashboard: { type: Boolean, default: false },
    books: { type: Boolean, default: false },
    downloads: { type: Boolean, default: false },
    purchased: { type: Boolean, default: false },
    testimonials: { type: Boolean, default: false },
    users: { type: Boolean, default: false },
    authors: { type: Boolean, default: false },
    blogs: { type: Boolean, default: false },
    addAdminUser: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

const User = mongoose.model("User", userSchema, "users");

export default User;
