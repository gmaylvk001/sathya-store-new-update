"use client";
import React, { useState, useEffect } from 'react';

export default function SearchBox({ initialValue = '', onChange, fakeText = 'iPhone' }) {
  const [value, setValue] = useState(initialValue || '');

  useEffect(() => {
    // If parent provides a controlled value via onChange pattern, keep internal in sync
    if (typeof initialValue === 'string' && initialValue !== value) {
      setValue(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  const handleChange = (e) => {
    setValue(e.target.value);
    if (onChange) onChange(e);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className="relative w-full">
      {/* Input with container */}
      <form onSubmit={handleSubmit} className="relative flex items-center w-full">
        {/* Input field */}
        <input
          type="text"
          value={value}
          onChange={handleChange}
          className="w-full h-10 px-4 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          aria-label={`Search box, suggested: ${fakeText}`}
        />
        
        {/* Overlay placeholder */}
        {!value && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500 pointer-events-none">
            {`Search For "${fakeText}"`}
          </span>
        )}

        {/* Search button */}
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
          aria-label="Search"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </button>
      </form>
    </div>
  );
}
