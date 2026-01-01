import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Mail, RotateCcw, Trash2, CheckCircle, Clock, Eye, User, Calendar, MessageSquare } from "lucide-react";
import { getCurrentAdminUser, canAdd, canEdit, canDelete } from "../utils/permissions";
import { handleApiError } from "../utils/apiUtils";
import DataTable from "../components/DataTable";

export default function ContactsAdmin() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());

  const [stats, setStats] = useState({
    totalContacts: 0,
    pendingContacts: 0,
    readContacts: 0,
    repliedContacts: 0
  });

  // Fetch all contacts
  const fetchContacts = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
        console.log("🔄 Manual refresh: Fetching contacts from database...");
      } else {
        console.log("🔄 Fetching contacts from database...");
      }

      const token = localStorage.getItem("admin_token");
      if (!token) {
        console.error("No admin token found");
        return;
      }

      const response = await axios.get("http://localhost:3000/api/contacts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data.data || [];
      console.log(`✅ Fetched ${data.length} contacts from database`);

      // Calculate stats
      const totalContacts = data.length;
      const pendingContacts = data.filter(c => c.status === 'pending').length;
      const readContacts = data.filter(c => c.status === 'read').length;
      const repliedContacts = data.filter(c => c.status === 'replied').length;

      setStats({
        totalContacts,
        pendingContacts,
        readContacts,
        repliedContacts
      });

      setContacts(data);
      setLastUpdated(new Date().toLocaleString());

      if (showRefreshIndicator) {
        toast.success("Contacts data refreshed!");
      }
    } catch (error) {
      handleApiError(error, "contacts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Update contact status
  const updateContactStatus = async (contactId, newStatus) => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        toast.error("Authentication required. Please login again.");
        return;
      }

      await axios.patch(`http://localhost:3000/api/contacts/${contactId}/status`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Contact marked as ${newStatus}!`);
      await fetchContacts();
      
      // Update selected contact if it's the one being updated
      if (selectedContact && selectedContact._id === contactId) {
        const updated = contacts.find(c => c._id === contactId);
        if (updated) {
          setSelectedContact({ ...updated, status: newStatus });
        }
      }
    } catch (error) {
      console.error("Error updating contact status:", error);
      toast.error("Failed to update contact status");
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (contact) => {
    setContactToDelete(contact);
    setShowDeleteModal(true);
  };

  // Delete contact
  const deleteContact = async () => {
    if (!contactToDelete) {
      return;
    }

    const contactId = contactToDelete._id;

    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        toast.error("Authentication required. Please login again.");
        return;
      }

      await axios.delete(`http://localhost:3000/api/contacts/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Contact deleted successfully!");
      await fetchContacts();
      
      // Close modals if deleted contact was selected
      if (selectedContact && selectedContact._id === contactId) {
        setSelectedContact(null);
      }
      setShowDeleteModal(false);
      setContactToDelete(null);
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact");
    }
  };

  // Send reply email
  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    if (!selectedContact) {
      toast.error("No contact selected");
      return;
    }

    setSendingReply(true);

    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        toast.error("Authentication required. Please login again.");
        return;
      }

      const response = await axios.post("http://localhost:3000/api/contacts/reply", {
        contactId: selectedContact._id,
        replyMessage: replyMessage.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success("Reply email sent successfully!");
        setReplyMessage("");
        setShowReplyModal(false);
        await fetchContacts();
        
        // Update selected contact status
        if (selectedContact) {
          const updated = contacts.find(c => c._id === selectedContact._id);
          if (updated) {
            setSelectedContact({ ...updated, status: 'replied' });
          }
        }
      } else {
        toast.error(response.data.message || "Failed to send reply");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to send reply email");
      }
    } finally {
      setSendingReply(false);
    }
  };

  // Open reply modal
  const openReplyModal = (contact) => {
    setSelectedContact(contact);
    setReplyMessage("");
    setShowReplyModal(true);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      read: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      replied: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    };
    return styles[status] || styles.pending;
  };

  // Load current user and data on component mount
  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentAdminUser();
      setCurrentUser(user);
    };
    loadUser();
    fetchContacts();
  }, []);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-0">
          <div className="flex items-center gap-3">
            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Contact Messages</h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {lastUpdated && (
              <span className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
                Last updated: {currentTime}
              </span>
            )}
            <button
              onClick={() => fetchContacts(true)}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition-colors text-gray-700 dark:text-gray-300 w-full sm:w-auto"
              title="Refresh contacts data"
            >
              <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">View and manage contact messages from users</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-indigo-600 dark:to-indigo-800 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Mail className="w-8 h-8 opacity-80" />
            <MessageSquare className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-blue-100 dark:text-indigo-200 text-sm font-medium">Total Messages</p>
            <p className="text-3xl font-bold mt-1">{stats.totalContacts}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-800 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 opacity-80" />
            <Mail className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-yellow-100 dark:text-yellow-200 text-sm font-medium">Pending</p>
            <p className="text-3xl font-bold mt-1">{stats.pendingContacts}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-800 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Eye className="w-8 h-8 opacity-80" />
            <CheckCircle className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-indigo-100 dark:text-indigo-200 text-sm font-medium">Read</p>
            <p className="text-3xl font-bold mt-1">{stats.readContacts}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-800 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 opacity-80" />
            <Mail className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-green-100 dark:text-green-200 text-sm font-medium">Replied</p>
            <p className="text-3xl font-bold mt-1">{stats.repliedContacts}</p>
          </div>
        </div>
      </div>

      {/* Contacts List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {contacts.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">No contact messages yet</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Contact messages from users will appear here</p>
          </div>
        ) : (
          <DataTable
            columns={[
              {
                header: "Name",
                accessor: "name",
                cell: (contact) => (
                  <div className="flex items-center">
                    {contact.userAvatar ? (
                      <img
                        src={contact.userAvatar.startsWith('data:') ? contact.userAvatar : `http://localhost:3000${contact.userAvatar}`}
                        alt={contact.name}
                        className="w-8 h-8 rounded-full object-cover mr-2 border border-gray-200 dark:border-gray-600"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'block';
                          }
                        }}
                      />
                    ) : null}
                    <User 
                      className={`w-5 h-5 text-gray-400 dark:text-gray-500 mr-2 ${contact.userAvatar ? 'hidden' : ''}`}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{contact.name}</span>
                  </div>
                ),
              },
              {
                header: "Email",
                accessor: "email",
                cellClassName: "text-gray-900 dark:text-white",
              },
              {
                header: "Message",
                accessor: "message",
                cell: (contact) => (
                  <p className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                    {contact.message}
                  </p>
                ),
              },
              {
                header: "Date",
                accessor: "createdAt",
                cellClassName: "text-gray-500 dark:text-gray-400",
                cell: (contact) => (
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(contact.createdAt)}
                  </div>
                ),
              },
              {
                header: "Status",
                accessor: "status",
                cell: (contact) => (
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(contact.status)}`}>
                    {contact.status}
                  </span>
                ),
              },
              {
                header: "Actions",
                accessor: "actions",
                cell: (contact) => (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedContact(contact);
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                      title="View details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openReplyModal(contact);
                      }}
                      className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-green-600 dark:disabled:hover:text-green-400"
                      title={!canEdit(currentUser, 'contacts') ? "You don't have permission to reply" : "Reply"}
                      disabled={!canEdit(currentUser, 'contacts')}
                    >
                      <Mail className="w-5 h-5" />
                    </button>
                    {contact.status !== 'read' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateContactStatus(contact._id, 'read');
                        }}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-indigo-600 dark:disabled:hover:text-indigo-400"
                        title={!canEdit(currentUser, 'contacts') ? "You don't have permission to mark as read" : "Mark as read"}
                        disabled={!canEdit(currentUser, 'contacts')}
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(contact);
                      }}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-red-600 dark:disabled:hover:text-red-400"
                      title={!canDelete(currentUser, 'contacts') ? "You don't have permission to delete" : "Delete"}
                      disabled={!canDelete(currentUser, 'contacts')}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ),
              },
            ]}
            data={contacts}
            itemsPerPage={10}
            emptyMessage="No contact messages yet"
            emptyIcon={Mail}
          />
        )}
      </div>

      {/* Contact Details Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedContact(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Message Details</h2>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">User</label>
                <div className="mt-2 flex items-center gap-3">
                  {selectedContact.userAvatar ? (
                    <img
                      src={selectedContact.userAvatar.startsWith('data:') ? selectedContact.userAvatar : `http://localhost:3000${selectedContact.userAvatar}`}
                      alt={selectedContact.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  {!selectedContact.userAvatar && (
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedContact.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedContact.email}</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</label>
                <p className="mt-1 text-lg text-gray-900 dark:text-white">{formatDate(selectedContact.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                <p className="mt-1">
                  <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadge(selectedContact.status)}`}>
                    {selectedContact.status}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Message</label>
                <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{selectedContact.message}</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                {selectedContact.status !== 'read' && (
                  <button
                    onClick={() => {
                      updateContactStatus(selectedContact._id, 'read');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
                    disabled={!canEdit(currentUser, 'contacts')}
                    title={!canEdit(currentUser, 'contacts') ? "You don't have permission to mark as read" : "Mark as Read"}
                  >
                    <Eye className="w-4 h-4" />
                    Mark as Read
                  </button>
                )}
                <button
                  onClick={() => openReplyModal(selectedContact)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600"
                  disabled={!canEdit(currentUser, 'contacts')}
                  title={!canEdit(currentUser, 'contacts') ? "You don't have permission to reply" : "Reply"}
                >
                  <Mail className="w-4 h-4" />
                  Reply
                </button>
                <button
                  onClick={() => openDeleteModal(selectedContact)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
                  disabled={!canDelete(currentUser, 'contacts')}
                  title={!canDelete(currentUser, 'contacts') ? "You don't have permission to delete" : "Delete"}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowReplyModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reply to {selectedContact.name}</h2>
                <button
                  onClick={() => {
                    setShowReplyModal(false);
                    setReplyMessage("");
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">To</label>
                <div className="mt-2 flex items-center gap-3">
                  {selectedContact.userAvatar ? (
                    <img
                      src={selectedContact.userAvatar.startsWith('data:') ? selectedContact.userAvatar : `http://localhost:3000${selectedContact.userAvatar}`}
                      alt={selectedContact.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  {!selectedContact.userAvatar && (
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                  )}
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedContact.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedContact.email}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                  Your Reply Message
                </label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={10}
                  placeholder="Type your reply message here..."
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 py-3 px-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  This message will be sent automatically to {selectedContact.email}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Original Message:</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {selectedContact.message}
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyMessage.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Mail className="w-4 h-4" />
                  {sendingReply ? "Sending..." : "Send Reply"}
                </button>
                <button
                  onClick={() => {
                    setShowReplyModal(false);
                    setReplyMessage("");
                  }}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && contactToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => {
          setShowDeleteModal(false);
          setContactToDelete(null);
        }}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full mb-4">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                Delete Contact Message?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                Are you sure you want to delete the contact message from <strong>{contactToDelete.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={deleteContact}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setContactToDelete(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

