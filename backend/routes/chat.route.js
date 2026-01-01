import express from "express";
import {
  getAllConversations,
  getUserMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
  setTypingStatus,
  getTypingStatus,
  setAdminOnlineStatus,
  getAdminOnlineStatus,
  takeOverChat,
  sendAIGreeting
} from "../controllers/chat.controller.js";
import { resolveTenant, requireTenant, checkTenantAccess } from "../middleware/tenant.middleware.js";
import { requireAuth, optionalAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// Apply authentication and tenant middleware to all chat routes
router.use(requireAuth); // Admin authentication first
router.use(resolveTenant);
router.use(requireTenant);
router.use(checkTenantAccess);

// GET all conversations (admin only)
router.get("/conversations", getAllConversations);

// GET messages for a specific user (admin only, or user accessing their own messages)
router.get("/messages/:userId", optionalAuth, resolveTenant, requireTenant, getUserMessages);

// SEND a message
router.post("/send", optionalAuth, resolveTenant, requireTenant, sendMessage);

// MARK messages as read
router.patch("/read/:userId", optionalAuth, resolveTenant, requireTenant, markAsRead);

// GET unread count
router.get("/unread-count", getUnreadCount);

// SET typing status
router.post("/typing", optionalAuth, resolveTenant, requireTenant, setTypingStatus);

// GET typing status
router.get("/typing/:userId", optionalAuth, resolveTenant, requireTenant, getTypingStatus);

// SET admin online status
router.post("/admin/online", setAdminOnlineStatus);

// GET admin online status
router.get("/admin/online", getAdminOnlineStatus);

// TAKE OVER chat from AI
router.post("/takeover", takeOverChat);

// SEND automatic AI greeting when user comes online
router.post("/ai-greeting/:userId", optionalAuth, resolveTenant, requireTenant, sendAIGreeting);

export default router;


