import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { BookOpen, Upload, Save, Plus, Edit, Trash2, Eye, RotateCcw } from "lucide-react";
import { getCurrentAdminUser, canAdd, canEdit, canDelete } from "../utils/permissions";
import DataTable from "../components/DataTable";

export default function BooksAdmin() {
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    price: "",
    pdfFile: null,
    coverFile: null,
    description: "",
    publisher: "",
    publishedDate: ""
  });

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [books, setBooks] = useState([]);
  const [editingBook, setEditingBook] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ show: false, book: null });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());


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

  // Fetch all books
  const fetchBooks = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
        console.log("🔄 Manual refresh: Fetching books from database...");
      } else {
        console.log("🔄 Fetching books from database...");
      }

      const response = await axios.get("http://localhost:3000/api/books");
      const data = response.data.data || [];
      console.log(`✅ Fetched ${data.length} books from database`);

      setBooks(data);
      setLastUpdated(new Date().toLocaleString());

      if (showRefreshIndicator) {
        toast.success("Data refreshed from database!");
      }
    } catch (error) {
      console.error("❌ Error fetching books:", error);
      toast.error("Failed to load books");
    } finally {
      setRefreshing(false);
    }
  };

  // Handle form submission (Add/Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Add text fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('author', formData.author);
      formDataToSend.append('price', parseFloat(formData.price));
      formDataToSend.append('description', formData.description);
      formDataToSend.append('publisher', formData.publisher);
      formDataToSend.append('publishedDate', formData.publishedDate);

      // Add files
      if (formData.coverFile) {
        formDataToSend.append('cover', formData.coverFile);
      }
      if (formData.pdfFile) {
        formDataToSend.append('pdfFile', formData.pdfFile);
      }

      if (editingBook) {
        // Update existing book
        await axios.put(`http://localhost:3000/api/books/${editingBook._id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success("Book updated successfully! 📚");
      } else {
        // Add new book
        await axios.post("http://localhost:3000/api/books", formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success("Book added successfully! 📚");
      }

      // Reset form and fetch updated books
      resetForm();
      await fetchBooks();
      setShowForm(false);
      setEditingBook(null);
    } catch (error) {
      console.error("Error saving book:", error);
      toast.error("Failed to save book. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    const publisherName = currentUser?.name || currentUser?.email || "";
    setFormData({
      title: "",
      author: "",
      price: "",
      pdfFile: null,
      coverFile: null,
      description: "",
      publisher: publisherName,
      publishedDate: ""
    });
  };

  // Edit book
  const handleEdit = (book) => {
    setEditingBook(book);
    const publisherName = currentUser?.name || currentUser?.email || book.publisher || "";
    setFormData({
      title: book.title,
      author: book.author,
      price: book.price.toString(),
      pdfFile: null,
      coverFile: null,
      description: book.description,
      publisher: publisherName,
      publishedDate: book.publishedDate ? new Date(book.publishedDate).toISOString().split('T')[0] : ""
    });
    setShowForm(true);
  };

  // Show delete modal
  const showDeleteModal = (book) => {
    setDeleteModal({ show: true, book });
  };

  // Hide delete modal
  const hideDeleteModal = () => {
    setDeleteModal({ show: false, book: null });
  };

  // Confirm delete
  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:3000/api/books/${deleteModal.book._id}`);
      toast.success("Book deleted successfully!");
      await fetchBooks();
      hideDeleteModal();
    } catch (error) {
      console.error("Error deleting book:", error);
      toast.error("Failed to delete book");
    }
  };

  // Load current user and books on component mount
  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentAdminUser();
      setCurrentUser(user);
      // Set publisher when user is loaded and form is visible
      if (user && showForm) {
        const publisherName = user.name || user.email || "";
        setFormData(prev => ({
          ...prev,
          publisher: publisherName
        }));
      }
    };
    loadUser();
    fetchBooks();
  }, []);
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Update publisher when currentUser changes and form is shown
  useEffect(() => {
    if (currentUser && showForm) {
      const publisherName = currentUser.name || currentUser.email || "";
      setFormData(prev => ({
        ...prev,
        publisher: publisherName
      }));
    }
  }, [currentUser, showForm]);

  return (
    <div className="p-4 sm:p-6 w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-0">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Books Management</h1>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {lastUpdated && (
              <span className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
                Last updated: {currentTime}
              </span>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => fetchBooks(true)}
                disabled={refreshing}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                title="Refresh data from database"
              >
                <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <button
                onClick={() => {
                  setShowForm(!showForm);
                  if (showForm) {
                    setEditingBook(null);
                    resetForm();
                  } else {
                    // Set publisher when opening form
                    const publisherName = currentUser?.name || currentUser?.email || "";
                    setFormData(prev => ({
                      ...prev,
                      publisher: publisherName
                    }));
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors w-full sm:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 dark:disabled:hover:bg-blue-700"
                disabled={!canAdd(currentUser, 'books')}
                title={!canAdd(currentUser, 'books') ? "You don't have permission to add books" : showForm ? 'Cancel' : 'Add Book'}
              >
                <Plus className="w-4 h-4" />
                {showForm ? 'Cancel' : 'Add Book'}
              </button>
            </div>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          {showForm
            ? (editingBook ? 'Edit book details' : 'Add new books to your bookstore collection')
            : `Manage your book collection (${books.length} books)`
          }
        </p>
      </div>

      {/* Show Form or Books List */}
      {showForm ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 p-6">
            <div className="flex items-center gap-3">
              {editingBook ? <Edit className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
              <h2 className="text-xl font-semibold text-white">
                {editingBook ? 'Edit Book' : 'Add New Book'}
              </h2>
            </div>
          </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* Title and Author Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Book Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-colors"
                placeholder="Enter book title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Author *
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                required
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-colors"
                placeholder="Enter author name"
              />
            </div>
          </div>

          {/* Price and Publisher Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price ($) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-colors"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Publisher
              </label>
              <input
                type="text"
                name="publisher"
                value={formData.publisher}
                onChange={handleChange}
                disabled
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed opacity-75"
                placeholder="Auto-filled from your account"
                title="Publisher is automatically set from your account information"
              />
            </div>
          </div>

          {/* Cover Image and PDF File Upload Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cover Image {editingBook ? '(Upload new to replace)' : '*'}
              </label>
              <div className="relative">
                <input
                  type="file"
                  name="coverFile"
                  onChange={handleChange}
                  accept="image/*"
                  required={!editingBook}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 pl-10 sm:pl-12 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-colors file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
                />
                <Upload className="absolute left-3 top-3 sm:top-5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
              </div>
              {editingBook && !formData.coverFile && (
                <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                  Current file: {editingBook.cover?.split('/').pop() || 'No file'}
                </p>
              )}
              {formData.coverFile && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                  New file selected: {formData.coverFile.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                PDF File {editingBook ? '(Upload new to replace)' : '*'}
              </label>
              <div className="relative">
                <input
                  type="file"
                  name="pdfFile"
                  onChange={handleChange}
                  accept=".pdf"
                  required={!editingBook}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 pl-10 sm:pl-12 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-colors file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-red-50 dark:file:bg-red-900/30 file:text-red-700 dark:file:text-red-300 hover:file:bg-red-100 dark:hover:file:bg-red-900/50"
                />
                <Upload className="absolute left-3 top-3 sm:top-5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
              </div>
              {editingBook && !formData.pdfFile && (
                <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                  Current file: {editingBook.pdfUrl?.split('/').pop() || 'No file'}
                </p>
              )}
              {formData.pdfFile && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                  New file selected: {formData.pdfFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Published Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
              Published Date *
            </label>
            <input
              type="date"
              name="publishedDate"
              value={formData.publishedDate}
              onChange={handleChange}
              required
              className="w-full sm:w-1/2 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-colors resize-vertical"
              placeholder="Enter book description..."
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:to-purple-600 focus:ring-4 focus:ring-blue-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {editingBook ? 'Updating Book...' : 'Adding Book...'}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {editingBook ? 'Update Book' : 'Add Book'}
                </>
              )}
            </button>
          </div>
          </form>
        </div>
      ) : (
        /* Books List */
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 p-6">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-white" />
              <h2 className="text-xl font-semibold text-white">Books Collection</h2>
            </div>
          </div>

          <div className="p-6">
            <DataTable
              columns={[
                {
                  header: "Cover",
                  accessor: "cover",
                  cell: (book) => (
                    <img
                      src={`http://localhost:3000${book.cover}`}
                      alt={book.title}
                      className="w-10 h-14 sm:w-12 sm:h-16 object-cover rounded border border-gray-200 dark:border-gray-700"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/48x64?text=No+Image';
                      }}
                    />
                  ),
                },
                {
                  header: "Title",
                  accessor: "title",
                  cellClassName: "font-medium text-gray-900 dark:text-white",
                },
                {
                  header: "Author",
                  accessor: "author",
                  cellClassName: "text-gray-600 dark:text-gray-400",
                },
                {
                  header: "Price",
                  accessor: "price",
                  cell: (book) => (
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      ${book.price}
                    </span>
                  ),
                },
                {
                  header: "Actions",
                  accessor: "actions",
                  cell: (book) => (
                    <div className="flex gap-1 sm:gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(book);
                        }}
                        className="p-1.5 sm:p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        title={!canEdit(currentUser, 'books') ? "You don't have permission to edit" : "Edit"}
                        disabled={!canEdit(currentUser, 'books')}
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          showDeleteModal(book);
                        }}
                        className="p-1.5 sm:p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        title={!canDelete(currentUser, 'books') ? "You don't have permission to delete" : "Delete"}
                        disabled={!canDelete(currentUser, 'books')}
                      >
                        <Trash2 className="w-3 h-3 sm:w-3 sm:h-3" />
                      </button>
                    </div>
                  ),
                },
              ]}
              data={books}
              itemsPerPage={10}
              emptyMessage="No books yet"
              emptyIcon={BookOpen}
            />
            {books.length === 0 && canAdd(currentUser, 'books') && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  Add First Book
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Card - Show when form is visible */}
      {showForm && (
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">💡 Tips:</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>• All fields marked with * are required</li>
          <li>• When editing, only upload new files if you want to replace current ones</li>
          <li>• Upload cover images in JPG, PNG format (recommended: 300x450px)</li>
          <li>• Upload PDF files only - they will be stored securely</li>
          <li>• Price should be in USD format (e.g., 14.99)</li>
          <li>• File size limit: 10MB per file</li>
        </ul>
        </div>
      )}

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
                <h3 className="text-lg sm:text-xl font-semibold text-white">Delete Book</h3>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <img
                  src={`http://localhost:3000${deleteModal.book?.cover}`}
                  alt={deleteModal.book?.title}
                  className="w-16 h-20 object-cover rounded border border-gray-200 dark:border-gray-700 flex-shrink-0 mx-auto sm:mx-0"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/64x80?text=No+Image';
                  }}
                />
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm sm:text-base">{deleteModal.book?.title}</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">by {deleteModal.book?.author}</p>
                  <p className="text-red-600 dark:text-red-400 font-medium text-sm sm:text-base">
                    Are you sure you want to delete this book? This action cannot be undone.
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
                disabled={!canDelete(currentUser, 'books')}
              >
                Delete Book
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  }
  