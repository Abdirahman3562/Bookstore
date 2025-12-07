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

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userId = user?._id || user?.id;
  const [adminOnline, setAdminOnline] = useState(false);
  const [lastActivity, setLastActivity] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0); // Unread count for admin messages
  const previousMessagesRef = useRef([]); // Track previous messages to detect new ones
  const notifiedMessagesRef = useRef(new Set()); // Track which messages we've already notified for
  const isInitialLoadRef = useRef(true); // Track if this is the first load
  const previousUnreadCountRef = useRef(0); // Track previous unread count to detect increases
  const hasPlayedLoginSoundRef = useRef(false); // Track if we've played sound on login

  // Check if user is logged in
  const isUserLoggedIn = () => {
    return !!user && !!userId;
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

  // Fetch messages when chat opens
  const fetchMessages = async () => {
    if (!userId) return;

    try {
      const response = await axios.get(`http://localhost:3000/api/chat/messages/${userId}`);
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
      console.error("Error fetching messages:", error);
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
      await axios.post("http://localhost:3000/api/chat/send", {
        userId: userId,
        message: newMessage.trim(),
        sender: "user"
      });

      // Play sound after message is successfully saved to database
      playNotificationSound();
      
      setNewMessage("");
      await fetchMessages();
      
      // Auto-scroll to bottom after sending message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
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
    if (userId) {
      // Reset flags when userId changes (user logs in)
      hasPlayedLoginSoundRef.current = false;
      previousUnreadCountRef.current = 0;
      
      // Fetch messages to check for unread count
      const checkUnreadMessages = async () => {
        try {
          const response = await axios.get(`http://localhost:3000/api/chat/messages/${userId}`);
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
          console.error("Error checking unread messages:", error);
        }
      };
      
      checkUnreadMessages();
      
      // Also check periodically when user is logged in (even if chat is closed)
      const interval = setInterval(() => {
        checkUnreadMessages();
      }, 3000); // Check every 3 seconds
      
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
      previousUnreadCountRef.current = 0;
      hasPlayedLoginSoundRef.current = false;
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      fetchMessages().finally(() => setLoading(false));
      
      // Mark admin messages as read when chat is opened
      const markAdminMessagesAsRead = async () => {
        try {
          await axios.patch(`http://localhost:3000/api/chat/read/${userId}?sender=admin`);
          // Refresh unread count after marking as read
          fetchMessages();
        } catch (error) {
          console.error("Error marking admin messages as read:", error);
        }
      };
      markAdminMessagesAsRead();
      
      // Auto-scroll to bottom when chat is opened - always scroll on open
      shouldAutoScrollRef.current = true;
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
      
      // Real-time: Refresh messages every 2 seconds when open
      const interval = setInterval(() => {
        fetchMessages();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen, userId]);

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
    if (!userId) {
      setShowLoginModal(true);
      return;
    }
    setIsOpen(true);
    setIsMinimized(false);
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

      <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div
          className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ${
            isMinimized ? "w-80 h-14" : "w-96 h-[600px]"
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
                    messages.map((msg, index) => {
                      const showAvatar = msg.sender === "admin" || 
                        (index === 0 || messages[index - 1].sender !== msg.sender);
                      
                      return (
                        <div
                          key={msg._id}
                          className={`flex gap-2 ${msg.sender === "admin" ? "justify-start" : "justify-end"}`}
                        >
                          {msg.sender === "admin" && (
                            <>
                              <div className="flex-shrink-0">
                                {showAvatar ? (
                                  <div className="relative">
                                    {msg.adminAvatar ? (
                                      <img
                                        src={msg.adminAvatar}
                                        alt={msg.adminName || "Admin"}
                                        className="w-8 h-8 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
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
                                <div className="rounded-2xl px-4 py-2.5 break-words bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700">
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
                                <div className="rounded-2xl px-4 py-2.5 break-words bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md">
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
                                        className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-800"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
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
                    })
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
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
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
          className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-600 hover:via-blue-600 hover:to-blue-600 text-white rounded-full p-4 shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 transform hover:scale-110 flex items-center justify-center w-16 h-16 overflow-visible"
          style={{
            animation: 'pulse-glow 2s ease-in-out infinite',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)'
          }}
          aria-label="Live Chat"
        >
          {/* Animated gradient ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-75 animate-spin-slow blur-sm"></div>
          
          {/* Main button content */}
          <div className="relative z-10">
            <MessageCircle className="w-7 h-7 drop-shadow-lg" />
          </div>
          
          {/* Green online indicator - only show when no unread messages */}
          {unreadCount === 0 && (
            <span 
              className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white dark:border-gray-800 z-20"
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
          
          {/* Hover glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-500"></div>
        </button>
      )}
      
      {/* Custom CSS animations */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(139, 92, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.5);
          }
        }
        
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        
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
