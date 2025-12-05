import { useState, useEffect, useMemo } from "react";
import { FaCalendarAlt, FaCheckCircle } from "react-icons/fa";
import { FiBook, FiSearch } from "react-icons/fi";
import { Link } from "react-router-dom";

function BlogPage() {
  const [search, setSearch] = useState("");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // pagination state
  const PAGE_SIZE = 9;
  const [currentPage, setCurrentPage] = useState(1);

  // ✅ Format date: "September 12, 2025"
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // 🧠 Fetch blogs & authors oo isku dar
  useEffect(() => {
    Promise.all([
      fetch("http://localhost:3000/api/blogs").then((r) => r.json()),
      fetch("http://localhost:3000/api/authors").then((r) => r.json()).catch(() => ({ data: [] })),
    ])
      .then(([blogsResponse, authorsResponse]) => {
        const blogsData = blogsResponse.data || [];
        const authorsData = authorsResponse.data || [];
        
        // Filter only published blogs
        const publishedBlogs = blogsData.filter(blog => blog.status === 'published');
        
        const merged = publishedBlogs.map((blog) => {
          // Handle authorId - could be ObjectId, string, or nested object
          let authorIdValue = "";
          if (blog.authorId) {
            if (typeof blog.authorId === "string") {
              authorIdValue = blog.authorId;
            } else if (blog.authorId._id) {
              authorIdValue = blog.authorId._id;
            } else if (blog.authorId.toString) {
              authorIdValue = blog.authorId.toString();
            }
          }
          
          // Check if authorId is populated (object) with name or username
          const isAuthorPopulated = blog.authorId && typeof blog.authorId === 'object' && (blog.authorId.name || blog.authorId.username);
          
          // Find author by comparing string values
          let author = null;
          if (isAuthorPopulated) {
            author = blog.authorId;
          } else {
            author = authorsData.find((a) => {
              const authorId = String(a._id || a.id || "");
              return authorId === authorIdValue;
            });
          }
          
          // Format date from publishedDate
          const date = blog.publishedDate || blog.date || blog.createdAt;
          
          // Construct thumbnail URL - handle base64, http, and file paths
          let thumbnailUrl = "/images/placeholder.jpg";
          if (blog.thumbnail && blog.thumbnail.trim() !== '') {
            // Check if it's base64
            if (blog.thumbnail.startsWith('data:image/')) {
              thumbnailUrl = blog.thumbnail;
            } else if (blog.thumbnail.startsWith('http://') || blog.thumbnail.startsWith('https://')) {
              thumbnailUrl = blog.thumbnail;
            } else if (blog.thumbnail.startsWith('/uploads/')) {
              thumbnailUrl = `http://localhost:3000${blog.thumbnail}`;
            } else if (blog.thumbnail.startsWith('uploads/')) {
              thumbnailUrl = `http://localhost:3000/${blog.thumbnail}`;
            } else {
              thumbnailUrl = `http://localhost:3000/uploads/${blog.thumbnail}`;
            }
          }
          
          // Construct author image URL - handle base64, http, and file paths
          let authorImageUrl = "/default-avatar.png";
          if (author && author.avatar && author.avatar.trim() !== '') {
            // Check if it's base64
            if (author.avatar.startsWith('data:image/')) {
              authorImageUrl = author.avatar;
            } else if (author.avatar.startsWith('http://') || author.avatar.startsWith('https://')) {
              authorImageUrl = author.avatar;
            } else if (author.avatar.startsWith('/uploads/')) {
              authorImageUrl = `http://localhost:3000${author.avatar}`;
            } else if (author.avatar.startsWith('uploads/')) {
              authorImageUrl = `http://localhost:3000/${author.avatar}`;
            } else {
              authorImageUrl = `http://localhost:3000/uploads/${author.avatar}`;
            }
          }
          
          return {
            ...blog,
            id: blog._id || blog.id,
            date: date,
            authorName: (author && author.name && author.name.trim() !== '') ? author.name : "Unknown Author",
            username: (author && author.username && author.username.trim() !== '') ? author.username : "",
            authorImage: authorImageUrl,
            verified: !!author?.verified,
            thumbnail: thumbnailUrl,
          };
        });
        setArticles(merged);
      })
      .catch((e) => console.error("Error loading data:", e))
      .finally(() => setLoading(false));
  }, []);

  // filter by search
  const filteredArticles = useMemo(() => {
    const res = articles.filter((a) =>
      a.title.toLowerCase().includes(search.toLowerCase())
    );
    return res;
  }, [articles, search]);

  // reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // compute current page slice
  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / PAGE_SIZE));
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageArticles = filteredArticles.slice(start, end);

  const goToPage = (p) => {
    const target = Math.min(Math.max(1, p), totalPages);
    setCurrentPage(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-500">
        Loading blog articles...
      </div>
    );
  }

  return (
    <div className=" px-4 lg:px-2 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 bg-blue-500 text-white flex items-center justify-center rounded-full">
            <FiBook className="text-2xl" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-blue-600 mb-3">Our Blog</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Explore our latest insights, tutorials, and updates about education
          technology and online learning.
        </p>

        {/* Search bar */}
        <div className="mt-8 relative max-w-xl mx-auto">
          <FiSearch className="absolute left-4 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-blue-400 rounded-lg py-2.5 pl-10 pr-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
        </div>
      </div>

      {/* Articles Grid */}
      {pageArticles.length > 0 ? (
        <>
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pageArticles.map((article) => (
              <div
                key={article._id || article.id}
                className="bg-[#edf4f5] border border-gray-200 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
              >
                <Link
                  to={`/blog/${encodeURIComponent(
                    article.title.toLowerCase().replace(/\s+/g, "-")
                  )}`}
                  className="relative block"
                >
                  <img
                    src={article.thumbnail || "/images/placeholder.jpg"}
                    alt={article.title}
                    className="w-full h-48 object-cover transition-transform duration-500 ease-in-out transform hover:scale-110"
                    onError={(e) => (e.target.src = "/images/placeholder.jpg")}
                  />
                  <div className="absolute top-0 left-0 px-2 py-0 m-1 bg-blue-100 text-blue-600 text-sm font-semibold rounded-full">
                    {article.category}
                  </div>
                  <div className="absolute top-0 right-0 flex items-center gap-2 px-2 py-0 m-1 bg-blue-100 text-blue-600 text-sm rounded-full">
                    <FaCalendarAlt className="text-blue-600" />
                    {formatDate(article.date)}
                  </div>
                </Link>

                <div className="p-5">
                  <h3 className="text-md font-semibold text-gray-800 mb-2 hover:text-blue-600">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {(() => {
                      // Strip HTML tags for preview
                      const text = article.content || "";
                      return text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
                    })()}
                  </p>

                  {/* Author */}
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex items-center gap-2">
                      {article.authorImage && article.authorImage !== "/default-avatar.png" ? (
                        <img
                          src={article.authorImage}
                          alt={article.authorName}
                          className="w-8 h-8 rounded-full object-cover border border-gray-300 flex-shrink-0"
                          onError={(e) => {
                            e.target.style.display = "none";
                            const fallback = e.target.nextElementSibling;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300 flex-shrink-0 ${
                          article.authorImage && article.authorImage !== "/default-avatar.png" ? "hidden" : ""
                        }`}
                      >
                        <span className="text-xs text-gray-500 font-semibold">
                          {article.authorName ? article.authorName.charAt(0).toUpperCase() : "?"}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        {article.username}
                        {article.verified && (
                          <FaCheckCircle className="text-blue-600 text-[16px]" />
                        )}
                      </p>
                    </div>
                    <Link
                      to={`/blog/${encodeURIComponent(
                        article.title.toLowerCase().replace(/\s+/g, "-")
                      )}`}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium transition"
                    >
                      Read More →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-10 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md border ${
                  currentPage === 1
                    ? "text-gray-400 border-gray-200 cursor-not-allowed"
                    : "text-blue-700 border-blue-200 hover:bg-blue-50"
                }`}
              >
                Prev
              </button>

              {/* page numbers (simple 1..N) */}
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`w-9 h-9 rounded-md border text-sm ${
                      p === currentPage
                        ? "text-gray-400 border-gray-200 cursor-not-allowed"
                    : "text-blue-700 border-blue-200 hover:bg-blue-50"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md border ${
                  currentPage === totalPages
                    ? "text-gray-400 border-gray-200 cursor-not-allowed"
                    : "text-blue-700 border-blue-200 hover:bg-blue-50"
                }`}
              >
                Next
              </button>
            </div>

            <p className="text-sm text-gray-500">
              Showing {filteredArticles.length === 0 ? 0 : start + 1}
              –
              {Math.min(end, filteredArticles.length)} of{" "}
              {filteredArticles.length} posts
            </p>
          </div>
        </>
      ) : (
        <p className="text-center text-gray-500 mt-10">
          No articles found matching your search.
        </p>
      )}
    </div>
  );
}

export default BlogPage;
