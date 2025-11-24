import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FiShoppingCart } from "react-icons/fi";
import toast from "react-hot-toast"; // Make sure toast is imported correctly

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "");
}

export default function BookDetails() {
  const { title } = useParams();
  const navigate = useNavigate(); // To navigate to other routes
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloads, setDownloads] = useState([]);


  useEffect(() => {
    fetch(`http://localhost:5100/books`) // Adjust this URL to your API endpoint
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((b) => slugify(b.title) === title);
        setBook(found);
        setLoading(false);
      });
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
    const exists = cart.find((item) => item.id === book.id);
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

  // Fetch current downloads from JSON Server
  fetch("http://localhost:5003/downloads") // Get the download data from the server
    .then((res) => {
      if (!res.ok) {
        throw new Error("Failed to fetch downloads data");
      }
      return res.json();
    })
    .then((downloads) => {
      // Check if the user has already downloaded the book
      const alreadyDownloaded = downloads.some(
        (download) => download.bookId === book.id && download.userId === user.id
      );

      if (alreadyDownloaded) {
        toast.error("To download, go to the downloads page."); // Show error if already downloaded
        return;
      }

      // If not already downloaded, allow the download
      const downloadData = {
        userId: user.id,
        userName: user.name,
        email: user.email,
        bookId: book.id, // Ensure we're using book's ID
        title,
        author,
        cover,
        price,
        isFree: price === 0,
        pdfUrl,
        timestamp: new Date().toISOString(),
      };

      // Create a download link and trigger the download
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `${title}.pdf`; // Ensure the correct title is used
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Add the downloaded book to JSON Server
      fetch("http://localhost:5003/downloads", {
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



  
  if (loading) return <h1>Loading...</h1>;
  if (!book) return <h1>Book not found</h1>;

  return (
    <div className="py-6 px-4 max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="flex flex-col lg:flex-row items-center gap-6">
        <img
          src={book.cover}
          alt={book.title}
          className="w-full lg:w-1/3 h-80 object-cover rounded-lg shadow-md mb-4 lg:mb-0"
        />

        <div className="flex flex-col lg:w-2/3">
          <h1 className="text-2xl lg:text-4xl font-bold mb-4 text-gray-800">
            {book.title}
          </h1>
          <p className="text-xl text-gray-600 mb-2">By {book.author}</p>
          <p className="text-base text-gray-500 mb-4">{book.description}</p>

          <div className="mt-8 flex justify-between items-center">
            {/* Check if price is 0, then display "Free" */}
            <p className="text-blue-600 font-bold mt-2">
              {book.price === 0 ? "Free" : `Price: $${book.price}`}
            </p>

            {/* Conditional rendering of the button */}
            {book.price === 0 ? (
              // If the book is free, display the "Download PDF" button
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
                className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition flex items-center gap-2"
              >
                <span className="">Download PDF</span>
              </button>
            ) : (
              // If the book is paid, display the "Add to Cart" button
              <button
                onClick={handleAddToCart}
                className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition flex items-center gap-2"
              >
                <FiShoppingCart />
                <span className="hidden lg:inline">Add to Cart</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
