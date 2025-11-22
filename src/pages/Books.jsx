import books from "../data/books.json";

function slugify(text) {
  return text.toLowerCase().replace(/\s+/g, "-");
}


export default function Books() {
  return (
    <div className="py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {books.map(book => (
        <div key={book.id} className="border p-4 rounded shadow">
          <img src={book.cover} className="w-full h-60 object-cover" />

          <h2 className="text-xl font-semibold mt-2">Title: {book.title}</h2>

          <p className="text-gray-700">Author: {book.author}</p>

          <p className="text-gray-600 mt-1">
            <span className="font-semibold">Publisher:</span> {book.publisher}
          </p>

          <p className="text-gray-500 mt-1">
            <span className="font-semibold">Published:</span> {book.publishedDate}
          </p>

          <p className="text-blue-600 font-bold mt-2">Price: ${book.price}</p>

          {/* Convert title to URL format */}
          <a
            href={`/book/${slugify(book.title)}`}
            className="mt-4 block bg-blue-600 text-white p-2 rounded text-center hover:bg-blue-700 transition"
          >
            View Details
          </a>
        </div>
      ))}
    </div>
  );
}
