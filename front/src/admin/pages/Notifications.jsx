import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Bell, ShoppingCart, MessageSquare, User, FileText, CheckCircle, XCircle, Trash2, RotateCcw } from "lucide-react";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
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
    try {
      const adminEmail = localStorage.getItem("admin_email");
      if (adminEmail) {
        // Try admins API first
        try {
          const adminsResponse = await axios.get("http://localhost:3000/api/admins");
          const admins = adminsResponse.data.data || [];
          const admin = admins.find(a => a.email === adminEmail);
          if (admin) {
            setCurrentUser(admin);
            return;
          }
        } catch (error) {
          console.log("Admins API not available");
        }

        // Fallback to users API
        const usersResponse = await axios.get("http://localhost:3000/api/users");
        const users = usersResponse.data.data || [];
        const user = users.find(u => u.email === adminEmail);
        if (user) {
          setCurrentUser(user);
        }
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const allNotifications = [];

      // If user is admin, show all notifications
      if (currentUser?.adminRole === "admin") {
        // Get pending purchases (only pending, not active)
        try {
          const purchasesResponse = await axios.get("http://localhost:3000/api/purchased");
          const purchases = purchasesResponse.data.data || [];
          const pendingPurchases = purchases.filter(p => p.status === "pending");
          
          pendingPurchases.forEach(purchase => {
            const notificationId = `purchase-${purchase._id}`;
            // Skip if notification is deleted
            if (!deletedNotifications.includes(notificationId)) {
              allNotifications.push({
                id: notificationId,
                type: "purchase",
                title: "New Purchase",
                message: `User purchased: ${purchase.bookTitle || "Book"}`,
                status: "pending",
                date: purchase.createdAt || new Date(),
                icon: ShoppingCart,
                color: "blue",
                isRead: readNotifications.includes(notificationId)
              });
            }
          });
        } catch (error) {
          console.error("Error fetching purchases:", error);
        }

        // Get recent blog comments
        try {
          const blogsResponse = await axios.get("http://localhost:3000/api/blogs");
          const blogs = blogsResponse.data.data || [];
          
          blogs.forEach(blog => {
            if (blog.comments && blog.comments.length > 0) {
              const recentComments = blog.comments
                .filter(c => {
                  const commentDate = new Date(c.date);
                  const dayAgo = new Date();
                  dayAgo.setDate(dayAgo.getDate() - 1);
                  return commentDate > dayAgo;
                })
                .slice(-5); // Last 5 comments
              
              recentComments.forEach(comment => {
                const notificationId = `comment-${comment.id || comment._id}`;
                // Skip if notification is deleted
                if (!deletedNotifications.includes(notificationId)) {
                  allNotifications.push({
                    id: notificationId,
                    type: "comment",
                    title: "New Comment",
                    message: `${comment.username} commented on "${blog.title}"`,
                    date: new Date(comment.date),
                    icon: MessageSquare,
                    color: "green",
                    isRead: readNotifications.includes(notificationId)
                  });
                }
              });
            }
          });
        } catch (error) {
          console.error("Error fetching blogs:", error);
        }
      }

      // If user is author
      if (currentUser?.adminRole === "author") {
        // Get comments on their blogs
        try {
          const blogsResponse = await axios.get("http://localhost:3000/api/blogs");
          const blogs = blogsResponse.data.data || [];
          
          // Get the authorId from admin user record (this links admin user to author profile)
          let currentAuthorId = "";
          
          if (currentUser.authorId) {
            // authorId from admin user record (links to authors collection)
            currentAuthorId = String(currentUser.authorId._id || currentUser.authorId || "");
          } else {
            // Fallback: Try to find author by email or name
            try {
              const authorsResponse = await axios.get("http://localhost:3000/api/authors");
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
            return;
          }
          
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
        } catch (error) {
          console.error("Error fetching author blogs:", error);
        }
      }

      // Sort by date (newest first)
      allNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));

      setNotifications(allNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (notificationId) => {
    if (!readNotifications.includes(notificationId)) {
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
  };

  const openDeleteModal = (e, notificationId, notificationTitle) => {
    e.stopPropagation(); // Prevent triggering markAsRead
    setDeleteModal({ isOpen: true, notificationId, notificationTitle });
  };

  const confirmDelete = () => {
    const { notificationId } = deleteModal;
    
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
              Notifications
            </h1>
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
          Stay updated with your activities and system events
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
              No notifications
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You're all caught up! No new notifications.
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
                yellow: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
              };

              return (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  title={!notification.isRead ? "Click to mark as read" : "Click to view"}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer relative group ${
                    !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  {/* Delete Button - Available for admin and author */}
                  <button
                    onClick={(e) => openDeleteModal(e, notification.id, notification.title)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 dark:hover:bg-red-900/50"
                    title="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
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
                          notification.status === "pending"
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                            : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                        }`}>
                          {notification.status === "pending" ? (
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

