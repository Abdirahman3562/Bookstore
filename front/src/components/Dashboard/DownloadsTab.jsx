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

        // Get authentication token (admin_token takes priority, then user token)
        const adminToken = localStorage.getItem("admin_token");
        const userToken = localStorage.getItem("token");
        const token = adminToken || userToken;

        if (!token) {
          toast.error("Authentication required. Please log in again.");
          setLoading(false);
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`
        };

        // 1️⃣ FETCH free downloads from backend API
        const freeRes = await fetch("http://localhost:3000/api/downloads", { headers });
        const freeResponseData = await freeRes.json();
        const freeData = freeResponseData.data || [];

        // Filter user's downloads (show all, even if revoked)
        const userFreeBooks = freeData.filter(
          (item) =>
            item.userId === userId || item.userId === userId?.toString() || item.userId === user.id
        );

        // 2️⃣ FETCH purchased ACTIVE books from backend API
        const orderRes = await fetch("http://localhost:3000/api/purchased", { headers });
        const orderResponseData = await orderRes.json();
        const orderData = orderResponseData.data || [];

        // Only show APPROVED or ACTIVE orders with download permission
        const approvedOrders = orderData.filter(
          (o) =>
            (o.email === userEmail || o.userId === userId || o.userId === userId?.toString()) &&
            (o.status === "approved" || o.status === "active") &&
            o.isDownloadAllowed === true
        );

        console.log("📚 Approved orders for user:", approvedOrders.length);
        approvedOrders.forEach(order => {
          console.log(`  - ${order.title} (ID: ${order._id}, Status: ${order.status}, DownloadAllowed: ${order.isDownloadAllowed})`);
        });

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
          ...approvedOrders.map((o) => {
            const bookKey = o.bookId || o._id || o.id || o.title;
            const isRevoked = revokedBooksMap[bookKey] || false;
            return {
              ...o,
              source: "purchased",
              pdfUrl: formatPdfUrl(o.pdfUrl),
              bookId: o.bookId || o._id || o.id || "",
              purchaseId: o._id || o.id, // Add purchaseId for secure download
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

        console.log("📚 Final books list:", unique.length);
        unique.forEach(book => {
          console.log(`  - ${book.title} (${book.source}) - PurchaseID: ${book.purchaseId || 'N/A'}`);
        });

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

    // Double-check: Ensure this is a purchased book with approved status
    if (!book.purchaseId) {
      return toast.error("This book is not available for download.");
    }

    // Check if the order is approved/active
    if (!book.status || (book.status !== "approved" && book.status !== "active")) {
      return toast.error("Your order is not approved yet. Please wait for approval or contact support.");
    }

    // Check if download is allowed
    if (book.isDownloadAllowed !== true) {
      return toast.error("Download access is not enabled for this order. Please contact support.");
    }

    // Check if access is revoked
    if (book.notDownloaded) {
      return toast.error("Access to this book has been revoked. Please contact support.");
    }

    if (!book.pdfUrl) {
      return toast.error("PDF file not available.");
    }

    try {
      const userId = user._id || user.id;

      // Get authentication token (admin_token takes priority, then user token)
      const adminToken = localStorage.getItem("admin_token");
      const userToken = localStorage.getItem("token");
      const token = adminToken || userToken;

      if (!token) {
        toast.error("Authentication required. Please log in again.");
        return;
      }

      console.log("📥 Starting download for:", book.title);
      console.log("🔑 Using token type:", adminToken ? "admin_token" : "user_token");
      console.log("👤 User ID:", userId);
      console.log("📋 Book details:", {
        purchaseId: book.purchaseId,
        source: book.source,
        pdfUrl: book.pdfUrl,
        bookId: book.bookId,
        title: book.title
      });

      // For purchased books (have purchaseId), use secure purchase download endpoint
      if (book.purchaseId) {
        console.log("📥 Downloading purchased book via secure endpoint");
        console.log("🔗 Download URL:", `http://localhost:3000/api/purchased/${book.purchaseId}/download`);

        const downloadResponse = await fetch(`http://localhost:3000/api/purchased/${book.purchaseId}/download`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("📡 Secure download response:", downloadResponse.status, downloadResponse.ok);

        if (!downloadResponse.ok) {
          let errorData;
          try {
            errorData = await downloadResponse.json();
          } catch (jsonError) {
            console.error("❌ Could not parse error response as JSON:", jsonError);
            errorData = { message: `HTTP ${downloadResponse.status}: ${downloadResponse.statusText}` };
          }
          console.error("❌ Secure download failed:", errorData);
          throw new Error(errorData.message || `Access denied: Order not approved (HTTP ${downloadResponse.status})`);
        }

        // Backend now serves the file directly, so get the blob from the response
        console.log("📄 Creating blob and download link...");
        let blob;
        try {
          blob = await downloadResponse.blob();
          console.log("📄 Blob size:", blob.size, "bytes");
        } catch (blobError) {
          console.error("❌ Failed to create blob:", blobError);
          throw new Error("Failed to process downloaded file");
        }

        if (blob.size === 0) {
          throw new Error("Downloaded file is empty");
        }

        // Create download link
        try {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          const filename = `${book.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
          a.download = filename;
          document.body.appendChild(a);
          a.click();

          // Cleanup
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          console.log("✅ Download completed for:", filename);
        } catch (downloadError) {
          console.error("❌ Failed to create download link:", downloadError);
          throw new Error("Failed to initiate download");
        }
        toast.success("Download started!");
        return;
      }

      // For free books, use the existing protected PDF endpoint
      console.log("📥 Downloading free book via PDF endpoint");

      // Extract filename from PDF URL
      const filename = book.pdfUrl.split('/').pop();
      const userEmail = user.email;
      const protectedUrl = `http://localhost:3000/api/pdf/${filename}?userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(userEmail)}`;

      console.log("🔗 Protected PDF URL:", protectedUrl);

      // Fetch the PDF file from protected endpoint
      const response = await fetch(protectedUrl);
      console.log("📡 PDF endpoint response:", response.status, response.ok);

      if (!response.ok) {
        if (response.status === 403) {
          console.error("❌ Access denied for free book download");
          throw new Error("Access denied: You don't have permission to download this book");
        } else if (response.status === 404) {
          console.error("❌ PDF file not found for free book download");
          throw new Error("PDF file not found on server");
        } else if (response.status === 401) {
          console.error("❌ Authentication failed for free book download");
          throw new Error("Authentication required. Please log in again.");
        }
        console.error("❌ PDF endpoint failed:", response.status, response.statusText);
        throw new Error(`Server error: ${response.status} - ${response.statusText}`);
      }

      // Get the blob
      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("Downloaded file is empty");
      }

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
            Authorization: `Bearer ${token}`
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
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);

      // More specific error messages
      if (error.message.includes("Access denied")) {
        toast.error("Access denied: Your order may not be approved yet.");
      } else if (error.message.includes("not approved")) {
        toast.error("Download not allowed: Order not approved.");
      } else if (error.message.includes("not found")) {
        toast.error("PDF file not found. Please contact support.");
      } else if (error.message.includes("empty")) {
        toast.error("Download failed: File appears to be empty.");
      } else if (error.message.includes("Authentication required")) {
        toast.error("Authentication required. Please log in again.");
      } else if (error.message.includes("Network") || error.message.includes("fetch") || error.message.includes("Failed to fetch")) {
        toast.error("Network error. Please check your connection and try again.");
      } else if (error.message.includes("Server error") || error.message.includes("HTTP")) {
        toast.error("Server error. Please try again later.");
      } else if (error.message.includes("Invalid response")) {
        toast.error("Server returned invalid response. Please try again.");
      } else if (error.message.includes("process downloaded file")) {
        toast.error("Failed to process the downloaded file.");
      } else if (error.message.includes("initiate download")) {
        toast.error("Failed to start download. Please try again.");
      } else {
        toast.error(`Download failed: ${error.message || "Unknown error occurred"}`);
      }
    }
  };

  // 🔽 READ ONLINE
  const handleReadNow = async (book) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      return toast.error("Please log in first.");
    }

    // Double-check: Ensure this is a purchased book with approved status
    if (!book.purchaseId) {
      return toast.error("This book is not available for reading.");
    }

    // Check if the order is approved/active
    if (!book.status || (book.status !== "approved" && book.status !== "active")) {
      return toast.error("Your order is not approved yet. Please wait for approval or contact support.");
    }

    // Check if download is allowed
    if (book.isDownloadAllowed !== true) {
      return toast.error("Read access is not enabled for this order. Please contact support.");
    }

    if (book.notDownloaded) {
      return toast.error("Access to this book has been revoked.");
    }

    if (!book.pdfUrl) {
      return toast.error("PDF file not available.");
    }

    try {
      const userId = user._id || user.id;

      // Get authentication token (admin_token takes priority, then user token)
      const adminToken = localStorage.getItem("admin_token");
      const userToken = localStorage.getItem("token");
      const token = adminToken || userToken;

      if (!token) {
        toast.error("Authentication required. Please log in again.");
        return;
      }

      console.log("📖 Starting read online for:", book.title);
      console.log("🔑 Using token type:", adminToken ? "admin_token" : "user_token");

      // For purchased books, use the secure read endpoint to get authorized URL
      if (book.purchaseId) {
        console.log("📖 Reading purchased book via secure read endpoint");

        const readResponse = await fetch(`http://localhost:3000/api/purchased/${book.purchaseId}/read`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("📡 Secure read response:", readResponse.status, readResponse.ok);

        if (!readResponse.ok) {
          const errorData = await readResponse.json().catch(() => ({}));
          console.error("❌ Secure read failed:", errorData);
          throw new Error(errorData.message || "Access denied: Order not approved");
        }

        const readData = await readResponse.json();
        console.log("✅ Read authorized, URL:", readData.url);

        // Open PDF in new tab
        window.open(readData.url, "_blank", "noopener,noreferrer");
        return;
      }

      // For free books, use the protected PDF endpoint with token
      console.log("📖 Reading free book via PDF endpoint");

      // Extract filename from PDF URL
      const filename = book.pdfUrl.split('/').pop();
      const userEmail = user.email;

      // Include token in the URL for authentication
      const protectedUrl = `http://localhost:3000/api/pdf/${filename}?userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(userEmail)}&token=${encodeURIComponent(token)}`;

      console.log("🔗 Protected read URL:", protectedUrl);

      // Open PDF in a new browser tab using protected endpoint
      window.open(protectedUrl, "_blank", "noopener,noreferrer");

    } catch (error) {
      console.error("Read online error:", error);
      toast.error(`Failed to open book: ${error.message || "Unknown error"}`);
    }
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
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">APPROVED · DOWNLOADABLE</p>
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
