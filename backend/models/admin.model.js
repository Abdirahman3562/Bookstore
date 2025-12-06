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
      delete: { type: Boolean, default: undefined },
      revoke: { type: Boolean, default: undefined }
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
    blogComments: {
      view: { type: Boolean, default: undefined },
      reply: { type: Boolean, default: undefined },
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
    addAdminUser: {
      view: { type: Boolean, default: undefined },
      add: { type: Boolean, default: undefined },
      edit: { type: Boolean, default: undefined },
      delete: { type: Boolean, default: undefined }
    }
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
