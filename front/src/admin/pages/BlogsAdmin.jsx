import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import {
  FileText,
  RotateCcw,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  Image as ImageIcon,
  User,
  Tag,
  X,
  Eye,
  EyeOff,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

export default function BlogsAdmin() {
  const [blogs, setBlogs] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to strip HTML tags and get plain text
  const stripHtml = (html) => {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);
  const [blogForComments, setBlogForComments] = useState(null);
  const [commentToDelete, setCommentToDelete] = useState({ commentId: null, replyId: null });
  const [editingBlog, setEditingBlog] = useState(null);
  const [thumbnailChanged, setThumbnailChanged] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    authorId: "",
    publishedDate: "",
    thumbnail: "",
    content: "",
    status: "draft",
  });

  const [stats, setStats] = useState({
    totalBlogs: 0,
    publishedBlogs: 0,
    draftBlogs: 0,
    newThisMonth: 0,
  });

  // Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
    ],
    content: formData.content || "",
    onUpdate: ({ editor }) => {
      setFormData((prev) => ({ ...prev, content: editor.getHTML() }));
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none",
      },
    },
  });

  // Update editor content when formData.content changes (for editing)
  useEffect(() => {
    if (editor && showModal) {
      const currentContent = editor.getHTML();
      if (
        formData.content !== currentContent &&
        formData.content &&
        formData.content !== "<p></p>"
      ) {
        editor.commands.setContent(formData.content || "");
      }
    }
  }, [formData.content, editor, showModal]);

  // Fetch blogs data
  const fetchBlogs = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      }

      const response = await axios.get("http://localhost:3000/api/blogs");
      const data = response.data.data || [];

      // Calculate stats
      const totalBlogs = data.length;
      const publishedBlogs = data.filter(
        (b) => b.status === "published"
      ).length;
      const draftBlogs = data.filter((b) => b.status === "draft").length;
      const now = new Date();
      const newThisMonth = data.filter((b) => {
        if (!b.createdAt) return false;
        const created = new Date(b.createdAt);
        return (
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        );
      }).length;

      setStats({
        totalBlogs,
        publishedBlogs,
        draftBlogs,
        newThisMonth,
      });

      setBlogs(data);
      setLastUpdated(new Date().toLocaleString());

      if (showRefreshIndicator) {
        toast.success("Blogs data refreshed!");
      }
    } catch (error) {
      console.error("❌ Error fetching blogs:", error);
      toast.error("Failed to load blogs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch authors for dropdown
  const fetchAuthors = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/authors");
      const data = response.data.data || [];
      setAuthors(data);
    } catch (error) {
      console.error("Error fetching authors:", error);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      category: "",
      authorId: "",
      publishedDate: new Date().toISOString().split("T")[0],
      thumbnail: "",
      content: "",
      status: "draft",
    });
    if (editor) {
      editor.commands.setContent("");
    }
    setEditingBlog(null);
    setThumbnailChanged(false);
  };

  // Open modal for create
  const handleCreate = () => {
    resetForm();
    setShowModal(true);
  };

  // Open modal for edit
  const handleEdit = (blog) => {
    // Handle authorId - could be ObjectId, string, or nested object
    let authorIdValue = "";
    if (blog.authorId) {
      if (typeof blog.authorId === "string") {
        authorIdValue = blog.authorId;
      } else if (blog.authorId._id) {
        authorIdValue = blog.authorId._id;
      } else if (blog.authorId.toString) {
        authorIdValue = blog.authorId.toString();
      }
    }

    setFormData({
      title: blog.title || "",
      category: blog.category || "",
      authorId: authorIdValue,
      publishedDate:
        blog.publishedDate || new Date().toISOString().split("T")[0],
      thumbnail: blog.thumbnail || "",
      content: blog.content || "",
      status: blog.status || "draft",
    });
    setEditingBlog(blog);
    setThumbnailChanged(false);
    setShowModal(true);
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result;
        // Set thumbnail immediately for preview
        setFormData((prev) => ({ ...prev, thumbnail: base64 }));
        setThumbnailChanged(true);

        // Then compress if needed
        const img = new Image();
        img.src = base64;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Resize if too large (max 1200px for blog thumbnails)
          if (width > 1200) {
            height = (height * 1200) / width;
            width = 1200;
          }
          if (height > 1200) {
            width = (width * 1200) / height;
            height = 1200;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const compressed = canvas.toDataURL("image/jpeg", 0.8);
          setFormData((prev) => ({ ...prev, thumbnail: compressed }));
        };
        img.onerror = () => {
          // If image fails to load, use the base64 directly
          console.error("Image compression failed, using original");
        };
      };
      reader.onerror = () => {
        toast.error("Failed to read image file");
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get content from editor
    const content = editor ? editor.getHTML() : formData.content;

    // Validate content
    if (
      !content ||
      content === "<p></p>" ||
      content.trim() === "" ||
      content === "<p><br></p>"
    ) {
      toast.error("Please enter blog content");
      return;
    }

    // Update formData with editor content
    const blogData = { ...formData, content };

    try {
      // If updating and thumbnail hasn't changed, don't send it
      if (editingBlog && !thumbnailChanged) {
        delete blogData.thumbnail;
      }

      if (editingBlog) {
        await axios.put(
          `http://localhost:3000/api/blogs/${editingBlog._id}`,
          blogData
        );
        toast.success("Blog updated successfully!");
      } else {
        await axios.post("http://localhost:3000/api/blogs", blogData);
        toast.success("Blog created successfully!");
      }

      setShowModal(false);
      resetForm();
      await fetchBlogs();
    } catch (error) {
      console.error("Error saving blog:", error);
      if (error.response?.status === 413) {
        toast.error("Thumbnail is too large. Please use a smaller image.");
      } else {
        toast.error(
          editingBlog ? "Failed to update blog" : "Failed to create blog"
        );
      }
    }
  };

  // Open delete modal
  const openDeleteModal = (blog) => {
    setBlogToDelete(blog);
    setShowDeleteModal(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!blogToDelete) return;

    try {
      await axios.delete(`http://localhost:3000/api/blogs/${blogToDelete._id}`);
      toast.success("Blog deleted successfully!");
      setShowDeleteModal(false);
      setBlogToDelete(null);
      await fetchBlogs();
    } catch (error) {
      console.error("Error deleting blog:", error);
      toast.error("Failed to delete blog");
    }
  };

  // Toggle status
  const toggleStatus = async (blog) => {
    try {
      const newStatus = blog.status === "published" ? "draft" : "published";
      await axios.patch(`http://localhost:3000/api/blogs/${blog._id}/status`, {
        status: newStatus,
      });
      toast.success(
        `Blog ${
          newStatus === "published" ? "published" : "moved to draft"
        } successfully!`
      );
      await fetchBlogs();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update blog status");
    }
  };

  // Open delete comment modal
  const openDeleteCommentModal = (commentId, replyId = null) => {
    setCommentToDelete({ commentId, replyId });
    setShowDeleteCommentModal(true);
  };

  // Delete comment or reply
  const handleDeleteComment = async () => {
    if (!blogForComments || !commentToDelete.commentId) return;

    try {
      let url = `http://localhost:3000/api/blogs/${blogForComments._id}/comments/${commentToDelete.commentId}`;
      if (commentToDelete.replyId) {
        url += `/replies/${commentToDelete.replyId}`;
      }

      const response = await axios.delete(url);
      
      if (response.data.success) {
        toast.success(
          commentToDelete.replyId ? "Reply deleted successfully!" : "Comment deleted successfully!"
        );
        
        // Update the blog data in state
        const updatedBlog = response.data.data;
        setBlogForComments(updatedBlog);
        
        // Also update the blogs list
        await fetchBlogs();
        
        // Close modal
        setShowDeleteCommentModal(false);
        setCommentToDelete({ commentId: null, replyId: null });
      }
    } catch (error) {
      console.error("Error deleting comment/reply:", error);
      toast.error("Failed to delete comment/reply");
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchBlogs();
    fetchAuthors();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading blogs...</p>
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
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Blogs Management
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {lastUpdated && (
              <span className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
                Last updated: {lastUpdated}
              </span>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => fetchBlogs(true)}
                disabled={refreshing}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                title="Refresh blogs data"
              >
                <RotateCcw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                <span className="inline">
                  {refreshing ? "Refreshing..." : "Refresh"}
                </span>
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Blog</span>
              </button>
            </div>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Create, edit, and publish blog posts and articles
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 dark:from-sky-600 dark:to-sky-800 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 opacity-80" />
            <FileText className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-cyan-100 dark:text-sky-200 text-sm font-medium">Total Posts</p>
            <p className="text-3xl font-bold">{stats.totalBlogs}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-lime-500 to-lime-600 dark:from-emerald-600 dark:to-emerald-800 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Eye className="w-8 h-8 opacity-80" />
            <CheckCircle className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-lime-100 dark:text-emerald-200 text-sm font-medium">Published</p>
            <p className="text-3xl font-bold">{stats.publishedBlogs}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 dark:from-orange-600 dark:to-orange-800 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <EyeOff className="w-8 h-8 opacity-80" />
            <FileText className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-amber-100 dark:text-orange-200 text-sm font-medium">Drafts</p>
            <p className="text-3xl font-bold">{stats.draftBlogs}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-violet-600 dark:to-violet-800 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 opacity-80" />
            <Plus className="w-5 h-5 opacity-60" />
          </div>
          <div>
            <p className="text-purple-100 dark:text-violet-200 text-sm font-medium">
              New This Month
            </p>
            <p className="text-3xl font-bold">{stats.newThisMonth}</p>
          </div>
        </div>
      </div>

      {/* Blogs Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-700 dark:to-blue-700 p-6">
          <h2 className="text-xl font-semibold text-white">Blog Posts</h2>
        </div>

        <div className="p-6">
          {blogs.length === 0 ? (
        <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No blogs found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Blog posts will appear here when created.
              </p>
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add First Blog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => {
                const author = authors.find(
                  (a) => a._id === blog.authorId || a.id === blog.authorId
                );
                const commentsCount = blog.comments?.length || 0;

                return (
                  <div
                    key={blog._id}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Thumbnail */}
                    {blog.thumbnail && blog.thumbnail.trim() !== "" && (
                      <div className="w-full h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img
                          src={blog.thumbnail}
                          alt={blog.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.parentElement.style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-5">
                      {/* Category & Status */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                          <Tag className="w-3 h-3" />
                          {blog.category}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            blog.status === "published"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                              : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                          }`}
                        >
                          {blog.status === "published" ? (
                            <Eye size={12} />
                          ) : (
                            <EyeOff size={12} />
                          )}
                          {blog.status?.charAt(0).toUpperCase() +
                            blog.status?.slice(1) || "Draft"}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {blog.title}
                      </h3>

                      {/* Content Preview */}
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                        {blog.content
                          ? stripHtml(blog.content) || "No content available"
                          : "No content available"}
                      </p>

                      {/* Author & Date */}
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          {author &&
                          author.avatar &&
                          author.avatar.trim() !== "" ? (
                            <img
                              src={author.avatar}
                              alt={author.name}
                              className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            </div>
                          )}
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {author ? author.name.split(" ")[0] : "Unknown"}
                          </span>
                        </div>
                        {blog.publishedDate && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {blog.publishedDate}
                          </div>
                        )}
                      </div>

                      {/* Comments & Actions */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => {
                            setBlogForComments(blog);
                            setShowCommentsModal(true);
                          }}
                          className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors cursor-pointer"
                          title="View comments"
                        >
                          {commentsCount}{" "}
                          {commentsCount === 1 ? "comment" : "comments"}
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(blog)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Edit blog"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleStatus(blog)}
                            className={`p-2 rounded-lg transition-colors ${
                              blog.status === "published"
                                ? "text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                : "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                            }`}
                            title={
                              blog.status === "published"
                                ? "Move to draft"
                                : "Publish"
                            }
                          >
                            {blog.status === "published" ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => openDeleteModal(blog)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete blog"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl lg:ml-40 md:ml-40 ml-0 w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky z-[10000] top-0 bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-700 dark:to-blue-700 p-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {editingBlog ? "Edit Blog" : "Create New Blog"}
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="How Online Learning is Transforming Education"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Education"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Author *
                  </label>
                  <select
                    required
                    value={formData.authorId}
                    onChange={(e) =>
                      setFormData({ ...formData, authorId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Author</option>
                    {authors.map((author) => (
                      <option key={author._id} value={author._id}>
                        {author.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Published Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.publishedDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        publishedDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Thumbnail
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
                  />
                  {formData.thumbnail && formData.thumbnail.trim() !== "" && (
                    <div className="mt-4 w-fit">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview:</p>

                      {/* Wrapper that DOES NOT affect scroll layout */}
                      <div className="relative w-48 h-48">
                        <img
                          src={formData.thumbnail}
                          alt="Thumbnail Preview"
                          className="w-48 h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shadow-md"
                          onError={(e) => (e.target.style.display = "none")}
                        />

                        {/* Absolute delete - outside layout flow */}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, thumbnail: "" }));
                            setThumbnailChanged(true);
                          }}
                          className="absolute -top-2 -right-2 z-20 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg"
                          title="Remove thumbnail"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content *
                  </label>

                  {/* Toolbar */}
                  {editor && (
                    <div className="border border-gray-300 dark:border-gray-600 border-b-0 rounded-t-lg bg-gray-50 dark:bg-gray-700 p-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          editor.chain().focus().toggleBold().run()
                        }
                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                          editor.isActive("bold") ? "bg-gray-300 dark:bg-gray-600" : ""
                        }`}
                        title="Bold"
                      >
                        <Bold className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          editor.chain().focus().toggleItalic().run()
                        }
                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                          editor.isActive("italic") ? "bg-gray-300 dark:bg-gray-600" : ""
                        }`}
                        title="Italic"
                      >
                        <Italic className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          editor.chain().focus().toggleUnderline().run()
                        }
                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                          editor.isActive("underline") ? "bg-gray-300 dark:bg-gray-600" : ""
                        }`}
                        title="Underline"
                      >
                        <UnderlineIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      </button>
                      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
                      <button
                        type="button"
                        onClick={() =>
                          editor
                            .chain()
                            .focus()
                            .toggleHeading({ level: 1 })
                            .run()
                        }
                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                          editor.isActive("heading", { level: 1 })
                            ? "bg-gray-300 dark:bg-gray-600"
                            : ""
                        } text-gray-700 dark:text-gray-300`}
                        title="Heading 1"
                      >
                        H1
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          editor
                            .chain()
                            .focus()
                            .toggleHeading({ level: 2 })
                            .run()
                        }
                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                          editor.isActive("heading", { level: 2 })
                            ? "bg-gray-300 dark:bg-gray-600"
                            : ""
                        } text-gray-700 dark:text-gray-300`}
                        title="Heading 2"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          editor
                            .chain()
                            .focus()
                            .toggleHeading({ level: 3 })
                            .run()
                        }
                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                          editor.isActive("heading", { level: 3 })
                            ? "bg-gray-300 dark:bg-gray-600"
                            : ""
                        } text-gray-700 dark:text-gray-300`}
                        title="Heading 3"
                      >
                        H3
                      </button>
                      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
                      <button
                        type="button"
                        onClick={() =>
                          editor.chain().focus().toggleBulletList().run()
                        }
                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                          editor.isActive("bulletList") ? "bg-gray-300 dark:bg-gray-600" : ""
                        }`}
                        title="Bullet List"
                      >
                        <List className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          editor.chain().focus().toggleOrderedList().run()
                        }
                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                          editor.isActive("orderedList") ? "bg-gray-300 dark:bg-gray-600" : ""
                        }`}
                        title="Numbered List"
                      >
                        <List className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      </button>
                      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
                      <button
                        type="button"
                        onClick={() =>
                          editor.chain().focus().setTextAlign("left").run()
                        }
                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                          editor.isActive({ textAlign: "left" })
                            ? "bg-gray-300 dark:bg-gray-600"
                            : ""
                        }`}
                        title="Align Left"
                      >
                        <AlignLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          editor.chain().focus().setTextAlign("center").run()
                        }
                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                          editor.isActive({ textAlign: "center" })
                            ? "bg-gray-300 dark:bg-gray-600"
                            : ""
                        }`}
                        title="Align Center"
                      >
                        <AlignCenter className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          editor.chain().focus().setTextAlign("right").run()
                        }
                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                          editor.isActive({ textAlign: "right" })
                            ? "bg-gray-300 dark:bg-gray-600"
                            : ""
                        }`}
                        title="Align Right"
                      >
                        <AlignRight className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      </button>
                      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
                      <label
                        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer inline-flex items-center"
                        title="Insert Image"
                      >
                        <ImageIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const base64 = reader.result;
                                editor
                                  .chain()
                                  .focus()
                                  .setImage({ src: base64 })
                                  .run();
                              };
                              reader.readAsDataURL(file);
                            }
                            e.target.value = ""; // Reset input
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const url = window.prompt("Enter URL:");
                          if (url) {
                            editor.chain().focus().setLink({ href: url }).run();
                          }
                        }}
                        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                        title="Insert Link"
                      >
                        Link
                      </button>
                      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
                      <div className="flex items-center gap-1">
                        <label
                          className="flex items-center gap-1 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer"
                          title="Text Color"
                        >
                          <span className="text-xs text-gray-700 dark:text-gray-300">T</span>
                          <input
                            type="color"
                            className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                            onChange={(e) => {
                              editor
                                .chain()
                                .focus()
                                .setColor(e.target.value)
                                .run();
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </label>
                        <label
                          className="flex items-center gap-1 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer"
                          title="Background Color"
                        >
                          <span className="text-xs text-gray-700 dark:text-gray-300">BG</span>
                          <input
                            type="color"
                            className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                            onChange={(e) => {
                              editor
                                .chain()
                                .focus()
                                .setHighlight({ color: e.target.value })
                                .run();
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          editor.chain().focus().toggleBlockquote().run()
                        }
                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                          editor.isActive("blockquote") ? "bg-gray-300 dark:bg-gray-600" : ""
                        } text-gray-700 dark:text-gray-300`}
                        title="Blockquote"
                      >
                        "
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          editor.chain().focus().toggleCodeBlock().run()
                        }
                        className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                          editor.isActive("codeBlock") ? "bg-gray-300 dark:bg-gray-600" : ""
                        } text-gray-700 dark:text-gray-300`}
                        title="Code Block"
                      >
                        {"</>"}
                      </button>
                    </div>
                  )}

                  {/* Editor Content */}
                  <div className="border border-gray-300 dark:border-gray-600 rounded-b-lg h-[450px] overflow-y-auto p-4 prose prose-sm dark:prose-invert max-w-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <EditorContent editor={editor} />
                  </div>

                  {!formData.content ||
                  formData.content === "<p></p>" ||
                  formData.content.trim() === "" ? (
                    <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                      Content is required
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  {editingBlog ? "Update Blog" : "Create Blog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {showCommentsModal && blogForComments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full h-[90vh] sm:h-[85vh] flex flex-col overflow-hidden">
            <div className="sticky z-[10000] top-0 bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-700 dark:to-blue-700 p-4 sm:p-6 flex items-center justify-between flex-shrink-0">
              <div className="flex-1 min-w-0 pr-2">
                <h2 className="text-lg sm:text-xl font-semibold text-white truncate">
                  Comments on "{blogForComments.title}"
                </h2>
                <p className="text-xs sm:text-sm text-cyan-100 dark:text-cyan-200 mt-1">
                  {blogForComments.comments?.length || 0} total comments
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCommentsModal(false);
                  setBlogForComments(null);
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {!blogForComments.comments ||
              blogForComments.comments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No comments yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    This blog post doesn't have any comments.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {blogForComments.comments.map((comment, index) => {
                    // Recursive function to render nested replies
                    const renderReplies = (replies, depth = 0, parentCommentId = null) => {
                      if (!replies || replies.length === 0) return null;
                      const marginLeft = Math.min(depth * 4, 16);
                      // Use parentCommentId if provided, otherwise use the main comment ID
                      const currentParentId = parentCommentId || (comment.id || comment._id);
                      
                      return (
                        <div
                          className="mt-3 space-y-3 border-l-2 border-gray-200 dark:border-gray-700 pl-2 sm:pl-4"
                          style={{ marginLeft: `${Math.min(marginLeft * 0.25, 2)}rem` }}
                        >
                          {replies.map((reply) => (
                            <div key={reply.id || reply._id} className="space-y-2">
                              <div className="flex items-start gap-1.5 sm:gap-3">
                                {reply.avatar && reply.avatar.trim() !== "" ? (
                                  <img
                                    src={reply.avatar}
                                    alt={reply.username || "User"}
                                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                    }}
                                  />
                                ) : null}
                                {(!reply.avatar || reply.avatar.trim() === "") && (
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-500" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0 pr-1 sm:pr-2">
                                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                                    <span className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm">
                                      {reply.username || "Unknown"}
                                    </span>
                                    {reply.edited && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        (edited)
                                      </span>
                                    )}
                                    {reply.date && (
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        • {new Date(reply.date).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm whitespace-pre-wrap break-words">
                                    {reply.reply || reply.comment || "No content"}
                                  </p>
                                </div>
                                <button
                                  onClick={() => openDeleteCommentModal(currentParentId, reply.id || reply._id)}
                                  className="p-1.5 sm:p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0 mt-0.5"
                                  title="Delete reply"
                                >
                                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                              </div>
                              {/* Render nested replies recursively */}
                              {reply.replies &&
                                reply.replies.length > 0 &&
                                renderReplies(reply.replies, depth + 1, currentParentId)}
                            </div>
                          ))}
                        </div>
                      );
                    };

                      return (
                        <div
                          key={comment.id || comment._id || index}
                          className="border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4 last:border-b-0"
                        >
                          <div className="flex items-start gap-1.5 sm:gap-3">
                            {comment.avatar && comment.avatar.trim() !== "" ? (
                              <img
                                src={comment.avatar}
                                alt={comment.username || "User"}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  const fallback = e.target.parentElement.querySelector('.avatar-fallback');
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div 
                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 avatar-fallback ${comment.avatar && comment.avatar.trim() !== "" ? "hidden" : ""}`}
                            >
                              <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
                            </div>
                            <div className="flex-1 min-w-0 pr-1 sm:pr-2">
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                                <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                                  {comment.username || "Unknown"}
                                </span>
                                {comment.edited && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    (edited)
                                  </span>
                                )}
                                {comment.date && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    • {new Date(comment.date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base whitespace-pre-wrap break-words mb-2">
                                {comment.comment || "No content"}
                              </p>
                              {/* Render replies */}
                              {comment.replies &&
                                comment.replies.length > 0 &&
                                renderReplies(comment.replies)}
                            </div>
                            <button
                              onClick={() => openDeleteCommentModal(comment.id || comment._id)}
                              className="p-1.5 sm:p-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0 mt-0.5"
                              title="Delete comment"
                            >
                              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          </div>
                        </div>
                      );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Blog Confirmation Modal */}
      {showDeleteModal && blogToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Delete Blog
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold">"{blogToDelete.title}"</span>?
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  All associated comments and data will be permanently removed.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setBlogToDelete(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Blog
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Comment/Reply Confirmation Modal */}
      {showDeleteCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full">
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    {commentToDelete.replyId ? "Delete Reply" : "Delete Comment"}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="mb-5 sm:mb-6">
                <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-2">
                  {commentToDelete.replyId
                    ? "Are you sure you want to delete this reply?"
                    : "Are you sure you want to delete this comment and all its replies?"}
                </p>
                {!commentToDelete.replyId && (
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    All nested replies will also be permanently removed.
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowDeleteCommentModal(false);
                    setCommentToDelete({ commentId: null, replyId: null });
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteComment}
                  className="px-4 py-2 bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Trash2 className="w-4 h-4" />
                  {commentToDelete.replyId ? "Delete Reply" : "Delete Comment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
