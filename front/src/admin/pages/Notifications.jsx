import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { handleApiError } from "../utils/apiUtils";
import { Bell, ShoppingCart, MessageSquare, User, FileText, CheckCircle, XCircle, Trash2, RotateCcw } from "lucide-react";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  console.log("🔔 Admin Notifications page loaded");
  const isFetchingRef = useRef(false);
  const [readNotifications, setReadNotifications] = useState(() => {
    // Load read notifications from localStorage
    const saved = localStorage.getItem('admin_read_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [deletedNotifications, setDeletedNotifications] = useState(() => {
    // Load deleted notifications from localStorage
    const saved = localStorage.getItem('admin_deleted_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, notificationId: null, notificationTitle: null });

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    console.log("🔍 Admin Notifications: fetchCurrentUser called");
    try {
      const adminEmail = localStorage.getItem("admin_email");
      const token = localStorage.getItem("admin_token");
      const storedUser = localStorage.getItem("user");

      console.log("🔍 Admin Notifications: Auth data:", {
        adminEmail: !!adminEmail,
        token: !!token,
        storedUser: !!storedUser
      });

      if (!adminEmail || !token) {
        console.log("❌ Admin Notifications: No admin auth data, cannot load notifications");
        setLoading(false);
        return;
      }

      // First try to use stored user data if available
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setCurrentUser(userData);
          return;
        } catch (parseError) {
          // Continue to API calls
        }
      }

      // Try admins API first
      try {
        const adminsResponse = await axios.get("http://localhost:3000/api/admins", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const admins = adminsResponse.data.data || [];
        const admin = admins.find(a => a.email === adminEmail);

        if (admin) {
          setCurrentUser(admin);
          return;
        } else {
          // Try case-insensitive match
          const adminCaseInsensitive = admins.find(a => a.email?.toLowerCase() === adminEmail?.toLowerCase());
          if (adminCaseInsensitive) {
            setCurrentUser(adminCaseInsensitive);
            return;
          }
        }
      } catch (error) {
        // Continue to fallback
      }

      // Fallback to users API
      try {
        const usersResponse = await axios.get("http://localhost:3000/api/users", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const users = usersResponse.data.data || [];
        const user = users.find(u => u.email === adminEmail);

        if (user) {
          setCurrentUser(user);
        } else {
          // Fallback: Create a mock admin user
          const mockAdmin = {
            _id: "test-admin-id",
            name: "Test Admin",
            email: adminEmail,
            adminRole: "admin"
          };
          setCurrentUser(mockAdmin);
        }
      } catch (error) {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
    }
  };


  const fetchNotifications = async () => {
    console.log("🚀 Admin Notifications: fetchNotifications called");

    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      console.log("⏸️ Admin Notifications: Fetch already in progress, skipping...");
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      const allNotifications = [];

      // Get authentication token
      const token = localStorage.getItem("admin_token");
      console.log("🔑 Admin Notifications: Token exists:", !!token);

      if (!token) {
        console.log("❌ Admin Notifications: No token, showing auth error");
        toast.error("Authentication required. Please log in again.");
        setLoading(false);
        isFetchingRef.current = false;
        return;
      }

      // If no currentUser, still show empty notifications but don't error
      if (!currentUser) {
        console.log("❌ Admin Notifications: No current user, showing empty notifications");
        console.log("Available localStorage keys:", Object.keys(localStorage));
        console.log("Current user state:", currentUser);
        setNotifications([]);
        setLoading(false);
        isFetchingRef.current = false;
        return;
      }

      console.log("👤 Admin Notifications: Current user:", currentUser.name, currentUser._id, currentUser.adminRole);

      // Get notifications from database API for this admin user
      const adminUserId = currentUser._id || currentUser.id;
      console.log("🆔 Admin Notifications: User ID for fetching notifications:", adminUserId);
      console.log("🎯 Admin Notifications: User role:", currentUser.adminRole);

      // Always try to get notifications from database first
      try {
        console.log("📡 Admin Notifications: Making API call to:", `http://localhost:3000/api/notifications/${adminUserId}`);
        const notificationsResponse = await axios.get(`http://localhost:3000/api/notifications/${adminUserId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("📡 Admin Notifications: API Response:", notificationsResponse.data);

        if (notificationsResponse.data.success) {
          const dbNotifications = notificationsResponse.data.data || [];
          console.log("✅ Found", dbNotifications.length, "database notifications from API");

          dbNotifications.forEach(notification => {
            const notificationId = notification._id || notification.id;
            // Skip if notification is deleted
            if (!deletedNotifications.includes(notificationId)) {
              // Map notification type to icon and color
              let icon = Bell;
              let color = "blue";

              switch (notification.type) {
                case 'new_order':
                  icon = ShoppingCart;
                  color = "orange";
                  break;
                case 'order_approved':
                  icon = CheckCircle;
                  color = "green";
                  break;
                case 'order_active':
                  icon = CheckCircle;
                  color = "green";
                  break;
                case 'order_cancelled':
                  icon = XCircle;
                  color = "red";
                  break;
                case 'download_available':
                  icon = FileText;
                  color = "purple";
                  break;
                case 'general':
                default:
                  icon = Bell;
                  color = "blue";
                  break;
              }

              allNotifications.push({
                id: notificationId,
                type: notification.type || "general",
                title: notification.title || "Notification",
                message: notification.message || "",
                status: notification.relatedType === 'purchase' ? "pending" : null,
                date: notification.createdAt || new Date(),
                icon: icon,
                color: color,
                isRead: notification.isRead || readNotifications.includes(notificationId),
                relatedId: notification.relatedId,
                relatedType: notification.relatedType
              });
            }
          });
        }
      } catch (apiError) {
        console.error("❌ Admin Notifications: Database API failed:", apiError.response?.data || apiError.message);
        // Continue to fetch pending purchases even if API fails
      }

      // Always fetch pending purchases and add them as notifications (if not already in database notifications)
      if (currentUser?.adminRole === "admin") {
        try {
          console.log("📦 Admin Notifications: Fetching pending purchases...");
          const purchasesResponse = await axios.get("http://localhost:3000/api/purchased", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const purchases = purchasesResponse.data.data || [];
          const pendingPurchases = purchases.filter(p => p.status === "pending");

          console.log(`📦 Found ${pendingPurchases.length} pending purchases`);

          pendingPurchases.forEach(purchase => {
            const notificationId = `purchase-${purchase._id}`;
            // Check if we already have a database notification for this purchase
            const existingDbNotification = allNotifications.find(n =>
              n.relatedId === purchase._id.toString() && n.type === 'new_order'
            );

            // Only add if not already in database notifications and not deleted
            if (!existingDbNotification && !deletedNotifications.includes(notificationId)) {
              console.log(`📦 Adding pending purchase notification: ${purchase.title}`);
              allNotifications.push({
                id: notificationId,
                type: "purchase",
                title: "New Purchase - Pending Approval 📋",
                message: `User ${purchase.userName || purchase.email || "Someone"} purchased: "${purchase.title || "Book"}" by ${purchase.author || "Unknown"}. Status: Pending Approval - Click to review and approve.`,
                status: "pending",
                date: purchase.createdAt || purchase.timestamp || new Date(),
                icon: ShoppingCart,
                color: "orange",
                isRead: readNotifications.includes(notificationId),
                purchaseId: purchase._id || purchase.id,
                needsAction: true, // Mark as needing admin action
                actionUrl: `/admin/purchased?order=${purchase._id}` // Direct link to approve
              });
            }
          });
        } catch (purchaseError) {
          console.error("❌ Admin Notifications: Error fetching purchases:", purchaseError);
        }
      }

      // If user is author
      if (currentUser?.adminRole === "author") {
        // Get comments on their blogs
        try {
          const blogsResponse = await axios.get("http://localhost:3000/api/blogs", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const blogs = blogsResponse.data.data || [];
          
          // Get the authorId from admin user record (this links admin user to author profile)
          let currentAuthorId = "";
          
          if (currentUser.authorId) {
            // authorId from admin user record (links to authors collection)
            currentAuthorId = String(currentUser.authorId._id || currentUser.authorId || "");
          } else {
            // Fallback: Try to find author by email or name
            try {
              const authorsResponse = await axios.get("http://localhost:3000/api/authors", {
                headers: { Authorization: `Bearer ${token}` }
              });
              const authors = authorsResponse.data.data || [];
              
              // Try to match by email first
              let matchedAuthor = authors.find(a => 
                a.email && a.email.toLowerCase() === currentUser.email?.toLowerCase()
              );
              
              // If no match by email, try by name
              if (!matchedAuthor && currentUser.name) {
                matchedAuthor = authors.find(a => 
                  a.name && a.name.toLowerCase() === currentUser.name?.toLowerCase()
                );
              }
              
              if (matchedAuthor) {
                currentAuthorId = String(matchedAuthor._id || matchedAuthor.id || "");
                console.log("Found author by email/name:", currentAuthorId);
              } else {
                // Last fallback: use admin user's _id (might work if blog authorId matches admin user _id)
                currentAuthorId = String(currentUser._id || currentUser.id || "");
                console.log("Using admin user _id as fallback:", currentAuthorId);
              }
            } catch (error) {
              console.error("Error fetching authors for fallback:", error);
              // Last fallback: use admin user's _id
              currentAuthorId = String(currentUser._id || currentUser.id || "");
            }
          }
          
          if (!currentAuthorId) {
            console.log("No authorId found for author user");
            // Skip author notifications but continue processing
          } else {
            console.log("Author ID being used for notifications:", currentAuthorId);
            console.log("Total blogs found:", blogs.length);
            
            const authorBlogs = blogs.filter(b => {
              let blogAuthorId = "";
              if (b.authorId) {
                if (typeof b.authorId === "string") {
                  blogAuthorId = b.authorId;
                } else if (b.authorId._id) {
                  blogAuthorId = b.authorId._id;
                } else if (b.authorId.toString) {
                  blogAuthorId = b.authorId.toString();
                }
              }
              const matches = String(blogAuthorId) === currentAuthorId;
              if (matches) {
                console.log("Found matching blog:", b.title, "with", b.comments?.length || 0, "comments");
              }
              return matches;
            });
            
            console.log("Author blogs found:", authorBlogs.length);

            authorBlogs.forEach(blog => {
              if (blog.comments && blog.comments.length > 0) {
                // Show ALL comments, not just recent ones
                blog.comments.forEach(comment => {
                  const notificationId = `comment-${comment.id || comment._id}`;
                  // Skip if notification is deleted
                  if (!deletedNotifications.includes(notificationId)) {
                    // Get comment text (could be in comment.comment or comment.reply)
                    const commentText = comment.comment || comment.reply || "";
                    const commentPreview = commentText.length > 50 
                      ? commentText.substring(0, 50) + "..." 
                      : commentText;
                    
                    allNotifications.push({
                      id: notificationId,
                      type: "comment",
                      title: "New Comment on Your Blog",
                      message: `${comment.username || "A user"} commented on your blog "${blog.title}": "${commentPreview}"`,
                      date: new Date(comment.date),
                      icon: MessageSquare,
                      color: "green",
                      isRead: readNotifications.includes(notificationId),
                      blogId: blog._id || blog.id,
                      blogTitle: blog.title,
                      commentUsername: comment.username || "User",
                      commentText: commentText
                    });
                  }
                });
              }
            });
          }
        } catch (error) {
          console.error("Error fetching author blogs:", error);
        }
      }

      // Sort by date (newest first)
      allNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));

      console.log("📋 Final notifications to display:", allNotifications.length);
      console.log("📋 Notification titles:", allNotifications.map(n => n.title));

      setNotifications(allNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      handleApiError(error, "notifications");
      // Set empty array on error to prevent infinite loading
      setNotifications([]);
    } finally {
      // Always set loading to false, even if there was an error
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read for all notification types when clicked
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Handle different notification types
    switch (notification.type) {
      case 'new_order':
        // Navigate to specific order in purchased admin page
        if (notification.relatedId) {
          navigate(`/admin/purchased?order=${notification.relatedId}`);
        } else {
          navigate('/admin/purchased');
        }
        break;
      case 'purchase':
        // Navigate to purchased admin page for pending approvals
        if (notification.purchaseId) {
          navigate(`/admin/purchased?order=${notification.purchaseId}`);
        } else {
          navigate('/admin/purchased');
        }
        break;
      case 'order_approved':
      case 'order_active':
      case 'order_cancelled':
        // Navigate to purchased admin page
        navigate('/admin/purchased');
        break;
      default:
        // For other notifications, navigation already handled
        break;
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      if (!readNotifications.includes(notificationId)) {
        const token = localStorage.getItem("admin_token");
        const adminUserId = currentUser?._id || currentUser?.id;
        
        // Update in database if it's a database notification
        if (token && adminUserId && !notificationId.startsWith('purchase-') && !notificationId.startsWith('comment-')) {
          try {
            await axios.patch(`http://localhost:3000/api/notifications/${notificationId}/read`, {
              userId: adminUserId
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (apiError) {
            console.error("Error marking notification as read in API:", apiError);
            // Continue with local update even if API fails
          }
        }
        
        const updatedRead = [...readNotifications, notificationId];
        setReadNotifications(updatedRead);
        localStorage.setItem('admin_read_notifications', JSON.stringify(updatedRead));
        
        // Update the notification in the list
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        
        // Notify TopBar to update count
        window.dispatchEvent(new CustomEvent('notificationRead', { detail: { id: notificationId } }));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  const openDeleteModal = (e, notificationId, notificationTitle) => {
    e.stopPropagation(); // Prevent triggering markAsRead
    setDeleteModal({ isOpen: true, notificationId, notificationTitle });
  };

  const confirmDelete = async () => {
    const { notificationId } = deleteModal;
    
    const token = localStorage.getItem("admin_token");
    const adminUserId = currentUser?._id || currentUser?.id;
    
    // Delete from database if it's a database notification
    if (token && adminUserId && !notificationId.startsWith('purchase-') && !notificationId.startsWith('comment-')) {
      try {
        await axios.delete(`http://localhost:3000/api/notifications/${notificationId}`, {
          data: { userId: adminUserId },
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (apiError) {
        console.error("Error deleting notification from API:", apiError);
        // Continue with local delete even if API fails
      }
    }
    
    const updatedDeleted = [...deletedNotifications, notificationId];
    setDeletedNotifications(updatedDeleted);
    localStorage.setItem('admin_deleted_notifications', JSON.stringify(updatedDeleted));
    
    // Remove from notifications list
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    
    // Also remove from read notifications if it was read
    if (readNotifications.includes(notificationId)) {
      const updatedRead = readNotifications.filter(id => id !== notificationId);
      setReadNotifications(updatedRead);
      localStorage.setItem('admin_read_notifications', JSON.stringify(updatedRead));
    }
    
    // Notify TopBar to update count
    window.dispatchEvent(new CustomEvent('notificationDeleted', { detail: { id: notificationId } }));
    
    toast.success("Notification deleted");
    setDeleteModal({ isOpen: false, notificationId: null, notificationTitle: null });
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, notificationId: null, notificationTitle: null });
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Order Management
            </h1>
            {notifications.filter(n => n.needsAction).length > 0 && (
              <div className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-sm font-medium">
                {notifications.filter(n => n.needsAction).length} pending approval
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (currentUser) {
                fetchNotifications();
              }
            }}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Refresh
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Review and approve pending book orders
        </p>
        {currentUser?.adminRole === "author" && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            Showing comments on your blogs
          </p>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No pending orders
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              All orders have been processed! New orders will appear here for approval.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => {
              const Icon = notification.icon;
              const colorClasses = {
                blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
                red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
                yellow: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
                orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
                purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
              };

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  title={
                    notification.needsAction
                      ? "Click to review and approve this purchase"
                      : notification.type === 'new_order'
                        ? "Click to view order"
                        : (!notification.isRead ? "Click to mark as read" : "Click to view")
                  }
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer relative group ${
                    notification.needsAction
                      ? 'bg-orange-50 dark:bg-orange-900/10 border-l-4 border-l-orange-500'
                      : !notification.isRead
                        ? 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-l-blue-500'
                        : ''
                  }`}
                >
                  {/* Action buttons are now at the bottom of the notification */}
                  
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${colorClasses[notification.color] || colorClasses.blue}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm font-semibold ${
                            notification.isRead 
                              ? 'text-gray-700 dark:text-gray-300' 
                              : 'text-gray-900 dark:text-white font-bold'
                          }`}>
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(notification.date).toLocaleString()}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        notification.isRead 
                          ? 'text-gray-500 dark:text-gray-400' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {notification.message}
                      </p>
                      {notification.type === "comment" && notification.commentText && (
                        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700/50 rounded text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">{notification.commentUsername}:</span> {notification.commentText}
                        </div>
                      )}
                      {!notification.isRead && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to mark as read
                        </p>
                      )}
                      {notification.status && (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                          notification.needsAction
                            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300"
                            : notification.status === "pending"
                              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                              : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                        }`}>
                          {notification.needsAction ? (
                            <>
                              <XCircle className="w-3 h-3" />
                              Needs Approval
                            </>
                          ) : notification.status === "pending" ? (
                            <>
                              <XCircle className="w-3 h-3" />
                              Pending
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Completed
                            </>
                          )}
                        </span>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3 flex-shrink-0">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering navigation
                              markAsRead(notification.id);
                            }}
                            className="flex items-center gap-1 px-3 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors border border-blue-200 dark:border-blue-800"
                            title="Mark as read"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Mark as Read
                          </button>
                        )}
                        <button
                          onClick={(e) => openDeleteModal(e, notification.id, notification.title)}
                          className="flex items-center gap-1 px-3 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors border border-red-200 dark:border-red-800"
                          title="Delete notification"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={cancelDelete}
          ></div>
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Delete Notification
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Are you sure you want to delete this notification?
                  </p>
                </div>
              </div>
              
              {deleteModal.notificationTitle && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {deleteModal.notificationTitle}
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-500 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

