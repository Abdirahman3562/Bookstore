import { useParams } from "react-router-dom";
import books from "../data/books.json";

// Function to slugify the title for URL matching
function slugify(text) {
  return text.toLowerCase().replace(/\s+/g, "-");
}

export default function BookDetails() {
  const { title } = useParams(); // 'title' comes from the URL

  const book = books.find(b => slugify(b.title) === title); // Find book by slugified title

  // If book not found, display error message
  if (!book) return <h1 className="p-10 text-red-600">Book not found</h1>;

  return (
    <div className="py-10 px-10 lg:px-0 md:px-0 max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Book Cover */}
      <div className="flex flex-col lg:flex-row items-center gap-6">
        <img 
          src={book.cover} 
          alt={book.title} 
          className="w-full lg:w-1/3 h-80 object-cover rounded-lg shadow-md"
        />
        
        {/* Book Details */}
        <div className="flex flex-col items-start lg:w-2/3">
          <h1 className="text-4xl font-bold text-gray-800 mb-4"> Title: {book.title}</h1>
          <p className="text-xl font-medium text-gray-600 mb-2"> Author: By {book.author}</p>

          <p className="text-lg text-gray-500 mb-4">{book.description}</p>

          <div className="flex  flex-col  w-full mb-4">
            <p className="text-sm text-gray-400">Published on: {book.publishedDate}</p>
            <p className="text-sm text-gray-400">Publisher: {book.publisher}</p>
          </div>

          {/* Price and Buy Button */}
          <div className="flex   justify-between items-center w-full mt-20">
            <p className="text-2xl font-semibold text-blue-600">Price: ${book.price}</p>
            <button className="bg-green-600  mr-4 mt-2 text-white py-2 px-6 rounded-md hover:bg-green-700 transition duration-300">
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
