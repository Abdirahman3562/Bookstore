import mongoose from "mongoose";

const authorSchema = new mongoose.Schema({
  // Multi-tenant support: every author belongs to a tenant
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true,
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

// Compound index for tenant-scoped username uniqueness
authorSchema.index({ tenantId: 1, username: 1 }, { unique: true });
authorSchema.index({ tenantId: 1, status: 1 });

const Author = mongoose.model("Author", authorSchema, "authors");

export default Author;







