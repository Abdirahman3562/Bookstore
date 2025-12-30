import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  // Multi-tenant support: tenant_id is null for SUPER_ADMIN, required for ADMIN
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    default: null, // null = SUPER_ADMIN (platform owner)
    index: true
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
    enum: ['SUPER_ADMIN', 'admin', 'author'], // SUPER_ADMIN = platform owner
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
    },
    liveChat: {
      view: { type: Boolean, default: undefined },
      reply: { type: Boolean, default: undefined }
    }
  },
  authorId: {
    type: String,
    default: null
  },
  twoStepVerification: {
    type: Boolean,
    default: false
  },
  loggedInStatus: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    default: null
  }
}, {
  timestamps: true
});

// Compound index for tenant-scoped email uniqueness
adminSchema.index({ tenantId: 1, email: 1 }, { unique: true, sparse: true });
adminSchema.index({ adminRole: 1 });

const Admin = mongoose.model("Admin", adminSchema);
export default Admin;
