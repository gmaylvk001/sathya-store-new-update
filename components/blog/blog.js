"use client";

import React, { useState, useEffect, useMemo } from "react";

import Link from "next/link";
import { useModal } from "@/context/ModalContext";



// ─── Helpers ──────────────────────────────────────────────────────────────────

// Fisher-Yates shuffle algorithm - randomize blog order
function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function formatDate(dateStr) {

  if (!dateStr) return "";

  return new Date(dateStr).toLocaleDateString("en-GB", {

    year: "numeric",

    month: "short",

    day: "numeric",

  });

}



// Built-in clean text stripper to drop structural tags from text metrics

function stripHtmlTags(str) {

  if (!str) return "";

  return str

    .replace(/<[^>]*>/g, "")   // Automatically wipes out <p>, </p>, <strong> etc.

    .replace(/&nbsp;/g, " ")   // Converts space entities into clean spaces

    .trim();

}



function readTime(text) {

  if (!text) return "3 min read";

  const cleanText = stripHtmlTags(text);

  const words = cleanText.trim().split(/\s+/).length;

  return `${Math.max(1, Math.ceil(words / 200))} min read`;

}



// ─── Video thumbnail helpers ──────────────────────────────────────────────────

function getVideoType(url) {

  if (!url) return null;

  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";

  if (url.includes("vimeo.com")) return "vimeo";

  return "direct"; // mp4 or other hosted video

}



function getYouTubeId(url) {

  const match = url.match(

    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/

  );

  return match ? match[1] : null;

}



function getYouTubeThumbnail(url) {

  const id = getYouTubeId(url);

  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;

}



// Skeleton loader component

function Skeleton({ className }) {

  return (

    <div

      className={`animate-pulse bg-gray-200 rounded ${className ?? ""}`}

    />

  );

}



// ─── Main Component ───────────────────────────────────────────────────────────

