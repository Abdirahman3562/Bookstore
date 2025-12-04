import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#f8f7f7] shadow-md rounded-md border border-gray-200 shaddow text-[#2563eb] py-6 mt-10">
      <div className="max-w-6xl mx-auto px-6 text-center">
        {/* Footer logo */}
        <div className="mb-4">
          <h3 className="text-3xl font-semibold">BookStore</h3>
        </div>

        {/* Footer Links */}
        <div className="flex justify-center gap-8 mb-4">
          <a href="/" className="hover:text-blue-600">Home</a>
          <a href="/books" className="hover:text-blue-600">Books</a>
          <a href="/about" className="hover:text-blue-600">About</a>
          <a href="/contact" className="hover:text-blue-600">Contact</a>
        </div>

        {/* Footer Text */}
        <p className="text-sm text-[#2563eb] mb-2">
          © 2025 BookStore. All rights reserved.
        </p>
        <p className="text-sm text-[#2563eb]">
          Powered by <a href="https://github.com/Abdirahmaan12" className="text-[#2563eb]">Samafale</a>
        </p>
      </div>
    </footer>
  );
}
