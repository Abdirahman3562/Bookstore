import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  // Multi-tenant support: every chat message belongs to a tenant
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
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userAvatar: {
    type: String,
    default: ""
  },
  message: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    enum: ['user', 'admin', 'ai'],
    required: true
  },
  isAIChat: {
    type: Boolean,
    default: false
  },
  takenOverBy: {
    type: String, // adminId who took over
    default: null
  },
  takenOverAt: {
    type: Date,
    default: null
  },
  adminId: {
    type: String,
    default: null
  },
  adminName: {
    type: String,
    default: null
  },
  adminAvatar: {
    type: String,
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
chatMessageSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });
chatMessageSchema.index({ tenantId: 1, isRead: 1, sender: 1 });
chatMessageSchema.index({ tenantId: 1, createdAt: -1 });

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema, "chatmessages");

export default ChatMessage;

