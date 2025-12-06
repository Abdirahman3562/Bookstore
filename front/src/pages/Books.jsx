import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Calendar, DollarSign, User, Building2, Search, Filter, X } from "lucide-react";

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
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("all"); // "all", "free", "paid"

  useEffect(() => {
    fetch("http://localhost:3000/api/books")
      .then((response) => response.json())
      .then((responseData) => {
        const data = responseData.data || [];
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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 dark:border-blue-400 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading books...</p>
        </div>
      </div>
    );
  }

  // Filter and search books
  const filteredBooks = books.filter((book) => {
    // Search filter
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Price filter
    const matchesPrice = 
      priceFilter === "all" ? true :
      priceFilter === "free" ? book.price === 0 :
      priceFilter === "paid" ? book.price > 0 : true;
    
    return matchesSearch && matchesPrice;
  });

  return (
    <div className="py-8 sm:py-12 bg-white dark:bg-gray-900 min-h-screen transition-colors duration-200">
      {/* Header */}
      <div className="mb-8 sm:mb-12">
        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Our Book Collection
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
          Discover {filteredBooks.length} of {books.length} amazing books waiting for you
        </p>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Price Filter */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setPriceFilter("all")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  priceFilter === "all"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setPriceFilter("free")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  priceFilter === "free"
                    ? "bg-green-600 text-white shadow-md"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Free
              </button>
              <button
                onClick={() => setPriceFilter("paid")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  priceFilter === "paid"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Paid
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      {books.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No books found</h3>
          <p className="text-gray-600 dark:text-gray-400">Check back later for new releases!</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-16">
          <Search className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No books match your search</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Try adjusting your search or filter criteria</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setPriceFilter("all");
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {filteredBooks.map((book) => (
            <div
              key={book._id || book.id}
              className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:-translate-y-1"
            >
              {/* Book Cover */}
              <Link to={`/book/${slugify(book.title)}`} className="block relative overflow-hidden">
                <div className="h-64 bg-gray-100 dark:bg-gray-700 relative">
                  <img
                    src={book.cover ? `http://localhost:3000${book.cover}` : 'https://via.placeholder.com/300x400?text=No+Image'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    alt={book.title}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300x400?text=No+Image';
                    }}
                  />
                  {/* Price Badge */}
                  <div className="absolute top-3 right-3">
                    {book.price === 0 ? (
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                        FREE
                      </span>
                    ) : (
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                        ${book.price}
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              {/* Book Info */}
              <div className="p-4 sm:p-5">
                <Link to={`/book/${slugify(book.title)}`}>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <span className="text-gray-600 dark:text-gray-400 font-semibold">Title:</span> {book.title}
                  </h2>
                </Link>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <User className="w-4 h-4 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                    <p className="text-sm">
                      <span className="font-semibold text-gray-600 dark:text-gray-400">Author:</span> <span className="text-gray-800 dark:text-gray-200">{book.author}</span>
                    </p>
                  </div>

                  {book.publisher && (
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Building2 className="w-4 h-4 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                      <p className="text-sm">
                        <span className="font-semibold text-gray-600 dark:text-gray-400">Publisher:</span> <span className="text-gray-800 dark:text-gray-200">{book.publisher}</span>
                      </p>
                    </div>
                  )}

                  {book.publishedDate && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <p className="text-sm">
                        <span className="font-semibold">Published:</span> {formatDate(book.publishedDate)}
                      </p>
                    </div>
                  )}
                </div>

                {/* View Details Button */}
                <Link
                  to={`/book/${slugify(book.title)}`}
                  className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-center py-2.5 px-4 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
