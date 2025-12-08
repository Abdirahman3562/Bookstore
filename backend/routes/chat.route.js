import express from "express";
import {
  getAllConversations,
  getUserMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
  setTypingStatus,
  getTypingStatus
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

export default router;


