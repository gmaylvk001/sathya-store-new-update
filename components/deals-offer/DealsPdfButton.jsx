"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useHeaderdetails } from "@/context/HeaderContext";
import { readStoredSession } from "@/lib/clientAuthSession";
import { FaRegFilePdf } from "react-icons/fa6";
import DealsPdfModal from "./DealsPdfModal";

/**
 * DealsPdfButton
 * Header PDF icon button matching Reference Image 1 & 2.
 * - Visible ONLY when:
 *   1. User is authenticated (logged in)
 *   2. User is on /deals-offer (or triggered from deals)
 * - Positioned between Location Pin icon and User Profile icon.
 * - Clean white circle with soft drop shadow (no red border), red icon inside.
 * - Clicking it opens the DealsPdfModal with backdrop.
 */
export default function DealsPdfButton({ className = "", forceVisible = false }) {
  const pathname = usePathname();
  const { isLoggedIn, userData } = useHeaderdetails();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Synchronize authentication status from HeaderContext + client session + localStorage
  useEffect(() => {
    setMounted(true);

    const checkAuth = () => {
      if (typeof window === "undefined") return;
      const session = readStoredSession();
      const token = session?.token || localStorage.getItem("token");
      const hasAuth = Boolean(token && (isLoggedIn || userData || session?.userId));
      setIsAuthenticated(hasAuth);
    };

    checkAuth();

    // Listen for storage / login / logout events across tabs and components
    window.addEventListener("storage", checkAuth);
    window.addEventListener("auth-changed", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("auth-changed", checkAuth);
    };
  }, [isLoggedIn, userData]);

  // Listen for openDealsPdfModal custom window event
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOpen = () => setIsModalOpen(true);
    window.addEventListener("openDealsPdfModal", handleOpen);
    return () => window.removeEventListener("openDealsPdfModal", handleOpen);
  }, []);

  if (!mounted) return null;

  const isSupportedPage =
    pathname?.startsWith("/deals-offer") ||
    pathname?.startsWith("/category") ||
    pathname?.startsWith("/search");

  // Strict Rule: ONLY show when authenticated AND on supported page (or forceVisible)
  if (!forceVisible && (!isAuthenticated || !isSupportedPage)) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        id="pdf-export-url"
        onClick={() => setIsModalOpen(true)}
        className={`deals-pdf-btn relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white shadow-md hover:shadow-lg border border-gray-100 text-[#d72828] hover:bg-red-50/40 active:scale-95 transition-all duration-200 cursor-pointer group shrink-0 ${className}`}
        title="Deals Offer PDF Export"
        aria-label="Deals Offer PDF Export"
      >
        <FaRegFilePdf className="w-[18px] h-[18px] text-[#d72828] group-hover:scale-105 transition-transform flex-shrink-0" />
      </button>

      {/* Popup Modal */}
      <DealsPdfModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        exportType={
          pathname?.startsWith("/category")
            ? "category"
            : pathname?.startsWith("/search")
            ? "search"
            : "deals-offer"
        }
      />
    </>
  );
}
