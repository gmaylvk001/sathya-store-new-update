"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

export default function CategoryImageSection({ categorySlug, index = 0 }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!categorySlug) return;
    const fetch_ = async () => {
      try {
        setLoading(true);
        const res  = await fetch(`/api/category-image-section/${categorySlug}`);
        const data = await res.json();
        if (data.success) {
          setSections(Array.isArray(data.data) ? data.data : [data.data]);
        }
      } catch (err) {
        console.error("CategoryImageSection fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [categorySlug]);

  if (loading) return null;

  if (!sections || sections.length === 0) return null;


  const ImageCard = ({ img, i }) => (
    <a
      href={img.url || "#"}
      className="block"
      style={{ display: "block", lineHeight: 0 }}
    >
      <img
        src={img.image}
        alt={img.name || `Image ${i + 1}`}
        style={{
          width: "350px",
          height: "350px",
          objectFit: "cover",
          display: "block",
        }}
      />
    </a>
  );

  return (
    <div className="w-full mt-4">
      {sections.filter((_, i) => i === index).map((section) => {
        const activeImages = (section.images || []).filter(
          (img) => img.status === "active"
        );

        if (activeImages.length === 0) return null;

        return (
          <div key={section._id}>
            {/* Section Title */}
            {section.section_title && (
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 px-1">
                {section.section_title}
              </h2>
            )}

            {activeImages.length <= 4 ? (
              // ── Grid for 1–4 images — no gap, seamless ──────────────
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${activeImages.length}, 1fr)`,
                  gap: 0,
                }}
              >
                {activeImages.map((img, i) => (
                  <ImageCard key={i} img={img} i={i} />
                ))}
              </div>
            ) : (
              // ── Swiper for 5+ ────────────────────────────────────────
              <Swiper
                modules={[Navigation]}
                navigation
                spaceBetween={0}
                breakpoints={{
                  0:    { slidesPerView: 2 },
                  640:  { slidesPerView: 3 },
                  1024: { slidesPerView: 4 },
                }}
                className="customSwiper"
              >
                {activeImages.map((img, i) => (
                  <SwiperSlide key={i}>
                    <ImageCard img={img} i={i} />
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>
        );
      })}
    </div>
  );
}