"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FaSearch } from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ products: [], pages: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  // Mock search implementation (replace with real API call if needed)
  const fetchResults = useCallback(
    async (q) => {
      if (!q) return { products: [], pages: [] };

      const allProducts = [
        { id: "1", name: "Apple iPhone 15 Pro", price: 129900, image: "/images/iphone15.jpg" },
        { id: "2", name: "Apple iPhone 14", price: 79900, image: "/images/iphone14.jpg" },
        { id: "3", name: "Samsung Galaxy S24", price: 99999, image: "/images/s24.jpg" },
        { id: "4", name: "Miob Air Fryer", price: 4999, image: "/images/airfryer.jpg" },
        { id: "5", name: "Sony Headphones", price: 4990, image: "/images/headphones.jpg" },
      ];

      const allPages = [
        { id: "p1", title: "How to Choose a Smartphone", url: "/blog/choose-smartphone" },
        { id: "p2", title: "Best Air Fryers 2025", url: "/blog/best-air-fryers" },
        { id: "p3", title: "Camera Buying Guide", url: "/blog/camera-guide" },
      ];

      const qLower = q.toLowerCase();

      const matchedProducts = allProducts.filter((p) => p.name.toLowerCase().includes(qLower));
      const matchedPages = allPages.filter((pg) => pg.title.toLowerCase().includes(qLower));

      // simulate small latency
      await new Promise((r) => setTimeout(r, 80));

      return { products: matchedProducts, pages: matchedPages };
    },
    []
  );

  // Debounced search effect
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults({ products: [], pages: [] });
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await fetchResults(query);
        setResults(data);
        setShowDropdown(true);
      } catch (err) {
        console.error("Search error", err);
        setResults({ products: [], pages: [] });
        setShowDropdown(true);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query, fetchResults]);

  // Hide on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const highlight = (text, q) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + q.length);
    const after = text.slice(idx + q.length);
    return (
      <>
        {before}
        <span className="text-[#d72828] font-semibold">{match}</span>
        {after}
      </>
    );
  };

  const onProductClick = (id) => {
    setShowDropdown(false);
    setQuery("");
    router.push(`/product/${id}`);
  };

  const onPageClick = (url) => {
    setShowDropdown(false);
    setQuery("");
    router.push(url);
  };

  return (
    <div ref={containerRef} className="relative w-full sm:max-w-[400px]">
      <div className="flex items-center bg-white border rounded-lg shadow-sm focus-within:shadow-md overflow-hidden">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products, pages..."
          className="flex-1 px-3 py-2 text-sm outline-none"
          aria-label="Search"
          onFocus={() => {
            if (query.length >= 2) setShowDropdown(true);
          }}
        />
        <button
          type="button"
          className="px-3 text-gray-600"
          onClick={() => {
            if (query.length >= 2) setShowDropdown((s) => !s);
          }}
          aria-label="Search button"
        >
          <FaSearch />
        </button>
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-lg z-50 max-h-[250px] overflow-y-auto border border-gray-100">
          <div className="px-3 py-2 text-xs text-gray-500 font-semibold">PRODUCTS</div>

          {results.products.length > 0 ? (
            results.products.map((p) => (
              <button
                key={p.id}
                onClick={() => onProductClick(p.id)}
                className="w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-gray-100"
              >
                <img src={p.image} alt={p.name} className="w-10 h-10 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-800 truncate">{highlight(p.name, query)}</div>
                  <div className="text-xs text-green-600 mt-1">₹{p.price.toLocaleString()}</div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-3 py-3 text-sm text-gray-500">No products found</div>
          )}

          <div className="border-t border-gray-100 my-1" />

          <div className="px-3 py-2 text-xs text-gray-500 font-semibold">PAGES & BLOG POSTS</div>

          {results.pages.length > 0 ? (
            results.pages.map((pg) => (
              <button key={pg.id} onClick={() => onPageClick(pg.url)} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm">
                {highlight(pg.title, query)}
              </button>
            ))
          ) : (
            <div className="px-3 py-3 text-sm text-gray-500">No pages found</div>
          )}
        </div>
      )}
    </div>
  );
}