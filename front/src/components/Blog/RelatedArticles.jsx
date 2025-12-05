import { ArrowRight } from "lucide-react";
import { FaCalendarAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function RelatedArticles({
  relatedPosts = [],
  currentPostCategory,
  currentPostId,
}) {
  // Filter related posts by same category but exclude current post
  const filteredPosts = relatedPosts.filter(
    (post) => post.category === currentPostCategory && (post._id || post.id) !== currentPostId
  );

  // Helper: slugify title
  const toSlug = (str) => str?.toLowerCase().trim().replace(/\s+/g, "-") ?? "";

  return (
    <div className="mt-12 rounded-xl bg-white p-6 border border-gray-200  shadow-sm">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center">
        Related Articles
      </h2>

      {filteredPosts.length > 0 ? (
        <ul className="space-y-6">
          {filteredPosts.map((post) => (
            <li
              key={post._id || post.id}
              className="flex items-center gap-4 hover:bg-blue-100 transition-all duration-300 rounded-lg p-2"
            >
              {/* Thumbnail */}
              <Link
                to={`/blog/${toSlug(post.title)}`}
                className="flex-shrink-0"
              >
                <img
                  src={
                    post.thumbnail?.startsWith('http') 
                      ? post.thumbnail 
                      : post.thumbnail 
                        ? `http://localhost:3000${post.thumbnail.startsWith('/') ? post.thumbnail : `/${post.thumbnail}`}`
                        : "/images/placeholders/article-thumb.jpg"
                  }
                  alt={post.title}
                  className="w-20 h-14 object-cover rounded-md border border-blue-200"
                  onError={(e) =>
                    (e.target.src = "/images/placeholders/article-thumb.jpg")
                  }
                />
              </Link>

              {/* Title + Date */}
              <div className="flex-1 min-w-0">
                <Link
                  to={`/blog/${toSlug(post.title)}`}
                  className="text-gray-900 font-medium hover:text-blue-600 block truncate"
                  title={post.title}
                >
                  {post.title}
                </Link>
                <p className="text-xs text-blue-600  mt-1 flex items-center gap-1">
                  <FaCalendarAlt className="inline" />
                  {new Date(post.publishedDate || post.date || post.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>

              {/* Arrow Button */}
              <Link
                to={`/blog/${toSlug(post.title)}`}
                className="text-blue-600 hover:text-blue-700 transition"
                aria-label={`Read more about ${post.title}`}
              >
                <ArrowRight className="w-5 h-5" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500 mt-6">
          No related articles found in this category.
        </p>
      )}

      {/* View All Button */}
      <div className="mt-8">
        <Link
          to="/blog"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold"
        >
          View all articles
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
    </div>
  );
}
