import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function NewReleases() {
  const [booksData, setBooksData] = useState([]);
  const [loading, setLoading] = useState(true);  // Loading state
  const slugify = (text) => {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
  };

  // Fetch books data
useEffect(() => {
  fetch('http://localhost:5000/books')  // Adjust the URL as per your API endpoint
    .then((response) => response.json())
    .then((data) => {
      console.log('API Response:', data);  // Log the response to check its structure
      if (Array.isArray(data)) {
        setBooksData(data);  // If it's an array, directly set it to state
      } else if (data && data.books) {
        setBooksData(data.books);  // If books are inside a 'books' key
      } else {
        console.error('No books data found.');
      }
      setLoading(false);
    })
    .catch((error) => {
      console.error('Error fetching books:', error);
      setLoading(false);
    });
}, []);



  if (loading) {
    return <div>Loading...</div>;  // Show a loading indicator
  }

  // Limiting to 4 books only
  const limitedBooks = booksData.slice(0, 4);

  return (
    <div className="w-full mt-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">New Releases</h2>
        <Link to="/all-new-releases" className="text-blue-600 hover:underline">
          View All ({booksData.length})
        </Link>
      </div>

      {/* Book Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {limitedBooks.map((book) => (
          <div key={book.id} className="bg-white rounded-lg shadow-lg p-3 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
            <Link to={`/book/${slugify(book.title)}`} className="block">
              <img
                src={book.cover}
                alt={book.title}
                className="w-full lg:h-28 md:h-28 h-40 object-cover rounded-t-lg"
              />
              <div className="mt-4">
                <h3 className="text-lg font-semibold">{book.title}</h3>
                <p className="text-gray-600 text-sm">{book.author}</p>
                <p className="text-blue-600 font-semibold mt-2">${book.price}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
