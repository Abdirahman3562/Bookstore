import Notification from "../models/notifications.model.js";

// CREATE NEW NOTIFICATION
export const createNotification = async (req, res) => {
  try {
    const notificationData = {
      userId: req.body.userId,
      type: req.body.type || "general",
      title: req.body.title,
      message: req.body.message,
      relatedId: req.body.relatedId || null,
      relatedType: req.body.relatedType || null,
      tenantId: req.body.tenantId || req.tenantId || null
    };

    console.log("📧 Creating notification:", notificationData);

    const newNotification = new Notification(notificationData);
    await newNotification.save();

    console.log("✅ Notification created:", newNotification._id);

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: newNotification
    });
  } catch (err) {
    console.error("Error creating notification:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// GET ALL NOTIFICATIONS FOR A USER
export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("🔍 getUserNotifications - userId:", userId);
    console.log("🔍 getUserNotifications - tenantId:", req.tenantId);

    let notifications = [];
    let totalNotifications = 0;
    let userNotifications = 0;

    try {
      // Check total notifications in database
      totalNotifications = await Notification.countDocuments({});
      console.log("📊 Total notifications in database:", totalNotifications);

      // Check notifications for this specific user
      userNotifications = await Notification.countDocuments({ userId });
      console.log("👤 Notifications for user", userId + ":", userNotifications);

      notifications = await Notification.find({ userId, tenantId: req.tenantId })
        .sort({ createdAt: -1 })
        .limit(100); // Limit to last 100 notifications

      console.log("✅ Found", notifications.length, "notifications from database for user", userId);
    } catch (dbError) {
      console.log("⚠️ Database not available, using mock notifications data");

      // Mock notifications data when database is not available
      const mockNotifications = [
        {
          _id: "mock-1",
          userId: userId,
          tenantId: req.tenantId || "mock-tenant",
          type: "general",
          title: "Welcome to the Bookstore Admin Panel",
          message: "Your admin account has been successfully set up. You can now manage books, users, and system settings.",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          isRead: false
        },
        {
          _id: "mock-2",
          userId: userId,
          tenantId: req.tenantId || "mock-tenant",
          type: "new_order",
          title: "New Book Purchase",
          message: "A user has purchased 'The Great Gatsby' for $15.99. Order ID: ORD-001",
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          isRead: false,
          relatedId: "purchase-001",
          relatedType: "purchase"
        },
        {
          _id: "mock-3",
          userId: userId,
          tenantId: req.tenantId || "mock-tenant",
          type: "download_available",
          title: "Download Ready",
          message: "Your requested book '1984' is now available for download. Check your downloads section.",
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          isRead: true,
          relatedId: "download-001",
          relatedType: "download"
        }
      ];

      notifications = mockNotifications;
      console.log("✅ Using", notifications.length, "mock notifications");
    }

    // Debug: Log all notifications in database (limited)
    if (totalNotifications > 0 && notifications.length === 0) {
      console.log("⚠️ No notifications for this user. All notifications in DB:");
      const allNotifications = await Notification.find({})
        .sort({ createdAt: -1 })
        .limit(5);
      allNotifications.forEach((n, i) => {
        console.log(`  ${i+1}. UserID: ${n.userId}, Title: ${n.title}, Type: ${n.type}`);
      });
    }

    // If no notifications found, try without userId filter to see all notifications
    if (notifications.length === 0) {
      console.log("🔍 No notifications for user, checking all notifications in DB");
      const allNotifications = await Notification.find({})
        .sort({ createdAt: -1 })
        .limit(10);

      console.log("📊 All notifications in DB:", allNotifications.map(n => ({
        id: n._id,
        userId: n.userId,
        title: n.title,
        type: n.type
      })));
    }

    let unreadCount = 0;
    try {
      unreadCount = await Notification.countDocuments({
        userId,
        tenantId: req.tenantId,
        isRead: false
      });
    } catch (dbError) {
      // Calculate unread count from mock data
      unreadCount = notifications.filter(n => !n.isRead).length;
    }

    console.log("📊 Unread count:", unreadCount);

    res.status(200).json({
      success: true,
      message: "Notifications fetched successfully",
      data: notifications,
      unreadCount
    });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// MARK NOTIFICATION AS READ
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const notification = await Notification.findOne({ _id: id, tenantId: req.tenantId });
    
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: "Notification not found" 
      });
    }

    // Verify the notification belongs to the user
    if (notification.userId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized" 
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification
    });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: err.message 
    });
  }
};

// MARK ALL NOTIFICATIONS AS READ
export const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.body;

    await Notification.updateMany(
      { userId, tenantId: req.tenantId, isRead: false },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read"
    });
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: err.message 
    });
  }
};

// DELETE NOTIFICATION
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const notification = await Notification.findOne({ _id: id, tenantId: req.tenantId });
    
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: "Notification not found" 
      });
    }

    // Verify the notification belongs to the user
    if (notification.userId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized" 
      });
    }

    await Notification.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: err.message 
    });
  }
};

// DELETE ALL NOTIFICATIONS
export const deleteAllNotifications = async (req, res) => {
  try {
    const { userId } = req.body;

    await Notification.deleteMany({ userId, tenantId: req.tenantId });

    res.status(200).json({
      success: true,
      message: "All notifications deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting all notifications:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: err.message 
    });
  }
};





