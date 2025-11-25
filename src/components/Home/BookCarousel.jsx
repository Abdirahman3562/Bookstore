import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function BookCarousel() {
  const slugify = (text) => {
    return text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "");
  };

  const [booksData, setBooksData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
    const [allBooksData, setAllBooksData] = useState([]);  // Holds all books


  useEffect(() => {
    fetch("http://localhost:5100/books")
      .then((response) => response.json())
      .then((data) => {
        // 👉 Kaliya soo qaado 10 buug
        const limitedBooks = data.slice(0, 10);
        const Allbooks = data; // For all books
        setBooksData(limitedBooks);
        setAllBooksData(Allbooks); // Store all books in state

        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading books:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading books...</div>;
  }

  const visibleBooks = 5; // number of books shown per slide
  const bookWidth = 192;
  const spaceWidth = 16;
  const slideWidth = bookWidth + spaceWidth;

  const nextBook = () => {
    if (currentIndex + visibleBooks < booksData.length) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const prevBook = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const isPrevDisabled = currentIndex === 0;
  const isNextDisabled = currentIndex + visibleBooks >= booksData.length;

  return (
    <div className="relative w-full mt-10  mb-20">
      <div className="flex lg:flex-row md:flex-row flex-col justify-between lg:items-center md:items-center lg:ml-0 md:ml-0 ml-4 mb-4">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-blue-600 tracking-tight">
            Books
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Discover the latest releases and top picks
          </p>
        </div>

        <div className="flex gap-4 justify-end mr-4">
          <Link
            to="/books"
            className="text-blue-600 border border-gray-300 px-2 py-1 shadow-md hover:shadow-lg rounded-md"
          >
            View All ({allBooksData.length})
          </Link>

          {/* Buttons */}

          <div className="flex space-x-2">
            {/* Previous Button */}
            <button
              onClick={prevBook}
              disabled={isPrevDisabled}
              className={`p-2 rounded-full border border-gray-300 hover:bg-gray-100 ${
                isPrevDisabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <FaChevronLeft className="w-4 h-4 text-gray-500" />
            </button>

            {/* Next Button */}
            <button
              onClick={nextBook}
              disabled={isNextDisabled}
              className={`p-2 rounded-full border border-gray-300 hover:bg-gray-100 ${
                isNextDisabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <FaChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden w-full">
        <div
          className="flex transition-transform duration-500 ease-in-out py-4"
          style={{
            transform: `translateX(-${currentIndex * slideWidth}px)`,
            width: `${booksData.length * slideWidth}px`,
          }}
        >
          {booksData.map((book, index) => (
            <Link
              key={book.id}
              to={`/book/${slugify(book.title)}`}
              className="w-48 flex-shrink-0 bg-white rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
              style={{
                marginRight:
                  index < booksData.length - 1 ? `${spaceWidth}px` : "0",
              }}
            >
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
  );
}
