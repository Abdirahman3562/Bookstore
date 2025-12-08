import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { MessageSquare, RotateCcw, Edit, Trash2, Plus, CheckCircle, XCircle, Clock, User, Tag, Upload, Star } from "lucide-react";
import { getCurrentAdminUser, canAdd, canEdit, canDelete } from "../utils/permissions";

export default function TestimonialsAdmin() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());

  const [stats, setStats] = useState({
    totalTestimonials: 0,
    pendingTestimonials: 0,
    approvedTestimonials: 0,
    rejectedTestimonials: 0
  });

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    tag: "",
    img: "",
    avatarFile: null,
    quote: "",
    rating: 5,
    status: "pending"
  });
  const [deleteModal, setDeleteModal] = useState({ show: false, testimonial: null });
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch all testimonials
  const fetchTestimonials = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
        console.log("🔄 Manual refresh: Fetching testimonials from database...");
      } else {
        console.log("🔄 Fetching testimonials from database...");
      }

      const response = await axios.get("http://localhost:3000/api/testimonials");
      const data = response.data.data || [];
      console.log(`✅ Fetched ${data.length} testimonials from database`);

      // Calculate stats
      const totalTestimonials = data.length;
      const pendingTestimonials = data.filter(t => t.status === 'pending').length;
      const approvedTestimonials = data.filter(t => t.status === 'approved').length;
      const rejectedTestimonials = data.filter(t => t.status === 'rejected').length;

      setStats({
        totalTestimonials,
        pendingTestimonials,
        approvedTestimonials,
        rejectedTestimonials
      });

      setTestimonials(data);
      setLastUpdated(new Date().toLocaleString());

      if (showRefreshIndicator) {
        toast.success("Testimonials data refreshed!");
      }
    } catch (error) {
      console.error("❌ Error fetching testimonials:", error);
      toast.error("Failed to load testimonials");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();

      // Add text fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('role', formData.role);
      formDataToSend.append('tag', formData.tag);
      formDataToSend.append('quote', formData.quote);
      formDataToSend.append('rating', formData.rating);
      formDataToSend.append('status', formData.status);

      // Add file if uploaded
      if (formData.avatarFile) {
        formDataToSend.append('avatar', formData.avatarFile);
      }
      // Note: If editing and no new file uploaded, the existing img will remain unchanged in the database
      // We don't send the img field in FormData to avoid overwriting with empty value

      if (editingTestimonial) {
        await axios.put(`http://localhost:3000/api/testimonials/${editingTestimonial._id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success("Testimonial updated successfully!");
      } else {
        await axios.post("http://localhost:3000/api/testimonials", formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success("Testimonial created successfully!");
      }
      await fetchTestimonials();
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error("Error saving testimonial:", error);
      toast.error("Failed to save testimonial");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      role: "",
      tag: "",
      img: "",
      avatarFile: null,
      quote: "",
      rating: 5,
      status: "pending"
    });
    setEditingTestimonial(null);
  };

  // Handle edit
  const handleEdit = (testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      name: testimonial.name,
      role: testimonial.role,
      tag: testimonial.tag,
      img: testimonial.img,
      avatarFile: null,
      quote: testimonial.quote,
      rating: testimonial.rating || 5,
      status: testimonial.status
    });
    setShowForm(true);
  };

  // Update testimonial status
  const updateTestimonialStatus = async (testimonialId, newStatus) => {
    try {
      await axios.patch(`http://localhost:3000/api/testimonials/${testimonialId}/status`, {
        status: newStatus
      });

      const statusMessages = {
        'approved': 'Testimonial approved successfully!',
        'rejected': 'Testimonial rejected!',
        'pending': 'Testimonial moved to pending!'
      };

      toast.success(statusMessages[newStatus] || 'Testimonial status updated!');
      await fetchTestimonials();
    } catch (error) {
      console.error("Error updating testimonial status:", error);
      toast.error("Failed to update testimonial status");
    }
  };

  // Show delete modal
  const showDeleteModal = (testimonial) => {
    setDeleteModal({ show: true, testimonial });
  };

  // Hide delete modal
  const hideDeleteModal = () => {
    setDeleteModal({ show: false, testimonial: null });
  };

  // Confirm delete
  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:3000/api/testimonials/${deleteModal.testimonial._id}`);
      toast.success("Testimonial deleted successfully!");
      await fetchTestimonials();
      hideDeleteModal();
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      toast.error("Failed to delete testimonial");
    }
  };

  // Handle form change
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file' && files && files[0]) {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300', icon: Clock },
      approved: { color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300', icon: CheckCircle },
      rejected: { color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Load current user and data on component mount
  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentAdminUser();
      setCurrentUser(user);
    };
    loadUser();
    fetchTestimonials();
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading testimonials...</p>
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
            <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Testimonials Management</h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {lastUpdated && (
              <span className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
                Last updated: {currentTime}
              </span>
            )}
            <button
              onClick={() => fetchTestimonials(true)}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition-colors text-gray-700 dark:text-gray-300 w-full sm:w-auto"
              title="Refresh testimonials data"
            >
              <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Review and moderate user testimonials and reviews</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-purple-600 dark:to-purple-800 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <MessageSquare className="w-8 h-8 opacity-80" />
            <CheckCircle className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-blue-100 dark:text-purple-200 text-sm font-medium">Total Testimonials</p>
            <p className="text-3xl font-bold">{stats.totalTestimonials}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 dark:from-orange-600 dark:to-orange-800 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 opacity-80" />
            <Tag className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-yellow-100 dark:text-orange-200 text-sm font-medium">Pending Reviews</p>
            <p className="text-3xl font-bold">{stats.pendingTestimonials}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-teal-600 dark:to-teal-800 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 opacity-80" />
            <User className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-green-100 dark:text-teal-200 text-sm font-medium">Approved</p>
            <p className="text-3xl font-bold">{stats.approvedTestimonials}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-pink-600 dark:to-pink-800 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <XCircle className="w-8 h-8 opacity-80" />
            <Trash2 className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-red-100 dark:text-pink-200 text-sm font-medium">Rejected</p>
            <p className="text-3xl font-bold">{stats.rejectedTestimonials}</p>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                if (!editingTestimonial) resetForm();
              }}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role *</label>
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="e.g., Student, Reader, Writer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tag *</label>
              <input
                type="text"
                name="tag"
                value={formData.tag}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="e.g., Great Service, Quality Books"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Avatar Image {editingTestimonial ? '(Upload new to replace)' : '*'}
              </label>
              <input
                type="file"
                name="avatarFile"
                onChange={handleChange}
                accept="image/*"
                required={!editingTestimonial}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {editingTestimonial && !formData.avatarFile && (
                <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                  Current image: {editingTestimonial.img?.split('/').pop() || 'No image'}
                </p>
              )}
              {formData.avatarFile && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                  New file selected: {formData.avatarFile.name}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quote *</label>
              <textarea
                name="quote"
                value={formData.quote}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none resize-vertical bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Enter the testimonial quote..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rating *</label>
              <select
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={5}>5 Stars ⭐⭐⭐⭐⭐</option>
                <option value={4}>4 Stars ⭐⭐⭐⭐</option>
                <option value={3}>3 Stars ⭐⭐⭐</option>
                <option value={2}>2 Stars ⭐⭐</option>
                <option value={1}>1 Star ⭐</option>
              </select>
            </div>

            {editingTestimonial && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            )}

            <div className="md:col-span-2 flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
              >
                {editingTestimonial ? 'Update Testimonial' : 'Create Testimonial'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  if (!editingTestimonial) resetForm();
                }}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Action Buttons */}
      {canAdd(currentUser, 'testimonials') && (
        <div className="mb-6">
          <button
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) {
                setEditingTestimonial(null);
                resetForm();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canAdd(currentUser, 'testimonials')}
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Cancel' : 'Add Testimonial'}
          </button>
        </div>
      )}

      {/* Testimonials List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 p-6">
          <h2 className="text-xl font-semibold text-white">Customer Testimonials</h2>
        </div>

        <div className="p-6">
          {testimonials.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No testimonials yet</h3>
              <p className="text-gray-600 dark:text-gray-400">Testimonials will appear here when customers submit reviews.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {testimonials.map((testimonial) => (
                <div key={testimonial._id} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* User Info */}
                    <div className="flex items-center gap-4">
                      <img
                        src={testimonial.img?.startsWith('http') 
                          ? testimonial.img 
                          : `http://localhost:3000${testimonial.img}`}
                        alt={testimonial.name}
                        className="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-sm"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/64x64?text=No+Image';
                        }}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{testimonial.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Tag className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">{testimonial.tag}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quote */}
                    <div className="flex-1">
                      {/* Rating Stars */}
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, idx) => {
                          const rating = testimonial.rating || 5;
                          const isFilled = idx < rating;
                          return (
                            <Star
                              key={idx}
                              className={`w-4 h-4 ${
                                isFilled
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          );
                        })}
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
                          ({testimonial.rating || 5}/5)
                        </span>
                      </div>
                      
                      <blockquote className="text-gray-700 dark:text-gray-300 italic text-base leading-relaxed mb-4">
                        "{testimonial.quote}"
                      </blockquote>

                      {/* Status and Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(testimonial.status)}
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {testimonial.createdAt 
                              ? new Date(testimonial.createdAt).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })
                              : testimonial.timestamp
                                ? new Date(testimonial.timestamp).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })
                                : 'N/A'
                            }
                          </span>
                        </div>

                        <div className="flex gap-2">
                          {canEdit(currentUser, 'testimonials') && testimonial.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateTestimonialStatus(testimonial._id, 'approved')}
                                className="flex items-center gap-1 px-3 py-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors border border-green-200 dark:border-green-800 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Approve testimonial"
                                disabled={!canEdit(currentUser, 'testimonials')}
                              >
                                <CheckCircle className="w-3 h-3" />
                                Approve
                              </button>
                              <button
                                onClick={() => updateTestimonialStatus(testimonial._id, 'rejected')}
                                className="flex items-center gap-1 px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-200 dark:border-red-800 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Reject testimonial"
                                disabled={!canEdit(currentUser, 'testimonials')}
                              >
                                <XCircle className="w-3 h-3" />
                                Reject
                              </button>
                            </>
                          )}

                          {canEdit(currentUser, 'testimonials') && testimonial.status === 'approved' && (
                            <button
                              onClick={() => updateTestimonialStatus(testimonial._id, 'pending')}
                              className="flex items-center gap-1 px-3 py-1.5 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors border border-yellow-200 dark:border-yellow-800 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Move to pending"
                              disabled={!canEdit(currentUser, 'testimonials')}
                            >
                              <Clock className="w-3 h-3" />
                              Pending
                            </button>
                          )}

                          {canEdit(currentUser, 'testimonials') && testimonial.status === 'rejected' && (
                            <button
                              onClick={() => updateTestimonialStatus(testimonial._id, 'pending')}
                              className="flex items-center gap-1 px-3 py-1.5 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors border border-orange-200 dark:border-orange-800 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Move to pending"
                              disabled={!canEdit(currentUser, 'testimonials')}
                            >
                              <Clock className="w-3 h-3" />
                              Review
                            </button>
                          )}

                          {canEdit(currentUser, 'testimonials') && (
                            <button
                              onClick={() => handleEdit(testimonial)}
                              className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Edit testimonial"
                              disabled={!canEdit(currentUser, 'testimonials')}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {canDelete(currentUser, 'testimonials') && (
                            <button
                              onClick={() => showDeleteModal(testimonial)}
                              className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete testimonial"
                              disabled={!canDelete(currentUser, 'testimonials')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-red-600 dark:bg-red-700 p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white">Delete Testimonial</h3>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <img
                  src={deleteModal.testimonial?.img?.startsWith('http') 
                    ? deleteModal.testimonial.img 
                    : `http://localhost:3000${deleteModal.testimonial?.img}`}
                  alt={deleteModal.testimonial?.name}
                  className="w-16 h-16 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700 flex-shrink-0 mx-auto sm:mx-0"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/64x64?text=No+Image';
                  }}
                />
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm sm:text-base">{deleteModal.testimonial?.name}</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{deleteModal.testimonial?.role}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 italic">"{deleteModal.testimonial?.quote?.substring(0, 60)}..."</p>
                  <p className="text-red-600 dark:text-red-400 font-medium text-sm sm:text-base">
                    Are you sure you want to delete this testimonial? This action cannot be undone and will permanently remove the testimonial from the system.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={hideDeleteModal}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canDelete(currentUser, 'testimonials')}
              >
                Delete Testimonial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
