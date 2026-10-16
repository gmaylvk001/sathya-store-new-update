"use client";

import { usePageLoading } from "@/context/PageLoadingContext";

export default function PageLoadingOverlay() {
  const { isPageLoading } = usePageLoading();

  if (!isPageLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 backdrop-blur-sm pointer-events-auto">
      <div className="text-gray-800 text-lg font-medium animate-pulse">
        Loading...
      </div>
    </div>
  );
}
