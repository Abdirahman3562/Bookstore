import React, { useEffect, useState } from "react";
import { FaQuoteRight, FaStar, FaExclamationTriangle } from "react-icons/fa";

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

 useEffect(() => {
  fetch("http://localhost:3000/api/testimonials")
    .then((res) => res.json())
    .then((responseData) => {
      // Handle backend response structure
      const data = responseData.data || [];
      
      // Filter only approved testimonials
      const approvedTestimonials = data.filter(t => t.status === 'approved');
      
      setTestimonials(approvedTestimonials);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Error fetching testimonials:", err);
      setError(true);
      setLoading(false);
    });
}, []);


  // Loading State with Spinner
  if (loading) {
    return (
      <section className="py-20">
        <div className="px-6 lg:px-0 md:px-0">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-4xl font-extrabold text-blue-600 dark:text-blue-400">
              What Book Lovers Say
            </h2>
            <div className="mt-2 h-1 w-24 bg-blue-600 dark:bg-blue-400 rounded-full mx-auto"></div>
          </div>
          
          {/* Loading Spinner */}
          <div className="flex flex-col items-center justify-center py-20">
            <svg
              className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400 mb-4"
              viewBox="0 0 50 50"
            >
              <circle
                className="opacity-25"
                cx="25"
                cy="25"
                r="20"
                stroke="currentColor"
                strokeWidth="5"
                fill="none"
              />
              <circle
                className="opacity-75"
                cx="25"
                cy="25"
                r="20"
                stroke="currentColor"
                strokeWidth="5"
                strokeDasharray="31.4 188.4"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Loading testimonials...</p>
          </div>
        </div>
      </section>
    );
  }

  // Error State with Beautiful Design
  if (error) {
    return (
      <section className="py-20">
        <div className="px-6 lg:px-0 md:px-0">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-4xl font-extrabold text-blue-600 dark:text-blue-400">
              What Book Lovers Say
            </h2>
            <div className="mt-2 h-1 w-24 bg-blue-600 dark:bg-blue-400 rounded-full mx-auto"></div>
          </div>
          
          {/* Error Message */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-8 max-w-md w-full shadow-lg">
              <div className="flex flex-col items-center text-center">
                <div className="bg-red-100 dark:bg-red-900/40 rounded-full p-4 mb-4">
                  <FaExclamationTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-red-900 dark:text-red-300 mb-2">
                  Oops! Something went wrong
                </h3>
                <p className="text-red-700 dark:text-red-400 mb-4">
                  We couldn't load the testimonials. Please try again later.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20">
      <div className=" px-6 lg:px-0 md:px-0">

        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-4xl font-extrabold text-blue-600 dark:text-blue-400">
            What Book Lovers Say
          </h2>
          <div className="mt-2 h-1 w-24 bg-blue-600 dark:bg-blue-400 rounded-full mx-auto"></div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => {
            // Construct image URL
            const imageUrl = t.img && !t.img.startsWith('http') 
              ? `http://localhost:3000${t.img.startsWith('/') ? t.img : `/${t.img}`}`
              : t.img;
            
            return (
              <div
                key={t._id || t.id}
                className="bg-[#edf4f5] dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 rounded-2xl p-6 shadow-sm hover:shadow-md transition relative"
              >
                {/* Stars */}
                <div className="flex gap-1 text-blue-600 dark:text-blue-400 mb-3">
                  {[...Array(5)].map((_, idx) => {
                    const rating = t.rating || 5;
                    const isFilled = idx < rating;
                    return (
                      <FaStar 
                        key={idx} 
                        className={isFilled ? 'text-blue-600 dark:text-blue-400' : 'text-gray-300 dark:text-gray-600'} 
                      />
                    );
                  })}
                </div>

                {/* Tag */}
                <span className="inline-block text-xs font-semibold text-blue-600 dark:text-blue-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full mb-4">
                  {t.tag}
                </span>

                {/* Quote */}
                <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed relative">
                  "{t.quote}"
                </p>
                <FaQuoteRight className="absolute text-5xl text-gray-200 dark:text-gray-700 top-4 right-4" />

                {/* Author */}
                <div className="flex items-center gap-4 mt-6">
                  <img
                    src={imageUrl}
                    alt={t.name}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/48';
                    }}
                  />
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{t.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
