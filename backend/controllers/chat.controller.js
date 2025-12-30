import ChatMessage from "../models/chat.model.js";
import User from "../models/users.model.js";
import Admin from "../models/admin.model.js";
import WebsiteSettings from "../models/websiteSettings.model.js";
import { getAIResponse } from "../utils/aiChatbot.js";

// Admin online tracking - Store admin online status in memory
const adminOnlineStatus = new Map(); // adminId -> { isOnline: boolean, lastSeen: Date }

// GET ALL CONVERSATIONS (grouped by user)
export const getAllConversations = async (req, res) => {
  try {
    // First, update any user messages that don't have isRead set
    await ChatMessage.updateMany(
      {
        tenantId: req.tenantId, // Add tenantId filter
        sender: "user",
        $or: [
          { isRead: { $exists: false } },
          { isRead: null }
        ]
      },
      { isRead: false }
    );

    // Get all unique users who have sent messages
    // For SUPER_ADMIN, show all conversations; for others, filter by tenant
    const matchCondition = req.admin?.adminRole === 'SUPER_ADMIN'
      ? {} // No tenant filter for SUPER_ADMIN
      : { tenantId: req.tenantId }; // Filter by tenant for regular admins

    const conversations = await ChatMessage.aggregate([
      { $match: matchCondition }, // Filter by tenant (or not for SUPER_ADMIN)
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

    // Get last message for each conversation and fetch user's current avatar
    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conv) => {
        const lastMsg = await ChatMessage.findOne({ userId: conv._id })
          .sort({ createdAt: -1 })
          .limit(1);
        
        // Fetch user's current avatar from User model if not in messages
        let userAvatar = conv.userAvatar;
        if (!userAvatar) {
          try {
            const user = await User.findById(conv._id);
            if (user && user.avatar) {
              userAvatar = user.avatar;
            }
          } catch (error) {
            console.log("Error fetching user avatar:", error);
          }
        }
        
        // Also get user's name and email from User model if available
        let userName = conv.userName;
        let userEmail = conv.userEmail;
        try {
          const user = await User.findById(conv._id);
          if (user) {
            if (!userName && user.name) userName = user.name;
            if (!userEmail && user.email) userEmail = user.email;
            // Always use the latest avatar from User model if available
            if (user.avatar) userAvatar = user.avatar;
          }
        } catch (error) {
          console.log("Error fetching user info:", error);
        }
        
        return {
          userId: conv._id,
          userName: userName || "User",
          userEmail: userEmail || "",
          userAvatar: userAvatar || "",
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

    const messages = await ChatMessage.find({ userId, tenantId: req.tenantId })
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

// CHECK IF ANY ADMIN IS ONLINE (legacy - for backward compatibility)
const isAnyAdminOnline = () => {
  const now = new Date();
  for (const [adminId, status] of adminOnlineStatus.entries()) {
    if (status.isOnline) {
      // Check if admin was active within last 5 minutes
      const lastSeen = new Date(status.lastSeen);
      const diffInMinutes = Math.floor((now - lastSeen) / 1000 / 60);
      if (diffInMinutes < 5) {
        return true;
      } else {
        // Auto-mark as offline if inactive for more than 5 minutes
        adminOnlineStatus.set(adminId, { isOnline: false, lastSeen: status.lastSeen });
      }
    }
  }
  return false;
};

// CHECK IF ANY ADMIN/AUTHOR IS LOGGED IN (using loggedInStatus from database)
const isAnyAdminLoggedIn = async () => {
  try {
    // Check Admin model for logged in admins/authors
    const loggedInAdmin = await Admin.findOne({ 
      loggedInStatus: true 
    });
    
    if (loggedInAdmin) {
      console.log("✅ Found logged in admin/author in Admin model:", loggedInAdmin.email);
      return true;
    }
    
    // Check User model for logged in admins/authors (legacy support)
    const loggedInUserAdmin = await User.findOne({ 
      adminRole: { $in: ['admin', 'author'] },
      loggedInStatus: true 
    });
    
    if (loggedInUserAdmin) {
      console.log("✅ Found logged in admin/author in User model:", loggedInUserAdmin.email);
      return true;
    }
    
    console.log("❌ No admin/author is logged in (loggedInStatus = false)");
    return false;
  } catch (error) {
    console.error("Error checking admin logged in status:", error);
    // Fallback to old method if database check fails
    return isAnyAdminOnline();
  }
};

// SET ADMIN ONLINE STATUS
export const setAdminOnlineStatus = async (req, res) => {
  try {
    const { adminId, isOnline } = req.body;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: "adminId is required"
      });
    }

    adminOnlineStatus.set(adminId, {
      isOnline: isOnline !== false, // Default to true if not specified
      lastSeen: new Date()
    });

    console.log(`👤 Admin ${adminId} is now ${isOnline !== false ? 'ONLINE' : 'OFFLINE'}`);

    res.status(200).json({
      success: true,
      message: "Admin online status updated",
      data: { isOnline: isOnline !== false }
    });
  } catch (err) {
    console.error("Error setting admin online status:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// GET ADMIN ONLINE STATUS
export const getAdminOnlineStatus = async (req, res) => {
  try {
    const isOnline = isAnyAdminOnline();
    res.status(200).json({
      success: true,
      data: { isOnline }
    });
  } catch (err) {
    console.error("Error getting admin online status:", err);
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

    // If sender is user, get user info and check if admin is online
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

      // Check if any admin/author is logged in (using loggedInStatus from database)
      const adminLoggedIn = await isAnyAdminLoggedIn();
      console.log("🔍 Checking admin/author logged in status (loggedInStatus):", adminLoggedIn);
      
      // Check if user is online
      // If user is sending a message, they are considered online
      // Also check isOnline field if it exists
      const userIsOnline = user.isOnline === true || user.isOnline === undefined || user.isOnline === null;
      console.log("👤 User online status:", userIsOnline, "(isOnline field:", user.isOnline, ")");
      
      // Check if there are recent admin/author messages (within last 10 minutes)
      // This indicates an admin/author is actively responding to this conversation
      const recentAdminMessages = await ChatMessage.find({
        userId: userId,
        sender: "admin",
        createdAt: {
          $gte: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
        }
      }).sort({ createdAt: -1 }).limit(1);
      
      const hasRecentAdminActivity = recentAdminMessages.length > 0;
      console.log("📝 Recent admin activity in conversation:", hasRecentAdminActivity);
      
      // Save user message first
      const userMessage = await ChatMessage.create({
        tenantId: req.tenantId, // Add tenantId from middleware
        userId,
        userName,
        userEmail,
        userAvatar,
        message,
        sender: "user",
        isRead: false,
        isAIChat: !adminLoggedIn // Mark as AI chat if no admin is logged in
      });
      
      // Use AI if:
      // 1. User is online (user must be logged in and online)
      // 2. NOT (admin/author is logged in AND actively responding)
      // This means:
      // - If admin is logged in AND responding → NO AI (admin handles it)
      // - If admin is logged in BUT not responding → AI responds
      // - If admin is NOT logged in → AI responds
      const adminIsResponding = adminLoggedIn && hasRecentAdminActivity;
      
      if (userIsOnline && !adminIsResponding) {
        // Admin/Author is not actively responding - use AI to respond
        if (!adminLoggedIn) {
          console.log("🤖 Admin/Author is not logged in (loggedInStatus = false) - Using AI to respond:", userId);
        } else if (adminLoggedIn && !hasRecentAdminActivity) {
          console.log("🤖 Admin/Author is logged in but not actively responding to this user - Using AI to respond:", userId);
        }
        
        // Get conversation history for context
        const conversationHistory = await ChatMessage.find({ userId, tenantId: req.tenantId })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();
        
        // Reverse to get chronological order
        conversationHistory.reverse();
        
        // Get website settings for AI response
        const websiteSettings = await WebsiteSettings.getSettings();
        const websiteName = websiteSettings?.websiteName || "Bookstore";
        
        // Get AI response
        const aiResponse = await getAIResponse(message, conversationHistory, websiteName);
        console.log("💬 AI Response:", aiResponse);
        
        // Save AI response to database
        const aiMessage = await ChatMessage.create({
          tenantId: req.tenantId, // Add tenantId from middleware
          userId,
          userName,
          userEmail,
          userAvatar,
          message: aiResponse,
          sender: "ai",
          isRead: false,
          isAIChat: true
        });

        console.log("✅ AI message saved to database:", aiMessage._id);

        return res.status(201).json({
          success: true,
          message: "Message sent successfully, AI responded",
          data: {
            userMessage,
            aiMessage
          }
        });
      } else {
        // Admin/Author is logged in AND actively responding - NO AI response, admin will respond manually
        if (adminLoggedIn && hasRecentAdminActivity) {
          console.log("👤 Admin/Author is logged in (loggedInStatus = true) AND actively responding - NO AI response, waiting for admin/author response");
        } else if (!userIsOnline) {
          console.log("👤 User is not online - NO AI response");
        }
        return res.status(201).json({
          success: true,
          message: "Message sent successfully, admin/author is handling the conversation",
          data: userMessage
        });
      }
    } else {
      // For admin/AI messages, get user info from previous messages or User model
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

      const chatMessage = await ChatMessage.create({
        tenantId: req.tenantId, // Add tenantId from middleware
        userId,
        userName,
        userEmail,
        userAvatar,
        message,
        sender,
        adminId: sender === "admin" ? adminId : null,
        adminName: sender === "admin" ? adminName : null,
        adminAvatar: sender === "admin" ? adminAvatar : null,
        isRead: false
      });

      return res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: chatMessage
      });
    }
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
      { userId, tenantId: req.tenantId, sender: senderToMark, isRead: false },
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
      tenantId: req.tenantId,
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
        tenantId: req.tenantId,
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
    const { userId, isTyping, sender, adminName, adminAvatar } = req.body;

    console.log("📝 Setting typing status:", { userId, isTyping, sender, adminName, adminAvatar });

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
        timestamp: new Date(),
        // Store admin info if sender is admin
        adminName: sender === "admin" ? adminName : null,
        adminAvatar: sender === "admin" ? adminAvatar : null
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
        sender: status?.sender || null,
        adminName: status?.adminName || null,
        adminAvatar: status?.adminAvatar || null
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

// TAKE OVER CHAT (Admin takes over from AI)
export const takeOverChat = async (req, res) => {
  try {
    const { userId, adminId, adminName, adminAvatar } = req.body;

    if (!userId || !adminId) {
      return res.status(400).json({
        success: false,
        message: "userId and adminId are required"
      });
    }

    // Update all AI messages for this user to mark that admin has taken over
    await ChatMessage.updateMany(
      { 
        userId, 
        sender: "ai",
        takenOverBy: null // Only update messages not already taken over
      },
      { 
        takenOverBy: adminId,
        takenOverAt: new Date()
      }
    );

    // Get user info
    const lastUserMsg = await ChatMessage.findOne({ userId, sender: "user" })
      .sort({ createdAt: -1 });
    
    let userName = "";
    let userEmail = "";
    let userAvatar = "";
    
    if (lastUserMsg) {
      userName = lastUserMsg.userName;
      userEmail = lastUserMsg.userEmail;
      userAvatar = lastUserMsg.userAvatar;
    } else {
      const user = await User.findById(userId);
      if (user) {
        userName = user.name || "";
        userEmail = user.email || "";
        userAvatar = user.avatar || "";
      }
    }

    // Send a system message that admin has taken over
    const takeoverMessage = await ChatMessage.create({
      userId,
      userName,
      userEmail,
      userAvatar,
      message: `${adminName || 'Admin'} has joined the conversation and will assist you now.`,
      sender: "admin",
      adminId,
      adminName,
      adminAvatar,
      isRead: false
    });

    console.log(`✅ Admin ${adminId} took over chat for user ${userId}`);

    res.status(200).json({
      success: true,
      message: "Chat taken over successfully",
      data: takeoverMessage
    });
  } catch (err) {
    console.error("Error taking over chat:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// SEND AUTOMATIC AI GREETING WHEN USER COMES ONLINE
export const sendAIGreeting = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required"
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if any admin/author is logged in (using loggedInStatus from database)
    const adminLoggedIn = await isAnyAdminLoggedIn();
    console.log("🔍 Checking admin/author logged in status (loggedInStatus) for AI greeting:", adminLoggedIn);
    
    // Check if there are recent admin/author messages (within last 10 minutes)
    // Only send AI greeting if admin/author is not logged in OR not actively responding
    const recentAdminMessages = await ChatMessage.find({
      userId: userId,
      sender: "admin",
      createdAt: {
        $gte: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
      }
    }).sort({ createdAt: -1 }).limit(1);
    
    const hasRecentAdminActivity = recentAdminMessages.length > 0;
    console.log("📝 Recent admin activity in conversation:", hasRecentAdminActivity);
    
    // Don't send AI greeting if admin/author is logged in AND actively responding
    if (adminLoggedIn && hasRecentAdminActivity) {
      // Admin/Author is logged in AND actively responding - don't send AI greeting
      console.log("👤 Admin/Author is logged in and actively responding - No AI greeting sent");
      return res.status(200).json({
        success: true,
        message: "Admin/Author is logged in and actively responding, no AI greeting sent",
        data: null
      });
    }
    
    // Check if user is online
    // If user exists and is requesting greeting, they are considered online
    // Also check isOnline field if it exists (but don't block if field doesn't exist)
    const userIsOnline = user.isOnline !== false; // Only block if explicitly false
    console.log("👤 User online status for greeting:", userIsOnline, "(isOnline field:", user.isOnline, ")");
    
    if (!userIsOnline) {
      console.log("👤 User is explicitly marked as offline (isOnline = false) - No AI greeting sent");
      return res.status(200).json({
        success: true,
        message: "User is offline, no AI greeting sent",
        data: null
      });
    }
    
    // Check if user already has messages
    const existingMessages = await ChatMessage.find({ userId }).sort({ createdAt: 1 });
    
    // Only send greeting if user has no messages (first time coming online)
    if (existingMessages.length === 0) {
      const userName = user.name || "";
      const userEmail = user.email || "";
      const userAvatar = user.avatar || "";

      // Get website settings for AI response
      const websiteSettings = await WebsiteSettings.getSettings();
      const websiteName = websiteSettings?.websiteName || "Bookstore";
      console.log("🌐 Website name for AI greeting:", websiteName);
      
      // Get AI greeting response (empty conversation history for first greeting)
      const aiGreeting = await getAIResponse("Hello", [], websiteName);
      console.log("💬 AI Greeting generated:", aiGreeting.substring(0, 100) + "...");
      
      // Save AI greeting message
      const aiMessage = await ChatMessage.create({
        userId,
        userName,
        userEmail,
        userAvatar,
        message: aiGreeting,
        sender: "ai",
        isRead: false,
        isAIChat: true
      });

      console.log("✅ Automatic AI greeting sent to user (no admin online):", userId);

      return res.status(201).json({
        success: true,
        message: "AI greeting sent successfully (no admin online)",
        data: aiMessage
      });
    } else {
      // User already has messages
      console.log("📝 User already has messages, no greeting sent");
      return res.status(200).json({
        success: true,
        message: "User already has messages, no greeting sent",
        data: null
      });
    }
  } catch (err) {
    console.error("Error sending AI greeting:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

