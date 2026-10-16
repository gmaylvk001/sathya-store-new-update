"use client";

import React, { useState, useEffect } from "react";
import ExchangeOfferModal from "./ExchangeOfferModal";

export default function ExchangeOfferSection({
  productCategory,
  onExchangeApply,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appliedOffer, setAppliedOffer] = useState(null);
  const [hasExchangeOffers, setHasExchangeOffers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("without");

  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const res = await fetch(
          `/api/exchange-offers-condition/options?categoryName=${encodeURIComponent(
            productCategory
          )}`
        );
        const data = await res.json();
        if (res.ok && data.success && data.data.types.length > 0) {
          setHasExchangeOffers(true);
        } else {
          setHasExchangeOffers(false);
        }
      } catch (err) {
        setHasExchangeOffers(false);
      } finally {
        setIsLoading(false);
      }
    };
    if (productCategory) {
      checkAvailability();
    } else {
      setIsLoading(false);
    }
  }, [productCategory]);

  const handleApply = (offer) => {
    setAppliedOffer(offer);
    onExchangeApply(offer);
  };

  const handleRemove = () => {
    setAppliedOffer(null);
    onExchangeApply(null);
  };

  // Do not render anything if this category has no exchange offers in DB
  if (isLoading || !hasExchangeOffers) return null;

  return (
    <div className="w-full my-4 border border-gray-200 rounded-md overflow-hidden bg-white">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab("without")}
          className={`flex-1 py-2.5 text-[11px] font-bold text-center uppercase tracking-wide transition-colors ${
            activeTab === "without"
              ? "bg-[#d72828] text-white"
              : "text-gray-600 bg-white hover:bg-gray-50"
          }`}
        >
          WITHOUT EXCHANGE
        </button>
        <button
          onClick={() => setActiveTab("with")}
          className={`flex-1 py-2.5 text-[11px] font-bold text-center uppercase tracking-wide transition-colors ${
            activeTab === "with"
              ? "bg-[#d72828] text-white"
              : "text-gray-600 bg-white hover:bg-gray-50"
          }`}
        >
          WITH EXCHANGE
        </button>
      </div>

      <div className="p-4">
        {activeTab === "without" ? (
          <p className="text-xs text-gray-500">
            Standard purchase without exchange.
          </p>
        ) : (
          <div className="space-y-3">
            {appliedOffer ? (
              <div className="bg-green-50 border border-green-200 rounded p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-green-700">
                    Exchange Offer Applied
                  </p>
                  <p className="text-xs text-green-600">
                    {appliedOffer.brand} {appliedOffer.type} ({appliedOffer.condition})
                  </p>
                  <p className="text-sm font-bold text-green-700 mt-1">
                    - ₹{Number(appliedOffer.price).toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={handleRemove}
                  className="text-red-500 hover:text-red-700 text-xs font-semibold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-[#f4f7f9] border border-[#d1d5db] text-gray-700 text-sm font-medium py-3 px-4 text-left rounded shadow-inner hover:bg-[#e9ecef] transition-colors"
              >
                Choose Product to Exchange
              </button>
            )}
          </div>
        )}
      </div>

      <ExchangeOfferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categoryName={productCategory}
        onApply={handleApply}
      />
    </div>
  );
}
