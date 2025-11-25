import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaGlobe,
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaCheckCircle,
} from "react-icons/fa";

function AuthorPage() {
  const { username } = useParams();
  const [author, setAuthor] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Helper: convert title to slug
  const toSlug = (str) => str?.toLowerCase().trim().replace(/\s+/g, "-") ?? "";

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
        const aRes = await fetch("http://localhost:5005/authors");
        if (!aRes.ok) throw new Error("Failed to load authors");
        const aData = await aRes.json();

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

        setAuthor({
          id: found.id,
          username: found.username,
          name: found.name,
          image: found.avatar,
          bio: found.bio || "No bio available yet.",
          verified: !!found.verified,
          badge: found.badge || null,
          social: found.social || {},
        });

        // 2️⃣ Fetch blogs and filter by authorId or username
        const pRes = await fetch("http://localhost:5006/blogs");
        if (!pRes.ok) throw new Error("Failed to load blogs");
        const blogs = await pRes.json();

        const posts = blogs.filter(
          (p) =>
            Number(p.authorId) === Number(found.id) ||
            p.authorName?.toLowerCase().replace(/\s+/g, "") ===
              found.username?.toLowerCase()
        );

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
  }, [username]);

  // 🕓 Loading state
  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-500">
        Loading author…
      </div>
    );
  }

  // ❌ Author not found
  if (!author) {
    return (
      <div className="text-center mt-12 text-gray-500">
        Author not found.
      </div>
    );
  }

  const social = author.social || {};

  return (
    <div className=" lg:px-0 md:px-0 border border-gray-100  rounded-md px-6 py-12 space-y-10 mt-6">
      {/* ✅ Author Profile Section */}
      <div className="flex flex-col md:flex-row items-center md:items-start bg-white p-6 rounded-xl shadow-md">
        <img
          src={author.image || "/images/authors/default.jpg"}
          alt={author.name}
          onError={(e) => (e.target.src = "/images/authors/default.jpg")}
          className="w-56 h-56 rounded-xl object-cover "
        />

        <div className="flex-1 ml-12 md:ml-6 mt-4 md:mt-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-1">
              {author.name}
              {author.verified && (
                <FaCheckCircle
                  className="text-blue-600 text-lg"
                  title="Verified Author"
                />
              )}
            </h1>
            {author.badge && (
              <span className="mt-2 sm:mt-0 inline-block bg-blue-100 text-white px-3 py-1 rounded-full text-sm font-semibold uppercase">
                {author.badge}
              </span>
            )}
          </div>

          <p className="text-gray-600 mt-1">@{author.username}</p>
          <p className="text-gray-700 mt-2 max-w-xl mr-5">"{author.bio}"</p>

          {/* ✅ Social Links */}
          <div className="flex flex-wrap gap-2 mt-6">
            {social.website && (
              <a
                href={social.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 border border-blue-100 hover:border-blue-400 rounded-md text-gray-700 hover:bg-blue-100 transition"
              >
                <FaGlobe className="text-gray-500 text-lg" />
                <span>Website</span>
              </a>
            )}
            {social.github && (
              <a
                href={social.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 border border-blue-100 hover:border-blue-400 rounded-md text-gray-700 hover:bg-blue-100 transition"
              >
                <FaGithub className="text-gray-800 text-lg" />
                <span>GitHub</span>
              </a>
            )}
            {social.linkedin && (
              <a
                href={social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 border border-blue-100 hover:border-blue-400 rounded-md text-gray-700 hover:bg-blue-100 transition"
              >
                <FaLinkedin className="text-blue-700 text-lg" />
                <span>LinkedIn</span>
              </a>
            )}
            {social.twitter && (
              <a
                href={social.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 border border-blue-100 hover:border-blue-400 rounded-md text-gray-700 hover:bg-blue-100 transition"
              >
                <FaTwitter className="text-blue-400 text-lg" />
                <span>Twitter</span>
              </a>
            )}
          </div>
        </div>

        {/* ✅ Posts count */}
        <div className="mt-6 md:mt-0 md:ml-6 text-blue-600 text-sm font-semibold border border-blue-400 rounded-full px-4 py-2">
          Posts{" "}
          <span className="ml-1 text-blue-600">({articles.length})</span>
        </div>
      </div>

      {/* ✅ Author Posts Grid */}
      {articles.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((post) => (
            <Link
              to={`/blog/${toSlug(post.title)}`}
              key={post.id}
              className="relative bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-blue-100 overflow-hidden group"
            >
              <img
                src={
                  post.thumbnail || "/images/placeholders/article-thumb.jpg"
                }
                alt={post.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                onError={(e) =>
                  (e.target.src = "/images/placeholders/article-thumb.jpg")
                }
              />

              {post.category && (
                <span className="absolute top-3 left-3 bg-blue-100 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full uppercase shadow-sm">
                  {post.category}
                </span>
              )}

              <div className="p-5 space-y-3">
                <h3 className="text-lg font-bold text-gray-900 leading-snug line-clamp-2">
                  {post.title}
                </h3>

                <div className="inline-flex items-center gap-1 text-xs font-medium bg-blue-100 text-blue-600 px-2 py-1 rounded-md shadow-sm">
                  <FaCalendarAlt className="text-[12px]" />
                  <span>{getRelativeTime(post.date)}</span>
                </div>

                <p className="text-gray-700 text-sm line-clamp-3 leading-relaxed">
                  {post.content}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center mt-8">
          This author hasn’t published any articles yet.
        </p>
      )}
    </div>
  );
}

export default AuthorPage;
