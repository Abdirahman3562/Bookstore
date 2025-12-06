import React from 'react';
import { Link } from 'react-router-dom'; // You can replace with actual link to page if needed

export default function EbookAd() {
  return (
    <div className="bg-blue-100 dark:bg-gray-800 dark:border dark:border-gray-700 lg:p-4 md:p-4 px-6 rounded-lg shadow-lg mt-5 transition-colors duration-200">
      <div className="flex flex-col lg:flex-row items-center mt-6">
        {/* Text Section */}
        <div className="flex flex-col lg:mr-8 order-2 lg:order-1">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-white">
            Ebooks - Now Available from Bookshop.org
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-4">
            Buy Ebooks. Support Local Bookstores.
          </p>
          <p className="mt-4 text-gray-700 dark:text-gray-300">
            Finally, we can get ebooks from local bookstores! Browse and buy on Bookshop.org, and read right in your web browser, or download our iPhone or Android apps for the full reading experience. Every purchase financially supports local, independent bookstores! Have questions?{' '}
            <Link to="/learn-more" className="text-blue-500 dark:text-blue-400 hover:underline">
              Click here to learn more!
            </Link>
          </p>
        </div>

        {/* Image Section */}
        <div className="flex justify-center order-1 lg:order-2 mt-6 lg:mt-0">
          <img
            src="../../public/images/ebook-phone-mock-angle.png"
            alt="Ebooks on mobile"
            className="w-[1300px]  h-auto rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
