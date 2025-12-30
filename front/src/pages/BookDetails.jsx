import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FiShoppingCart, FiDownload, FiArrowLeft, FiCalendar, FiUser, FiDollarSign, FiBookOpen } from "react-icons/fi";
import { BookOpen, Download, ShoppingCart, ArrowLeft, Calendar, User, DollarSign } from "lucide-react";
import toast from "react-hot-toast";
import { getTenantUrl, getTenantHeaders } from "../utils/tenantUtils";

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "");
}

export default function BookDetails() {
  const { title } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloads, setDownloads] = useState([]);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        const url = getTenantUrl("http://localhost:3000/api/books");
        const headers = getTenantHeaders();

        const response = await fetch(url, { headers });
        const responseData = await response.json();

        const data = responseData.data || [];
        const found = data.find((b) => slugify(b.title) === title);
        setBook(found);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching book:", error);
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [title]);

  const handleAddToCart = () => {
    const user = JSON.parse(localStorage.getItem("user"));

    // User not logged in
    if (!user) {
      toast.error("Please login first!"); // Use toast.error for error messages
      return;
    }

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Check if already in cart
    const exists = cart.find((item) => (item._id || item.id) === (book._id || book.id));
    if (exists) {
      toast.error("Already added to cart!"); // Show error if already in cart
      return;
    }

    // Add book to cart
    cart.push(book);
    localStorage.setItem("cart", JSON.stringify(cart));

    // Notify Navbar that cart changed
    window.dispatchEvent(new Event("cartUpdated"));

    toast.success("Added to cart!"); // Show success message
  };


  const handleDownload = (pdfUrl, title, cover, author, price, email) => {
  console.log("Book Title:", title); // Log to verify the title
  console.log("PDF URL:", pdfUrl); // Log to verify the PDF URL

  const user = JSON.parse(localStorage.getItem("user")); // Assuming the user is saved in localStorage

  if (!user) {
    toast.error("You need to log in first."); // Show error if user is not logged in
    return;
  }

  // Extract filename from PDF URL
  const filename = pdfUrl.split('/').pop();
  
  // Use protected PDF endpoint with user authentication
  const userId = user._id || user.id;
  const userEmail = user.email;
  const protectedUrl = `http://localhost:3000/api/pdf/${filename}?userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(userEmail)}`;

  // Fetch current downloads from backend API
  fetch("http://localhost:3000/api/downloads")
    .then((res) => {
      if (!res.ok) {
        throw new Error("Failed to fetch downloads data");
      }
      return res.json();
    })
    .then((responseData) => {
      const downloads = responseData.data || [];
      // Check if the user has already downloaded the book
      const alreadyDownloaded = downloads.some(
        (download) => (download.bookId === (book._id || book.id)) && (download.userId === user.id || download.userId === user._id)
      );

      if (alreadyDownloaded) {
        toast.error("To download, go to the downloads page."); // Show error if already downloaded
        return;
      }

      // If not already downloaded, allow the download
      const downloadData = {
        userId: user._id || user.id,
        userName: user.name,
        email: user.email,
        bookId: book._id || book.id, // Ensure we're using book's ID
        title,
        author,
        cover,
        price,
        isFree: price === 0,
        pdfUrl,
        timestamp: new Date().toISOString(),
      };

      // Fetch PDF from protected endpoint and trigger download
      fetch(protectedUrl)
        .then((res) => {
          if (!res.ok) {
            if (res.status === 403) {
              throw new Error("Access denied: You don't have permission to download this book");
            }
            throw new Error("Failed to download PDF");
          }
          return res.blob();
        })
        .then((blob) => {
          // Create a download link and trigger the download
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${title}.pdf`; // Ensure the correct title is used
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        })
        .catch((error) => {
          console.error("Download error:", error);
          toast.error(error.message || "Failed to download PDF. Please try again.");
        });

      // Add the downloaded book to backend API
      fetch("http://localhost:3000/api/downloads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(downloadData),
      })
        .then((res) => res.json())
        .then((data) => {
          toast.success("Download recorded successfully!"); // Show success message after download
        })
        .catch((err) => {
          toast.error("Error recording download."); // Show error if something goes wrong
        });

      // Add the downloaded book to localStorage for persistent state on client-side
      const existingDownloads = JSON.parse(localStorage.getItem("downloads")) || [];
      const updatedDownloads = [...existingDownloads, downloadData];
      localStorage.setItem("downloads", JSON.stringify(updatedDownloads));

      // Update the state to reflect the new list of downloaded books
      setDownloads(updatedDownloads);
    })
    .catch((error) => {
      toast.error("Error fetching downloads data: " + error.message); // Display more specific error message
    });
};



  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <BookOpen className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Book Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The book you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate("/books")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Books
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate("/books")}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Books</span>
        </button>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 sm:p-8 lg:p-12">
            {/* Book Cover Section */}
            <div className="lg:col-span-1">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl transform rotate-3 group-hover:rotate-6 transition-transform duration-300 opacity-20"></div>
                <div className="relative">
                  <img
                    src={book.cover ? `http://localhost:3000${book.cover}` : 'https://via.placeholder.com/400x600?text=No+Image'}
                    alt={book.title}
                    className="w-full h-auto rounded-2xl shadow-2xl transform group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x600?text=No+Image';
                    }}
                  />
                  {/* Price Badge */}
                  <div className="absolute top-4 right-4">
                    {book.price === 0 ? (
                      <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                        <span className="text-lg">FREE</span>
                      </span>
                    ) : (
                      <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg flex items-center gap-1">
                        <DollarSign className="w-5 h-5" />
                        {book.price}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Book Details Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title and Author */}
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                  {book.title}
                </h1>
                <div className="flex items-center gap-2 text-xl text-gray-600 dark:text-gray-300 mb-6">
                  <User className="w-5 h-5" />
                  <span className="font-medium">By {book.author}</span>
                </div>
              </div>

              {/* Book Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {book.publisher && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Publisher</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{book.publisher}</p>
                      </div>
                    </div>
                  </div>
                )}
                {book.publishedDate && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Published</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{formatDate(book.publishedDate)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  About This Book
                </h2>
                <div className="relative">
                  <div className={`text-gray-700 dark:text-gray-300 leading-relaxed text-base transition-all duration-300 ${!showFullDescription && book.description && book.description.length > 200 ? 'line-clamp-4' : showFullDescription ? 'max-h-96 overflow-y-auto' : ''}`}>
                    {book.description || "No description available for this book."}
                  </div>
                  {book.description && book.description.length > 200 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="mt-3 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-sm transition-colors inline-flex items-center gap-1"
                    >
                      {showFullDescription ? 'Show Less' : 'Read More'}
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4">
                {book.price === 0 ? (
                  <button
                    onClick={() =>
                      handleDownload(
                        book.pdfUrl,
                        book.title,
                        book.cover,
                        book.author,
                        book.price,
                        book.email
                      )
                    }
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <Download className="w-6 h-6" />
                    <span className="text-lg">Download PDF</span>
                  </button>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <ShoppingCart className="w-6 h-6" />
                    <span className="text-lg">Add to Cart</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
