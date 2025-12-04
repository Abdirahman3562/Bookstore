import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  UserPen, RotateCcw, Plus, Edit, Trash2, CheckCircle, XCircle, 
  Mail, Globe, Github, Linkedin, Twitter, Youtube, Facebook, Instagram,
  Calendar, MapPin, FileText, X
} from "lucide-react";

export default function AuthorsAdmin() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [authorToDelete, setAuthorToDelete] = useState(null);
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    avatar: "",
    verified: false,
    bio: "",
    location: "",
    website: "",
    email: "",
    social: {
      github: "",
      linkedin: "",
      twitter: "",
      youtube: "",
      facebook: "",
      instagram: ""
    },
    status: "active"
  });

  const [stats, setStats] = useState({
    totalAuthors: 0,
    activeAuthors: 0,
    verifiedAuthors: 0,
    newThisMonth: 0
  });

  // Fetch authors data
  const fetchAuthors = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      }

      const response = await axios.get("http://localhost:3000/api/authors");
      const data = response.data.data || [];
      
      // Calculate stats
      const totalAuthors = data.length;
      const activeAuthors = data.filter(a => a.status === 'active').length;
      const verifiedAuthors = data.filter(a => a.verified === true).length;
      const now = new Date();
      const newThisMonth = data.filter(a => {
        if (!a.createdAt) return false;
        const created = new Date(a.createdAt);
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }).length;

      setStats({
        totalAuthors,
        activeAuthors,
        verifiedAuthors,
        newThisMonth
      });

      setAuthors(data);
      setLastUpdated(new Date().toLocaleString());

      if (showRefreshIndicator) {
        toast.success("Authors data refreshed!");
      }
    } catch (error) {
      console.error("❌ Error fetching authors:", error);
      toast.error("Failed to load authors");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      username: "",
      name: "",
      avatar: "",
      verified: false,
      bio: "",
      location: "",
      website: "",
      email: "",
      social: {
        github: "",
        linkedin: "",
        twitter: "",
        youtube: "",
        facebook: "",
        instagram: ""
      },
      status: "active"
    });
    setEditingAuthor(null);
    setAvatarChanged(false);
  };

  // Open modal for create
  const handleCreate = () => {
    resetForm();
    setShowModal(true);
  };

  // Open modal for edit
  const handleEdit = (author) => {
    setFormData({
      username: author.username || "",
      name: author.name || "",
      avatar: author.avatar || "",
      verified: author.verified || false,
      bio: author.bio || "",
      location: author.location || "",
      website: author.website || "",
      email: author.email || "",
      social: {
        github: author.social?.github || "",
        linkedin: author.social?.linkedin || "",
        twitter: author.social?.twitter || "",
        youtube: author.social?.youtube || "",
        facebook: author.social?.facebook || "",
        instagram: author.social?.instagram || ""
      },
      status: author.status || "active"
    });
    setEditingAuthor(author);
    setAvatarChanged(false);
    setShowModal(true);
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Compress image if it's too large
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize if too large (max 800px)
          if (width > 800) {
            height = (height * 800) / width;
            width = 800;
          }
          if (height > 800) {
            width = (width * 800) / height;
            height = 800;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressed = canvas.toDataURL('image/jpeg', 0.8);
          setFormData({ ...formData, avatar: compressed });
          setAvatarChanged(true);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const authorData = { ...formData };
      
      // If updating and avatar hasn't changed, don't send it
      if (editingAuthor && !avatarChanged) {
        delete authorData.avatar;
      }

      if (editingAuthor) {
        // Update existing author
        await axios.put(`http://localhost:3000/api/authors/${editingAuthor._id}`, authorData);
        toast.success("Author updated successfully!");
      } else {
        // Create new author
        await axios.post("http://localhost:3000/api/authors", authorData);
        toast.success("Author created successfully!");
      }

      setShowModal(false);
      resetForm();
      await fetchAuthors();
    } catch (error) {
      console.error("Error saving author:", error);
      if (error.response?.status === 413) {
        toast.error("Image is too large. Please use a smaller image.");
      } else {
        toast.error(editingAuthor ? "Failed to update author" : "Failed to create author");
      }
    }
  };

  // Open delete modal
  const openDeleteModal = (author) => {
    setAuthorToDelete(author);
    setShowDeleteModal(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!authorToDelete) return;

    try {
      await axios.delete(`http://localhost:3000/api/authors/${authorToDelete._id}`);
      toast.success("Author deleted successfully!");
      setShowDeleteModal(false);
      setAuthorToDelete(null);
      await fetchAuthors();
    } catch (error) {
      console.error("Error deleting author:", error);
      toast.error("Failed to delete author");
    }
  };

  // Toggle status
  const toggleStatus = async (author) => {
    try {
      const newStatus = author.status === 'active' ? 'inactive' : 'active';
      await axios.patch(`http://localhost:3000/api/authors/${author._id}/status`, {
        status: newStatus
      });
      toast.success(`Author ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
      await fetchAuthors();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update author status");
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchAuthors();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authors...</p>
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
            <UserPen className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Authors Management</h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {lastUpdated && (
              <span className="text-sm text-gray-500 text-center sm:text-left">
                Last updated: {lastUpdated}
              </span>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => fetchAuthors(true)}
                disabled={refreshing}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-200 disabled:cursor-not-allowed rounded-lg transition-colors"
                title="Refresh authors data"
              >
                <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Author</span>
              </button>
            </div>
          </div>
        </div>
        <p className="text-gray-600 text-sm sm:text-base">Manage author profiles, biographies, and their published works</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <UserPen className="w-8 h-8 opacity-80" />
            <FileText className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-indigo-100 text-sm font-medium">Total Authors</p>
            <p className="text-3xl font-bold">{stats.totalAuthors}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 opacity-80" />
            <UserPen className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-green-100 text-sm font-medium">Active Authors</p>
            <p className="text-3xl font-bold">{stats.activeAuthors}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 opacity-80" />
            <CheckCircle className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-purple-100 text-sm font-medium">Verified Authors</p>
            <p className="text-3xl font-bold">{stats.verifiedAuthors}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 opacity-80" />
            <Plus className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-teal-100 text-sm font-medium">New This Month</p>
            <p className="text-3xl font-bold">{stats.newThisMonth}</p>
          </div>
        </div>
      </div>

      {/* Authors Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
          <h2 className="text-xl font-semibold text-white">Author Profiles</h2>
        </div>

        <div className="p-6">
          {authors.length === 0 ? (
            <div className="text-center py-12">
              <UserPen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No authors found</h3>
              <p className="text-gray-600 mb-4">Author profiles will appear here when created.</p>
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add First Author
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Author</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Username</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Verified</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Location</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Created</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {authors.map((author) => (
                    <tr key={author._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=6366F1&color=fff&size=128`}
                            alt={author.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=6366F1&color=fff&size=128`;
                            }}
                          />
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{author.name}</p>
                            {author.email && (
                              <p className="text-gray-600 text-xs flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {author.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700 font-mono">@{author.username}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          author.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {author.status === 'active' ? (
                            <CheckCircle size={12} />
                          ) : (
                            <XCircle size={12} />
                          )}
                          {author.status?.charAt(0).toUpperCase() + author.status?.slice(1) || 'Active'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {author.verified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <CheckCircle size={12} />
                            Verified
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Not verified</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {author.location ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {author.location}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {author.createdAt ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(author.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(author)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit author"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleStatus(author)}
                            className={`p-1.5 rounded transition-colors ${
                              author.status === 'active'
                                ? 'text-orange-600 hover:bg-orange-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={author.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {author.status === 'active' ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => openDeleteModal(author)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete author"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl lg:ml-40 md:ml-40 ml-0  w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {editingAuthor ? 'Edit Author' : 'Create New Author'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="sharafdin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mr Sharafdin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="hello@dugsiiye.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Hargeisa, Somaliland"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://dugsiiye.com/u/sharafdin"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Full-Stack Developer & Educator..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avatar (Base64 or URL)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {formData.avatar && (
                    <div className="mt-2">
                      <img
                        src={formData.avatar}
                        alt="Preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      />
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="verified"
                    checked={formData.verified}
                    onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="verified" className="text-sm font-medium text-gray-700">
                    Verified Author
                  </label>
                </div>

                {/* Social Media */}
                <div className="md:col-span-2 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media Links</h3>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Github className="w-4 h-4" />
                    GitHub
                  </label>
                  <input
                    type="url"
                    value={formData.social.github}
                    onChange={(e) => setFormData({
                      ...formData,
                      social: { ...formData.social, github: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://github.com/sharafdin"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={formData.social.linkedin}
                    onChange={(e) => setFormData({
                      ...formData,
                      social: { ...formData.social, linkedin: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://linkedin.com/in/sharafdin"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </label>
                  <input
                    type="url"
                    value={formData.social.twitter}
                    onChange={(e) => setFormData({
                      ...formData,
                      social: { ...formData.social, twitter: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://twitter.com/sharafdin"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Youtube className="w-4 h-4" />
                    YouTube
                  </label>
                  <input
                    type="url"
                    value={formData.social.youtube}
                    onChange={(e) => setFormData({
                      ...formData,
                      social: { ...formData.social, youtube: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://youtube.com/@sharafdin"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={formData.social.facebook}
                    onChange={(e) => setFormData({
                      ...formData,
                      social: { ...formData.social, facebook: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://facebook.com/sharafdin"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Instagram className="w-4 h-4" />
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={formData.social.instagram}
                    onChange={(e) => setFormData({
                      ...formData,
                      social: { ...formData.social, instagram: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://instagram.com/sharafdin"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingAuthor ? 'Update Author' : 'Create Author'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && authorToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Delete Author</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to delete <span className="font-semibold">{authorToDelete.name}</span>?
                </p>
                <p className="text-sm text-gray-500">
                  All associated data will be permanently removed.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setAuthorToDelete(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Author
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
