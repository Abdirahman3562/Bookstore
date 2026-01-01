import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  // Multi-tenant support: every notification belongs to a tenant
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  receiverRole: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  type: {
    type: String,
    required: true,
    enum: ['new_order', 'order_approved', 'order_active', 'order_cancelled', 'download_available', 'general'],
    default: 'general'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedId: {
    type: String, // Can be purchase ID, download ID, etc.
    default: null
  },
  relatedType: {
    type: String, // 'purchase', 'download', etc.
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient tenant-scoped queries
notificationSchema.index({ tenantId: 1, userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ tenantId: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema, "notifications");

export default Notification;





