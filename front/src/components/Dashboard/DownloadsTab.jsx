import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function DownloadsTab() {
  const [books, setBooks] = useState([]); // ALL: free downloads + active purchases
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    const fetchDownloads = async () => {
      try {
        const userId = user._id || user.id;
        const userEmail = user.email;

        // 1️⃣ FETCH free downloads from backend API
        const freeRes = await fetch("http://localhost:3000/api/downloads");
        const freeResponseData = await freeRes.json();
        const freeData = freeResponseData.data || [];

        // Filter user's downloads (show all, even if revoked)
        const userFreeBooks = freeData.filter(
          (item) => 
            item.userId === userId || item.userId === userId?.toString() || item.userId === user.id
        );

        // 2️⃣ FETCH purchased ACTIVE books from backend API
        const orderRes = await fetch("http://localhost:3000/api/purchased");
        const orderResponseData = await orderRes.json();
        const orderData = orderResponseData.data || [];

        const activeOrders = orderData.filter(
          (o) =>
            (o.email === userEmail || o.userId === userId || o.userId === userId?.toString()) &&
            (o.status === "active" || o.status === "processing")
        );

        // 2️⃣.5 Check which purchased books have revoked access
        // Get all download records for this user to check notDownloaded status
        const userDownloadRecords = freeData.filter(
          (item) => item.userId === userId || item.userId === userId?.toString() || item.userId === user.id
        );

        // Create a map of bookId/title to notDownloaded status
        const revokedBooksMap = {};
        userDownloadRecords.forEach(record => {
          const key = record.bookId || record.title;
          if (record.notDownloaded) {
            revokedBooksMap[key] = true;
          }
        });

        // 3️⃣ ISKU DAR (free + active) - Format PDF URLs properly
        const formatPdfUrl = (url) => {
          if (!url) return null;
          if (url.startsWith('http://') || url.startsWith('https://')) return url;
          if (url.startsWith('/')) return `http://localhost:3000${url}`;
          return `http://localhost:3000/${url}`;
        };

        let combined = [
          ...userFreeBooks.map((b) => ({
            ...b,
            source: "free",
            pdfUrl: formatPdfUrl(b.pdfUrl),
            bookId: b.bookId || b._id || b.id || "",
            notDownloaded: b.notDownloaded || false,
          })),
          ...activeOrders.map((o) => {
            const bookKey = o.bookId || o._id || o.id || o.title;
            const isRevoked = revokedBooksMap[bookKey] || false;
            return {
              ...o,
              source: "purchased",
              pdfUrl: formatPdfUrl(o.pdfUrl),
              bookId: o.bookId || o._id || o.id || "",
              notDownloaded: isRevoked,
            };
          }),
        ];

        // 4️⃣ REMOVE duplicates (same title) - keep all books, even if revoked
        const unique = combined.filter(
          (value, index, self) => {
            const firstIndex = self.findIndex((b) => b.title === value.title);
            // Keep first occurrence (show all books, even if revoked)
            return index === firstIndex;
          }
        );

        setBooks(unique);

        setTimeout(() => setLoading(false), 800); // smooth spinner
      } catch (err) {
        console.error("Error loading downloads:", err);
        setLoading(false);
      }
    };

    fetchDownloads();
  }, []);

  // 🔽 DOWNLOAD FILE
  const handleDownload = async (book) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return toast.error("Please log in first.");

    // Check if access is revoked
    if (book.notDownloaded) {
      return toast.error("Access to this book has been revoked. Please contact support.");
    }

    if (!book.pdfUrl) {
      return toast.error("PDF file not available.");
    }

    try {
      // Extract filename from PDF URL
      const filename = book.pdfUrl.split('/').pop();
      
      // Use protected PDF endpoint with user authentication
      const userId = user._id || user.id;
      const userEmail = user.email;
      const protectedUrl = `http://localhost:3000/api/pdf/${filename}?userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(userEmail)}`;

      // Fetch the PDF file from protected endpoint
      const response = await fetch(protectedUrl);
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied: You don't have permission to download this book");
        }
        throw new Error("Failed to download PDF");
      }

      // Get the blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${book.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Save download record to database
      try {
        const userId = user._id || user.id;
        const downloadData = {
          userId: userId?.toString(),
          userName: user.name || "Unknown User",
          email: user.email || "",
          bookId: book.bookId || book._id || book.id || "",
          title: book.title,
          author: book.author,
          cover: book.cover || "",
          price: book.price || 0,
          isFree: (book.price || 0) === 0,
          pdfUrl: book.pdfUrl,
          timestamp: new Date().toISOString(),
          notDownloaded: false
        };

        const saveResponse = await fetch("http://localhost:3000/api/downloads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(downloadData),
        });

        if (saveResponse.ok) {
          console.log("✅ Download record saved to database");
        } else {
          console.error("Failed to save download record");
        }
      } catch (saveError) {
        console.error("Error saving download record:", saveError);
        // Don't show error to user, download was successful
      }

      toast.success("Download started!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download PDF. Please try again.");
    }
  };

  // 🔽 READ ONLINE
  const handleReadNow = (book) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      return toast.error("Please log in first.");
    }

    if (book.notDownloaded) {
      return toast.error("Access to this book has been revoked.");
    }

    if (!book.pdfUrl) {
      return toast.error("PDF file not available.");
    }

    // Extract filename from PDF URL
    // PDF URL format: /uploads/pdfFile-1764951139524-912180075.pdf
    const filename = book.pdfUrl.split('/').pop();
    
    // Use protected PDF endpoint with user authentication
    const userId = user._id || user.id;
    const userEmail = user.email;
    const protectedUrl = `http://localhost:3000/api/pdf/${filename}?userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(userEmail)}`;

    // Open PDF in a new browser tab using protected endpoint
    window.open(protectedUrl, "_blank", "noopener,noreferrer");
  };

  // ⏳ Spinner
  if (loading) {
    return (
      <div className="flex justify-center border border-gray-300 dark:border-gray-700 rounded-lg shadow-md py-10 bg-white dark:bg-gray-800">
        <svg className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" viewBox="0 0 50 50">
          <circle className="opacity-25" cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="5" fill="none" />
          <circle className="opacity-75" cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="5" strokeDasharray="31.4 188.4" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Your Downloads</h2>

      {books.length === 0 ? (
        <div className="flex justify-center items-center py-10 border border-gray-300 dark:border-gray-700 rounded-lg shadow-md bg-white dark:bg-gray-800">
          <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold">No downloads available.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {books.map((book, i) => (
            <div key={i} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md gap-4 border border-gray-200 dark:border-gray-700">
              
              {/* LEFT SIDE */}
              <div className="flex lg:flex-row md:flex-row flex-col lg:items-center md:items-center gap-4 w-full sm:w-auto">
                <img
                  src={book.cover ? `http://localhost:3000${book.cover}` : 'https://via.placeholder.com/80x96?text=No+Image'}
                  className="lg:w-20 md:w-20 w-full lg:h-24 md:h-20 h-auto object-cover rounded-md shadow"
                  alt={book.title}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/80x96?text=No+Image';
                  }}
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{book.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">By {book.author}</p>
                  {book.source === "free" ? (
                    <p className="text-green-600 dark:text-green-400 text-sm font-medium">FREE DOWNLOAD</p>
                  ) : (
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">PURCHASED · ACTIVE</p>
                  )}
                </div>
              </div>

              {/* RIGHT BUTTONS */}
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative group">
                  <button
                    onClick={() => handleDownload(book)}
                    disabled={book.notDownloaded}
                    className={`px-4 py-2 rounded-md text-sm sm:text-base transition-all ${
                      book.notDownloaded
                        ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-60'
                        : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
                    }`}
                  >
                    Download
                  </button>
                  {book.notDownloaded && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                      Too many downloads
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800 dark:border-t-gray-700"></div>
                    </div>
                  )}
                </div>

                <div className="relative group">
                  <button
                    onClick={() => handleReadNow(book)}
                    disabled={book.notDownloaded}
                    className={`px-4 py-2 rounded-md text-sm sm:text-base transition-all ${
                      book.notDownloaded
                        ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed opacity-60'
                        : 'bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600'
                    }`}
                  >
                    Read Now
                  </button>
                  {book.notDownloaded && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                      Access revoked
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800 dark:border-t-gray-700"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
