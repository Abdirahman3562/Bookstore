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
    default: undefined // No default - only set for admin users
  },
  role: {
    type: String,
    enum: ['regular', 'premium'],
    default: undefined // No default - only set for admin users
  },
  adminRole: {
    type: String,
    enum: ['admin', 'author', null],
    default: undefined // No default - only set for admin users
  },
  permissions: {
    dashboard: { 
      view: { type: Boolean, default: undefined },
      add: { type: Boolean, default: undefined },
      edit: { type: Boolean, default: undefined },
      delete: { type: Boolean, default: undefined }
    },
    books: { 
      view: { type: Boolean, default: undefined },
      add: { type: Boolean, default: undefined },
      edit: { type: Boolean, default: undefined },
      delete: { type: Boolean, default: undefined }
    },
    downloads: { 
      view: { type: Boolean, default: undefined },
      add: { type: Boolean, default: undefined },
      edit: { type: Boolean, default: undefined },
      delete: { type: Boolean, default: undefined }
    },
    purchased: { 
      view: { type: Boolean, default: undefined },
      add: { type: Boolean, default: undefined },
      edit: { type: Boolean, default: undefined },
      delete: { type: Boolean, default: undefined }
    },
    testimonials: { 
      view: { type: Boolean, default: undefined },
      add: { type: Boolean, default: undefined },
      edit: { type: Boolean, default: undefined },
      delete: { type: Boolean, default: undefined }
    },
    users: { 
      view: { type: Boolean, default: undefined },
      add: { type: Boolean, default: undefined },
      edit: { type: Boolean, default: undefined },
      delete: { type: Boolean, default: undefined }
    },
    authors: { 
      view: { type: Boolean, default: undefined },
      add: { type: Boolean, default: undefined },
      edit: { type: Boolean, default: undefined },
      delete: { type: Boolean, default: undefined }
    },
    blogs: { 
      view: { type: Boolean, default: undefined },
      add: { type: Boolean, default: undefined },
      edit: { type: Boolean, default: undefined },
      delete: { type: Boolean, default: undefined }
    },
    contacts: { 
      view: { type: Boolean, default: undefined },
      add: { type: Boolean, default: undefined },
      edit: { type: Boolean, default: undefined },
      delete: { type: Boolean, default: undefined }
    },
    websiteSettings: { 
      view: { type: Boolean, default: undefined },
      add: { type: Boolean, default: undefined },
      edit: { type: Boolean, default: undefined },
      delete: { type: Boolean, default: undefined }
    },
    addAdminUser: { type: Boolean, default: undefined }
  },
  verificationToken: {
    type: String,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  verificationTokenExpires: {
    type: Date,
    default: null
  },
  twoStepVerification: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const User = mongoose.model("User", userSchema, "users");

export default User;
