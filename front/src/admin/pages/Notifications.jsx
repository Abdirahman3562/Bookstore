import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Bell, ShoppingCart, MessageSquare, User, FileText, CheckCircle, XCircle } from "lucide-react";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

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
        // Get pending purchases
        try {
          const purchasesResponse = await axios.get("http://localhost:3000/api/purchased");
          const purchases = purchasesResponse.data.data || [];
          const pendingPurchases = purchases.filter(p => p.status === "pending");
          
          pendingPurchases.forEach(purchase => {
            allNotifications.push({
              id: `purchase-${purchase._id}`,
              type: "purchase",
              title: "New Purchase",
              message: `User purchased: ${purchase.bookTitle || "Book"}`,
              status: "pending",
              date: purchase.createdAt || new Date(),
              icon: ShoppingCart,
              color: "blue"
            });
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
                allNotifications.push({
                  id: `comment-${comment.id || comment._id}`,
                  type: "comment",
                  title: "New Comment",
                  message: `${comment.username} commented on "${blog.title}"`,
                  date: new Date(comment.date),
                  icon: MessageSquare,
                  color: "green"
                });
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
          const authorBlogs = blogs.filter(b => {
            const authorId = typeof b.authorId === 'object' ? b.authorId._id : b.authorId;
            const currentUserId = currentUser._id;
            return authorId?.toString() === currentUserId?.toString();
          });

          authorBlogs.forEach(blog => {
            if (blog.comments && blog.comments.length > 0) {
              const recentComments = blog.comments
                .filter(c => {
                  const commentDate = new Date(c.date);
                  const dayAgo = new Date();
                  dayAgo.setDate(dayAgo.getDate() - 1);
                  return commentDate > dayAgo;
                })
                .slice(-5);
              
              recentComments.forEach(comment => {
                allNotifications.push({
                  id: `comment-${comment.id || comment._id}`,
                  type: "comment",
                  title: "New Comment on Your Blog",
                  message: `${comment.username} commented on "${blog.title}"`,
                  date: new Date(comment.date),
                  icon: MessageSquare,
                  color: "green"
                });
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
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-8 h-8 text-blue-600 dark:text-blue-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Notifications
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Stay updated with your activities and system events
        </p>
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
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${colorClasses[notification.color] || colorClasses.blue}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(notification.date).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {notification.message}
                      </p>
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
    </div>
  );
}

