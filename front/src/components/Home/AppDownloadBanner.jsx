import { FaApple, FaGooglePlay } from "react-icons/fa";

export default function AppDownloadBanner() {
  return (
    <div className="bg-[#2563eb] dark:bg-gray-800 rounded-md mt-10 py-8 px-2 m-4 lg:m-0 md:m-0 text-center text-white dark:text-white transition-colors duration-200">
      <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-6 max-w-2xl mx-auto text-white dark:text-white">
        Read your Bookshop.org ebooks anytime, anywhere with the free
        Bookshop.org apps for iOS and Android.
      </h2>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
        
        {/* App Store Button */}
        <button className="flex items-center gap-3 bg-black dark:bg-gray-700 text-white dark:text-white py-3 px-5 rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors duration-200 w-56 justify-center">
          <FaApple size={28} className="text-white dark:text-white" />
          <div className="text-left">
            <p className="text-xs leading-none text-white dark:text-gray-300">Download on the</p>
            <p className="text-sm font-bold leading-none text-white dark:text-white">App Store</p>
          </div>
        </button>

        {/* Google Play Button */}
        <button className="flex items-center gap-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-white py-3 px-5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 w-56 justify-center">
          <FaGooglePlay size={26} className="text-[#34A853] dark:text-[#34A853]" />
          <div className="text-left">
            <p className="text-xs leading-none text-gray-600 dark:text-gray-300">GET IT ON</p>
            <p className="text-sm font-bold leading-none text-gray-800 dark:text-white">Google Play</p>
          </div>
        </button>

      </div>
    </div>
  );
}
