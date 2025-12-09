import express from "express";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
} from "../controllers/notifications.controller.js";

const router = express.Router();

// GET all notifications for a user
router.get("/:userId", getUserNotifications);

// MARK notification as read
router.patch("/:id/read", markAsRead);

// MARK all notifications as read
router.patch("/read-all", markAllAsRead);

// DELETE a notification
router.delete("/:id", deleteNotification);

// DELETE all notifications
router.delete("/", deleteAllNotifications);

export default router;





