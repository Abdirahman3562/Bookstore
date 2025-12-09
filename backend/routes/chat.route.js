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

const router = express.Router();

// GET all conversations
router.get("/conversations", getAllConversations);

// GET messages for a specific user
router.get("/messages/:userId", getUserMessages);

// SEND a message
router.post("/send", sendMessage);

// MARK messages as read
router.patch("/read/:userId", markAsRead);

// GET unread count
router.get("/unread-count", getUnreadCount);

// SET typing status
router.post("/typing", setTypingStatus);

// GET typing status
router.get("/typing/:userId", getTypingStatus);

// SET admin online status
router.post("/admin/online", setAdminOnlineStatus);

// GET admin online status
router.get("/admin/online", getAdminOnlineStatus);

// TAKE OVER chat from AI
router.post("/takeover", takeOverChat);

// SEND automatic AI greeting when user comes online
router.post("/ai-greeting/:userId", sendAIGreeting);

export default router;


