import express from "express";
import Notification from "../models/notifications.model.js";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  createNotification
} from "../controllers/notifications.controller.js";
import { resolveTenant, requireTenant, checkTenantAccess } from "../middleware/tenant.middleware.js";

const router = express.Router();

// Apply tenant middleware to all notification routes
router.use(async (req, res, next) => {
  // Special handling for localhost development - bypass tenant checks
  if (req.headers.host && req.headers.host.includes('localhost')) {
    console.log('🏠 Localhost request detected for notifications - bypassing tenant checks');
    req.tenantId = '6953b1f351551dd25f2ed2d9'; // samafale tenant ID
    req.tenant = { _id: '6953b1f351551dd25f2ed2d9', name: 'samafale' };
    req.user = { _id: req.params.userId }; // Mock user for checkTenantAccess
    req.isSuperAdmin = false;
    return next();
  }

  // For production/other domains, use normal tenant middleware
  resolveTenant(req, res, () => {
    requireTenant(req, res, () => {
      checkTenantAccess(req, res, next);
    });
  });
});

// GET all notifications for a user
router.get("/:userId", getUserNotifications);

// DEBUG: Get all notifications (for testing) - NO AUTH FOR TESTING
router.get("/debug/all", async (req, res) => {
  try {
    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(20);

    console.log("🐛 DEBUG: Found", notifications.length, "total notifications from database");
    notifications.forEach((n, i) => {
      console.log(`  ${i+1}. UserID: ${n.userId}, Title: ${n.title}, Type: ${n.type}`);
    });

    res.json({
      success: true,
      count: notifications.length,
      notifications: notifications.map(n => ({
        id: n._id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        createdAt: n.createdAt
      }))
    });
  } catch (error) {
    console.error("🐛 DEBUG Error:", error);

    // Provide mock data when database is not available
    const mockNotifications = [
      {
        id: "mock-1",
        userId: "admin-1",
        title: "Welcome Notification",
        message: "This is a mock notification for testing",
        type: "general",
        createdAt: new Date()
      }
    ];

    console.log("🐛 DEBUG: Database not available, returning mock data");
    res.json({
      success: true,
      count: mockNotifications.length,
      notifications: mockNotifications,
      note: "Database not available - showing mock data"
    });
  }
});

// POST create new notification
router.post("/", createNotification);

// MARK notification as read
router.patch("/:id/read", markAsRead);

// MARK all notifications as read
router.patch("/read-all", markAllAsRead);

// DELETE a notification
router.delete("/:id", deleteNotification);

// DELETE all notifications
router.delete("/", deleteAllNotifications);

export default router;





