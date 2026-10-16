"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { PAGE_TYPES } from "@/lib/categoryPageComponents/registry";
import { buildCategoryBrandHref } from "@/lib/categoryPageComponents/categoryHref";

function slugify(text) {
  return text
    ?.toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

export default function ShopByBrand({ categorySlug }) {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overviewMap, setOverviewMap] = useState({});

  useEffect(() => {
    if (!categorySlug) return;
    const fetchBrands = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/brand/by-category?slug=${categorySlug}`);
        const data = await res.json();
        if (data.success) {
          setBrands(data.brands);
          const pages = (data.brands || [])
            .filter((b) => b._id && (b.brand_slug || b.brand_name))
            .map((b) => ({
              pageType: PAGE_TYPES.CATEGORY_BRAND,
              slug: categorySlug,
              brandSlug: b.brand_slug || slugify(b.brand_name),
              brandId: b._id,
            }));
          if (pages.length) {
            try {
              const availRes = await fetch("/api/category-pages/availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pages }),
                cache: "no-store",
              });
              const availData = await availRes.json();
              if (availData?.success) {
                const next = {};
                for (const [key, val] of Object.entries(
                  availData.availability || {}
                )) {
                  const brandKey = key.split(":").pop();
                  next[brandKey] = val;
                }
                setOverviewMap(next);
              }
            } catch {
              setOverviewMap({});
            }
          }
        } else {
          setError(data.error || "Failed to fetch brands");
        }
      } catch (err) {
        console.error("ShopByBrand fetch error:", err);
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, [categorySlug]);

  if (loading) {
    return (
      <section className="bg-white px-5 sm:px-8 py-6 rounded-2xl">
        <div className="h-5 w-36 bg-gray-100 animate-pulse rounded mb-5" />
        <div className="flex gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="min-w-[90px] h-[90px] bg-gray-100 animate-pulse rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (error || brands.length === 0) return null;

  return (
    <section className="bg-white px-5 sm:px-8 py-6 mt-6 mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <span className="inline-block w-1 h-6 rounded-full bg-[#d72828]" />
        <h2 className="text-base sm:text-lg font-bold text-gray-800">
          Shop by Brand
        </h2>
      </div>

      {/* Brand Swiper */}
      <Swiper
        modules={[Navigation]}
        navigation
        spaceBetween={12}
        breakpoints={{
          0:    { slidesPerView: 3 },
          480:  { slidesPerView: 4 },
          640:  { slidesPerView: 5 },
          768:  { slidesPerView: 6 },
          1024: { slidesPerView: 8 },
        }}
        className="shopByBrandSwiper !pb-1"
      >
        {brands.map((brand) => (
          <SwiperSlide key={brand._id}>
            <Link
              href={buildCategoryBrandHref(
                categorySlug,
                brand.brand_slug || slugify(brand.brand_name),
                Boolean(overviewMap[String(brand._id)])
              )}
              className="flex flex-col items-center gap-2 group"
            >
              {/* Brand logo */}
              <div className="w-full aspect-square rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden p-3 group-hover:border-[#d72828] group-hover:shadow-md transition-all duration-300">
                {brand.image ? (
                  <Image
                    src={`/uploads/Brands/${brand.image}`}
                    alt={brand.brand_name}
                    width={80}
                    height={80}
                    className="object-contain w-full h-full"
                    unoptimized
                  />
                ) : (
                  <span className="text-xl font-bold text-gray-400">
                    {brand.brand_name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Brand name */}
              <span className="text-xs text-center text-gray-600 font-medium line-clamp-1 group-hover:text-[#d72828] transition-colors duration-200">
                {brand.brand_name}
              </span>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}