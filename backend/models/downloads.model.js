import mongoose from "mongoose";

// Unified Downloads Schema - combines both legacy and new download tracking
const downloadSchema = new mongoose.Schema({
  // Multi-tenant support: every download belongs to a tenant
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true
  },
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
  // Book information (supports both legacy 'title' and new 'bookTitle')
  title: {
    type: String,
    required: true
  },
  bookTitle: {
    type: String,
    default: null // For backward compatibility, will be mapped to title
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
  // For paid books: reference to the purchase/order
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Purchased",
    default: null
  },
  // Download metadata
  timestamp: {
    type: Date,
    default: Date.now
  },
  downloadedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  // Access control
  notDownloaded: {
    type: Boolean,
    default: false
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  revokedAt: {
    type: Date,
    default: null
  },
  revokedBy: {
    type: String,
    default: null
  },
  // Download count for analytics
  downloadCount: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Indexes for efficient tenant-scoped queries
downloadSchema.index({ tenantId: 1, userId: 1 });
downloadSchema.index({ tenantId: 1, bookId: 1 });
downloadSchema.index({ tenantId: 1, createdAt: -1 });
downloadSchema.index({ tenantId: 1, downloadedAt: -1 });
downloadSchema.index({ tenantId: 1, orderId: 1 });
downloadSchema.index({ tenantId: 1, isFree: 1 });
downloadSchema.index({ tenantId: 1, notDownloaded: 1 });
downloadSchema.index({ tenantId: 1, isRevoked: 1 });

// Unified Download model for the 'downloads' collection
const Download = mongoose.model("Download", downloadSchema, "downloads");

export default Download;
