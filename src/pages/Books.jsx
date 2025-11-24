import { useState, useEffect } from "react"; // For managing state and effects
import { Link } from "react-router-dom";

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "");
}

const formatDate = (date) => {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(date).toLocaleDateString("en-US", options);
};

export default function Books() {
  const [books, setBooks] = useState([]); // State to store the books data
  const [loading, setLoading] = useState(true); // Loading state

  // Fetching books data from API
useEffect(() => {
  fetch("http://localhost:5100/books")
    .then((response) => response.json())
    .then((data) => {
      console.log("API DATA:", data);

      if (Array.isArray(data)) {
        setBooks(data);
      } else {
        console.error("books.json structure is wrong!", data);
      }

      setLoading(false);
    })
    .catch((error) => {
      console.error("Error fetching books:", error);
      setLoading(false);
    });
}, []);



  if (loading) {
    return <div>Loading...</div>; // Show a loading indicator while data is being fetched
  }

  return (
    <div className="py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {books.map((book) => (
        <div key={book.id} className="border p-4 rounded shadow">
          <img
            src={book.cover} // Check if the cover is correct, should be a valid image path
            className="w-full h-60 object-cover"
            alt={book.title}
          />

          <h2 className="text-xl font-semibold mt-2">Title: {book.title}</h2>

          <p className="text-gray-700">Author: {book.author}</p>

          <p className="text-gray-600 mt-1">
            <span className="font-semibold">Publisher:</span> {book.publisher}
          </p>

          <p className="text-gray-500 mt-1">
            <span className="font-semibold">Published: </span>
            <span className="bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold px-1 ml-1 rounded-md shadow-md">
              {formatDate(book.publishedDate)}
            </span>
          </p>

          {/* Check if price is 0, then display "Free" */}
          <p className="text-blue-600 font-bold mt-2">
             {book.price === 0 ? "Free" : `Price: $${book.price}`}
          </p>
          {/* Convert title to URL format */}
          <Link
            to={`/book/${slugify(book.title)}`}
            className="mt-4 block bg-blue-600 text-white p-2 rounded text-center hover:bg-blue-700 transition"
          >
            View Details
          </Link>
        </div>
      ))}
    </div>
  );
}
