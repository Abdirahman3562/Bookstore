import ChatMessage from "../models/chat.model.js";
import User from "../models/users.model.js";

// GET ALL CONVERSATIONS (grouped by user)
export const getAllConversations = async (req, res) => {
  try {
    // First, update any user messages that don't have isRead set
    await ChatMessage.updateMany(
      {
        sender: "user",
        $or: [
          { isRead: { $exists: false } },
          { isRead: null }
        ]
      },
      { isRead: false }
    );

    // Get all unique users who have sent messages
    const conversations = await ChatMessage.aggregate([
      {
        $group: {
          _id: "$userId",
          lastMessage: { $max: "$createdAt" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$sender", "user"] }, { $eq: ["$isRead", false] }] },
                1,
                0
              ]
            }
          },
          userName: { $first: "$userName" },
          userEmail: { $first: "$userEmail" },
          userAvatar: { $first: "$userAvatar" }
        }
      },
      { $sort: { lastMessage: -1 } }
    ]);

    // Get last message for each conversation
    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conv) => {
        const lastMsg = await ChatMessage.findOne({ userId: conv._id })
          .sort({ createdAt: -1 })
          .limit(1);
        
        return {
          userId: conv._id,
          userName: conv.userName,
          userEmail: conv.userEmail,
          userAvatar: conv.userAvatar,
          unreadCount: conv.unreadCount,
          lastMessage: lastMsg ? {
            message: lastMsg.message,
            sender: lastMsg.sender,
            createdAt: lastMsg.createdAt
          } : null,
          lastActivity: conv.lastMessage
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Conversations fetched successfully",
      data: conversationsWithLastMessage
    });
  } catch (err) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// GET MESSAGES FOR A SPECIFIC USER
export const getUserMessages = async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await ChatMessage.find({ userId })
      .sort({ createdAt: 1 })
      .limit(100);

    // Don't mark messages as read here - only mark when admin explicitly calls markAsRead
    // This prevents user messages from being marked as read when user fetches their own messages

    res.status(200).json({
      success: true,
      message: "Messages fetched successfully",
      data: messages
    });
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// SEND MESSAGE (from user or admin)
export const sendMessage = async (req, res) => {
  try {
    const { userId, message, sender, adminId, adminName, adminAvatar } = req.body;

    if (!userId || !message || !sender) {
      return res.status(400).json({
        success: false,
        message: "userId, message, and sender are required"
      });
    }

    // If sender is user, get user info
    let userName = "";
    let userEmail = "";
    let userAvatar = "";

    if (sender === "user") {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      userName = user.name || "";
      userEmail = user.email || "";
      userAvatar = user.avatar || "";
    } else {
      // For admin messages, get user info from previous messages or User model
      const lastUserMsg = await ChatMessage.findOne({ userId, sender: "user" })
        .sort({ createdAt: -1 });
      if (lastUserMsg) {
        userName = lastUserMsg.userName;
        userEmail = lastUserMsg.userEmail;
        userAvatar = lastUserMsg.userAvatar;
      } else {
        // If no previous messages, get user info from User model
        const user = await User.findById(userId);
        if (user) {
          userName = user.name || "";
          userEmail = user.email || "";
          userAvatar = user.avatar || "";
        }
      }
    }

    const chatMessage = await ChatMessage.create({
      userId,
      userName,
      userEmail,
      userAvatar,
      message,
      sender,
      adminId: sender === "admin" ? adminId : null,
      adminName: sender === "admin" ? adminName : null,
      adminAvatar: sender === "admin" ? adminAvatar : null,
      isRead: false // All messages start as unread - user messages unread until admin reads them, admin messages unread until user reads them
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: chatMessage
    });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// MARK MESSAGES AS READ
export const markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const { sender } = req.query; // "user" or "admin" - defaults to "user" for backward compatibility

    // If sender is "admin", mark admin messages as read (for user side)
    // If sender is "user" or not specified, mark user messages as read (for admin side)
    const senderToMark = sender === "admin" ? "admin" : "user";

    await ChatMessage.updateMany(
      { userId, sender: senderToMark, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: "Messages marked as read"
    });
  } catch (err) {
    console.error("Error marking messages as read:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// GET UNREAD COUNT
export const getUnreadCount = async (req, res) => {
  try {
    // Count messages where sender is "user" and:
    // - isRead is false, OR
    // - isRead is not set (null/undefined) - treat as unread
    const unreadCount = await ChatMessage.countDocuments({
      sender: "user",
      $or: [
        { isRead: false },
        { isRead: { $exists: false } },
        { isRead: null }
      ]
    });

    // Also update any user messages that don't have isRead set to false
    // This fixes existing messages in the database
    await ChatMessage.updateMany(
      {
        sender: "user",
        $or: [
          { isRead: { $exists: false } },
          { isRead: null }
        ]
      },
      { isRead: false }
    );

    res.status(200).json({
      success: true,
      data: { unreadCount }
    });
  } catch (err) {
    console.error("Error getting unread count:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// Store typing status in memory (simple approach)
const typingStatus = new Map(); // userId -> { isTyping: boolean, sender: string, timestamp: Date }

// SET TYPING STATUS
export const setTypingStatus = async (req, res) => {
  try {
    const { userId, isTyping, sender } = req.body;

    console.log("📝 Setting typing status:", { userId, isTyping, sender });

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    if (isTyping) {
      typingStatus.set(userId, {
        isTyping: true,
        sender: sender || "user",
        timestamp: new Date()
      });
      console.log("✅ Typing status set:", typingStatus.get(userId));
    } else {
      typingStatus.delete(userId);
      console.log("❌ Typing status cleared for userId:", userId);
    }

    res.status(200).json({
      success: true,
      message: "Typing status updated"
    });
  } catch (err) {
    console.error("Error setting typing status:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// GET TYPING STATUS
export const getTypingStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    const status = typingStatus.get(userId);
    
    // Auto-clear typing status after 5 seconds of inactivity
    if (status && status.timestamp) {
      const now = new Date();
      const diffInSeconds = Math.floor((now - status.timestamp) / 1000);
      if (diffInSeconds > 5) {
        typingStatus.delete(userId);
        console.log("⏰ Typing status expired for userId:", userId);
        return res.status(200).json({
          success: true,
          data: { isTyping: false, sender: null }
        });
      }
    }

    console.log("📖 Getting typing status for userId:", userId, "Status:", status);

    res.status(200).json({
      success: true,
      data: {
        isTyping: status?.isTyping || false,
        sender: status?.sender || null
      }
    });
  } catch (err) {
    console.error("Error getting typing status:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

