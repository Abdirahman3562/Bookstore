import { useState } from "react";
import { FiTag } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function DiscountAlert() {
  const navigate = useNavigate();

  return (
    <div
      className="
        w-full bg-[#2563eb] dark:bg-gray-900 text-white dark:text-white py-3 px-4 flex items-center gap-3
        text-sm md:text-base relative overflow-hidden transition-colors duration-200
      "
    >
      {/* Icon */}
      <FiTag size={22} className="text-yellow-300 dark:text-yellow-400 flex-shrink-0" />

      {/* Sliding Text */}
      <div className="overflow-hidden whitespace-nowrap w-full">
        <p className="font-medium inline-block animate-marquee text-white dark:text-white">
          <span className="font-bold text-yellow-300 dark:text-yellow-400">Qiimo Dhimis! </span>
          Buugaag badan waxay ku jiraan sale 🔥 — Ka faa'iidayso maanta!
          &nbsp;&nbsp;&nbsp;
        </p>
      </div>

      {/* BUY NOW Button */}
      <button
        onClick={() => navigate("/books")}
        className="absolute right-4 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 flex items-center gap-1 
        font-semibold px-3 py-1 rounded-full shadow hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
      >
        <FiTag size={16} className="text-blue-600 dark:text-blue-300" />
        Buy Now
      </button>
    </div>
  );
}
