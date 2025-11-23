    import { useState, useEffect } from "react";
    import toast from "react-hot-toast"; // Import toast for showing notifications

    export default function DownloadsTab() {
    const [downloads, setDownloads] = useState([]);
    const [userDownloads, setUserDownloads] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch all downloads from JSON Server
    useEffect(() => {
        fetch("http://localhost:5003/downloads")
        .then((res) => res.json())
        .then((data) => {
            setDownloads(data); // Set the fetched downloads data
            const user = JSON.parse(localStorage.getItem("user"));

            // Filter only the downloads of the logged-in user
            if (user) {
            const userSpecificDownloads = data.filter(
                (download) => download.userId === user.id
            );
            setUserDownloads(userSpecificDownloads); // Set user's specific downloads
            }
            setLoading(false);
        })
        .catch((error) => {
            console.error("Error fetching downloads:", error);
            setLoading(false);
        });
    }, []);

const handleDownload = (pdfUrl, title, cover, author, price, email) => {
  const user = JSON.parse(localStorage.getItem("user")); // Hubi in user-ka uu galay

  if (!user) {
    toast.error("You need to log in first.");
    return;
  }

  // Haddii user-ka uu login yahay, buugga waxaa si toos ah loo soo dejin doonaa
  const link = document.createElement("a");
  link.href = pdfUrl;  // URL-ka PDF-ka
  link.download = `${title}.pdf`;  // Magaca PDF-ka
  document.body.appendChild(link);
  link.click();  // Ku dhufo si PDF-ka loogu soo dejiyo
  document.body.removeChild(link); // Kadibna ka saar link-ka DOM-ka

  // Fariin guul ah u soo dir user-ka
  toast.success("Download started!");
};




    // Handle reading the PDF in a new tab
    const handleReadNow = (pdfUrl) => {
        window.open(pdfUrl, "_blank");
    };

    // Render loading state
    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Your Downloads</h2>

        {/* Check if the user has any downloaded books */}
        {userDownloads.length === 0 ? (
            <p>No downloads available.</p>
        ) : (
            <div className="space-y-4">
            {userDownloads.map((book, index) => (
                <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-100 rounded-lg shadow-md"
                >
                <div className="flex items-center gap-4">
                    <img
                    src={book.cover}
                    alt={book.title}
                    className="w-16 h-20 object-cover rounded-md"
                    />
                    <div>
                    <h3 className="text-xl font-semibold text-gray-800">{book.title}</h3>
                    <p className="text-gray-600">By {book.author}</p>
                    <p className="text-gray-600">{book.isFree ? "Free" : `$${book.price}`}</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    {/* Download Button */}
                    <button
                    onClick={() => handleDownload(book.pdfUrl, book.title, book.cover, book.author, book.price, book.email)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                    Download
                    </button>

                    {/* Read Now Button */}
                    <button
                    onClick={() => handleReadNow(book.pdfUrl)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
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
