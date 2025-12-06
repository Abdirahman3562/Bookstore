import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaGlobe,
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaYoutube,
  FaFacebook,
  FaInstagram,
} from "react-icons/fa";
import RelatedArticles from "../components/Blog/RelatedArticles";
import CommentSection from "../components/Blog/CommentSection";

function SinglePostPage() {
  const { title } = useParams();
  const [article, setArticle] = useState(null);
  const [articles, setArticles] = useState([]);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorLoading, setAuthorLoading] = useState(false);
  const [authorPosts, setAuthorPosts] = useState([]);

  // Helper: format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Helper: create slug
  const toSlug = (str) => str?.toLowerCase().replace(/\s+/g, "-") ?? "";

  // 1️⃣ Load all blogs
  useEffect(() => {
    const loadBlogs = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:3000/api/blogs");
        if (!res.ok) throw new Error("Failed to load blogs");
        const response = await res.json();
        const data = response.data || [];

        // Filter only published blogs
        const publishedBlogs = data.filter(blog => blog.status === 'published');
        
        setArticles(publishedBlogs.map(blog => {
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
        }));
        
        const selected = publishedBlogs.find((b) => toSlug(b.title) === title);
        if (selected) {
          let thumbnailUrl = "/images/placeholder.jpg";
          if (selected.thumbnail && selected.thumbnail.trim() !== '') {
            // Check if it's base64
            if (selected.thumbnail.startsWith('data:image/')) {
              thumbnailUrl = selected.thumbnail;
            } else if (selected.thumbnail.startsWith('http://') || selected.thumbnail.startsWith('https://')) {
              thumbnailUrl = selected.thumbnail;
            } else if (selected.thumbnail.startsWith('/uploads/')) {
              thumbnailUrl = `http://localhost:3000${selected.thumbnail}`;
            } else if (selected.thumbnail.startsWith('uploads/')) {
              thumbnailUrl = `http://localhost:3000/${selected.thumbnail}`;
            } else {
              thumbnailUrl = `http://localhost:3000/uploads/${selected.thumbnail}`;
            }
          }
          
          setArticle({
            ...selected,
            id: selected._id || selected.id,
            date: selected.publishedDate || selected.date || selected.createdAt,
            thumbnail: thumbnailUrl,
            authorId: selected.authorId, // Preserve authorId for author lookup
          });
        } else {
          setArticle(null);
        }
      } catch (err) {
        console.error("Error loading article:", err);
      } finally {
        setLoading(false);
      }
    };

    loadBlogs();
  }, [title]);

  // 2️⃣ Load author info once article is found
  useEffect(() => {
    if (!article) return;

    const loadAuthor = async () => {
      try {
        setAuthorLoading(true);
        
        // Handle authorId - could be ObjectId, string, or nested object
        let authorIdValue = "";
        if (article.authorId) {
          if (typeof article.authorId === "string") {
            authorIdValue = article.authorId;
          } else if (article.authorId._id) {
            authorIdValue = article.authorId._id;
          } else if (article.authorId.toString) {
            authorIdValue = article.authorId.toString();
          }
        }
        
        // Check if authorId is already populated (object with name or username property)
        const isAuthorPopulated = article.authorId && typeof article.authorId === 'object' && (article.authorId.name || article.authorId.username);
        
        if (isAuthorPopulated) {
          // Use populated author data directly
          const authorData = article.authorId;
          let avatarUrl = "/images/authors/default.jpg";
          if (authorData.avatar && authorData.avatar.trim() !== '') {
            // Check if it's base64
            if (authorData.avatar.startsWith('data:image/')) {
              avatarUrl = authorData.avatar;
            } else if (authorData.avatar.startsWith('http://') || authorData.avatar.startsWith('https://')) {
              avatarUrl = authorData.avatar;
            } else if (authorData.avatar.startsWith('/uploads/')) {
              avatarUrl = `http://localhost:3000${authorData.avatar}`;
            } else if (authorData.avatar.startsWith('uploads/')) {
              avatarUrl = `http://localhost:3000/${authorData.avatar}`;
            } else {
              avatarUrl = `http://localhost:3000/uploads/${authorData.avatar}`;
            }
          }
          
          setAuthor({
            id: authorData._id || authorData.id,
            name: (authorData.name && authorData.name.trim() !== '') ? authorData.name : "Unknown Author",
            username: authorData.username,
            avatar: avatarUrl,
            bio: authorData.bio || "No bio available yet.",
            verified: authorData.verified || false,
            social: authorData.social || {},
          });
        } else {
          // Fetch authors and find matching one
          const res = await fetch("http://localhost:3000/api/authors");
          if (!res.ok) throw new Error("Failed to load authors");
          const response = await res.json();
          const authors = response.data || [];

          // Find author by comparing string values
          const matched = authors.find((a) => {
            const authorId = String(a._id || a.id || "");
            return authorId === authorIdValue;
          });

          if (matched) {
            let avatarUrl = "/images/authors/default.jpg";
            if (matched.avatar && matched.avatar.trim() !== '') {
              // Check if it's base64
              if (matched.avatar.startsWith('data:image/')) {
                avatarUrl = matched.avatar;
              } else if (matched.avatar.startsWith('http://') || matched.avatar.startsWith('https://')) {
                avatarUrl = matched.avatar;
              } else if (matched.avatar.startsWith('/uploads/')) {
                avatarUrl = `http://localhost:3000${matched.avatar}`;
              } else if (matched.avatar.startsWith('uploads/')) {
                avatarUrl = `http://localhost:3000/${matched.avatar}`;
              } else {
                avatarUrl = `http://localhost:3000/uploads/${matched.avatar}`;
              }
            }
            
            setAuthor({
              id: matched._id || matched.id,
              name: (matched.name && matched.name.trim() !== '') ? matched.name : "Unknown Author",
              username: matched.username,
              avatar: avatarUrl,
              bio: matched.bio || "No bio available yet.",
              verified: matched.verified || false,
              social: matched.social || {},
            });
          } else {
            setAuthor(null);
          }
        }
      } catch (err) {
        console.error("Error loading author:", err);
        setAuthor(null);
      } finally {
        setAuthorLoading(false);
      }
    };

    loadAuthor();
  }, [article]);

  // 3️⃣ Calculate number of posts by this author
  useEffect(() => {
    if (!author || !articles.length) return;
    const authorId = String(author._id || author.id || "");
    const posts = articles.filter((p) => {
      // Handle authorId - could be ObjectId, string, or nested object
      let postAuthorIdValue = "";
      if (p.authorId) {
        if (typeof p.authorId === "string") {
          postAuthorIdValue = p.authorId;
        } else if (p.authorId._id) {
          postAuthorIdValue = p.authorId._id;
        } else if (p.authorId.toString) {
          postAuthorIdValue = p.authorId.toString();
        }
      }
      return String(postAuthorIdValue) === authorId;
    });
    setAuthorPosts(posts);
  }, [author, articles]);

  // 4️⃣ Related posts (same category)
  const relatedPosts = article
    ? articles.filter(
        (p) => p.category === article.category && (p._id || p.id) !== (article._id || article.id)
      )
    : [];

  // Loading & not found states
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex justify-center items-center transition-colors duration-200">
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 dark:border-blue-400 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex justify-center items-center px-4 transition-colors duration-200">
        <div className="text-center bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 max-w-md">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCalendarAlt className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Article Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">The article you're looking for doesn't exist.</p>
          <Link
            to="/blog"
            className="inline-block px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-semibold"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const social = author?.social || {};

  return (
    <div className="w-full max-w-7xl mx-auto py-2 lg:px-4 md:px-4 px-2 mt-2 bg-white dark:bg-gray-900 min-h-screen transition-colors duration-200">
      {/* Thumbnail + Meta */}
      <div className="relative mb-8 w-full overflow-hidden">
        <img
          src={article.thumbnail || "/images/placeholder.jpg"}
          alt={article.title}
          className="w-full h-80 object-cover rounded-xl"
          onError={(e) => (e.target.src = "/images/placeholder.jpg")}
        />
        <div className="absolute top-4 right-4 px-4 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm rounded-full text-blue-600 dark:text-blue-400 shadow-md">
          <FaCalendarAlt className="inline text-blue-600 dark:text-blue-400 mr-1 mt-[-2px]" />
          {formatDate(article.date)}
        </div>
        <div className="absolute top-4 left-2 px-4 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-blue-600 dark:text-blue-400 text-sm font-semibold rounded-full shadow-md">
          {article.category}
        </div>
      </div>

      {/* Title + Author Info */}
      <div className="w-full px-2 lg:px-4 md:px-4">
        <h1 className="w-full lg:text-3xl md:text-3xl text-xl font-extrabold text-gray-900 dark:text-white mb-6 break-words">
          {article.title}
        </h1>

        <div className="flex items-center space-x-3">
          {author?.avatar && author.avatar !== "/images/authors/default.jpg" ? (
            <img
              src={author.avatar}
              alt={author?.name || article.authorName || "Author"}
              className="w-10 h-10 rounded-full object-cover border-2 border-blue-400 dark:border-blue-500 flex-shrink-0"
              onError={(e) => {
                e.target.style.display = "none";
                const fallback = e.target.nextElementSibling;
                if (fallback) fallback.style.display = "flex";
              }}
            />
          ) : null}
          <div 
            className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center border-2 border-blue-400 dark:border-blue-500 flex-shrink-0 ${
              author?.avatar && author.avatar !== "/images/authors/default.jpg" ? "hidden" : ""
            }`}
          >
            <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
              {author?.name ? author.name.charAt(0).toUpperCase() : "?"}
            </span>
          </div>
          <div className="flex flex-col mt-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
              <Link
                to={`/u/${
                  author?.username ||
                  article.authorName?.toLowerCase().replace(/\s+/g, "") ||
                  "unknown"
                }`}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {author?.username || article.authorName || "Unknown Author"}
              </Link>
              {author?.verified && (
                <FaCheckCircle
                  className="text-[18px] text-blue-600 dark:text-blue-400 ml-1"
                  title="Verified Author"
                />
              )}
            </span>
            <p className="flex items-center mt-1 text-[12px] text-blue-600 dark:text-blue-400 font-semibold gap-2">
              <FaCalendarAlt className="inline" />
              {formatDate(article.date)}
            </p>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="w-full px-2 lg:px-4 md:px-4">
        <div 
          className="prose prose-sm lg:prose-xl max-w-none w-full text-gray-700 dark:text-gray-300 mt-8 overflow-hidden break-words dark:prose-invert"
          style={{
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          <div
            className="w-full overflow-hidden"
            style={{
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
            dangerouslySetInnerHTML={{ 
              __html: (() => {
                const content = article.content || "";
                if (!content) return "";
                // Make images responsive - left aligned on mobile, centered on desktop
                return content.replace(
                  /<img([^>]*)>/gi,
                  '<img$1 class="block lg:mx-auto" style="max-width: 100%; height: auto; display: block; margin: 1rem 0; margin-left: 0; margin-right: auto;" />'
                );
              })()
            }}
          />
        </div>
      </div>

           {/* Author Profile Section */}
      <div className="mt-10 w-full px-4 sm:px-6 lg:px-8">
        {authorLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading author...</p>
            </div>
          </div>
        ) : author ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="flex flex-col lg:flex-row items-center lg:items-start p-6 sm:p-8 gap-6 lg:gap-8">
              {/* Author Avatar */}
              <div className="flex-shrink-0">
                {author.avatar && author.avatar !== "/images/authors/default.jpg" ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-30"></div>
                    <img
                      src={author.avatar}
                      alt={author.name}
                      className="relative w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-2xl object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                      onError={(e) => {
                        e.target.style.display = "none";
                        const fallback = e.target.nextElementSibling;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                  </div>
                ) : null}
                <div 
                  className={`w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-lg ${
                    author.avatar && author.avatar !== "/images/authors/default.jpg" ? "hidden" : ""
                  }`}
                >
                  <span className="text-3xl sm:text-4xl lg:text-5xl text-blue-600 dark:text-blue-400 font-bold">
                    {author.name ? author.name.charAt(0).toUpperCase() : "?"}
                  </span>
                </div>
              </div>

              {/* Author Info */}
              <div className="flex-1 w-full text-center lg:text-left min-w-0">
                <div className="flex flex-col items-center lg:items-start gap-2 mb-4">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="break-words">{author.username || author.username}</span>
                    {author.verified && (
                      <FaCheckCircle
                        className="text-blue-600 dark:text-blue-400 text-lg sm:text-xl flex-shrink-0"
                        title="Verified Author"
                      />
                    )}
                  </h2>
                  {author.username && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">@{author.username}</p>
                  )}
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 mt-4 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  "{author.bio || "No bio available yet."}"
                </p>

                {/* Social Links */}
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

              {/* Dynamic Post Count */}
              <div className="flex-shrink-0 w-full lg:w-auto">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-full px-4 sm:px-6 py-2 sm:py-3 text-blue-600 dark:text-blue-400 text-sm sm:text-base font-semibold">
                  <span>Posts</span>
                  <span className="bg-blue-600 dark:bg-blue-500 text-white rounded-full px-2 sm:px-3 py-0.5 text-xs sm:text-sm font-bold">
                    {authorPosts.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">Author details not found for this post.</p>
          </div>
        )}
      </div>

      {/* Related Posts */}
      <div className="w-full px-2 lg:px-4 md:px-4 mt-10">
        <RelatedArticles
          relatedPosts={relatedPosts}
          currentPostCategory={article.category}
        />
      </div>

      <div className="w-full px-2 lg:px-4 md:px-4 mt-10">
        <CommentSection />
      </div>
    </div>
  );
}

export default SinglePostPage;
