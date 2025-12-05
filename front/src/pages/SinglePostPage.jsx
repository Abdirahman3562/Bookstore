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
      <div className="min-h-screen flex justify-center items-center text-gray-500">
        Loading article...
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-500">
        Article not found.
      </div>
    );
  }

  const social = author?.social || {};

  return (
    <div className="w-full max-w-7xl mx-auto py-2 lg:px-4 md:px-4 px-2 mt-2">
      {/* Thumbnail + Meta */}
      <div className="relative mb-8 w-full overflow-hidden">
        <img
          src={article.thumbnail || "/images/placeholder.jpg"}
          alt={article.title}
          className="w-full h-80 object-cover rounded-xl"
          onError={(e) => (e.target.src = "/images/placeholder.jpg")}
        />
        <div className="absolute top-4 right-4 px-4 py-1 bg-blue-100 text-sm rounded-full text-blue-600 shadow-md">
          <FaCalendarAlt className="inline text-blue-600 mr-1 mt-[-2px]" />
          {formatDate(article.date)}
        </div>
        <div className="absolute top-4 left-2 px-4 py-1 bg-blue-100 text-blue-600 text-sm font-semibold rounded-full shadow-md">
          {article.category}
        </div>
      </div>

      {/* Title + Author Info */}
      <div className="w-full px-2 lg:px-4 md:px-4">
        <h1 className="w-full lg:text-3xl md:text-3xl text-xl font-extrabold text-gray-900 mb-6 break-words">
          {article.title}
        </h1>

        <div className="flex items-center space-x-3">
          {author?.avatar && author.avatar !== "/images/authors/default.jpg" ? (
            <img
              src={author.avatar}
              alt={author?.name || article.authorName || "Author"}
              className="w-10 h-10 rounded-full object-cover border border-gray-300 flex-shrink-0"
              onError={(e) => {
                e.target.style.display = "none";
                const fallback = e.target.nextElementSibling;
                if (fallback) fallback.style.display = "flex";
              }}
            />
          ) : null}
          <div 
            className={`w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300 flex-shrink-0 ${
              author?.avatar && author.avatar !== "/images/authors/default.jpg" ? "hidden" : ""
            }`}
          >
            <span className="text-xs text-gray-500 font-semibold">
              {author?.name ? author.name.charAt(0).toUpperCase() : "?"}
            </span>
          </div>
          <div className="flex flex-col mt-2 text-sm text-gray-600">
            <span className="font-medium text-gray-900 flex items-center gap-1">
              <Link
                to={`/u/${
                  author?.username ||
                  article.authorName?.toLowerCase().replace(/\s+/g, "") ||
                  "unknown"
                }`}
                className="hover:text-blue-600"
              >
                {author?.username || article.authorName || "Unknown Author"}
              </Link>
              {author?.verified && (
                <FaCheckCircle
                  className="text-[18px] text-blue-600 ml-1"
                  title="Verified Author"
                />
              )}
            </span>
            <p className="flex items-center mt-1 text-[12px] text-blue-600 font-semibold gap-2">
              <FaCalendarAlt className="inline" />
              {formatDate(article.date)}
            </p>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="w-full px-2 lg:px-4 md:px-4">
        <div 
          className="prose prose-sm lg:prose-xl max-w-none w-full text-gray-700 mt-8 overflow-hidden break-words"
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
      <div className="mt-10 w-full px-2 lg:px-4 md:px-4">
        {authorLoading ? (
          <div className="text-gray-500">Loading author...</div>
        ) : author ? (
          <div className="flex flex-col md:flex-row items-center md:items-start hover:shadow-md rounded-xl shadow-md p-4 md:p-6 w-full overflow-hidden">
            {/* Author Avatar */}
            <div className="flex-shrink-0 mb-4 md:mb-0">
              {author.avatar && author.avatar !== "/images/authors/default.jpg" ? (
                <img
                  src={author.avatar}
                  alt={author.name}
                  className="w-32 h-32 md:w-56 md:h-56 rounded-xl object-cover border-emerald-500"
                  onError={(e) => {
                    e.target.style.display = "none";
                    const fallback = e.target.nextElementSibling;
                    if (fallback) fallback.style.display = "flex";
                  }}
                />
              ) : null}
              <div 
                className={`w-32 h-32 md:w-56 md:h-56 rounded-xl bg-gray-200 flex items-center justify-center border border-emerald-500 ${
                  author.avatar && author.avatar !== "/images/authors/default.jpg" ? "hidden" : ""
                }`}
              >
                <span className="text-2xl md:text-4xl text-gray-500 font-semibold">
                  {author.name ? author.name.charAt(0).toUpperCase() : "?"}
                </span>
              </div>
            </div>

            {/* Author Info */}
            <div className="flex-1 w-full md:ml-6 mt-4 md:mt-0 px-2 lg:px-4 md:px-4 min-w-0 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 w-full">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-1 break-words">
                  {author.username}
                  {author.verified && (
                    <FaCheckCircle
                      className="text-blue-600 text-lg flex-shrink-0"
                      title="Verified Author"
                    />
                  )}
                </h2>
              </div>
              {author.username && (
                <p className="text-gray-600 mt-1 break-words">@{author.username}</p>
              )}
              <p className="text-gray-700 mt-4 w-full break-words">
                "{author.bio || "No bio available yet."}"
              </p>

              {/* Social Links */}
              <div className="flex flex-wrap gap-2 mt-6 w-full">
                {social.github && social.github.trim() !== '' && (
                  <a
                    href={social.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-200 hover:border-blue-400 rounded-md text-gray-700 hover:bg-blue-100 transition"
                  >
                    <FaGithub className="text-blue-600 text-lg" />
                    <span>GitHub</span>
                  </a>
                )}
                {social.linkedin && social.linkedin.trim() !== '' && (
                  <a
                    href={social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-200 hover:border-blue-400 rounded-md text-gray-700 hover:bg-blue-100 transition"
                  >
                    <FaLinkedin className="text-blue-600 text-lg" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {social.twitter && social.twitter.trim() !== '' && (
                  <a
                    href={social.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-200 hover:border-blue-400 rounded-md text-gray-700 hover:bg-blue-100 transition"
                  >
                    <FaTwitter className="text-blue-600 text-lg" />
                    <span>Twitter</span>
                  </a>
                )}
                {social.website && social.website.trim() !== '' && (
                  <a
                    href={social.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-200 hover:border-blue-400 rounded-md text-gray-700 hover:bg-blue-100 transition"
                  >
                    <FaGlobe className="text-blue-600 text-lg" />
                    <span>Website</span>
                  </a>
                )}
                {social.youtube && social.youtube.trim() !== '' && (
                  <a
                    href={social.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-200 hover:border-blue-400 rounded-md text-gray-700 hover:bg-blue-100 transition"
                  >
                    <FaYoutube className="text-blue-600 text-lg" />
                    <span>YouTube</span>
                  </a>
                )}
                {social.facebook && social.facebook.trim() !== '' && (
                  <a
                    href={social.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-200 hover:border-blue-400 rounded-md text-gray-700 hover:bg-blue-100 transition"
                  >
                    <FaFacebook className="text-blue-600 text-lg" />
                    <span>Facebook</span>
                  </a>
                )}
                {social.instagram && social.instagram.trim() !== '' && (
                  <a
                    href={social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-200 hover:border-blue-400 rounded-md text-gray-700 hover:bg-blue-100 transition"
                  >
                    <FaInstagram className="text-blue-600 text-lg" />
                    <span>Instagram</span>
                  </a>
                )}
              </div>
            </div>

            {/* ✅ Dynamic Post Count */}
            <div className="mt-4 md:mt-0 md:ml-6 mb-2 md:mb-0 text-blue-600 text-sm font-semibold border border-blue-600 rounded-full px-4 py-2 flex-shrink-0 self-center md:self-start">
              Posts{" "}
              <span className="ml-1 text-blue-600">
                ({authorPosts.length})
              </span>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">
            Author details not found for this post.
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
