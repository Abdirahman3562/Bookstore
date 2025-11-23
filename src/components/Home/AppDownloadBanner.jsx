import { FaApple, FaGooglePlay } from "react-icons/fa";

export default function AppDownloadBanner() {
  return (
    <div className="bg-[#2563eb] mt-10 py-8 px-4 text-center text-white">
      <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-6 max-w-2xl mx-auto">
        Read your Bookshop.org ebooks anytime, anywhere with the free
        Bookshop.org apps for iOS and Android.
      </h2>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
        
        {/* App Store Button */}
        <button className="flex items-center gap-3 bg-black text-white py-3 px-5 rounded-lg hover:bg-gray-900 transition w-56 justify-center">
          <FaApple size={28} />
          <div className="text-left">
            <p className="text-xs leading-none">Download on the</p>
            <p className="text-sm font-bold leading-none">App Store</p>
          </div>
        </button>

        {/* Google Play Button */}
        <button className="flex items-center gap-3 bg-white text-gray-800 py-3 px-5 rounded-lg hover:bg-gray-100 transition w-56 justify-center">
          <FaGooglePlay size={26} className="text-[#34A853]" />
          <div className="text-left">
            <p className="text-xs leading-none">GET IT ON</p>
            <p className="text-sm font-bold leading-none">Google Play</p>
          </div>
        </button>

      </div>
    </div>
  );
}
