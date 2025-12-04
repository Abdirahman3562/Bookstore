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
        // 1️⃣ FETCH free downloads from server 5003
        const freeRes = await fetch("http://localhost:5003/downloads");
        const freeData = await freeRes.json();

        const userFreeBooks = freeData.filter(
          (item) => item.userId === user.id
        );

        // 2️⃣ FETCH purchased ACTIVE books from server 5001
        const orderRes = await fetch("http://localhost:5001/purchased");
        const orderData = await orderRes.json();

        const arr = orderData.purchased || orderData;

        const activeOrders = arr.filter(
          (o) =>
            o.email === user.email &&
            (o.status === "active" || o.status === "processing")
        );

        // 3️⃣ ISKU DAR (free + active)
        let combined = [
          ...userFreeBooks.map((b) => ({
            ...b,
            source: "free",
          })),
          ...activeOrders.map((o) => ({
            ...o,
            source: "purchased",
            pdfUrl: o.pdfUrl, // ensure pdf
          })),
        ];

        // 4️⃣ REMOVE duplicates (same title)
        const unique = combined.filter(
          (value, index, self) =>
            index === self.findIndex((b) => b.title === value.title)
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
  const handleDownload = (pdfUrl, title) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return toast.error("Please log in first.");

    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `${title}.pdf`;
    a.click();

    toast.success("Download started!");
  };

  // 🔽 READ ONLINE
  const handleReadNow = (pdfUrl) => {
    window.open(pdfUrl, "_blank");
  };

  // ⏳ Spinner
  if (loading) {
    return (
      <div className="flex justify-center border border-gray-300 rounded-lg shadow-md py-10">
        <svg className="h-12 w-12 animate-spin text-blue-600" viewBox="0 0 50 50">
          <circle className="opacity-25" cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="5" fill="none" />
          <circle className="opacity-75" cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="5" strokeDasharray="31.4 188.4" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Your Downloads</h2>

      {books.length === 0 ? (
        <div className="flex justify-center items-center py-10 border border-gray-300 rounded-lg shadow-md">
          <p className="text-gray-600 text-lg font-semibold">No downloads available.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {books.map((book, i) => (
            <div key={i} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-100 rounded-lg shadow-md gap-4">
              
              {/* LEFT SIDE */}
              <div className="flex lg:flex-row md:flex-row flex-col lg:items-center md:items-center gap-4 w-full sm:w-auto">
                <img
                  src={book.cover}
                  className="lg:w-20 md:w-20 w-full lg:h-24 md:h-20 h-auto object-cover rounded-md shadow"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{book.title}</h3>
                  <p className="text-gray-600 text-sm">By {book.author}</p>
                  {book.source === "free" ? (
                    <p className="text-green-600 text-sm font-medium">FREE DOWNLOAD</p>
                  ) : (
                    <p className="text-blue-600 text-sm font-medium">PURCHASED · ACTIVE</p>
                  )}
                </div>
              </div>

              {/* RIGHT BUTTONS */}
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={() => handleDownload(book.pdfUrl, book.title)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm sm:text-base"
                >
                  Download
                </button>

                <button
                  onClick={() => handleReadNow(book.pdfUrl)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm sm:text-base"
                >
                  Read Now
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
