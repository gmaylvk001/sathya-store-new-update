"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useRegion } from "@/context/RegionContext";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

function getInstagramEmbedUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();

  // Extract Instagram shortcode from /reel/..., /reels/..., /p/..., /tv/..., or /{user}/reel/...
  const igRegex = /instagram\.com\/(?:(?:[a-zA-Z0-9_.-]+\/)?(?:reel|reels|p|tv)|share\/(?:reel|p))\/?([A-Za-z0-9_-]+)/i;
  const match = trimmed.match(igRegex);
  if (match && match[1]) {
    const code = match[1];
    const isPost = /\/p\//i.test(trimmed);
    const type = isPost ? "p" : "reel";
    return `https://www.instagram.com/${type}/${code}/embed/`;
  }

  // If already an embed URL
  if (trimmed.includes("/embed")) return trimmed;

  return trimmed;
}

function usePerPage() {
  const [perPage, setPerPage] = useState(4);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 500) setPerPage(1);
      else if (w < 768) setPerPage(2);
      else if (w < 1100) setPerPage(3);
      else setPerPage(4);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return perPage;
}

function getPageStarts(total, perPage) {
  if (total <= 0) return [];
  if (total <= perPage) return [0];
  const starts = [];
  for (let i = 0; i + perPage < total; i += perPage) {
    starts.push(i);
  }
  const last = total - perPage;
  if (starts[starts.length - 1] !== last) starts.push(last);
  return starts;
}

export default function TrendingVideoSection({ config }) {
  const { region, selectedRegion } = useRegion();
  const [videos, setVideos] = useState(() => {
    if (config?.videos && Array.isArray(config.videos)) {
      return config.videos.filter((v) => (v.status || "Active") === "Active");
    }
    return [];
  });
  const [loading, setLoading] = useState(() => !(config?.videos && Array.isArray(config.videos)));
  const scrollerRef = useRef(null);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const perPage = usePerPage();

  const currentRegion = region || selectedRegion?.id || "tamilnadu";

  useEffect(() => {
    if (config?.videos && Array.isArray(config.videos)) {
      setVideos(config.videos.filter((v) => (v.status || "Active") === "Active"));
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchVideos = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/videocard?region=${encodeURIComponent(currentRegion)}`);
        const data = await res.json();
        if (cancelled) return;

        if (data.success && Array.isArray(data.videoCards)) {
          const activeList = data.videoCards.filter(
            (v) => (v.status || "Active") === "Active"
          );
          setVideos(activeList);
        } else {
          setVideos([]);
        }
      } catch (err) {
        console.error("Failed to load trending videos:", err);
        if (!cancelled) setVideos([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchVideos();

    return () => {
      cancelled = true;
    };
  }, [currentRegion, config?.videos]);

  // Load Instagram Embed Script once
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!document.getElementById("instagram-embed-script")) {
        const script = document.createElement("script");
        script.id = "instagram-embed-script";
        script.src = "//www.instagram.com/embed.js";
        script.async = true;
        document.body.appendChild(script);
      } else if (window.instgrm?.Embeds?.process) {
        window.instgrm.Embeds.process();
      }
    }
  }, [videos]);

  const pageStarts = useMemo(
    () => getPageStarts(videos.length, perPage),
    [videos.length, perPage]
  );

  const pages = useMemo(
    () => pageStarts.map((start) => videos.slice(start, start + perPage)),
    [videos, pageStarts, perPage]
  );

  const pageCount = Math.max(1, pages.length);

  const scrollToPage = useCallback(
    (index, behavior = "smooth") => {
      const el = scrollerRef.current;
      if (!el) return;
      let next = index;
      if (next >= pageCount) next = 0;
      if (next < 0) next = pageCount - 1;
      el.scrollTo({ left: next * el.clientWidth, behavior });
      setPage(next);
    },
    [pageCount]
  );

  useEffect(() => {
    setPage(0);
    const el = scrollerRef.current;
    if (el) el.scrollTo({ left: 0, behavior: "auto" });
  }, [perPage]);

  // If loading or no videos exist for this region, don't show empty container
  if (loading || videos.length === 0) {
    return null;
  }

  const headingText = config?.title || "Instagram Feed";
  const gapPx = 16;
  const cellStyle = {
    width: `calc((100% - ${(perPage - 1) * gapPx}px) / ${perPage})`,
  };

  const renderCard = (video, key) => {
    const embedUrl = getInstagramEmbedUrl(video.video_url);

    return (
      <div
        key={key}
        className="box-border min-w-0 shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:border-gray-300"
        style={cellStyle}
      >
        {/* Sized so the full Instagram reel, likes, comments, and footer fit completely without clipping */}
        <div className="relative w-full h-[580px] sm:h-[610px] bg-white overflow-hidden">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title="Instagram Reel"
              className="w-full h-full border-0 block"
              scrolling="no"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <div className="p-4 text-center text-gray-400 text-sm flex flex-col items-center justify-center h-full gap-2">
              <span>Video unavailable</span>
              {video.video_url && (
                <a
                  href={video.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 underline"
                >
                  Open in Instagram
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="w-full mb-8 bg-white py-4 border-t border-gray-100">
      {/* w-full px-4 sm:px-6 matches the exact left & right margin of the product sections above */}
      <div className="w-full px-4 sm:px-6">
        {/* Section Heading & Controls */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-3">
            {/* Instagram Gradient Icon */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center shadow-sm shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                {headingText}
              </h2>
              <p className="text-xs text-gray-500 hidden sm:block">
                Watch our latest reels and product showcases on Instagram
              </p>
            </div>
          </div>

          {/* Carousel Next/Prev Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              aria-label="Previous reel page"
              disabled={page <= 0 && pageCount <= 1}
              onClick={() => scrollToPage(page - 1)}
              className="h-8 w-8 rounded-full border border-gray-300 bg-gray-50 text-gray-700 flex items-center justify-center hover:bg-gray-200 disabled:opacity-40 transition active:scale-95"
            >
              <FiChevronLeft size={18} />
            </button>
            <button
              type="button"
              aria-label="Next reel page"
              disabled={page >= pageCount - 1 && pageCount <= 1}
              onClick={() => scrollToPage(page + 1)}
              className="h-8 w-8 rounded-full border border-gray-300 bg-gray-50 text-gray-700 flex items-center justify-center hover:bg-gray-200 disabled:opacity-40 transition active:scale-95"
            >
              <FiChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Carousel Viewport: Exactly aligns with sections above, zero edge cut-off */}
        <div
          className="relative bg-white"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          <div
            ref={scrollerRef}
            className="flex w-full gap-0 overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory scrollbar-none select-none bg-white"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
              touchAction: "pan-x",
            }}
          >
            {pages.map((chunk, pageIdx) => (
              <div
                key={pageIdx}
                className="flex w-full min-w-full shrink-0 snap-start snap-always bg-white"
                style={{ gap: `${gapPx}px` }}
              >
                {chunk.map((video, i) =>
                  renderCard(video, `${video._id || video.video_url}-${pageIdx}-${i}`)
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
