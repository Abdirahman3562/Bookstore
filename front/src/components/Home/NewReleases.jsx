import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function NewReleases() {
  const [booksData, setBooksData] = useState([]);
  const [loading, setLoading] = useState(true);

  const slugify = (text) => {
    return text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "");
  };

  useEffect(() => {
    fetch("http://localhost:3000/api/books")
      .then((response) => response.json())
      .then((responseData) => {
        const data = responseData.data || [];
        if (Array.isArray(data)) {
          setBooksData(data);
        } else if (data && data.books) {
          setBooksData(data.books);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching books:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  // ✅ Sort by publishedDate (newest → oldest)
  const newestBooks = [...booksData]
    .sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate))
    .slice(0, 4);

  const sortedAll = [...booksData].sort(
    (a, b) => new Date(b.publishedDate) - new Date(a.publishedDate)
  );

  // ☑ Ka qaado inta new releases aad rabto (tusaale: 12)
  const latestBooks = sortedAll.slice(0, 12);

  return (
    <div className="w-full mt-10 px-4 lg:px-0 md:px-0">
      <div className="flex justify-between items-center mb-6 p-4">
        <h2 className="text-2xl ml-0 font-bold text-blue-600 tracking-tight">New Releases</h2>
        <Link to="/all-new-releases" className="text-blue-600 border border-gray-300 px-2 py-1 shadow-md hover:shadow-lg rounded-md">
          View All ({latestBooks.length})
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {newestBooks.map((book) => (
          <div
            key={book._id || book.id}
            className="bg-white border border-gray-200   rounded-lg shadow-lg p-4 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
          >
            <Link to={`/book/${slugify(book.title)}`} className="block">
              <img
                src={book.cover ? `http://localhost:3000${book.cover}` : 'https://via.placeholder.com/300x400?text=No+Image'}
                alt={book.title}
                className="w-full lg:h-28 md:h-28 h-40 object-cover rounded-t-lg"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x400?text=No+Image';
                }}
              />
              <div className="mt-4">
                <h3 className="text-lg font-semibold">{book.title}</h3>
                <p className="text-gray-600 text-sm">{book.author}</p>
                <p className="text-blue-600 font-bold mt-2">
                  {book.price === 0 ? "Free" : `Price: $${book.price}`}
                </p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
