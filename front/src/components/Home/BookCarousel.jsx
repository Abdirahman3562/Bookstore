import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function BookCarousel() {
  const slugify = (text) =>
    text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "");

  const [booksData, setBooksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allBooksData, setAllBooksData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/api/books")
      .then((res) => res.json())
      .then((responseData) => {
        const data = responseData.data || [];
        setBooksData(data.slice(0, 10));
        setAllBooksData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching books:", error);
        setLoading(false);
      });
  }, []);

  const visibleBooks = 5;
  const bookWidth = 180;
  const spaceWidth = 20;

  const maxIndex =
    booksData.length > visibleBooks ? booksData.length - visibleBooks : 0;

  const nextSlide = () => {
    setCurrentIndex(
      (prev) => (prev >= maxIndex ? 0 : prev + 1) // Loop forever
    );
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const goToSlide = (i) => {
    if (i <= maxIndex) setCurrentIndex(i);
  };

  useEffect(() => {
    if (loading) return;

    const timer = setInterval(() => {
      nextSlide(); // Always move forward
    }, 3000); // 3-second interval

    return () => clearInterval(timer);
  }, [currentIndex, loading, maxIndex]);

  useEffect(() => {
    if (!isAutoPlaying || loading) return;

    const timer = setInterval(() => {
      if (currentIndex < maxIndex) {
        nextSlide();
      } else {
        setIsAutoPlaying(false);
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [currentIndex, isAutoPlaying, loading, maxIndex]);

  if (loading) {
    return <div className="text-center py-10">Loading books...</div>;
  }

  return (
    <div className="relative w-full mt-10 mb-20">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 px-4">
        <div className="flex justify-between  rounded-md  p-2  lg:p-1 md:p-1  items-center w-full">
          {/* LEFT SIDE */}
          <div>
            <h1 className="lg:text-3xl md:text-3xl text-sm font-bold text-blue-600 dark:text-blue-400">
              Books
            </h1>
            <p className="text-gray-500 dark:text-gray-400 lg:text-sm md:text-sm text-[10px] ">
              Discover the latest releases
            </p>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4">
            <Link
              to="/books"
              className="text-blue-600 dark:text-blue-400 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1 lg:text-[18px] md:text-[18px] text-[12px] rounded-md shadow-md transition-colors"
            >
              View All ({allBooksData.length})
            </Link>

            <button
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className={`lg:p-2 md:p-2 p-1 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 ${
                currentIndex === 0
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              } transition-colors`}
            >
              <FaChevronLeft />
            </button>

            <button
              onClick={nextSlide}
              disabled={currentIndex >= maxIndex}
              className={`lg:p-2 md:p-2 p-1 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 ${
                currentIndex >= maxIndex
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              } transition-colors`}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>

      <div className="relative w-full    px-4">
        <div className="overflow-hidden rounded-xl">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{
              transform: `translateX(-${
                currentIndex * (bookWidth + spaceWidth)
              }px)`,
              gap: `${spaceWidth}px`,
            }}
          >
            {booksData.map((book) => (
              <div
                key={book._id || book.id}
                className="flex-shrink-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-4 rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden"
                style={{ width: bookWidth }}
              >
                <Link to={`/book/${slugify(book.title)}`}>
                  <img
                    src={book.cover ? `http://localhost:3000${book.cover}` : 'https://via.placeholder.com/180x240?text=No+Image'}
                    alt={book.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/180x240?text=No+Image';
                    }}
                  />
                  <div className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-2 text-gray-900 dark:text-white">
                      {book.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">View details</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

       
      </div>
    </div>
  );
}
