"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { useEffect, useState } from "react";
import Link from "next/link";

import "swiper/css";
import "swiper/css/navigation";

export default function FlashCategorySlider({ slug }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFlashCategories = async () => {
    try {
      setLoading(true);

      const currentSlug = window.location.pathname.split("/").pop();

      const res = await fetch(
        `/api/fetchflashcat?categorySlug=${currentSlug}`
      );
      const data = await res.json();

      if (data.success) {
        setCategories(data.banners);
      } else {
        setError(data.error || "Failed to fetch categories");
      }
    } catch (err) {
      setError("Error fetching categories");
      console.error("Flash category fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlashCategories();
  }, []);

  if (loading) {
    return (
      <div className="mt-6 pb-4 bg-white">
        <h2 className="text-2xl font-bold text-center py-4">Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-8">
          {[...Array(8)].map((_, index) => (
            <div
              key={index}
              className="bg-gray-200 rounded-xl aspect-square animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 pb-4 bg-white">
        <h2 className="text-2xl font-bold text-center py-4">Categories</h2>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">Failed to load categories</p>
          <button
            onClick={fetchFlashCategories}
            className="bg-[#d72828] text-white px-4 py-2 rounded hover:bg-[#d72828]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="mt-6 pb-4 bg-white">
        <h2 className="text-2xl font-bold text-center py-4">Categories</h2>
        <div className="text-center py-8 text-gray-500">
          <p>No categories available</p>
          <p className="text-sm">Add category banners from the admin panel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 pb-4 px-2 bg-white">
      <h2 className="text-2xl font-bold text-center py-4">Categories</h2>

      {/* <div className="px-4 md:px-12"> */}
        <Swiper
          modules={[Navigation]}
          navigation
          spaceBetween={20}
          breakpoints={{
            0: { slidesPerView: 2 },
            640: { slidesPerView: 4 },
            1024: { slidesPerView: 4 },
          }}
          className="pb-8 customSwiper"
        >
          {categories.map((category) => (
            <SwiperSlide key={category._id}>
              {category.redirect_url ? (
                <a
                  href={category.redirect_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {/* <div className="bg-[#d72828] rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300"> */}
                  <div className="bg-[#d72828] rounded-xl flex flex-col items-center">
                    <img
                      src={category.banner_image}
                      alt={category.banner_name}
                      // className="w-full h-full object-cover aspect-square rounded-xl"
                      className="w-full h-[full] rounded-[10px_10px_10px_10px]"
                      loading="lazy"
                    />
                  </div>
                </a>
              ) : (
                <Link
                  href={`/category/${category.category_slug}`}
                  className="block"
                >
                  <div className="bg-[#d72828] rounded-xl flex flex-col items-center">
                    <img
                      src={category.banner_image}
                      alt={category.banner_name}
                      className="w-full h-[full] rounded-[10px_10px_10px_10px]"
                      loading="lazy"
                    />
                  </div>
                </Link>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      {/* </div> */}
    </div>
  );
}
