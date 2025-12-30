import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { MessageCircle, X, Send, Minimize2, User, LogIn } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true); // Track if we should auto-scroll
  const navigate = useNavigate();

  // Helper function to extract userId from user object (handles MongoDB ObjectId format)
  const extractUserId = (user) => {
    if (!user) return null;
    
    // Try _id first
    let userId = user._id;
    
    // If _id is an object with $oid (MongoDB format)
    if (userId && typeof userId === 'object') {
      userId = userId.$oid || userId.toString();
    }
    
    // If still no userId, try id field
    if (!userId) {
      userId = user.id;
      if (userId && typeof userId === 'object') {
        userId = userId.$oid || userId.toString();
      }
    }
    
    // Convert to string if it's still an object
    if (userId && typeof userId === 'object') {
      userId = userId.toString();
    }
    
    return userId || null;
  };

  // Note: These are only used for initial render. Always check localStorage directly in functions.
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userId = user ? extractUserId(user) : null;
  const token = localStorage.getItem("token");
  const isAuthenticated = !!(user && userId && token);
  const [adminOnline, setAdminOnline] = useState(false);
  const [lastActivity, setLastActivity] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0); // Unread count for admin messages
  const previousMessagesRef = useRef([]); // Track previous messages to detect new ones
  const notifiedMessagesRef = useRef(new Set()); // Track which messages we've already notified for
  const isInitialLoadRef = useRef(true); // Track if this is the first load
  const previousUnreadCountRef = useRef(0); // Track previous unread count to detect increases
  const hasPlayedLoginSoundRef = useRef(false); // Track if we've played sound on login
  const [websiteName, setWebsiteName] = useState("Bookstore"); // Website name from settings
  const welcomeMessageSentRef = useRef(false); // Track if welcome message has been sent
  const [adminInfo, setAdminInfo] = useState({ name: "Support", avatar: "" }); // Admin info for welcome message
  const [isAdminTyping, setIsAdminTyping] = useState(false); // Track if admin is typing
  const [typingAdminInfo, setTypingAdminInfo] = useState({ name: "Admin", avatar: "" }); // Admin info for typing indicator
  const typingTimeoutRef = useRef(null); // Timeout for typing indicator
  const chatIntervalRef = useRef(null); // Ref to track the chat polling interval
  const unreadIntervalRef = useRef(null); // Ref to track the unread messages interval

  // Check if user is logged in (check localStorage directly to avoid stale state)
  const isUserLoggedIn = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr || userStr === "null") {
        console.log("❌ No user in localStorage");
        return false;
      }
      
      const currentUser = JSON.parse(userStr);
      const currentUserId = extractUserId(currentUser);
      const currentToken = localStorage.getItem("token");
      
      const isLoggedIn = !!(currentUser && currentUserId && currentToken);
      
      if (!isLoggedIn) {
        console.log("❌ isUserLoggedIn check failed:", {
          hasUser: !!currentUser,
          userId: currentUserId,
          hasToken: !!currentToken,
          userKeys: currentUser ? Object.keys(currentUser) : [],
          _idType: typeof currentUser?._id,
          _idValue: currentUser?._id
        });
      }
      
      return isLoggedIn;
    } catch (error) {
      console.error("❌ Error checking login status:", error);
      return false;
    }
  };

  // Check if admin is online (logged in)
  const isAdminOnline = () => {
    return adminOnline;
  };

  // Check if user is online (logged in and recently active)
  const isUserOnline = () => {
    if (!isUserLoggedIn()) return false;
    if (!lastActivity) return true; // If logged in, consider online by default
    const lastActiveDate = new Date(lastActivity);
    const now = new Date();
    const diffInMinutes = Math.floor((now - lastActiveDate) / 1000 / 60);
    return diffInMinutes < 5; // Online if active within last 5 minutes
  };

  // Validate authentication and redirect if invalid
  const validateAuthentication = async () => {
    const currentToken = localStorage.getItem("token");
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    const currentUserId = extractUserId(currentUser);
    
    if (!currentToken || !currentUserId) {
      console.log("User not authenticated, skipping chat initialization");
      return false;
    }

    try {
      // Test token validity with a simple API call
      await axios.get("http://localhost:3000/api/users/profile", {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      return true;
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error("Token expired or invalid, redirecting to login");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        toast.error("Session expired. Please login again.");
        window.location.href = "/auth";
        return false;
      }
      // For 500 or other server errors, still allow chat but log the error
      if (error.response?.status === 500) {
        console.warn("Server error during authentication check, continuing anyway");
      }
      return true; // Other errors don't prevent chat initialization
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio("/mixkit-message-pop-alert-2354.mp3");
      audio.volume = 0.7;
      audio.play().catch((error) => {
        console.log("Could not play notification sound:", error);
      });
    } catch (error) {
      console.log("Could not play notification sound:", error);
    }
  };

  // Fetch website settings to get website name
  const fetchWebsiteSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:3000/api/website-settings", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (response.data.success) {
        const websiteName = response.data.data?.websiteName || "Bookstore";
        setWebsiteName(websiteName);
      }
    } catch (error) {
      console.error("Error fetching website settings:", error);
      // Keep default "Bookstore" if fetch fails
    }
  };

  // Fetch admin info for welcome message
  const fetchAdminInfo = async () => {
    try {
      // Try to get admin from admins API
      const token = localStorage.getItem("token");
      const adminsResponse = await axios.get("http://localhost:3000/api/admins", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (adminsResponse.data.success) {
        const admins = adminsResponse.data.data || [];
        if (admins.length > 0) {
          // Use the first admin or find one with reply permission
          const admin = admins.find(a => a.permissions?.liveChat?.canReply) || admins[0];
          setAdminInfo({
            name: admin.name || admin.email?.split('@')[0] || "Support",
            avatar: admin.avatar || ""
          });
          return;
        }
      }
    } catch (error) {
      console.log("Admins API not available, using default");
    }
    
    // Fallback: Try to get admin info from recent admin messages
    try {
      const token = localStorage.getItem("token");
      const conversationsResponse = await axios.get("http://localhost:3000/api/chat/conversations", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (conversationsResponse.data.success) {
        const conversations = conversationsResponse.data.data || [];
        // Find a conversation with admin messages
        for (const conv of conversations) {
          if (conv.lastMessage?.sender === "admin") {
            const token = localStorage.getItem("token");
            const messagesResponse = await axios.get(`http://localhost:3000/api/chat/messages/${conv.userId}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (messagesResponse.data.success) {
              const messages = messagesResponse.data.data || [];
              const adminMsg = messages.find(m => m.sender === "admin" && m.adminName);
              if (adminMsg) {
                setAdminInfo({
                  name: adminMsg.adminName || "Support",
                  avatar: adminMsg.adminAvatar || ""
                });
                return;
              }
            }
          }
        }
      }
    } catch (error) {
      console.log("Could not get admin info from messages");
    }
    
    // Default fallback
    setAdminInfo({ name: "Support", avatar: "" });
  };

  // Send automatic AI welcome message when user first comes online
  const sendWelcomeMessage = async () => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    const currentUserId = extractUserId(currentUser);
    const token = localStorage.getItem("token");
    
    if (!currentUserId || welcomeMessageSentRef.current) return;
    
    if (!token) {
      // No token, skip welcome message
      return;
    }
    
    try {
      // Check if user already has messages
      const response = await axios.get(`http://localhost:3000/api/chat/messages/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const existingMessages = response.data.data || [];
        
        // Only send welcome message if user has no messages (first time coming online)
        if (existingMessages.length === 0) {
          try {
            // Call the AI greeting endpoint to automatically send AI greeting
            await axios.post(`http://localhost:3000/api/chat/ai-greeting/${currentUserId}`, {}, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log("✅ Automatic AI greeting sent to user");
            welcomeMessageSentRef.current = true;
          } catch (sendError) {
            // Handle 401 errors silently
            if (sendError.response?.status === 401) {
              console.log("Authentication failed, skipping welcome message");
            } else {
              console.error("Error sending AI greeting:", sendError);
            }
            welcomeMessageSentRef.current = true; // Mark as sent to avoid retry loops
          }
        } else {
          // User already has messages, mark as sent so we don't check again
          welcomeMessageSentRef.current = true;
        }
      }
    } catch (error) {
      // Handle 401 errors silently
      if (error.response?.status === 401) {
        console.log("Authentication failed, skipping welcome message");
      } else {
        console.error("Error checking/sending welcome message:", error);
      }
    }
  };

  // Fetch messages when chat opens
  const fetchMessages = async () => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    const currentUserId = extractUserId(currentUser);
    const token = localStorage.getItem("token");

    // Check if user and token exist
    if (!currentUserId || !token) {
      // Silently return if no token or userId (user may not be authenticated)
      return;
    }

    try {
      const response = await axios.get(`http://localhost:3000/api/chat/messages/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const newMessages = response.data.data || [];
        const previousMessages = previousMessagesRef.current;
        
        // Check for new admin messages and play sound (skip on initial load)
        if (!isInitialLoadRef.current && previousMessages.length > 0 && newMessages.length > previousMessages.length) {
          // Find new admin messages
          const newAdminMessages = newMessages
            .filter(msg => msg.sender === "admin" && !previousMessages.find(m => m._id === msg._id))
            .filter(msg => !notifiedMessagesRef.current.has(msg._id));
          
          // Play sound for each new admin message
          if (newAdminMessages.length > 0) {
            newAdminMessages.forEach(msg => {
              playNotificationSound();
              notifiedMessagesRef.current.add(msg._id);
            });
          }
        }
        
        // Mark initial load as complete
        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
        }
        
        setMessages(newMessages);
        previousMessagesRef.current = newMessages;
        
        // Auto-scroll to bottom only if user hasn't manually scrolled up
        if (shouldAutoScrollRef.current) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
        
        // Calculate unread count (admin messages that are unread)
        const unreadAdminMessages = newMessages.filter(
          msg => msg.sender === "admin" && (msg.isRead === false || !msg.isRead)
        );
        setUnreadCount(unreadAdminMessages.length);
        
        // Update last activity if user sent a message recently
        const userMessages = newMessages.filter(msg => msg.sender === "user");
        if (userMessages.length > 0) {
          const latestUserMessage = userMessages[userMessages.length - 1];
          setLastActivity(latestUserMessage.createdAt);
        }
        // Check if admin is online (if there are admin messages, admin is likely online)
        const adminMessages = newMessages.filter(msg => msg.sender === "admin");
        if (adminMessages.length > 0) {
          const latestAdminMessage = adminMessages[adminMessages.length - 1];
          const adminMessageDate = new Date(latestAdminMessage.createdAt);
          const now = new Date();
          const diffInMinutes = Math.floor((now - adminMessageDate) / 1000 / 60);
          setAdminOnline(diffInMinutes < 5); // Admin online if active within last 5 minutes
        }
      }
    } catch (error) {
      // Handle authentication errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log("Authentication failed - token expired");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setIsOpen(false);
        // Stop the interval if it's running
        if (chatIntervalRef.current) {
          clearInterval(chatIntervalRef.current);
          chatIntervalRef.current = null;
        }
        // Don't redirect automatically to avoid interrupting user experience
      } else {
        // Only log non-auth errors
        console.error("Error fetching messages:", error);
      }
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!isUserLoggedIn()) {
      toast.error("Please login to send a message");
      setIsOpen(false);
      return;
    }

    if (!newMessage.trim()) {
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const currentUser = JSON.parse(localStorage.getItem("user") || "null");
      const currentUserId = extractUserId(currentUser);

      // Check if token and userId exist
      if (!token || !currentUserId) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setIsOpen(false);
        window.location.href = "/auth";
        return;
      }

      await axios.post("http://localhost:3000/api/chat/send", {
        userId: currentUserId,
        message: newMessage.trim(),
        sender: "user"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Play sound after message is successfully saved to database
      playNotificationSound();

      setNewMessage("");

      // Stop typing indicator when sending
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (currentUserId) {
        axios.post("http://localhost:3000/api/chat/typing", {
          userId: currentUserId,
          isTyping: false
        }, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {});
      }

      await fetchMessages();

      // Auto-scroll to bottom after sending message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } catch (error) {
      console.error("Error sending message:", error);

      // Handle authentication errors
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setIsOpen(false);
        window.location.href = "/auth";
      } else {
        toast.error("Failed to send message");
      }
    } finally {
      setSending(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    });
  };

  // Check for unread messages when user logs in
  useEffect(() => {
    if (userId && isAuthenticated) {
      // Reset flags when userId changes (user logs in)
      hasPlayedLoginSoundRef.current = false;
      previousUnreadCountRef.current = 0;

      // Validate authentication before proceeding
      validateAuthentication().then(isValid => {
        if (!isValid) return;

        // Fetch messages to check for unread count
        const checkUnreadMessages = async () => {
          try {
            const token = localStorage.getItem("token");
            const currentUser = JSON.parse(localStorage.getItem("user") || "null");
            const currentUserId = extractUserId(currentUser);

            // Skip if no token or userId (user not authenticated)
            if (!token || !currentUserId) {
              // Stop the interval if not authenticated
              if (unreadIntervalRef.current) {
                clearInterval(unreadIntervalRef.current);
                unreadIntervalRef.current = null;
              }
              setUnreadCount(0);
              return;
            }

            const response = await axios.get(`http://localhost:3000/api/chat/messages/${currentUserId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
              const allMessages = response.data.data || [];
              const unreadAdminMessages = allMessages.filter(
                msg => msg.sender === "admin" && (msg.isRead === false || !msg.isRead)
              );

              // Debug: Log unread messages if needed
              // console.log("Unread admin messages:", unreadAdminMessages);

              const currentUnreadCount = unreadAdminMessages.length;
              const previousCount = previousUnreadCountRef.current;

              // Update unread count
              setUnreadCount(currentUnreadCount);

              // Play sound only when:
              // 1. User just logged in and there are unread messages (first check)
              // 2. Unread count increases (new admin message arrived)
              if (currentUnreadCount > 0) {
                if (!hasPlayedLoginSoundRef.current) {
                  // First time checking after login - play sound if there are unread messages
                  playNotificationSound();
                  hasPlayedLoginSoundRef.current = true;
                } else if (currentUnreadCount > previousCount) {
                  // Unread count increased - new message arrived
                  playNotificationSound();
                }
              }

              // Update previous count
              previousUnreadCountRef.current = currentUnreadCount;
            }
          } catch (error) {
            // Handle authentication errors by stopping the interval
            if (error.response?.status === 401 || error.response?.status === 403) {
              // Clear invalid token and user
              localStorage.removeItem("user");
              localStorage.removeItem("token");
              // Stop the interval immediately
              if (unreadIntervalRef.current) {
                clearInterval(unreadIntervalRef.current);
                unreadIntervalRef.current = null;
              }
              setUnreadCount(0);
              return;
            }
            // Only log non-auth errors
            if (error.response?.status !== 401 && error.response?.status !== 403) {
              console.error("Error checking unread messages:", error);
            }
          }
        };

        checkUnreadMessages();

        // Send automatic AI greeting when user logs in (if they have no messages)
        sendWelcomeMessage();

        // Also check periodically when user is logged in (even if chat is closed)
        unreadIntervalRef.current = setInterval(() => {
          // Check authentication before making API call
          const token = localStorage.getItem("token");
          const currentUser = JSON.parse(localStorage.getItem("user") || "null");
          const currentUserId = extractUserId(currentUser);
          
          if (!token || !currentUserId) {
            // User is not authenticated, stop the interval
            if (unreadIntervalRef.current) {
              clearInterval(unreadIntervalRef.current);
              unreadIntervalRef.current = null;
            }
            setUnreadCount(0);
            return;
          }
          
          checkUnreadMessages();
        }, 3000); // Check every 3 seconds

        return () => {
          if (unreadIntervalRef.current) {
            clearInterval(unreadIntervalRef.current);
            unreadIntervalRef.current = null;
          }
        };
      });
    } else {
      // Clear interval if user is not authenticated
      if (unreadIntervalRef.current) {
        clearInterval(unreadIntervalRef.current);
        unreadIntervalRef.current = null;
      }
      setUnreadCount(0);
      previousUnreadCountRef.current = 0;
      hasPlayedLoginSoundRef.current = false;
    }
  }, [userId]);

  // Fetch website settings and admin info on mount
  useEffect(() => {
    fetchWebsiteSettings();
    fetchAdminInfo();
  }, []);

  useEffect(() => {
    if (isOpen && userId && isAuthenticated) {
      // Validate authentication before opening chat
      validateAuthentication().then(isValid => {
        if (!isValid) {
          setIsOpen(false);
          return;
        }

        setLoading(true);

        // Send welcome message if this is first time opening chat
        sendWelcomeMessage().then(() => {
          fetchMessages().finally(() => setLoading(false));
        });
      
      // Mark admin messages as read when chat is opened
      const markAdminMessagesAsRead = async () => {
        try {
          const token = localStorage.getItem("token");
          const currentUser = JSON.parse(localStorage.getItem("user") || "null");
          const currentUserId = extractUserId(currentUser);
          
          // Only proceed if authenticated
          if (!token || !currentUserId) {
            return;
          }
          
          await axios.patch(`http://localhost:3000/api/chat/read/${currentUserId}?sender=admin`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          // Refresh unread count after marking as read
          fetchMessages();
        } catch (error) {
          // Handle 401 errors silently
          if (error.response?.status === 401 || error.response?.status === 403) {
            console.log("Authentication failed, skipping mark as read");
          } else {
            console.error("Error marking admin messages as read:", error);
          }
        }
      };
      markAdminMessagesAsRead();
      
      // Auto-scroll to bottom when chat is opened - always scroll on open
      shouldAutoScrollRef.current = true;
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
      
      // Real-time: Refresh messages every 2 seconds when open
      chatIntervalRef.current = setInterval(() => {
        // Check authentication before making any API calls
        const token = localStorage.getItem("token");
        const currentUser = JSON.parse(localStorage.getItem("user") || "null");
        const currentUserId = extractUserId(currentUser);
        
        // Only make API calls if user is authenticated
        if (!token || !currentUserId) {
          // User is not authenticated, stop the interval
          if (chatIntervalRef.current) {
            clearInterval(chatIntervalRef.current);
            chatIntervalRef.current = null;
          }
          setIsOpen(false);
          return;
        }
        
        fetchMessages();
        
        // Check admin online status
        axios.get("http://localhost:3000/api/chat/admin/online", {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => {
            if (res.data.success) {
              setAdminOnline(res.data.data.isOnline);
            }
          })
          .catch((err) => {
            // Handle 401 errors by stopping the interval
            if (err.response?.status === 401) {
              if (chatIntervalRef.current) {
                clearInterval(chatIntervalRef.current);
                chatIntervalRef.current = null;
              }
              setIsOpen(false);
            } else if (err.response?.status !== 401) {
              // Only log if it's not a 401 (unauthorized) error
              console.error("Error checking admin online status:", err);
            }
          });
        
        // Check if admin is typing
        if (currentUserId) {
          axios.get(`http://localhost:3000/api/chat/typing/${currentUserId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(res => {
              if (res.data.success) {
                const typingData = res.data.data;
                // Only show typing if admin is typing (not user)
                const adminIsTyping = typingData?.isTyping && typingData?.sender === "admin";
                setIsAdminTyping(adminIsTyping);
                // Update typing admin info if admin is typing
                if (adminIsTyping && typingData?.adminName) {
                  setTypingAdminInfo({
                    name: typingData.adminName || "Admin",
                    avatar: typingData.adminAvatar || ""
                  });
                }
                console.log("📖 Admin typing status:", adminIsTyping, typingData);
              }
            })
            .catch((err) => {
              // Handle 401 errors by stopping the interval
              if (err.response?.status === 401) {
                if (chatIntervalRef.current) {
                  clearInterval(chatIntervalRef.current);
                  chatIntervalRef.current = null;
                }
                setIsOpen(false);
              } else if (err.response?.status !== 401) {
                // Only log if it's not a 401 (unauthorized) error
                console.error("❌ Error checking admin typing status:", err);
              }
            });
        }
      }, 1000); // Check every 1 second for more responsive typing indicator
      return () => {
        if (chatIntervalRef.current) {
          clearInterval(chatIntervalRef.current);
          chatIntervalRef.current = null;
        }
        // Clean up typing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
      });
    }
  }, [isOpen, userId, websiteName, adminInfo]);

  // Auto-scroll to bottom when messages change (only if user is at bottom)
  useEffect(() => {
    if (isOpen && messages.length > 0 && shouldAutoScrollRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages.length, isOpen]);

  // Track user scroll to detect manual scrolling
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;

    const handleScroll = () => {
      const container = messagesContainer;
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100; // 100px threshold
      shouldAutoScrollRef.current = isAtBottom;
    };

    messagesContainer.addEventListener('scroll', handleScroll);
    return () => messagesContainer.removeEventListener('scroll', handleScroll);
  }, [isOpen]);

  const handleOpenChat = () => {
    // Check authentication directly from localStorage (not from stale component state)
    try {
      const userStr = localStorage.getItem("user");
      const tokenStr = localStorage.getItem("token");
      
      // Debug: Log what we found
      console.log("🔍 Opening chat - Checking localStorage:", {
        hasUserString: !!userStr,
        hasTokenString: !!tokenStr,
        userString: userStr ? userStr.substring(0, 100) + "..." : null
      });
      
      if (!userStr || userStr === "null" || !tokenStr) {
        console.log("❌ Missing user or token - showing login modal");
        setShowLoginModal(true);
        return;
      }
      
      const currentUser = JSON.parse(userStr);
      const currentUserId = extractUserId(currentUser);
      const currentToken = tokenStr;
      
      // Debug: Log authentication status
      console.log("🔍 Opening chat - User check:", {
        hasUser: !!currentUser,
        userId: currentUserId,
        hasToken: !!currentToken,
        userKeys: currentUser ? Object.keys(currentUser) : [],
        _idType: typeof currentUser?._id,
        _idValue: currentUser?._id
      });
      
      if (!currentUserId || !currentToken) {
        console.log("❌ Not authenticated - showing login modal. Missing:", {
          missingUserId: !currentUserId,
          missingToken: !currentToken
        });
        setShowLoginModal(true);
        return;
      }
      
      console.log("✅ Authenticated - opening chat");
      setIsOpen(true);
      setIsMinimized(false);
    } catch (error) {
      console.error("❌ Error checking authentication:", error);
      setShowLoginModal(true);
    }
  };

  const handleGoToLogin = () => {
    setShowLoginModal(false);
    navigate("/auth");
  };

  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
  };

  return (
    <>
      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={handleCloseLoginModal}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Login Required
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please login to start chatting with us
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleGoToLogin}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Go to Login
              </button>
              <button
                onClick={handleCloseLoginModal}
                className="w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div className={`fixed z-50 ${
        isOpen 
          ? "inset-0 md:inset-auto md:bottom-6 md:right-6 flex items-center justify-center md:block p-4 md:p-0" 
          : "bottom-6 right-6"
      }`}>
      {/* Chat Window */}
      {isOpen && (
        <div
          className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ${
            isMinimized 
              ? "w-80 h-14" 
              : "w-full md:w-96 h-full md:h-[600px] max-w-md"
          }`}
        >
          {/* Header - Professional Design */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 dark:from-blue-700 dark:via-blue-600 dark:to-purple-700 p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">Chat with us</h3>
                <p className="text-xs text-white/80">We're here to help</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                <Minimize2 className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto scrollbar-hide bg-gray-50 dark:bg-gray-900/50"
              >
                <div className="p-4 space-y-4">
                  {loading && messages.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start a conversation</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Send us a message and we'll get back to you!</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, index) => {
                        const showAvatar = msg.sender === "admin" || msg.sender === "ai" || 
                          (index === 0 || messages[index - 1].sender !== msg.sender);
                        
                        return (
                          <div
                            key={msg._id}
                            className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                          >
                          {/* AI Messages */}
                          {msg.sender === "ai" && (
                            <>
                              <div className="flex-shrink-0">
                                {showAvatar ? (
                                  <div className="relative">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
                                      <span className="text-white text-xs font-semibold">AI</span>
                                    </div>
                                    {/* AI Online Indicator - AI is always available */}
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                                  </div>
                                ) : (
                                  <div className="w-8"></div>
                                )}
                              </div>
                              <div className="flex flex-col items-start max-w-[75%]">
                                {showAvatar && (
                                  <span className="text-xs text-gray-600 dark:text-gray-400 mb-1 px-1 flex items-center gap-1">
                                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold shadow-sm">AI Assistance</span>
                                  </span>
                                )}
                                <div className="rounded-2xl px-4 py-2.5 break-words bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/20 text-gray-900 dark:text-white shadow-md hover:shadow-lg transition-shadow border border-purple-200 dark:border-purple-800">
                                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed text-left">{msg.message}</p>
                                  <p className="text-xs mt-1.5 text-gray-500 dark:text-gray-400 text-left">
                                    {formatDate(msg.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </>
                          )}
                          
                          {/* Admin Messages */}
                          {msg.sender === "admin" && (
                            <>
                              <div className="flex-shrink-0">
                                {showAvatar ? (
                                  <div className="relative">
                                    {msg.adminAvatar ? (
                                      <img
                                        src={msg.adminAvatar}
                                        alt={msg.adminName || "Admin"}
                                        className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-md"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                                        <User className="w-4 h-4 text-white" />
                                      </div>
                                    )}
                                    {/* Admin Online Indicator - Show if admin is online */}
                                    {isAdminOnline() && (
                                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="w-8"></div>
                                )}
                              </div>
                              <div className="flex flex-col items-start max-w-[75%]">
                                {showAvatar && (
                                  <span className="text-xs text-gray-600 dark:text-gray-400 mb-1 px-1">
                                    {msg.adminName || "Support"}
                                  </span>
                                )}
                                <div className="rounded-2xl px-4 py-2.5 break-words bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 text-gray-900 dark:text-white shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700">
                                  <p className="text-sm whitespace-pre-wrap break-words word-break break-all leading-relaxed">{msg.message}</p>
                                  <p className="text-xs mt-1.5 text-gray-500 dark:text-gray-400">
                                    {formatDate(msg.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </>
                          )}
                          
                          {msg.sender === "user" && (
                            <>
                              <div className="flex flex-col items-end max-w-[75%]">
                                {showAvatar && (msg.userName || user?.name) && (
                                  <span className="text-xs text-gray-600 dark:text-gray-400 mb-1 px-1">
                                    {msg.userName || user?.name}
                                  </span>
                                )}
                                <div className="rounded-2xl px-4 py-2.5 break-words bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md hover:shadow-lg transition-shadow">
                                  <p className="text-sm whitespace-pre-wrap break-words word-break break-all leading-relaxed">{msg.message}</p>
                                  <p className="text-xs mt-1.5 text-blue-100">
                                    {formatDate(msg.createdAt)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                {showAvatar ? (
                                  <div className="relative">
                                    {msg.userAvatar || user?.avatar ? (
                                      <img
                                        src={msg.userAvatar || user.avatar}
                                        alt={msg.userName || user?.name || "User"}
                                        className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-md"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                                        <span className="text-white text-xs font-semibold">
                                          {(msg.userName || user?.name)?.[0]?.toUpperCase() || "U"}
                                        </span>
                                      </div>
                                    )}
                                    {/* User Online Indicator - Show if user is online */}
                                    {isUserOnline() && (
                                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="w-8"></div>
                                )}
                              </div>
                            </>
                          )}
                          </div>
                        );
                      })}
                      {/* Admin Typing Indicator */}
                      {isAdminTyping && (
                        <div className="flex gap-2 justify-start">
                          <div className="flex-shrink-0">
                            {typingAdminInfo.avatar ? (
                              <img
                                src={typingAdminInfo.avatar}
                                alt={typingAdminInfo.name || "Admin"}
                                className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-800"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white text-xs font-semibold">
                                  {(typingAdminInfo.name || "Admin")[0]?.toUpperCase() || "A"}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-start max-w-[75%]">
                            <div className="rounded-2xl px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {typingAdminInfo.name || "Admin"} is typing
                                </span>
                                <div className="flex gap-1">
                                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                  <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Area - Professional Design */}
              <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                {!isUserLoggedIn() ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Please login to send a message
                    </p>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        window.location.href = "/auth";
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Go to Login
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            // Notify admin that user is typing
                            const currentUser = JSON.parse(localStorage.getItem("user") || "null");
                            const currentUserId = extractUserId(currentUser);
                            const token = localStorage.getItem("token");
                            
                            if (e.target.value.trim() && currentUserId && token) {
                              // Clear previous timeout
                              if (typingTimeoutRef.current) {
                                clearTimeout(typingTimeoutRef.current);
                              }
                              
                              // Send typing indicator to backend immediately
                              axios.post("http://localhost:3000/api/chat/typing", {
                                userId: currentUserId,
                                isTyping: true,
                                sender: "user"
                              }, {
                                headers: { Authorization: `Bearer ${token}` }
                              }).then(() => {
                                console.log("User typing status sent: true");
                              }).catch((err) => {
                                // Silently handle auth errors
                                if (err.response?.status !== 401 && err.response?.status !== 403) {
                                  console.error("Error sending typing status:", err);
                                }
                              });
                              
                              // Stop typing indicator after 2 seconds of no typing
                              typingTimeoutRef.current = setTimeout(() => {
                                const currentToken = localStorage.getItem("token");
                                const currentUser2 = JSON.parse(localStorage.getItem("user") || "null");
                                const currentUserId2 = extractUserId(currentUser2);
                                if (currentToken && currentUserId2) {
                                  axios.post("http://localhost:3000/api/chat/typing", {
                                    userId: currentUserId2,
                                    isTyping: false,
                                    sender: "user"
                                  }, {
                                    headers: { Authorization: `Bearer ${currentToken}` }
                                  }).catch(() => {});
                                }
                              }, 2000);
                            } else if (!e.target.value.trim() && currentUserId && token) {
                              // Stop typing indicator when input is empty
                              if (typingTimeoutRef.current) {
                                clearTimeout(typingTimeoutRef.current);
                              }
                              axios.post("http://localhost:3000/api/chat/typing", {
                                userId: currentUserId,
                                isTyping: false,
                                sender: "user"
                              }, {
                                headers: { Authorization: `Bearer ${token}` }
                              }).catch(() => {});
                            }
                          }}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              // Stop typing indicator when sending
                              if (typingTimeoutRef.current) {
                                clearTimeout(typingTimeoutRef.current);
                              }
                              const currentUser = JSON.parse(localStorage.getItem("user") || "null");
                              const currentUserId = extractUserId(currentUser);
                              const token = localStorage.getItem("token");
                              if (currentUserId && token) {
                                axios.post("http://localhost:3000/api/chat/typing", {
                                  userId: currentUserId,
                                  isTyping: false,
                                  sender: "user"
                                }, {
                                  headers: { Authorization: `Bearer ${token}` }
                                }).catch(() => {});
                              }
                              handleSendMessage();
                            }
                          }}
                          placeholder="Type your message..."
                          className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          disabled={sending || !isUserLoggedIn()}
                        />
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending || !isUserLoggedIn()}
                        className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center min-w-[48px]"
                        title="Send message"
                      >
                        {sending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                      Press Enter to send
                    </p>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Chat Button - Professional Design with Beautiful Animations */}
      {!isOpen && (
        <button
          onClick={handleOpenChat}
          className="relative bg-blue-600 hover:bg-blue-500 text-white rounded-full p-4 shadow-lg transition-all duration-300 flex items-center justify-center w-16 h-16 overflow-visible"
          aria-label="Live Chat"
        >
          {/* Main button content */}
          <div className="relative z-10">
            <MessageCircle className="w-7 h-7" />
          </div>
          
          {/* Green online indicator - only show when no unread messages */}
          {unreadCount === 0 && (
            <span 
              className="absolute -top-1 right-1 w-3.5 h-3.5 bg-blue-600 rounded-full border-2 border-white dark:border-gray-800 z-20"
              style={{
                animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.7)'
              }}
            ></span>
          )}
          
          {/* Unread count badge - Beautiful animated badge - Only show when there are unread messages */}
          {unreadCount > 0 && (
            <span 
              className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full px-2 py-1 min-w-[24px] h-[24px] flex items-center justify-center shadow-xl ring-2 ring-white dark:ring-gray-800 z-20"
              style={{
                animation: 'bounce-subtle 1s ease-in-out infinite',
                boxShadow: '0 0 15px rgba(239, 68, 68, 0.6), 0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      )}
      
      {/* Custom CSS animations */}
      <style>{`
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
      </div>
    </>
  );
}
