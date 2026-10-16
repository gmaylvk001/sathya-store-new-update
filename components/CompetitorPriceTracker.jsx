"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

// ==========================================
// Competitor Brand Logo Resolver
// Newly uploaded logos from public/uploads:
// - Amazon: /uploads/amazon (1).webp
// - Flipkart: /uploads/amazon (4).webp
// - Croma: /uploads/amazon (5).webp
// ==========================================
const getLogoPath = (platformName) => {
  const name = (platformName || "").toLowerCase();
  if (name.includes("amazon")) return "/uploads/amazon (1).webp";
  if (name.includes("flipkart")) return "/uploads/amazon (4).webp";
  if (name.includes("croma")) return "/uploads/amazon (5).webp";
  return null; // Fallback for unmatched platforms
};

/**
 * CompetitorPriceTracker Component
 * Modern 2026 Live Market Price Comparison widget powered by ePrice Tracker™.
 * Defensively renders with zero CLS and graceful fallback.
 * Ultra-compressed single-line header layout optimized for above-the-fold desktop viewport alignment.
 */
export default function CompetitorPriceTracker({ product, className = "" }) {
  const [trackerData, setTrackerData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDay, setCurrentDay] = useState("");

  const sathyaPrice = Number(
    product?.special_price > 0 ? product?.special_price : product?.price || 0
  );
  const productCode = product?.item_code || product?.product_code || product?.sku || "";
  const modelNumber = product?.model_number || "";

  useEffect(() => {
    try {
      const day = new Date().toLocaleDateString("en-US", { weekday: "long" });
      setCurrentDay(day || "Daily");
    } catch {
      setCurrentDay("Daily");
    }
  }, []);

  useEffect(() => {
    if (!product || (!productCode && !modelNumber) || sathyaPrice <= 0) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const params = new URLSearchParams({
      product_code: productCode,
      model_number: modelNumber,
      price: String(sathyaPrice),
    });

    fetch(`/api/price-tracker?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data && data.success && Array.isArray(data.deals)) {
            setTrackerData(data);
          } else {
            setTrackerData(null);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load live price tracker:", err);
        if (isMounted) {
          setTrackerData(null);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [product?._id, productCode, sathyaPrice]);

  // Loading state: return null to prevent layout shifts/flashing
  if (isLoading) {
    return null;
  }

  // Filter Amazon, Flipkart, and Croma deals
  const deals = (trackerData?.deals || [])
    .filter((deal) => {
      const plat = (deal?.platform || "").toLowerCase();
      return plat === "amazon" || plat === "flipkart" || plat === "croma";
    })
    .slice(0, 3);

  // Conditional Visibility: If deals is empty, return null immediately (no fallback banners)
  if (!trackerData || !Array.isArray(deals) || deals.length === 0) {
    return null;
  }

  const lastVerified = trackerData.lastVerifiedSlot || "2:30 PM";
  const displayDay = currentDay || "Daily";

  return (
    <div
      className={`bg-gradient-to-b from-slate-50/80 to-white border border-slate-200/90 rounded-2xl p-2.5 shadow-sm backdrop-blur-xs relative overflow-hidden transition-all duration-200 hover:shadow-md ${className}`}
    >
      {/* 1. Micro Gradient Accent Line */}
      <div className="h-1 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 w-full absolute top-0 left-0" />

      {/* 2. Flattened Header (Single Horizontal Line + Tight Descriptor) */}
      <div className="pb-1.5 border-b border-slate-100">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Luxury Sparkles Icon */}
            <svg
              className="w-3.5 h-3.5 text-amber-500 shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
            <h3 className="text-[12px] font-extrabold text-slate-900 tracking-tight leading-none whitespace-nowrap">
              {displayDay} Special Offers
            </h3>
          </div>

          {/* Live Slot Verification Pill */}
          <div
            className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 leading-none"
            title={`Verified by ePrice Tracker at ${lastVerified} IST`}
          >
            <span className="text-amber-500">⚡</span>
            <span>Verified at {lastVerified}</span>
          </div>
        </div>

        {/* Sub-heading descriptor */}
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block leading-none mb-1.5 mt-0.5">
          Live Market Comparison
        </span>
      </div>

      {/* 3. Exactly 2 Ultra-Micro Competitor Cards (Amazon & Flipkart) */}
      <div className="mt-1 space-y-1">
        {deals.map((deal, idx) => {
          const savings = deal.savingsVsSathya || 0;
          const isCheaper = deal.isSathyaCheaper && savings > 0;
          const isMatched = deal.isMatched || savings === 0;
          const logoSrc = getLogoPath(deal.platform);

          return (
            <div
              key={deal.platform || idx}
              className="flex items-center justify-between py-1 px-2 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-slate-200 transition-all shadow-2xs mb-1 last:mb-0"
            >
              {/* Left: Platform Logo & Name */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-md overflow-hidden border border-slate-200/80 bg-white flex items-center justify-center flex-shrink-0">
                  {logoSrc ? (
                    <img
                      src={logoSrc}
                      alt={`${deal.platform} Logo`}
                      className="w-full h-full object-cover rounded-md"
                      onError={(e) => {
                        e.target.style.display = "none";
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = "flex";
                        }
                      }}
                    />
                  ) : null}

                  {/* Fallback Initial */}
                  <span
                    className="text-[10px] font-bold text-slate-500 flex items-center justify-center w-full h-full"
                    style={{ display: logoSrc ? "none" : "flex" }}
                  >
                    {(deal.platform || "?").charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-semibold text-slate-800 whitespace-nowrap leading-tight">
                    {deal.platform}
                  </span>
                  <span className="text-[8px] text-slate-400 font-medium flex items-center gap-0.5 whitespace-nowrap leading-none mt-0.5">
                    <svg className="w-2 h-2 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Verified Store
                  </span>
                </div>
              </div>

              {/* Right: Competitor Price & Advantage Pill (Strictly isolated, flex-shrink-0) */}
              <div className="flex flex-col items-end justify-center flex-shrink-0 text-right pl-2">
                <span className="text-xs font-bold text-slate-800 whitespace-nowrap leading-none">
                  ₹{Number(deal.price).toLocaleString("en-IN")}
                </span>

                <span className="inline-flex items-center bg-emerald-50 text-emerald-700 border border-emerald-200/90 text-[8.5px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 flex-shrink-0 whitespace-nowrap tracking-tight leading-none">
                  Save ₹{Number(savings).toLocaleString("en-IN")} on SATHYA
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Brand Primary View All Button */}
      <Link
        href="/deals-offer"
        className="w-full mt-1.5 py-1.5 text-xs font-bold text-center text-white bg-[#d72828] hover:bg-[#b81d1d] active:scale-[0.99] rounded-lg transition-all flex items-center justify-center gap-1 shadow-xs"
      >
        <span>View All</span>
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
