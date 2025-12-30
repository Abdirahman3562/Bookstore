import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaGlobe,
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaYoutube,
  FaFacebook,
  FaInstagram,
  FaCheckCircle,
} from "react-icons/fa";
import { getTenantUrl, getTenantHeaders } from "../utils/tenantUtils";

function AuthorPage() {
  const { username } = useParams();
  const [author, setAuthor] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 9;

  // ✅ Helper: convert title to slug
  const toSlug = (str) => str?.toLowerCase().trim().replace(/\s+/g, "-") ?? "";

  // ✅ Helper: strip HTML tags
  const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  };

  // ✅ Relative time helper
  const getRelativeTime = (dateString) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diff = Math.floor((now - postDate) / 1000);
    const minutes = Math.floor(diff / 60);
    const hours = Math.floor(diff / 3600);
    const days = Math.floor(diff / 86400);
    const months = Math.floor(diff / 2592000);
    const years = Math.floor(diff / 31536000);
    if (years > 0) return `${years} year${years > 1 ? "s" : ""} ago`;
    if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  useEffect(() => {
    const loadAuthorAndPosts = async () => {
      try {
        setLoading(true);

        // 1️⃣ Fetch all authors
        const authorsUrl = getTenantUrl("http://localhost:3000/api/authors");
        const headers = getTenantHeaders();
        const aRes = await fetch(authorsUrl, { headers });
        if (!aRes.ok) throw new Error("Failed to load authors");
        const aResponse = await aRes.json();
        const aData = aResponse.data || [];

        // find by username (case-insensitive)
        const found = aData.find(
          (a) => a.username?.toLowerCase() === username?.toLowerCase()
        );

        if (!found) {
          setAuthor(null);
          setArticles([]);
          setLoading(false);
          return;
        }

        const authorId = found._id || found.id;

        let authorImageUrl = "/images/authors/default.jpg";
        if (found.avatar && found.avatar.trim() !== '') {
          // Check if it's base64
          if (found.avatar.startsWith('data:image/')) {
            authorImageUrl = found.avatar;
          } else if (found.avatar.startsWith('http://') || found.avatar.startsWith('https://')) {
            authorImageUrl = found.avatar;
          } else if (found.avatar.startsWith('/uploads/')) {
            authorImageUrl = `http://localhost:3000${found.avatar}`;
          } else if (found.avatar.startsWith('uploads/')) {
            authorImageUrl = `http://localhost:3000/${found.avatar}`;
          } else {
            authorImageUrl = `http://localhost:3000/uploads/${found.avatar}`;
          }
        }
        
        setAuthor({
          id: authorId,
          username: found.username,
          name: found.name,
          image: authorImageUrl,
          bio: found.bio || "No bio available yet.",
          verified: !!found.verified,
          badge: found.badge || null,
          social: found.social || {},
        });

        // 2️⃣ Fetch blogs and filter by authorId
        const blogsUrl = getTenantUrl("http://localhost:3000/api/blogs");
        const pRes = await fetch(blogsUrl, { headers });
        if (!pRes.ok) throw new Error("Failed to load blogs");
        const blogsResponse = await pRes.json();
        const blogs = blogsResponse.data || [];

        const posts = blogs
          .filter(blog => blog.status === 'published')
          .filter(
            (p) => {
              const blogAuthorId = p.authorId?._id || p.authorId?.toString() || p.authorId;
              return blogAuthorId?.toString() === authorId?.toString();
            }
          )
          .map(blog => {
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
            
            return {
              ...blog,
              id: blog._id || blog.id,
              date: blog.publishedDate || blog.date || blog.createdAt,
              thumbnail: thumbnailUrl,
            };
          });

        setArticles(posts || []);
      } catch (err) {
        console.error("Error loading author page:", err);
        setAuthor(null);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    loadAuthorAndPosts();
    setCurrentPage(1); // Reset to page 1 when author changes
  }, [username]);

  // 🕓 Loading state
  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Loading author...</p>
        </div>
      </div>
    );
  }

  // ❌ Author not found
  if (!author) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 max-w-md mx-4">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheckCircle className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Author Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400">The author you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const social = author.social || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* ✅ Author Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-12">
          <div className="flex flex-col lg:flex-row items-center lg:items-start p-6 sm:p-8 lg:p-10 gap-6 lg:gap-8">
            {/* Author Avatar */}
            <div className="flex-shrink-0">
              {author.image && author.image !== "/images/authors/default.jpg" ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-30"></div>
                  <img
                    src={author.image}
                    alt={author.name || author.username}
                    onError={(e) => {
                      e.target.style.display = "none";
                      const fallback = e.target.nextElementSibling;
                      if (fallback) fallback.style.display = "flex";
                    }}
                    className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-2xl object-cover border-4 border-white dark:border-gray-700 shadow-xl"
                  />
                </div>
              ) : null}
              <div 
                className={`w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-xl ${
                  author.image && author.image !== "/images/authors/default.jpg" ? "hidden" : ""
                }`}
              >
                <span className="text-4xl sm:text-5xl lg:text-6xl text-blue-600 dark:text-blue-400 font-bold">
                  {(author.name || author.username)?.charAt(0).toUpperCase() || "?"}
                </span>
              </div>
            </div>

            {/* Author Info */}
            <div className="flex-1 w-full text-center lg:text-left min-w-0">
              <div className="flex flex-col items-center lg:items-start gap-3 mb-4">
                <div className="flex items-center gap-3 flex-wrap justify-center lg:justify-start">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>{author.username || author.username}</span>
                    {author.verified && (
                      <FaCheckCircle
                        className="text-blue-600 dark:text-blue-400 text-xl sm:text-2xl flex-shrink-0"
                        title="Verified Author"
                      />
                    )}
                  </h1>
                  {author.badge && (
                    <span className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold uppercase shadow-lg">
                      {author.badge}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">@{author.username}</p>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mt-4 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto lg:mx-0">
                "{author.bio}"
              </p>

              {/* ✅ Social Links */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3 mt-6">
                {social.github && social.github.trim() !== '' && (
                  <a
                    href={social.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm sm:text-base"
                  >
                    <FaGithub className="text-blue-600 dark:text-blue-400 text-base sm:text-lg" />
                    <span className="hidden sm:inline">GitHub</span>
                  </a>
                )}
                {social.linkedin && social.linkedin.trim() !== '' && (
                  <a
                    href={social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm sm:text-base"
                  >
                    <FaLinkedin className="text-blue-600 dark:text-blue-400 text-base sm:text-lg" />
                    <span className="hidden sm:inline">LinkedIn</span>
                  </a>
                )}
                {social.twitter && social.twitter.trim() !== '' && (
                  <a
                    href={social.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm sm:text-base"
                  >
                    <FaTwitter className="text-blue-600 dark:text-blue-400 text-base sm:text-lg" />
                    <span className="hidden sm:inline">Twitter</span>
                  </a>
                )}
                {social.website && social.website.trim() !== '' && (
                  <a
                    href={social.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm sm:text-base"
                  >
                    <FaGlobe className="text-blue-600 dark:text-blue-400 text-base sm:text-lg" />
                    <span className="hidden sm:inline">Website</span>
                  </a>
                )}
                {social.youtube && social.youtube.trim() !== '' && (
                  <a
                    href={social.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm sm:text-base"
                  >
                    <FaYoutube className="text-blue-600 dark:text-blue-400 text-base sm:text-lg" />
                    <span className="hidden sm:inline">YouTube</span>
                  </a>
                )}
                {social.facebook && social.facebook.trim() !== '' && (
                  <a
                    href={social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm sm:text-base"
                  >
                    <FaFacebook className="text-blue-600 dark:text-blue-400 text-base sm:text-lg" />
                    <span className="hidden sm:inline">Facebook</span>
                  </a>
                )}
                {social.instagram && social.instagram.trim() !== '' && (
                  <a
                    href={social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-sm sm:text-base"
                  >
                    <FaInstagram className="text-blue-600 dark:text-blue-400 text-base sm:text-lg" />
                    <span className="hidden sm:inline">Instagram</span>
                  </a>
                )}
              </div>
            </div>

            {/* ✅ Posts count */}
            <div className="flex-shrink-0 w-full lg:w-auto">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-full px-4 sm:px-6 py-2 sm:py-3 text-blue-600 dark:text-blue-400 text-sm sm:text-base font-semibold">
                <span>Posts</span>
                <span className="bg-blue-600 dark:bg-blue-500 text-white rounded-full px-2 sm:px-3 py-0.5 text-xs sm:text-sm font-bold">
                  {articles.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Author Posts Grid */}
        {articles.length > 0 ? (
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <span className="w-1 h-8 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></span>
              Published Articles ({articles.length})
            </h2>
            
            {/* Pagination calculation */}
            {(() => {
              const totalPages = Math.ceil(articles.length / articlesPerPage);
              const startIndex = (currentPage - 1) * articlesPerPage;
              const endIndex = startIndex + articlesPerPage;
              const currentArticles = articles.slice(startIndex, endIndex);

              const goToPage = (page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: "smooth" });
              };

              return (
                <>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentArticles.map((post) => (
                      <Link
                        to={`/blog/${toSlug(post.title)}`}
                        key={post._id || post.id}
                        className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden transform hover:-translate-y-2"
                      >
                        {/* Image Container */}
                        <div className="relative h-48 sm:h-56 overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800">
                          <img
                            src={post.thumbnail || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop"}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) =>
                              (e.target.src = "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop")
                            }
                          />
                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          {/* Category Badge */}
                          {post.category && (
                            <span className="absolute top-3 left-3 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full uppercase shadow-lg">
                              {post.category}
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-5 sm:p-6 space-y-4">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {post.title}
                          </h3>

                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg">
                              <FaCalendarAlt className="text-xs" />
                              <span className="font-medium">{getRelativeTime(post.publishedDate || post.date || post.createdAt)}</span>
                            </div>
                          </div>

                          <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base line-clamp-3 leading-relaxed">
                            {stripHtml(post.content)}
                          </p>

                          {/* Read More Indicator */}
                          <div className="pt-2 flex items-center text-blue-600 dark:text-blue-400 text-sm font-semibold group-hover:translate-x-2 transition-transform duration-300">
                            <span>Read More</span>
                            <span className="ml-2">→</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-10 flex flex-col items-center gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`px-4 py-2 rounded-lg border transition-colors ${
                            currentPage === 1
                              ? "text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                              : "text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-white dark:bg-gray-800"
                          }`}
                        >
                          Prev
                        </button>

                        {/* Page Numbers */}
                        {[...Array(totalPages)].map((_, i) => {
                          const page = i + 1;
                          // Show first page, last page, current page, and pages around current
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => goToPage(page)}
                                className={`w-10 h-10 rounded-lg border text-sm font-medium transition-colors ${
                                  page === currentPage
                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                                    : "text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-white dark:bg-gray-800"
                                }`}
                              >
                                {page}
                              </button>
                            );
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <span
                                key={page}
                                className="text-gray-400 dark:text-gray-600"
                              >
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}

                        <button
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`px-4 py-2 rounded-lg border transition-colors ${
                            currentPage === totalPages
                              ? "text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                              : "text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-white dark:bg-gray-800"
                          }`}
                        >
                          Next
                        </button>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {articles.length === 0 ? 0 : startIndex + 1}–
                        {Math.min(endIndex, articles.length)} of {articles.length} articles
                      </p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCalendarAlt className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Articles Yet</h3>
            <p className="text-gray-500 dark:text-gray-400">
              This author hasn't published any articles yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthorPage;