export default function BlogComponent() {

  const { openLiveDemoModal } = useModal();

  const [blogs, setBlogs] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");

  const [heroSearchQuery, setHeroSearchQuery] = useState("");

  const [activeVideo, setActiveVideo] = useState(null); // for lightbox



  // ── Fetch all active blogs once ──────────────────────────────────────────

  useEffect(() => {

    async function fetchBlogs() {

      try {

        const res = await fetch(

          `${process.env.NEXT_PUBLIC_API_URL || ""}/api/blogs/get`,

          { cache: "no-store" }

        );

        if (!res.ok) throw new Error("Failed to fetch blogs");

        const json = await res.json();

        setBlogs(json.data || []);

      } catch (err) {

        console.error(err);

        setError("Could not load blog content. Please try again later.");

      } finally {

        setLoading(false);

      }

    }

    fetchBlogs();

  }, []);



  // ── Derived data with randomization ──────────────────────────────────────────

  // useMemo ensures each section gets a DIFFERENT randomized subset of blogs
  const {
    featuredGuides,
    latestArticles,
    popularPosts,
    videoBlogs,
  } = useMemo(() => {
    if (blogs.length === 0) {
      return {
        featuredGuides: [],
        latestArticles: [],
        popularPosts: [],
        videoBlogs: [],
      };
    }

    // Each section gets an independently shuffled copy for variety
    const videoBlogs = blogs.filter((b) => b.video && b.video.trim() !== "").slice(0, 4);

    return {
      featuredGuides: shuffleArray(blogs).slice(0, 4),
      latestArticles: shuffleArray(blogs).slice(0, 4),
      popularPosts: shuffleArray(blogs).slice(0, 4),
      videoBlogs: videoBlogs,
    };
  }, [blogs]);



  // Unique categories from populated category field

  const categoriesFromDB = [

    ...new Map(

      blogs

        .filter((b) => b.category?.category_name)

        .map((b) => [b.category._id, b.category])

    ).values(),

  ];



  // Fallback static categories if none come from DB

  const staticCategories = [

    { name: "Television", label: "Guides" },

    { name: "Air Conditioner", label: "Guides" },

    { name: "Refrigerator", label: "Guides" },

    { name: "Washing Machine", label: "Guides" },

    { name: "Kitchen Appliance", label: "Guides" },

    { name: "Laptop", label: "Guides" },

    { name: "Audio", label: "Guides" },

    { name: "Mobile & Gadget", label: "Guides" },

    { name: "New Technology", label: "Guides" },

  ];



  const displayCategories =

    categoriesFromDB.length > 0

      ? categoriesFromDB.map((c) => ({ name: c.category_name, label: "Guides" }))

      : staticCategories;



  // Search filter

  const filteredBlogs = blogs.filter((b) =>

    (b.blog_name + " " + stripHtmlTags(b.description))

      .toLowerCase()

      .includes(searchQuery.toLowerCase())

  );



  const popularSearches = [

    "Best AC for Indian Summer",

    "OLED vs QLED TV",

    "Front Load vs Top Load",

    "Best Refrigerator for Family",

    "Best 55 inch TV",

    "Best Washing Machine 2025",

    "How to Clean AC at Home",

    "Best Dishwashers in India",

    "Energy Saving Appliances",

    "Inverter AC Power Consumption",

  ];



  // ── Video Lightbox ────────────────────────────────────────────────────────

  function VideoLightbox({ blog, onClose }) {

    const type = getVideoType(blog.video);

    return (

      <div

        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"

        onClick={onClose}

      >

        <div

          className="relative w-full max-w-3xl rounded-xl overflow-hidden shadow-2xl"

          onClick={(e) => e.stopPropagation()}

        >

          <button

            onClick={onClose}

            className="absolute top-3 right-3 z-10 bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black transition"

          >

            ✕

          </button>

          {type === "youtube" ? (

            <iframe

              className="w-full aspect-video"

              src={`https://www.youtube.com/embed/${getYouTubeId(blog.video)}?autoplay=1`}

              allow="autoplay; encrypted-media"

              allowFullScreen

              title={blog.blog_name}

            />

          ) : type === "direct" || (blog.video && blog.video.startsWith('/uploads/')) ? (

            <video

              className="w-full aspect-video bg-black"

              src={blog.video}

              controls

              autoPlay

            />

          ) : (

            <div className="p-8 bg-gray-900 text-white text-center">

              <a href={blog.video} target="_blank" rel="noreferrer" className="underline text-[#d72828]">

                Open video in new tab

              </a>

            </div>

          )}

          <div className="bg-gray-900 p-3">

            <p className="text-white font-semibold text-sm">{blog.blog_name}</p>

          </div>

        </div>

      </div>

    );

  }



  // ── Render ────────────────────────────────────────────────────────────────

  return (

    <div className="w-full max-w-full sm:max-w-[720px] md:max-w-[960px] lg:max-w-[1320px] xl:max-w-[1520px] 2xl:max-w-[1680px] mx-auto px-4 md:px-6 lg:px-8">



      {/* ── Video Lightbox ── */}

      {activeVideo && (

        <VideoLightbox blog={activeVideo} onClose={() => setActiveVideo(null)} />

      )}



      {/* ===== 1. HERO SECTION ===== */}

      <div className="relative bg-[#081326] text-white py-16 px-6 sm:px-10 lg:px-20 overflow-hidden">

        <div className="absolute inset-0 z-0">

          <img

            src="/store/BEA_Store.png"

            alt="Background"

            className="w-full h-full object-cover opacity-30"

          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#081326] via-[#081326]/90 to-transparent" />

        </div>



        <div className="relative z-10 max-w-12xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center gap-10">

          <div className="flex-1">

            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">

              Sathya Stores Knowledge Hub

            </h1>

            <h2 className="text-xl md:text-2xl font-semibold mb-4 text-[#d72828]">

              Electronics & Home Appliance Buying Guides & Expert Advice

            </h2>

            <p className="max-w-2xl text-gray-300 text-sm md:text-base mb-10 leading-relaxed">

              Expert buying guides, appliance comparisons, maintenance tips and latest technology

              updates from Sathya Stores — Tamil Nadu's trusted electronics

              destination.

            </p>



            <div className="flex gap-8 md:gap-12">

              {[

                { label: "Years of Trust", value: "25+", icon :"/uploads/25.png" },

                { label: "Happy Customers", value: "50 Lakh+",icon:"/uploads/55lakhs.png"  },

                { label: "Stores Across Tamil Nadu", value: "47+",icon:"/uploads/47.png"  },

                { label: "Products", value: "5000+",icon:"/uploads/5000.png" },

              ].map((stat, i) => (

                <div key={i} className="flex items-center gap-3">

                  <img src={stat.icon} alt={stat.label} className="w-8 h-8" />

                  <div>

                    <div className="font-bold text-xl leading-none text-white">{stat.value}</div>

                    <div className="text-xs text-[#d72828] mt-1">{stat.label}</div>

                  </div>

                </div>

              ))}

            </div>

          </div>



          <div className="w-full md:w-[450px] hidden md:block">

            <img

              src="/store/BEA_Store.png"

              alt="Sathya Stores Store"

              className="w-full rounded-lg shadow-2xl border border-gray-700/50"

            />

          </div>

        </div>

      </div>



      <div className="max-w-12xl mx-auto px-4 md:px-6 py-10">



        {/* ===== 2. SEARCH BAR ===== */}

        <div className="bg-red-50 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-3 flex flex-col md:flex-row items-center gap-4 border border-red-50 mb-14 relative z-20">

          <span className="font-bold text-[#d72828] whitespace-nowrap px-4 text-sm">

            What are you looking for?

          </span>

          <div className="flex-1 w-full relative">

            <input

              type="text"

              value={heroSearchQuery}

              onChange={(e) => setHeroSearchQuery(e.target.value)}

              onKeyDown={(e) => {

                if (e.key === "Enter") {

                  setSearchQuery(heroSearchQuery);

                  document.getElementById("latest-articles")?.scrollIntoView({ behavior: "smooth" });

                }

              }}

              placeholder="Search guides, products, topics..."

              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-4 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"

            />

            <button

              onClick={() => {

                setSearchQuery(heroSearchQuery);

                document.getElementById("latest-articles")?.scrollIntoView({ behavior: "smooth" });

              }}

              className="absolute right-0 top-0 bottom-0 bg-[#d72828] text-white w-12 flex items-center justify-center rounded-r-lg hover:bg-[#d72828] transition"

            >

              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />

              </svg>

            </button>

          </div>

          <div className="hidden xl:flex items-center gap-2 text-[11px] font-bold text-gray-500 pr-2">

            <span className="mr-1">Popular Topics:</span>

            {["AC Buying Guide", "TV Guide", "Refrigerator Size", "Dishwasher Guide", "Power Savings"].map(

              (topic) => (

                <span

                  key={topic}

                  onClick={() => { setSearchQuery(topic); setHeroSearchQuery(topic); }}

                  className="text-[#d72828] bg-red-50/50 px-2.5 py-1.5 rounded cursor-pointer hover:bg-red-100 transition whitespace-nowrap"

                >

                  {topic}

                </span>

              )

            )}

          </div>

        </div>



        {error && (

          <div className="mb-8 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">

            {error}

          </div>

        )}



        {/* ===== 3. FEATURED BUYING GUIDES ===== */}

        <div className="mb-14">

          <div className="flex justify-between items-end mb-6">

            <h3 className="text-[22px] font-bold text-gray-900 tracking-tight">

              Featured Buying Guides

            </h3>

            <Link href="/blog" className="text-[#d72828] font-bold text-sm flex items-center gap-1 hover:underline">

              View all guides <span className="text-lg leading-none">→</span>

            </Link>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {loading

              ? Array.from({ length: 4 }).map((_, i) => (

                  <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">

                    <Skeleton className="h-44 w-full rounded-none" />

                    <div className="p-5 flex flex-col gap-2">

                      <Skeleton className="h-4 w-3/4" />

                      <Skeleton className="h-3 w-full" />

                      <Skeleton className="h-3 w-2/3" />

                    </div>

                  </div>

                ))

              : featuredGuides.length > 0

              ? featuredGuides.map((guide, idx) => (

                  <div

                    key={guide._id}

                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-md transition-all"

                  >

                    <div className="relative h-44 bg-gray-100 w-full overflow-hidden">

                      <div className="absolute top-4 left-4 bg-[#d72828] text-white w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold z-10 shadow-md ring-4 ring-white/50">

                        {idx + 1}

                      </div>

                      {guide.image ? (

                        <img

                          src={guide.image}

                          alt={guide.blog_name}

                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"

                        />

                      ) : (

                        <div className="w-full h-full bg-red-50 flex items-center justify-center text-[#d72828] text-4xl">📰</div>

                      )}

                    </div>

                    <div className="p-5 flex flex-col flex-1">

                      <h4 className="font-bold text-gray-900 mb-2 leading-snug text-[15px] group-hover:text-[#d72828] transition-colors">

                        {guide.blog_name}

                      </h4>

                      

                      {/* FIXED PREVIEW DISPLAY: HTML Tags stripped dynamically */}

                      <p className="text-[13px] text-gray-600 mb-4 flex-1 leading-relaxed line-clamp-3">

                        {stripHtmlTags(guide.description)}

                      </p>

                      

                      <Link

                        href={`/blog/${guide.blog_slug}`}

                        className="text-[#d72828] font-bold text-[13px] hover:underline mt-auto flex items-center gap-1"

                      >

                        Read More <span className="text-lg leading-none">→</span>

                      </Link>

                    </div>

                  </div>

                ))

              : (

                <p className="col-span-4 text-center text-gray-500 py-8">No guides available yet.</p>

              )}

          </div>

        </div>



        {/* ===== 4. EXPLORE BY KNOWLEDGE CATEGORY ===== */}

<div className="mb-16">

  <h3 className="text-[22px] font-bold text-gray-900 mb-6 tracking-tight">

    Explore by Knowledge Category

  </h3>

  <div className="flex justify-between gap-3 overflow-x-auto pb-4 hide-scrollbar">

    {[
      { name: "Television", icon: "/uploads/Television.png" },
      { name: "Air Conditioner", icon: "/uploads/AC.png" },
      { name: "Refrigerator", icon: "/uploads/Fridge.png" },
      { name: "Washing Machine", icon: "/uploads/washing.png" },
      { name: "Kitchen Appliance", icon: "/uploads/kitchen.png" },
      { name: "Laptop", icon: "/uploads/laptop.png" },
      { name: "Audio", icon: "/uploads/Audio.png" },
      { name: "Mobile & Gadget", icon: "/uploads/mobile.png" },
      { name: "New Technology", icon: "/uploads/new_technology.png" },
    ].map((cat, i) => (

      <div key={i} className="flex flex-col items-center gap-3 cursor-pointer group min-w-[100px]">

        <div className="w-16 h-16 rounded-full bg-white border-2 border-[#d72828] flex items-center justify-center">

          <img

            src={cat.icon}

            alt={cat.name}

            className="w-8 h-8 object-cover group-hover:scale-110 transition-transform duration-300"

          />

        </div>

        <span className="text-[12px] font-bold text-gray-800 text-center leading-tight group-hover:text-[#d72828]">

          {cat.name}

          <br />

          <span className="font-semibold text-gray-500 group-hover:text-[#d72828]">Guides</span>

        </span>

      </div>

    ))}

  </div>



  <div className="mt-4 bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200 rounded-lg p-4 flex justify-between items-center flex-col sm:flex-row gap-4">

    <div className="flex items-center gap-3">

      <div className="w-7 h-7 flex-shrink-0">

        <svg className="w-full h-full text-[#d72828]" fill="none" stroke="currentColor" viewBox="0 0 24 24">

          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />

        </svg>

      </div>

      <p className="text-[13px] text-gray-700">

        <span className="font-bold text-[#d72828]">Shopping Tip:</span> Not sure which product is right for you? Check our expert guides and make the right choice.

      </p>

    </div>

    <Link

      href="/blog"

      className="bg-[#d72828] text-white text-[13px] font-bold py-2.5 px-6 rounded hover:bg-[#d72828] whitespace-nowrap transition-colors shadow-sm"

    >

      View All Buying Guides →

    </Link>

  </div>

</div>



        {/* ===== 5. POPULAR COMPARISONS (Left) & WATCH EXPERT GUIDES (Right) ===== */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">



          {/* Left: Popular Comparisons (UPDATED MATCHING DESIGN) */}

          <div>

            <div className="flex justify-between items-end mb-6">

              <h3 className="text-[20px] font-extrabold text-[#0a1d56] tracking-tight">

                Popular Comparisons

              </h3>

              <a href="#" className="text-[#143ceb] font-bold text-[12px] flex items-center gap-1 hover:underline mb-1">

                View all <span className="text-base leading-none">&rarr;</span>

              </a>

            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">

              {[

                { t: "OLED vs\nQLED TV", img: "/store/BEA_Store.png" },

                { t: "Inverter AC vs\nNormal AC", img: "/store/BEA_Store.png" },

                { t: "Front Load vs\nTop Load", img: "/store/BEA_Store.png" },

                { t: "Double Door vs\nSide by Side", img: "/store/BEA_Store.png" },

                { t: "Dishwasher vs\nHand Washing", img: "/store/BEA_Store.png" },

              ].map((item, i) => (

                <div key={i} className="bg-white border border-[#e8efff] shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-xl p-2 flex flex-col group cursor-pointer hover:shadow-md transition-shadow">

                  <div className="relative w-full h-24 mb-3">

                    <div className="w-full h-full rounded-lg overflow-hidden bg-gray-100">

                      <img

                        src={item.img}

                        alt="Comparison"

                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"

                      />

                    </div>

                    {/* Positioned badge exactly bottom right of the image box */}

                    <div className="absolute -bottom-3 -right-2.5 w-7 h-7 bg-[#143ceb] rounded-full flex items-center justify-center text-[10px] font-black text-white border-[2.5px] border-white shadow-sm z-10 tracking-tighter pr-0.5">

                      VS

                    </div>

                  </div>

                  <div className="flex-1 flex items-start justify-center pb-2 px-1">

                    <p className="text-[11px] font-bold text-[#0a1d56] text-center leading-snug whitespace-pre-line group-hover:text-[#143ceb] transition-colors">

                      {item.t}

                    </p>

                  </div>

                </div>

              ))}

            </div>

          </div>



          {/* Right: Watch Sathya Stores Expert Guides (UPDATED MATCHING DESIGN) */}

          <div>

            <div className="flex justify-between items-end mb-6">

              <h3 className="text-[20px] font-extrabold text-[#0a1d56] tracking-tight">

                Watch Sathya Stores Expert Guides

              </h3>

              <a href="#" className="text-[#143ceb] font-bold text-[12px] flex items-center gap-1 hover:underline mb-1">

                View all videos <span className="text-base leading-none">&rarr;</span>

              </a>

            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

              {loading

                ? Array.from({ length: 4 }).map((_, i) => (

                    <div key={i}>

                      <Skeleton className="h-24 w-full rounded-xl mb-2" />

                      <Skeleton className="h-3 w-full" />

                      <Skeleton className="h-3 w-3/4 mt-1" />

                    </div>

                  ))

                : videoBlogs.length > 0

                ? videoBlogs.map((blog) => {

                    const thumb =

                      getVideoType(blog.video) === "youtube"

                        ? getYouTubeThumbnail(blog.video)

                        : blog.image || null;

                    return (

                      <div

                        key={blog._id}

                        className="bg-white border border-[#e8efff] shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-xl p-2 flex flex-col group cursor-pointer hover:shadow-md transition-shadow"

                        onClick={() => setActiveVideo(blog)}

                      >

                        <div className="relative w-full h-24 mb-3">

                          <div className="w-full h-full rounded-lg overflow-hidden bg-gray-900">

                            {thumb ? (

                              <img

                                src={thumb}

                                alt={blog.blog_name}

                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"

                              />

                            ) : (

                              <div className="w-full h-full bg-[#d72828]/40 flex items-center justify-center" />

                            )}

                          </div>

                          

                          {/* Play button center */}

                          <div className="absolute inset-0 flex items-center justify-center">

                            <div className="w-8 h-8 rounded-full bg-[#143ceb] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">

                              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">

                                <path d="M8 5v14l11-7z" />

                              </svg>

                            </div>

                          </div>



                          {/* Time Badge bottom right */}

                          <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">

                            {blog.duration || "3:15"}

                          </div>

                        </div>



                        <div className="flex-1 flex items-start px-1 pb-1">

                          <p className="text-[11px] font-bold text-[#0a1d56] leading-snug group-hover:text-[#143ceb] transition-colors line-clamp-3">

                            {blog.blog_name}

                          </p>

                        </div>

                      </div>

                    );

                  })

                : Array.from({ length: 4 }).map((_, i) => (

                    <div key={i} className="flex flex-col group cursor-pointer opacity-40">

                      <div className="h-24 bg-gray-200 rounded-md mb-2 flex items-center justify-center text-gray-400 text-2xl">

                        ▶

                      </div>

                      <p className="text-[11px] font-bold text-gray-400 leading-tight">

                        Video coming soon

                      </p>

                    </div>

                  ))}

            </div>

          </div>

        </div>



        {/* ===== 6. THREE-COLUMN LOGIC ===== */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">



          {/* COLUMN 1: Latest Articles */}

          <div id="latest-articles">

            <h3 className="text-[18px] font-bold text-gray-900 mb-4 tracking-tight">

              {searchQuery ? `Results for "${searchQuery}"` : "Latest Articles"}

            </h3>

            <div className="flex flex-col gap-4">

              {loading

                ? Array.from({ length: 4 }).map((_, i) => (

                    <div key={i} className="flex gap-3 bg-white rounded-lg border border-gray-100 p-3">

                      <Skeleton className="w-24 h-20 flex-shrink-0 rounded-md" />

                      <div className="flex-1 flex flex-col gap-2 py-1">

                        <Skeleton className="h-3 w-2/3" />

                        <Skeleton className="h-4 w-full" />

                        <Skeleton className="h-4 w-3/4" />

                      </div>

                    </div>

                  ))

                : (searchQuery ? filteredBlogs : latestArticles).length > 0

                ? (searchQuery ? filteredBlogs : latestArticles).slice(0, 4).map((blog) => (

                    <div

                      key={blog._id}

                      className="bg-white rounded-lg shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden flex gap-3 group hover:shadow-md transition-shadow"

                    >

                      <div className="w-24 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">

                        {blog.image ? (

                          <img

                            src={blog.image}

                            alt={blog.blog_name}

                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"

                          />

                        ) : (

                          <div className="w-full h-full bg-red-50 flex items-center justify-center text-2xl">📰</div>

                        )}

                      </div>

                      <div className="p-3 flex flex-col flex-1 justify-between">

                        <div>

                          <div className="flex items-center gap-1 text-[13px] text-gray-500 mb-1 font-medium">

                            <span>{formatDate(blog.createdAt)}</span>

                            <span className="w-0.5 h-0.5 bg-gray-300 rounded-full" />

                            <span>{readTime(blog.description)}</span>

                          </div>

                          <h4 className="text-[13px] font-bold text-gray-900 leading-snug group-hover:text-[#d72828] transition-colors line-clamp-2">

                            {blog.blog_name}

                          </h4>

                        </div>

                        <Link

                          href={`/blog/${blog.blog_slug}`}

                          className="text-[#d72828] font-bold text-[10px] hover:underline flex items-center gap-0.5"

                        >

                          Read More <span className="text-xs leading-none">→</span>

                        </Link>

                      </div>

                    </div>

                  ))

                : (

                  <p className="text-gray-500 text-sm py-4">

                    {searchQuery ? "No articles found for that search." : "No articles yet."}

                  </p>

                )}

              {searchQuery && (

                <button

                  onClick={() => { setSearchQuery(""); setHeroSearchQuery(""); }}

                  className="text-[#d72828] font-bold text-[12px] hover:underline flex items-center gap-1"

                >

                  &larr; Clear search

                </button>

              )}

              {!searchQuery && (

                <Link href="/blog" className="text-[#d72828] font-bold text-[12px] hover:underline flex items-center gap-1">

                  View all articles <span>&rarr;</span>

                </Link>

              )}

            </div>

          </div>



          {/* COLUMN 2: Search Blog + Categories (NEW) + Popular Posts */}

          <div className="flex flex-col gap-5">

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]">

              <h4 className="font-bold text-gray-900 mb-3 text-[15px]">Search Blog</h4>

              <div className="relative border border-gray-200 rounded overflow-hidden">

                <input

                  type="text"

                  value={searchQuery}

                  onChange={(e) => setSearchQuery(e.target.value)}

                  placeholder="Search articles, topics..."

                  className="w-full bg-white py-2 pl-3 pr-9 text-[12px] focus:outline-none focus:border-[#d72828]"

                />

                <button

                  onClick={() => document.getElementById("latest-articles")?.scrollIntoView({ behavior: "smooth" })}

                  className="absolute right-0 top-0 bottom-0 bg-[#0a1d56] text-white w-9 flex items-center justify-center hover:bg-[#d72828]"

                >

                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />

                  </svg>

                </button>

              </div>

            </div>



            {/* NEW CATEGORIES SECTION */}

            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]">

              <h4 className="font-bold text-[#0a1d56] mb-3 text-[15px]">Categories</h4>

              <ul className="flex flex-col gap-3">

                {[

                  { name: "Buying Guide", count: "12" },

                  { name: "Tips & Tricks", count: "10" },

                  { name: "Product Updates", count: "8" },

                  { name: "Tech Guide", count: "6" },

                  { name: "Offers & News", count: "5" },

                ].map((cat, i) => (

                  <li key={i} className="flex items-center justify-between group cursor-pointer">

                    <div className="flex items-center gap-3 text-gray-700 group-hover:text-[#d72828] transition-colors">

                      <div className="w-5 h-5 rounded flex items-center justify-center border border-[#e8efff] text-[#143ceb] bg-[#f5f8ff]">

                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />

                        </svg>

                      </div>

                      <span className="text-[13px] font-bold text-[#0a1d56]">{cat.name}</span>

                    </div>

                    <div className="flex items-center gap-2 text-gray-400 text-[12px]">

                      <span>({cat.count})</span>

                      <span className="text-[10px]">&gt;</span>

                    </div>

                  </li>

                ))}

              </ul>

            </div>



            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]">

              <h4 className="font-bold text-gray-900 mb-3 text-[15px]">Popular Posts</h4>

              <div className="flex flex-col gap-2.5">

                {loading

                  ? Array.from({ length: 4 }).map((_, i) => (

                      <div key={i} className="flex gap-2">

                        <Skeleton className="w-12 h-8 rounded flex-shrink-0" />

                        <div className="flex-1 flex flex-col gap-1">

                          <Skeleton className="h-3 w-full" />

                          <Skeleton className="h-2 w-1/2" />

                        </div>

                      </div>

                    ))

                  : popularPosts.map((post) => (

                      <Link

                        key={post._id}

                        href={`/blog/${post.blog_slug}`}

                        className="flex gap-2 items-start group cursor-pointer border-b border-gray-50 pb-2 last:border-0 last:pb-0"

                      >

                        {post.image ? (

                          <img

                            src={post.image}

                            alt={post.blog_name}

                            className="w-12 h-8 object-cover rounded flex-shrink-0"

                          />

                        ) : (

                          <div className="w-12 h-8 bg-red-50 rounded flex-shrink-0 flex items-center justify-center text-sm">📰</div>

                        )}

                        <div className="flex-1 min-w-0">

                          <h5 className="text-[13px] font-bold text-[#0a1d56] leading-tight group-hover:text-[#d72828] line-clamp-2">

                            {post.blog_name}

                          </h5>

                          <span className="text-[12px] text-gray-500 block mt-0.5">

                            {formatDate(post.createdAt)}

                          </span>

                        </div>

                      </Link>

                    ))}

              </div>

            </div>

          </div>



          {/* COLUMN 3: Sathya Stores Live Demo + Need Help Choosing + Subscribe */}

          <div className="flex flex-col gap-5">

            {/* Sathya Stores Live Demo */}
            <div className="flex items-center gap-2 rounded-xl border border-[#d4d8f0] bg-gradient-to-br from-[#f8f6ff] to-[#eef3ff] overflow-hidden shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] p-3 sm:p-4">
              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-[#0a1d56] text-[14px] sm:text-[15px] leading-snug mb-1">
                  Still confused which model is right for you?
                </h4>
                <p className="text-[11px] sm:text-[12px] text-gray-600 leading-relaxed mb-2.5">
                  Our experts can show you the actual product LIVE.
                </p>
                <ul className="flex flex-col gap-1 mb-3">
                  {["See it live", "Compare models", "Ask anything"].map((item) => (
                    <li key={item} className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-medium text-[#0a1d56]">
                      <span className="text-[#5B4CF5] font-bold">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={openLiveDemoModal}
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#5B4CF5] to-[#3b5bdb] text-white text-[11px] sm:text-[12px] font-bold py-2 px-3 rounded-lg"
                >
                  Demo Video Call
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <div className="shrink-0 w-[90px] sm:w-[110px] self-end">
                <img
                  src="/uploads/live-video-phone.png"
                  alt="Sathya Stores Live Demo"
                  className="w-full h-auto object-contain bg-transparent"
                />
              </div>
            </div>

            <div className="bg-[#f5f8ff] p-5 rounded-lg border border-[#e8efff] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] relative overflow-hidden">

              <div className="flex items-center gap-2 mb-2 relative z-10">

                <div className="w-7 h-7 bg-white rounded text-[#143ceb] flex items-center justify-center flex-shrink-0">

                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />

                  </svg>

                </div>

                <h4 className="font-bold text-[#0a1d56] text-[15px]">Need Help Choosing?</h4>

              </div>

              <p className="text-[13px] text-[#0a1d56] font-semibold mb-1 relative z-10">

                Confused between models?

              </p>

              <p className="text-[12px] text-gray-600 mb-4 leading-relaxed relative z-10 pr-16">

                Get guidance from Sathya Stores product specialists who help thousands of customers choose the right appliances every month.

              </p>

              <button className="bg-[#0a1d56] text-white text-[12px] font-bold py-2.5 px-4 rounded hover:bg-[#d72828] relative z-10 flex items-center gap-1 w-[130px] justify-center">

                Talk to Expert <span>&rarr;</span>

              </button>

              <div className="absolute right-0 bottom-0 w-30 h-32 z-0">

                <img

                  src="/uploads/customer_support.png"

                  alt="Expert"

                  className="w-full h-full object-contain object-bottom rounded-2xl"

                />

              </div>

            </div>



            <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)]">

              <div className="flex items-center gap-2 mb-2">

                <div className="w-7 h-7 bg-red-50 rounded text-[#d72828] flex items-center justify-center flex-shrink-0">

                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />

                  </svg>

                </div>

                <h4 className="font-bold text-[#0a1d56] text-[15px]">Subscribe to Our Blog</h4>

              </div>

              <p className="text-[12px] text-gray-600 mb-4 leading-relaxed">

                Get the latest tips, reviews and offers straight to your inbox.

              </p>

              <input

                type="email"

                placeholder="Enter your email address"

                className="w-full border border-gray-200 rounded py-2.5 px-3 text-[12px] mb-3 focus:outline-none focus:border-[#d72828]"

              />

              <button className="bg-[#0a1d56] text-white font-bold py-2.5 px-6 rounded hover:bg-[#d72828] text-[12px] transition-colors w-[130px]">

                Subscribe

              </button>

            </div>

          </div>

        </div>



      {/* ===== 7. POPULAR SEARCHES LOGIC ===== */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div>

            <h3 className="text-[18px] font-bold text-gray-900 mb-4 tracking-tight">

              Popular Searches

            </h3>

            <div className="bg-white rounded-lg border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] p-4">

              <div className="flex flex-wrap gap-2">

                {popularSearches.map((s, i) => (

                  <button

                    key={i}

                    onClick={() => {

                      setSearchQuery(s);

                      setHeroSearchQuery(s);

                      document.getElementById("latest-articles")?.scrollIntoView({ behavior: "smooth" });

                    }}

                    className="bg-gray-50 border border-gray-200 text-gray-700 text-[12px] font-bold px-2.5 py-1.5 rounded hover:border-[#d72828] hover:text-[#d72828] transition-colors whitespace-nowrap"

                  >

                    {s}

                  </button>

                ))}

              </div>

            </div>

          </div>



          <div>

            <h3 className="text-[18px] font-bold text-gray-900 mb-4 tracking-tight">

              Why Trust Sathya Stores Guides?

            </h3>

            <div className="bg-white rounded-lg border border-gray-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] p-8">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                {[

                  { img: "/uploads/25_years.png", title: "25+ Years", desc: "Helping TamilNadu Families choose better" },

                  { img: "/uploads/Brand.png", title: "Expert Team", desc: "Certified Product specialists" },

                  { img: "/uploads/Real_Customer.png", title: "50 Lakh+", desc: "Based on 50 lakh+ customers" },

                  { img: "/uploads/47+_Stores.png", title: "47+ Stores", desc: "Experience from daily customer interactions" },

                ].map((point, i) => (

                  <div key={i} className="flex gap-2">

                    <div className="w-12 h-12 rounded-full bg-red-50 text-[#d72828] flex items-center justify-center flex-shrink-0 text-xl">

                      <img src={point.img} alt={point.title} className="w-full h-full object-contain" />

                    </div>

                    <div>

                      <h4 className="font-bold text-gray-900 text-[15px]">{point.title}</h4>

                      <p className="text-[12px] text-gray-600 leading-snug">{point.desc}</p>

                    </div>

                  </div>

                ))}

              </div>

            </div>

          </div>



          <div>

            <h3 className="text-[18px] font-bold text-gray-900 mb-4 tracking-tight">

              Still Confused?

            </h3>

            <div className="bg-gradient-to-b from-[#d72828] to-[#d72828] rounded-lg border border-[#d72828] shadow-lg p-4 relative overflow-hidden flex flex-col justify-between min-h-[220px]">

              <div className="absolute inset-0 opacity-10">

                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16" />

              </div>

              <div className="relative z-10">

                <h3 className="text-white font-bold text-[15px] mb-2 leading-snug">

                  Which Appliance To Buy?

                </h3>

                <p className="text-[#d72828] text-[13px] leading-relaxed mb-4">

                  Talk to a Sathya Stores Expert or visit your nearest store.

                </p>

              </div>

              <div className="relative z-10 flex flex-col gap-2">

                <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-1.5 px-3 rounded flex items-center justify-center gap-1.5 transition-colors text-[13px] shadow-md">

                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">

                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-3.055 0-5.555 2.51-5.555 5.576 0 1.042.208 2.053.611 3.031L2.111 22l3.285-.994c.908.504 1.93.779 2.961.779 3.065 0 5.555-2.51 5.555-5.576 0-1.483-.574-2.876-1.604-3.922-.93-.946-2.16-1.46-3.573-1.46z" />

                  </svg>

                  WhatsApp

                </button>

                <button className="bg-white hover:bg-gray-100 text-[#d72828] font-bold py-1.5 px-3 rounded flex items-center justify-center gap-1.5 transition-colors text-[13px] shadow-md">

                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />

                  </svg>

                  Find Store

                </button>

              </div>

              <div className="absolute bottom-0 right-0 w-20 h-28 opacity-80">

                <img

                  src="/store/BEA_Store.png"

                  alt="Sathya Stores Store"

                  className="w-full h-full object-cover rounded-tl-lg"

                />

              </div>

            </div>

          </div>

        </div>

      </div>

      

    </div>

  );

}