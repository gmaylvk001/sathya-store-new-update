'use client';

import React, { useMemo } from 'react';
import { getStartingEmi } from '@/lib/emiCalculator';

/**
 * EmiOfferBanner Component
 *
 * Displays the "Available Offers" EMI card on the Product Detail Page
 * matching the Razorpay / Sathya Store live design specification.
 *
 * @param {{ price: number, onOpenModal: () => void, className?: string }} props
 */
export default function EmiOfferBanner({ price, onOpenModal, className = '' }) {
  const numericPrice = Number(price) || 0;

  const startingEmi = useMemo(() => {
    return getStartingEmi(numericPrice);
  }, [numericPrice]);

  if (numericPrice <= 0) return null;

  return (
    <div className={`w-full mt-3.5 mb-2 ${className}`}>
      <h3 className="text-xs sm:text-sm font-bold text-gray-900 mb-2">Available Offers</h3>

      <div
        role="button"
        tabIndex={0}
        onClick={onOpenModal}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenModal();
          }
        }}
        aria-label="View EMI plans and options"
        className="group relative border border-red-200/90 hover:border-red-400 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer bg-white select-none focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
      >
        {/* Top Header Strip */}
        <div className="bg-[#b91c1c] text-white px-3 sm:px-3.5 py-1.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
            <span>EMI Plans</span>
          </div>
          <span className="text-[11px] text-red-100 font-medium italic opacity-90">
            powered by <strong className="font-semibold text-white tracking-wide">Razorpay</strong>
          </span>
        </div>

        {/* Card Body */}
        <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-white">
          <div className="flex flex-col gap-1.5 min-w-0">
            <p className="text-xs sm:text-sm font-bold text-gray-900">
              {startingEmi ? (
                <>
                  EMI plans starting from{' '}
                  <span className="text-[#b91c1c] font-black">
                    ₹{startingEmi.toLocaleString('en-IN')}/month
                  </span>
                </>
              ) : (
                <>Explore flexible bank EMI options</>
              )}
            </p>

            {/* Bank Logos / Badges Row */}
            <div className="flex items-center gap-2">
              <div className="flex items-center -space-x-1.5">
                {/* RBL */}
                <span
                  title="RBL Bank"
                  className="w-5 h-5 rounded-full bg-[#0c2340] text-white text-[9px] font-black flex items-center justify-center border border-white shadow-2xs"
                >
                  R
                </span>
                {/* ICICI */}
                <span
                  title="ICICI Bank"
                  className="w-5 h-5 rounded-full bg-[#991b1b] text-white text-[9px] font-black flex items-center justify-center border border-white shadow-2xs"
                >
                  i
                </span>
                {/* HDFC */}
                <span
                  title="HDFC Bank"
                  className="w-5 h-5 rounded-full bg-[#004c8f] text-white text-[9px] font-black flex items-center justify-center border border-white shadow-2xs"
                >
                  H
                </span>
                {/* SBI */}
                <span
                  title="SBI Card"
                  className="w-5 h-5 rounded-full bg-[#0082cb] text-white text-[9px] font-black flex items-center justify-center border border-white shadow-2xs"
                >
                  S
                </span>
                {/* Axis */}
                <span
                  title="Axis Bank"
                  className="w-5 h-5 rounded-full bg-[#881337] text-white text-[9px] font-black flex items-center justify-center border border-white shadow-2xs"
                >
                  A
                </span>
              </div>
              <span className="text-[11px] text-gray-500 font-medium truncate">
                Credit &amp; Debit Cards
              </span>
            </div>
          </div>

          {/* Action Link / Arrow */}
          <div className="flex items-center gap-1 text-xs font-bold text-[#b91c1c] group-hover:translate-x-0.5 transition-transform shrink-0">
            <span className="hidden sm:inline">View Plans</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
