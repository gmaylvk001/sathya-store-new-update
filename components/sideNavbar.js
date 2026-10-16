'use client'; // if using in app directory (Next.js 13+)
 
import { useState } from 'react';
import Link from 'next/link';
 
export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
 
  const toggleMenu = () => setIsOpen(!isOpen);
 
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 lg:flex lg:items-center lg:justify-between">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-[#d72828]">
          MyLogo
        </Link>
        <button
          className="text-gray-700 lg:hidden focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
            />
          </svg>
        </button>
      </div>
 
      <div
        className={`lg:flex flex-col lg:flex-row lg:items-center lg:space-x-6 ${
          isOpen ? 'block' : 'hidden'
        }`}
      >
        <Link href="/" className="block px-2 py-2 text-gray-600 hover:text-[#d72828]">
          Home
        </Link>
        <Link href="/about" className="block px-2 py-2 text-gray-600 hover:text-[#d72828]">
          About Us
        </Link>
        <Link href="/services" className="block px-2 py-2 text-gray-600 hover:text-[#d72828]">
          Services
        </Link>
        <Link href="/pricing" className="block px-2 py-2 text-gray-600 hover:text-[#d72828]">
          Pricing
        </Link>
        <Link href="/contact" className="block px-2 py-2 text-gray-600 hover:text-[#d72828]">
          Contact
        </Link>
 
        <div className="mt-4 lg:mt-0 lg:ml-auto flex space-x-4">
          <Link href="/signin" className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg">
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm font-semibold text-white bg-[#d72828] hover:bg-[#d72828] rounded-lg"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
}