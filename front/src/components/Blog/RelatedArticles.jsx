import { ArrowRight, BookOpen } from "lucide-react";
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

  // Helper: Get thumbnail URL (same logic as SinglePostPage)
  const getThumbnailUrl = (thumbnail) => {
    if (!thumbnail || thumbnail.trim() === '') {
      return "/images/placeholder.jpg";
    }
    
    // Check if it's base64
    if (thumbnail.startsWith('data:image/')) {
      return thumbnail;
    }
    // Check if it's a full URL
    if (thumbnail.startsWith('http://') || thumbnail.startsWith('https://')) {
      return thumbnail;
    }
    // Check if it starts with /uploads/
    if (thumbnail.startsWith('/uploads/')) {
      return `http://localhost:3000${thumbnail}`;
    }
    // Check if it starts with uploads/
    if (thumbnail.startsWith('uploads/')) {
      return `http://localhost:3000/${thumbnail}`;
    }
    // Default: assume it's in uploads folder
    return `http://localhost:3000/uploads/${thumbnail}`;
  };

  return (
    <div className="mt-12 rounded-2xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-8 border border-gray-200 dark:border-gray-700 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Related Articles
        </h2>
      </div>

      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPosts.map((post) => (
            <Link
              key={post._id || post.id}
              to={`/blog/${toSlug(post.title)}`}
              className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Image Container */}
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-800">
                <img
                  src={getThumbnailUrl(post.thumbnail)}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop";
                  }}
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {post.title}
                </h3>
                
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <FaCalendarAlt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>
                    {new Date(post.publishedDate || post.date || post.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {/* Arrow Icon */}
                <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 group-hover:translate-x-2 transition-transform duration-300">
                  <span className="text-sm font-semibold mr-2">Read More</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No related articles found in this category.
          </p>
        </div>
      )}

      {/* View All Button */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <span>View all articles</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
