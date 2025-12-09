import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Bell, CheckCircle, Trash2, Download, BookOpen, X, CheckCheck } from "lucide-react";

export default function NotificationsTab() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id || user?.id;

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!userId) return;

    try {
      const response = await axios.get(`http://localhost:3000/api/notifications/${userId}`);
      if (response.data.success) {
        setNotifications(response.data.data || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [userId]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(`http://localhost:3000/api/notifications/${notificationId}/read`, {
        userId
      });
      await fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await axios.patch(`http://localhost:3000/api/notifications/read-all`, {
        userId
      });
      await fetchNotifications();
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`http://localhost:3000/api/notifications/${notificationId}`, {
        data: { userId }
      });
      await fetchNotifications();
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    if (!window.confirm("Are you sure you want to delete all notifications?")) {
      return;
    }
    try {
      await axios.delete(`http://localhost:3000/api/notifications/`, {
        data: { userId }
      });
      await fetchNotifications();
      toast.success("All notifications deleted");
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      toast.error("Failed to delete all notifications");
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_active':
        return <Download className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'order_approved':
        return <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'download_available':
        return <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All Read
              </button>
            )}
            <button
              onClick={deleteAllNotifications}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No notifications</h3>
          <p className="text-gray-600 dark:text-gray-400">You're all caught up! New notifications will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`group relative bg-white dark:bg-gray-800 rounded-xl border transition-all duration-300 hover:shadow-lg ${
                notification.isRead
                  ? 'border-gray-200 dark:border-gray-700'
                  : 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10'
              }`}
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    notification.isRead
                      ? 'bg-gray-100 dark:bg-gray-700'
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className={`font-semibold text-base mb-1 ${
                          notification.isRead
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{formatDate(notification.createdAt)}</span>
                          {!notification.isRead && (
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                              New
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification._id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unread indicator */}
              {!notification.isRead && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-400 rounded-l-xl"></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



