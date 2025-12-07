import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
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
    enum: ['user', 'admin'],
    required: true
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

// Index for efficient queries
chatMessageSchema.index({ userId: 1, createdAt: -1 });
chatMessageSchema.index({ isRead: 1, sender: 1 });

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema, "chatmessages");

export default ChatMessage;

