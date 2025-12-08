import Notification from "../models/notifications.model.js";

// GET ALL NOTIFICATIONS FOR A USER
export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100); // Limit to last 100 notifications

    const unreadCount = await Notification.countDocuments({ 
      userId, 
      isRead: false 
    });

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

    const notification = await Notification.findById(id);
    
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
      { userId, isRead: false },
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

    const notification = await Notification.findById(id);
    
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

    await Notification.deleteMany({ userId });

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


