"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination } from "swiper/modules";
import { useEffect, useState } from "react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

export default function BannerSlider({ categorySlug = null }) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      
      // Build URL with categorySlug if provided
      const url = categorySlug 
        ? `/api/main-cat-banner?categorySlug=${categorySlug}`
        : "/api/main-cat-banner";
        
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        setBanners(data.banners);
      } else {
        setError(data.error || "Failed to fetch banners");
      }
    } catch (err) {
      setError("Error fetching banners");
      console.error("Banner fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, [categorySlug]); // Refetch when categorySlug changes

  if (loading) {
    return (
      <div className="w-full h-[180px] sm:h-[280px] md:h-[300px] lg:h-[411px] bg-gray-200 animate-pulse flex items-center justify-center">
        <div className="text-gray-500">Loading banners...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[180px] sm:h-[280px] md:h-[300px] lg:h-[411px] bg-red-50 flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p>Failed to load banners</p>
          <button 
            onClick={fetchBanners}
            className="mt-2 px-4 py-2 bg-[#d72828] text-white rounded hover:bg-[#d72828]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className="w-full h-[180px] sm:h-[280px] md:h-[300px] lg:h-[411px] bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500 text-center">
          <p>No banners available</p>
          <p className="text-sm">Add banners from the admin panel</p>
        </div>
      </div>
    );
  }

  return (
    <Swiper
      modules={[Navigation, Autoplay, Pagination]}
      navigation
      pagination={{ 
        clickable: true,
        dynamicBullets: true 
      }}
      autoplay={{ 
        delay: 3000, 
        disableOnInteraction: false 
      }}
      loop={banners.length > 1}
      className="customSwiper overflow-hidden"
    >
      {banners.map((banner, index) => (
        <SwiperSlide key={banner._id || index}>
          {banner.redirect_url ? (
            <a 
              href={banner.redirect_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full h-full"
            >
              <img
                src={banner.banner_image}
                alt={banner.banner_name}
                loading="lazy"
               className="w-full h-[180px] sm:h-[280px] md:h-[300px] lg:h-[402px] object-cover"
              />
            </a>
          ) : (
            <img
              src={banner.banner_image}
              alt={banner.banner_name}
              loading="lazy"
                          className="w-full h-[180px] sm:h-[280px] md:h-[300px] lg:h-[411px] object-cover"            />
          )}
        </SwiperSlide>
      ))}
    </Swiper>
  );
}