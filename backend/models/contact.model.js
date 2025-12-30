import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  // Multi-tenant support: every contact message belongs to a tenant
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true
  },
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

// Indexes for efficient tenant-scoped queries
contactSchema.index({ tenantId: 1, status: 1 });
contactSchema.index({ tenantId: 1, userId: 1 });
contactSchema.index({ tenantId: 1, createdAt: -1 });

const Contact = mongoose.model("Contact", contactSchema, "contacts");

export default Contact;

