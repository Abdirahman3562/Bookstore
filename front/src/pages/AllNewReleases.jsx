import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function AllNewReleases() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);


  function slugify(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "");
}

  useEffect(() => {
    fetch("http://localhost:5100/books")
      .then((res) => res.json())
      .then((data) => {
        const allBooks = Array.isArray(data) ? data : data.books;

        // ⭐ Sort newest -> oldest
        const sortedBooks = [...allBooks].sort(
          (a, b) => new Date(b.publishedDate) - new Date(a.publishedDate)
        );

        // ⭐ SOO QAADO 12-KA UGU DANBEEYA KALIYA
        const latestBooks = sortedBooks.slice(0, 12);

        setBooks(latestBooks);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">All New Releases</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {books.map((book) => (
          <div key={book.id} className="bg-white shadow-lg rounded-lg p-3">
            <img
              src={book.cover}
              alt={book.title}
              className="w-full h-48 object-cover rounded"
            />
            <h2 className="mt-3 text-lg font-semibold">{book.title}</h2>
            <p className="text-gray-600 text-sm">{book.author}</p>
            <p className="font-bold text-blue-600 mt-2">
              {book.price === 0 ? "Free" : `$${book.price}`}
            </p>

            <Link
            to={`/book/${slugify(book.title)}`}
            className="mt-4 block bg-blue-600 text-white p-2 rounded text-center hover:bg-blue-700 transition"
          >
            View Details
          </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
