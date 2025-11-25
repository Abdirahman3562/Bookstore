import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaGlobe,
  FaGithub,
  FaLinkedin,
  FaTwitter,
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
        const res = await fetch("http://localhost:5006/blogs");
        if (!res.ok) throw new Error("Failed to load blogs");
        const data = await res.json();

        setArticles(data);
        const selected = data.find((b) => toSlug(b.title) === title);
        setArticle(selected || null);
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
        const res = await fetch("http://localhost:5005/authors");
        if (!res.ok) throw new Error("Failed to load authors");
        const authors = await res.json();

        const matched = authors.find(
          (a) => Number(a.id) === Number(article.authorId)
        );

        setAuthor(matched || null);
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
    const posts = articles.filter(
      (p) => Number(p.authorId) === Number(author.id)
    );
    setAuthorPosts(posts);
  }, [author, articles]);

  // 4️⃣ Related posts (same category)
  const relatedPosts = article
    ? articles.filter(
        (p) => p.category === article.category && p.id !== article.id
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
    <div className=" py-2 lg:px-0 md:px-0 px-2 mt-2">
      {/* Thumbnail + Meta */}
      <div className="relative mb-8">
        <img
          src={article.thumbnail}
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
      <div className=" px-2">
        <h1 className="w-full lg:text-3xl  md:text-3xl text-2xl font-extrabold text-gray-900 mb-6">
          {article.title}
        </h1>

        <div className="flex items-center space-x-3">
          <img
            src={
              author?.avatar ||
              article.authorImage ||
              "/images/authors/default.jpg"
            }
            alt={author?.name || article.authorName || "Author"}
            className="w-10 h-10 rounded-full object-cover border border-gray-300"
            onError={(e) => (e.target.src = "/images/authors/default.jpg")}
          />
          <div className="flex flex-col mt-2 text-sm text-gray-600">
            <span className="font-medium text-gray-900 flex items-center gap-1">
              <Link
                to={`/u/${
                  author?.username ||
                  article.authorName?.toLowerCase().replace(/\s+/g, "")
                }`}
                className="hover:text-blue-600"
              >
                {author?.name || article.authorName || "Unknown Author"}
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
      <div className="prose lg:prose-2xl  p-4 lg:p-0 md:p-0     text-gray-700 mt-8 max-w-4xl mx-auto">
        {article.content}
      </div>

      {/* Author Profile Section */}
      <div className="mt-10 ">
        {authorLoading ? (
          <div className="text-gray-500">Loading author...</div>
        ) : author ? (
          <div className="flex flex-col md:flex-row  items-center md:items-start hover:shadow-md    rounded-xl shadow-md">
            {/* Author Avatar */}
            <img
              src={author.avatar || "/images/authors/default.jpg"}
              alt={author.name}
              className="w-56 h-56 rounded-xl object-cover border-emerald-500"
              onError={(e) => (e.target.src = "/images/authors/default.jpg")}
            />

            {/* Author Info */}
            <div className="flex-1   md:ml-6 mt-4 md:mt-0 px-20 lg:px-0 md:px-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                  {author.name}
                  {author.verified && (
                    <FaCheckCircle
                      className="text-blue-600 text-lg "
                      title="Verified Author"
                    />
                  )}
                </h2>
              </div>
              <p className="text-gray-600 mt-1">@{author.username}</p>
              <p className="text-gray-700 mt-4 max-w-xl">
                "{author.bio || "No bio available yet."}"
              </p>

              {/* Social Links */}
              <div className="flex flex-wrap gap-2 mt-6">
                {social.github && (
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
                {social.linkedin && (
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
                {social.twitter && (
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
                {social.website && (
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
              </div>
            </div>

            {/* ✅ Dynamic Post Count */}
            <div className="mt-6 mr-2   mb-2 md:mt-0 md:ml-6 text-blue-600 text-sm font-semibold border border-blue-600 rounded-full px-4 py-2">
              Posts{" "}
              <span className="ml-1  text-blue-600">
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
      <RelatedArticles
        relatedPosts={relatedPosts}
        currentPostCategory={article.category}
      />

      <CommentSection />
    </div>
  );
}

export default SinglePostPage;
