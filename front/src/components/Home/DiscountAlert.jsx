import { useState } from "react";
import { FiTag } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function DiscountAlert() {
  const navigate = useNavigate();

  return (
    <div
      className="
        w-full bg-[#2563eb] text-white py-3 px-4 flex items-center gap-3
        text-sm md:text-base relative overflow-hidden
      "
    >
      {/* Icon */}
      <FiTag size={22} className="text-yellow-300 flex-shrink-0" />

      {/* Sliding Text */}
      <div className="overflow-hidden whitespace-nowrap w-full">
        <p className="font-medium inline-block animate-marquee">
          <span className="font-bold text-yellow-300">Qiimo Dhimis! </span>
          Buugaag badan waxay ku jiraan sale 🔥 — Ka faa’iidayso maanta!
          &nbsp;&nbsp;&nbsp;
        </p>
      </div>

      {/* BUY NOW Button */}
      <button
        onClick={() => navigate("/books")}
        className="absolute right-4 bg-white text-blue-600 flex items-center gap-1 
        font-semibold px-3 py-1 rounded-full shadow hover:bg-gray-200 transition"
      >
        <FiTag size={16} className="text-blue-600" />
        Buy Now
      </button>
    </div>
  );
}
