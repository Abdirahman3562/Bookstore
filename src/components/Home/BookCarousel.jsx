import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function BookCarousel() {
  const slugify = (text) => {
    return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
  };

  const [booksData, setBooksData] = useState([]);  // Initialize with an empty array
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true); // To track loading state

  useEffect(() => {
    // Fetch the books data from the JSON server API
    fetch('http://localhost:5000/books')  // Adjust the URL as per your API endpoint
      .then((response) => response.json())
      .then((data) => {
        setBooksData(data); // Set the books data
        setLoading(false); // Data loaded, set loading to false
      })
      .catch((error) => {
        console.error('Error loading books:', error);
        setLoading(false); // In case of an error, stop loading
      });
  }, []);

  // If data is still loading, return a loading indicator
  if (loading) {
    return <div>Loading books...</div>;
  }

  const visibleBooks = 5; // Number of books to show at once
  const bookWidth = 192; // w-48 in px
  const spaceWidth = 16; // space-x-4 in px
  const slideWidth = bookWidth + spaceWidth; // 208px

  const nextBook = () => {
    if (currentIndex + visibleBooks < booksData.length) {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }
  };

  const prevBook = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prevIndex) => prevIndex - 1);
    }
  };

  const isPrevDisabled = currentIndex === 0;
  const isNextDisabled = currentIndex + visibleBooks >= booksData.length;

  return (
    <div className="relative w-full lg:mt-10 md:mt-20 mt-16 lg:p-0 md:p-0 p-6 mb-20">
      <div className="flex justify-between items-center space-x-4 mb-4">
        <h1>Book Carousel</h1>
        <div className="flex gap-4">
          <button className="text-blue-500 hover:text-blue-700 text-sm font-medium">
            View All ({booksData.length}) {/* Showing the count of books */}
          </button>
          <div className="flex space-x-2">
            {/* Previous Button */}
            <button
              onClick={prevBook}
              disabled={isPrevDisabled}
              className={`p-2 rounded-full border border-gray-300 hover:bg-gray-100 ${
                isPrevDisabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l-7 7 7 7M19 5l-7 7 7 7"
                ></path>
              </svg>
            </button>

            {/* Next Button */}
            <button
              onClick={nextBook}
              disabled={isNextDisabled}
              className={`p-2 rounded-full border border-gray-300 hover:bg-gray-100 ${
                isNextDisabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l7-7-7-7M5 19l7-7-7-7"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-center">
        {/* Carousel for Books */}
        <div className="overflow-hidden w-full">
          <div
            className="flex transition-transform duration-500 ease-in-out py-4"
            style={{
              transform: `translateX(-${currentIndex * slideWidth}px)`,
              width: `${booksData.length * slideWidth}px`, // Ensure enough width for all books
            }}
          >
            {booksData.map((book, index) => (
              <Link
                key={book.id}
                to={`/book/${slugify(book.title)}`} // Link to the book details page with the slugified title
                className="w-48 flex-shrink-0 bg-white rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-x"
                style={{
                  marginRight: index < booksData.length - 1 ? `${spaceWidth}px` : '0', // Apply space manually for control
                }}
              >
                {/* Book Cover Image */}
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-full h-56 object-cover rounded-t-lg"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
