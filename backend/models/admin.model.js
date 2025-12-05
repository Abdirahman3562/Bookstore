import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
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
  adminRole: {
    type: String,
    enum: ['admin', 'author'],
    default: 'admin'
  },
  permissions: {
    dashboard: { type: Boolean, default: true },
    books: { type: Boolean, default: true },
    downloads: { type: Boolean, default: true },
    purchased: { type: Boolean, default: true },
    testimonials: { type: Boolean, default: true },
    users: { type: Boolean, default: true },
    authors: { type: Boolean, default: true },
    blogs: { type: Boolean, default: true },
    addAdminUser: { type: Boolean, default: true }
  },
  twoStepVerification: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
