import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { MessageCircle, Send, User, CheckCircle2, Circle, ArrowLeft, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { getCurrentAdminUser, canReplyLiveChat } from "../utils/permissions";

export default function LiveChatAdmin() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const messageCountsRef = useRef({});
  const previousUnreadCountsRef = useRef({}); // Track previous unread counts per conversation
  const isInitialLoadRef = useRef(true); // Track if this is the first load
  const [currentAdmin, setCurrentAdmin] = useState({ name: "Admin", avatar: "", email: "" });
  const [openedConversations, setOpenedConversations] = useState(new Set());
  const [notifiedMessages, setNotifiedMessages] = useState(new Set());
  const [canSendMessages, setCanSendMessages] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const [isUserTyping, setIsUserTyping] = useState(false); // Track if selected user is typing
  const [typingUsers, setTypingUsers] = useState(new Map()); // Track typing status for all users: userId -> { isTyping: boolean, userName: string, userAvatar: string }
  const typingTimeoutRef = useRef(null); // Timeout for typing indicator
  const [hasAIMessages, setHasAIMessages] = useState(false); // Track if conversation has AI messages

  // Set admin online status
  const setAdminOnline = async (isOnline) => {
    try {
      const adminUser = await getCurrentAdminUser();
      if (adminUser && adminUser.email) {
        const adminToken = localStorage.getItem("admin_token");
        await axios.post("http://localhost:3000/api/chat/admin/online", {
          adminId: adminUser.email,
          isOnline: isOnline
        }, {
          headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
        });
        console.log(`👤 Admin ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
      }
    } catch (error) {
      console.error("Error setting admin online status:", error);
    }
  };

  // Fetch current admin info
  const fetchCurrentAdmin = async () => {
    try {
      const adminUser = await getCurrentAdminUser();
      
      if (adminUser) {
        const adminInfo = {
          name: adminUser.name || adminUser.email?.split('@')[0] || "Admin",
          avatar: adminUser.avatar || "",
          email: adminUser.email || ""
        };
        
        console.log("Setting current admin:", adminInfo);
        console.log("Admin user data:", adminUser);
        
        setCurrentAdmin(adminInfo);
        
        // Check if admin has permission to send messages (reply permission)
        const hasReplyPermission = canReplyLiveChat(adminUser);
        setCanSendMessages(hasReplyPermission);
        
        // Set admin as online when they open the chat page
        if (hasReplyPermission) {
          setAdminOnline(true);
        }
      } else {
        const adminEmail = localStorage.getItem("admin_email");
        if (adminEmail) {
          // Try admins API first
          try {
            const adminToken = localStorage.getItem("admin_token");
            const adminsResponse = await axios.get("http://localhost:3000/api/admins", {
              headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
            });
            const admins = adminsResponse.data.data || [];
            const admin = admins.find(a => a.email === adminEmail);
            if (admin) {
              setCurrentAdmin({
                name: admin.name || adminEmail.split('@')[0],
                avatar: admin.avatar || "",
                email: admin.email
              });
              // Check permission
              const hasReplyPermission = canReplyLiveChat(admin);
              setCanSendMessages(hasReplyPermission);
              return;
            }
          } catch (error) {
            console.log("Admins API not available");
          }

          // Fallback to users API
          const usersResponse = await axios.get("http://localhost:3000/api/users", {
            headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
          });
          const users = usersResponse.data.data || [];
          const user = users.find(u => u.email === adminEmail);
          if (user) {
            setCurrentAdmin({
              name: user.name || adminEmail.split('@')[0],
              avatar: user.avatar || "",
              email: user.email
            });
            // Check permission
            const hasReplyPermission = canReplyLiveChat(user);
            setCanSendMessages(hasReplyPermission);
          } else {
            setCurrentAdmin({
              name: adminEmail.split('@')[0],
              avatar: "",
              email: adminEmail
            });
            setCanSendMessages(false);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching admin info:", error);
      setCanSendMessages(false);
    }
  };

  // Fetch conversations
  const fetchConversations = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      }

      const adminToken = localStorage.getItem("admin_token");
      const response = await axios.get("http://localhost:3000/api/chat/conversations", {
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
      });

      if (response.data.success) {
        const convs = response.data.data || [];

        // Check for new unread messages and play sound (skip on initial load)
        if (!isInitialLoadRef.current) {
          convs.forEach(conv => {
            const previousUnreadCount = previousUnreadCountsRef.current[conv.userId] || 0;
            const currentUnreadCount = conv.unreadCount || 0;
            
            // Play sound whenever unread count increases (user sent new message)
            if (currentUnreadCount > previousUnreadCount) {
              // Create a unique key based on conversation and unread count
              const notificationKey = `unread-${conv.userId}-${currentUnreadCount}`;
              
              // Only play sound if we haven't notified for this specific unread count
              if (!notifiedMessages.has(notificationKey)) {
                // User sent new message - play sound
                playNotificationSound();
                setNotifiedMessages(prev => new Set(prev).add(notificationKey));
              }
            }
            
            // Update previous unread count
            previousUnreadCountsRef.current[conv.userId] = currentUnreadCount;
          });
        } else {
          // On initial load, just populate the refs without playing sound
          convs.forEach(conv => {
            previousUnreadCountsRef.current[conv.userId] = conv.unreadCount || 0;
          });
          isInitialLoadRef.current = false;
        }
        
        // Sort like Messenger: Unread conversations first, then by lastActivity
        const sortedConvs = [...convs].sort((a, b) => {
          const aUnread = a.unreadCount > 0;
          const bUnread = b.unreadCount > 0;
          
          // Unread conversations come first
          if (aUnread && !bUnread) return -1;
          if (!aUnread && bUnread) return 1;
          
          // Within same unread status, sort by lastActivity (most recent first)
          const dateA = new Date(a.lastActivity);
          const dateB = new Date(b.lastActivity);
          return dateB - dateA;
        });
        setConversations(sortedConvs);
        setLastUpdated(new Date().toLocaleString());
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const adminToken = localStorage.getItem("admin_token");
      const response = await axios.get("http://localhost:3000/api/chat/unread-count", {
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
      });

      if (response.data.success) {
        setUnreadCount(response.data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  // Manual refresh handler
  const handleRefresh = async () => {
    await Promise.all([
      fetchConversations(true),
      fetchUnreadCount()
    ]);
    if (selectedConversation) {
      await fetchMessages(selectedConversation.userId);
    }
    toast.success("Chat refreshed!");
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    if (!date) return "";
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleTimeString();
  };


  // Play system notification sound
  const playNotificationSound = () => {
    try {
      // Use audio file from public folder
      const audio = new Audio("/mixkit-message-pop-alert-2354.mp3");
      audio.volume = 0.7;
      audio.play().catch((error) => {
        console.log("Could not play notification sound:", error);
      });
      
      // Also show browser notification if permission is granted
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("New Message", {
          body: "You have a new message",
          icon: "/favicon.ico",
          silent: true, // We're playing our own sound, so make notification silent
          tag: "chat-notification"
        });
      }
    } catch (error) {
      console.log("Could not play notification sound:", error);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async (userId, previousMessagesCount = null) => {
    try {
      const adminToken = localStorage.getItem("admin_token");
      const response = await axios.get(`http://localhost:3000/api/chat/messages/${userId}`, {
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
      });
      if (response.data.success) {
        const previousMessages = messages;
        const newMessages = response.data.data || [];
        const previousCount = previousMessagesCount !== null ? previousMessagesCount : previousMessages.length;
        const newCount = newMessages.length;
        
        // Check for new messages (for auto-scroll only, no sound here)
        const hasNewMessages = newCount > previousCount && previousCount >= 0;
        
        // Check if conversation has AI messages (not taken over yet)
        const hasAI = newMessages.some(msg => msg.sender === "ai" && !msg.takenOverBy);
        setHasAIMessages(hasAI);
        
        setMessages(newMessages);
        
        // Auto-scroll to bottom when new messages arrive
        if (hasNewMessages) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
        
        // Mark as read
        await axios.patch(`http://localhost:3000/api/chat/read/${userId}`);
        fetchUnreadCount();
        fetchConversations();
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !canSendMessages) {
      if (!canSendMessages) {
        toast.error("You don't have permission to send messages. You can only view conversations.");
      }
      return;
    }

    setSending(true);
    try {
      // Ensure we have the latest admin info before sending
      const adminUser = await getCurrentAdminUser();
      const adminName = adminUser?.name || currentAdmin.name || "Admin";
      const adminAvatar = adminUser?.avatar || currentAdmin.avatar || "";
      const adminEmail = adminUser?.email || currentAdmin.email || "";
      
      console.log("Sending message with admin info:", {
        adminName,
        adminAvatar,
        adminEmail,
        currentAdmin,
        adminUser
      });
      
      const adminToken = localStorage.getItem("admin_token");
      await axios.post("http://localhost:3000/api/chat/send", {
        userId: selectedConversation.userId,
        message: newMessage.trim(),
        sender: "admin",
        adminId: adminEmail,
        adminName: adminName,
        adminAvatar: adminAvatar
      }, {
        headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
      });

      setNewMessage("");
      
      // Stop typing indicator when sending
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (selectedConversation) {
        const adminToken = localStorage.getItem("admin_token");
        axios.post("http://localhost:3000/api/chat/typing", {
          userId: selectedConversation.userId,
          isTyping: false,
          sender: "admin"
        }, {
          headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
        }).catch(() => {});
      }
      
      await fetchMessages(selectedConversation.userId);
      fetchConversations();
      toast.success("Message sent!");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Handle conversation select
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    // Mark conversation as opened
    setOpenedConversations(prev => new Set(prev).add(conversation.userId));
    
    // Play sound only if there are unread messages when opening the conversation
    if (conversation.unreadCount > 0) {
      playNotificationSound();
    }
    
    fetchMessages(conversation.userId);
  };

  // Handle back to conversations list (mobile)
  const handleBackToConversations = () => {
    setSelectedConversation(null);
  };

  // Check if user is online (logged in and active within last 5 minutes)
  const isUserOnline = (lastActivity, userId) => {
    // First check if user is logged in by checking localStorage or API
    // For now, we assume if lastActivity is recent, user is logged in and active
    if (!lastActivity) return false;
    const lastActiveDate = new Date(lastActivity);
    const now = new Date();
    const diffInMinutes = Math.floor((now - lastActiveDate) / 1000 / 60);
    // Online if active within last 5 minutes (meaning user is logged in and active)
    return diffInMinutes < 5;
  };

  // Check if admin is logged in
  const isAdminLoggedIn = () => {
    return !!localStorage.getItem("admin_email");
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  useEffect(() => {
    fetchCurrentAdmin();
    fetchConversations();
    fetchUnreadCount();
    
    // Set admin online when component mounts (admin opens chat page)
    const setAdminOnlineOnMount = async () => {
      const adminUser = await getCurrentAdminUser();
      if (adminUser) {
        const hasReplyPermission = canReplyLiveChat(adminUser);
        if (hasReplyPermission) {
          setAdminOnline(true);
          console.log("✅ Admin set to ONLINE on mount");
        }
      }
    };
    setAdminOnlineOnMount();
    
    // Don't play sound when admin enters - only play when opening conversations with unread messages
    
    // Real-time: Refresh every 2 seconds
    const interval = setInterval(() => {
      fetchConversations();
      fetchUnreadCount();
      if (selectedConversation) {
        const userId = selectedConversation.userId;
        const previousCount = messageCountsRef.current[userId] || messages.length;
        fetchMessages(userId, previousCount);
        // Check if user is typing
        const adminToken = localStorage.getItem("admin_token");
        axios.get(`http://localhost:3000/api/chat/typing/${userId}`, {
          headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
        })
          .then(res => {
            if (res.data.success) {
              const typingData = res.data.data;
              // Only show typing if user is typing (not admin)
              const userIsTyping = typingData?.isTyping && typingData?.sender === "user";
              setIsUserTyping(userIsTyping);
            }
          })
          .catch(() => {});
      }
      
      // Check typing status for all conversations in the sidebar
      conversations.forEach((conv) => {
        const adminToken = localStorage.getItem("admin_token");
        axios.get(`http://localhost:3000/api/chat/typing/${conv.userId}`, {
          headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
        })
          .then(res => {
            if (res.data.success) {
              const typingData = res.data.data;
              const userIsTyping = typingData?.isTyping && typingData?.sender === "user";
              
              setTypingUsers(prev => {
                const newMap = new Map(prev);
                if (userIsTyping) {
                  newMap.set(conv.userId, {
                    isTyping: true,
                    userName: conv.userName,
                    userAvatar: conv.userAvatar
                  });
                } else {
                  newMap.delete(conv.userId);
                }
                return newMap;
              });
            }
          })
          .catch(() => {});
      });
      
      setLastUpdated(new Date().toLocaleString());
    }, 1000); // Check every 1 second for more responsive typing indicator

    return () => {
      clearInterval(interval);
      // Clean up typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Set admin offline when component unmounts
      setAdminOnline(false);
    };
  }, [selectedConversation]);
  
  // Update message count ref when messages change
  useEffect(() => {
    if (selectedConversation) {
      messageCountsRef.current[selectedConversation.userId] = messages.length;
    }
  }, [messages.length, selectedConversation]);

  // Auto-scroll to bottom when messages change (if conversation is selected)
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages.length, selectedConversation]);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Update current time every second for live timer
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Sound playing is now handled in fetchConversations when unread count increases

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header - Hidden on mobile when in chat view */}
      <div className={`mb-6 ${selectedConversation ? 'hidden lg:block' : ''}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Live Chat Management</h1>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'No unread messages'}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            {lastUpdated && (
              <span className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
                Last updated: {currentTime}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition-colors text-gray-700 dark:text-gray-300 w-[110px] sm:w-auto"
              title="Refresh chat"
            >
              <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Conversations List - Full screen on mobile when no chat selected, side panel on desktop */}
        <div className={`${selectedConversation ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex-col h-full`}>
          {/* Fixed Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h2 className="font-semibold text-gray-900 dark:text-white">Conversations</h2>
          </div>
          
          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isOpened = openedConversations.has(conv.userId);
                const hasUnread = conv.unreadCount > 0;
                // Messenger style: Show for any conversation with unread messages (regardless of opened status)
                const showMessengerStyle = hasUnread;
                
                return (
                <button
                  key={conv.userId}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 transition-all text-left relative ${
                    selectedConversation?.userId === conv.userId
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : showMessengerStyle
                      ? "bg-blue-50 dark:bg-blue-900/15 hover:bg-blue-100 dark:hover:bg-blue-900/20 border-l-4 border-l-blue-500"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  } ${
                    !hasUnread && isOpened
                      ? "opacity-60"
                      : ""
                  } active:bg-gray-100 dark:active:bg-gray-700`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar with Online Indicator - Messenger Style */}
                    <div className="flex-shrink-0 relative">
                      {conv.userAvatar ? (
                        <img
                          src={conv.userAvatar}
                          alt={conv.userName}
                          className={`w-12 h-12 md:w-14 md:h-14 rounded-full object-cover ${
                            showMessengerStyle ? "ring-2 ring-blue-400/50" : ""
                          }`}
                          onError={(e) => {
                            // If image fails to load, replace with default avatar
                            e.target.style.display = 'none';
                            const fallback = e.target.nextElementSibling;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-12 h-12 md:w-14 md:h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center ${
                          showMessengerStyle ? "ring-2 ring-blue-400/50" : ""
                        }`}
                        style={{ display: conv.userAvatar ? 'none' : 'flex' }}
                      >
                        {conv.userName ? (
                          <span className="text-blue-600 dark:text-blue-400 text-sm md:text-base font-semibold">
                            {conv.userName[0]?.toUpperCase() || "U"}
                          </span>
                        ) : (
                          <User className="w-6 h-6 md:w-7 md:h-7 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      {/* Online Indicator - Only show if user is logged in and online */}
                      {isUserOnline(conv.lastActivity, conv.userId) && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                      )}
                    </div>

                    {/* Content - Messenger Style */}
                    <div className="flex-1 min-w-0">
                      {/* Name Row with Timestamp and Blue Dot */}
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`truncate ${
                          showMessengerStyle
                            ? "text-gray-900 dark:text-white font-bold text-base md:text-lg" 
                            : "text-gray-700 dark:text-gray-300 font-semibold"
                        }`}>
                          {conv.userName}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <span className={`text-xs whitespace-nowrap ${
                            showMessengerStyle
                              ? "text-blue-600 dark:text-blue-400 font-semibold" 
                              : "text-gray-500 dark:text-gray-500"
                          }`}>
                            {formatDate(conv.lastActivity)}
                          </span>
                          {/* Unread Indicator - Blue Dot (Messenger Style) */}
                          {showMessengerStyle && (
                            <span className="w-3.5 h-3.5 bg-blue-500 rounded-full flex-shrink-0 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800"></span>
                          )}
                        </div>
                      </div>
                      {/* Last Message Row */}
                      <div className="flex items-center justify-between">
                        {typingUsers.has(conv.userId) ? (
                          <div className="flex items-center gap-1 flex-1">
                            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium italic">
                              typing
                            </span>
                            <div className="flex gap-0.5">
                              <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                              <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                          </div>
                        ) : (
                          <p className={`text-sm truncate flex-1 ${
                            showMessengerStyle
                              ? "text-gray-900 dark:text-white font-bold" 
                              : "text-gray-600 dark:text-gray-400"
                          }`}>
                            {conv.lastMessage?.message?.startsWith("Your:") || conv.lastMessage?.message?.startsWith("You:") 
                              ? conv.lastMessage.message.replace(/^(Your:|You:)\s*/, "")
                              : conv.lastMessage?.message || "No messages"}
                          </p>
                        )}
                        {/* Unread Count Badge - Messenger Style */}
                        {showMessengerStyle && !typingUsers.has(conv.userId) && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full flex-shrink-0 min-w-[20px] text-center">
                            {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Window - Hidden on mobile when no chat selected */}
        <div className={`${selectedConversation ? 'flex' : 'hidden lg:flex'} flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex-col h-full`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-3 md:p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Back Button - Mobile Only */}
                    <button
                      onClick={handleBackToConversations}
                      className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-900 dark:text-white" />
                    </button>
                    
                    <div className="relative flex-shrink-0">
                      {selectedConversation.userAvatar ? (
                        <img
                          src={selectedConversation.userAvatar}
                          alt={selectedConversation.userName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      )}
                      {/* Online Indicator - Only show if user is logged in and online */}
                      {isUserOnline(selectedConversation.lastActivity, selectedConversation.userId) && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 truncate">
                        <span className="truncate">{selectedConversation.userName}</span>
                        {isUserOnline(selectedConversation.lastActivity, selectedConversation.userId) && (
                          <span className="text-xs font-normal text-green-600 dark:text-green-400 flex-shrink-0">● Online</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {selectedConversation.userEmail}
                      </p>
                    </div>
                  </div>
                  
                  {/* Admin Info with Online Indicator - Hidden on mobile */}
                  <div className="hidden lg:flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs text-gray-600 dark:text-gray-400">You</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{currentAdmin.name}</p>
                    </div>
                    <div className="relative">
                      {currentAdmin.avatar ? (
                        <img
                          src={currentAdmin.avatar}
                          alt={currentAdmin.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {currentAdmin.name[0]?.toUpperCase() || "A"}
                          </span>
                        </div>
                      )}
                      {/* Admin Online Indicator - Only show if admin is logged in */}
                      {isAdminLoggedIn() && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Take Over Button - Show if conversation has AI messages - Below header for mobile visibility */}
              {hasAIMessages && (
                <div className="px-3 md:px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-gray-800">
                  <button
                    onClick={async () => {
                      if (!canSendMessages) {
                        toast.error("You don't have permission to take over chats. Contact an administrator to grant reply permissions.");
                        return;
                      }
                      
                      try {
                        const adminUser = await getCurrentAdminUser();
                        const adminId = adminUser?.email || currentAdmin.email;
                        const adminName = adminUser?.name || currentAdmin.name;
                        const adminAvatar = adminUser?.avatar || currentAdmin.avatar;
                        
                        const adminToken = localStorage.getItem("admin_token");
                        await axios.post("http://localhost:3000/api/chat/takeover", {
                          userId: selectedConversation.userId,
                          adminId: adminId,
                          adminName: adminName,
                          adminAvatar: adminAvatar
                        }, {
                          headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
                        });
                        
                        toast.success("You have taken over the chat!");
                        fetchMessages(selectedConversation.userId);
                        setHasAIMessages(false);
                      } catch (error) {
                        console.error("Error taking over chat:", error);
                        toast.error("Failed to take over chat");
                      }
                    }}
                    disabled={!canSendMessages}
                    className={`w-full px-3 md:px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                      canSendMessages
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60"
                    }`}
                    title={!canSendMessages ? "You don't have permission to take over chats. Contact an administrator to grant reply permissions." : "Take over this chat from AI"}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm md:text-base">Take Over Chat</span>
                  </button>
                  {!canSendMessages && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                      You need reply permission to take over chats
                    </p>
                  )}
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-6">
                {messages.map((msg, index) => {
                  const showAvatar = index === 0 || messages[index - 1].sender !== msg.sender;
                  const isAdmin = msg.sender === "admin";
                  const isAI = msg.sender === "ai";
                  const isRightSide = isAdmin || isAI;
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const isSameSender = prevMsg && prevMsg.sender === msg.sender;
                  
                  return (
                    <div
                      key={msg._id}
                      className={`flex mb-5 ${isRightSide ? "justify-end gap-4" : "justify-start gap-4"}`}
                    >
                      {/* User Messages - Left Side */}
                      {!isAdmin && msg.sender === "user" && (
                        <>
                          <div className="flex-shrink-0">
                            {showAvatar ? (
                              <div className="relative">
                                {msg.userAvatar ? (
                                  <img
                                    src={msg.userAvatar}
                                    alt={msg.userName}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-lg"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                    <User className="w-5 h-5 text-white" />
                                  </div>
                                )}
                                {/* Online Indicator - Show if user is online */}
                                {isUserOnline(selectedConversation?.lastActivity, selectedConversation?.userId) && (
                                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                                )}
                              </div>
                            ) : (
                              <div className="w-10"></div>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-start max-w-[65%] md:max-w-[60%]">
                            {showAvatar && (
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 px-1">
                                {msg.userName || "User"}
                              </span>
                            )}
                            <div className="rounded-2xl rounded-tl-md px-4 py-3 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow break-words">
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed text-left">{msg.message}</p>
                              <p className="text-xs mt-2 text-gray-500 dark:text-gray-400 text-left">
                                {formatDate(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex-shrink-0 w-8 md:w-12"></div>
                        </>
                      )}

                      {/* AI Messages - Right Side (Response to User) */}
                      {msg.sender === "ai" && (
                        <>
                          <div className="flex-shrink-0 w-8 md:w-12"></div>
                          <div className="flex flex-col items-end max-w-[65%] md:max-w-[60%]">
                            {showAvatar && (
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 px-1 flex items-center gap-1 justify-end">
                                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold shadow-sm">AI Assistance</span>
                                {msg.takenOverBy && (
                                  <span className="text-xs text-gray-500">(Taken over)</span>
                                )}
                              </span>
                            )}
                            <div className="rounded-2xl rounded-tr-md px-4 py-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white border border-purple-400 dark:border-purple-600 shadow-lg hover:shadow-xl transition-shadow break-words">
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed text-right">{msg.message}</p>
                              <p className="text-xs mt-2 text-purple-100 text-right">
                                {formatDate(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {showAvatar ? (
                              <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                                  <span className="text-white text-xs font-semibold">AI</span>
                                </div>
                                {/* AI Online Indicator - AI is always available */}
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                              </div>
                            ) : (
                              <div className="w-10"></div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Admin Messages - Right Side */}
                      {isAdmin && (
                        <>
                          <div className="flex-shrink-0 w-8 md:w-12"></div>
                          <div className="flex flex-col items-end max-w-[65%] md:max-w-[60%]">
                            {showAvatar && (
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 px-1">
                                {msg.adminName || currentAdmin.name}
                              </span>
                            )}
                            <div className="rounded-2xl rounded-tr-md px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:shadow-xl transition-shadow break-words">
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed text-right">{msg.message}</p>
                              <p className="text-xs mt-2 text-blue-100 text-right">
                                {formatDate(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex-shrink-0">
                            {showAvatar ? (
                              <div className="relative">
                                {msg.adminAvatar || currentAdmin.avatar ? (
                                  <img
                                    src={msg.adminAvatar || currentAdmin.avatar}
                                    alt={msg.adminName || currentAdmin.name}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-lg"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                                    <span className="text-white text-sm font-semibold">
                                      {(msg.adminName || currentAdmin.name)[0]?.toUpperCase() || "A"}
                                    </span>
                                  </div>
                                )}
                                {/* Admin Online Indicator - Show if admin is logged in */}
                                {isAdminLoggedIn() && (
                                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                                )}
                              </div>
                            ) : (
                              <div className="w-10"></div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
                {/* User Typing Indicator */}
                {isUserTyping && selectedConversation && (
                  <div className="flex justify-start gap-4 mb-5">
                    <div className="flex-shrink-0">
                      {selectedConversation.userAvatar ? (
                        <img
                          src={selectedConversation.userAvatar}
                          alt={selectedConversation.userName || "User"}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-lg"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-lg">
                          <span className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
                            {(selectedConversation.userName || "User")[0]?.toUpperCase() || "U"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-start max-w-[65%] md:max-w-[60%]">
                      <div className="rounded-2xl rounded-tl-md px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg">
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedConversation.userName || "User"} is typing
                          </span>
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 w-8 md:w-12"></div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-3 md:p-4 border-t border-gray-200 dark:border-gray-700">
                {!canSendMessages && (
                  <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-xs text-yellow-800 dark:text-yellow-300">
                      <strong>View Only:</strong> You can view conversations but cannot send messages. Contact an administrator to grant reply permissions.
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      // Notify user that admin is typing
                      if (e.target.value.trim() && selectedConversation) {
                        // Clear previous timeout
                        if (typingTimeoutRef.current) {
                          clearTimeout(typingTimeoutRef.current);
                        }
                        
                        // Send typing indicator to backend with admin info
                        const adminToken = localStorage.getItem("admin_token");
                        axios.post("http://localhost:3000/api/chat/typing", {
                          userId: selectedConversation.userId,
                          isTyping: true,
                          sender: "admin",
                          adminName: currentAdmin.name,
                          adminAvatar: currentAdmin.avatar
                        }, {
                          headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
                        }).then(() => {
                          console.log("✅ Admin typing status sent: true");
                        }).catch((err) => {
                          console.error("❌ Error sending admin typing status:", err);
                        });
                        
                        // Stop typing indicator after 2 seconds of no typing
                        typingTimeoutRef.current = setTimeout(() => {
                          const adminToken = localStorage.getItem("admin_token");
                          axios.post("http://localhost:3000/api/chat/typing", {
                            userId: selectedConversation.userId,
                            isTyping: false,
                            sender: "admin"
                          }, {
                            headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
                          }).then(() => {
                            console.log("⏰ Admin typing status cleared");
                          }).catch(() => {});
                        }, 2000);
                      } else if (!e.target.value.trim() && selectedConversation) {
                        // Stop typing indicator when input is empty
                        if (typingTimeoutRef.current) {
                          clearTimeout(typingTimeoutRef.current);
                        }
                        const adminToken = localStorage.getItem("admin_token");
                        axios.post("http://localhost:3000/api/chat/typing", {
                          userId: selectedConversation.userId,
                          isTyping: false,
                          sender: "admin"
                        }, {
                          headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
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
                        if (selectedConversation) {
                          const adminToken = localStorage.getItem("admin_token");
                          axios.post("http://localhost:3000/api/chat/typing", {
                            userId: selectedConversation.userId,
                            isTyping: false,
                            sender: "admin"
                          }, {
                            headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
                          }).catch(() => {});
                        }
                        handleSendMessage();
                      }
                    }}
                    placeholder={canSendMessages ? "Type your message..." : "You can only view messages..."}
                    className="flex-1 px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={sending || !canSendMessages}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending || !canSendMessages}
                    className="px-4 md:px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 md:gap-2"
                    title={!canSendMessages ? "You don't have permission to send messages" : ""}
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Select a conversation to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
