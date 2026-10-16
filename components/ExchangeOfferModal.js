"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

export default function ExchangeOfferModal({
  isOpen,
  onClose,
  categoryName,
  onApply,
}) {
  const [types, setTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [conditions, setConditions] = useState([]);

  const [selectedType, setSelectedType] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [pincode, setPincode] = useState("");

  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && categoryName) {
      fetchOptions();
      // Reset state when opened
      setSelectedType("");
      setSelectedBrand("");
      setSelectedCondition("");
      setPincode("");
      setCheckResult(null);
      setError("");
    }
  }, [isOpen, categoryName]);

  const fetchOptions = async () => {
    setIsLoadingOptions(true);
    try {
      const res = await fetch(
        `/api/exchange-offers-condition/options?categoryName=${encodeURIComponent(
          categoryName
        )}`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setTypes(data.data.types);
        setBrands(data.data.brands);
        setConditions(data.data.conditions);
      }
    } catch (err) {
      console.error("Failed to fetch options", err);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const handleCheck = async () => {
    if (!selectedType || !selectedBrand || !selectedCondition || !pincode) {
      setError("Please fill all fields before checking.");
      return;
    }
    setError("");
    setIsChecking(true);
    setCheckResult(null);

    try {
      const res = await fetch("/api/exchange-offers-condition/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categoryName,
          type: selectedType,
          brand: selectedBrand,
          condition: selectedCondition,
          zone: pincode,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCheckResult(data.data);
      } else {
        setError(data.error || "No matching exchange offer found for your selection.");
      }
    } catch (err) {
      console.error("Failed to check offer", err);
      setError("Failed to check offer. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleApply = () => {
    if (checkResult) {
      onApply(checkResult);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-md shadow-xl w-full max-w-md overflow-hidden relative">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-[#d72828]">
            Exchange your old product
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Icon icon="mdi:close" className="text-xl" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-xs text-gray-600 mb-2">
            Which product would you like to exchange?
          </p>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-[#d72828]"
            disabled={isLoadingOptions}
          >
            <option value="">Select Type</option>
            {types.map((t, idx) => (
              <option key={idx} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-[#d72828]"
            disabled={isLoadingOptions}
          >
            <option value="">Select Brand</option>
            {brands.map((b, idx) => (
              <option key={idx} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-[#d72828]"
            disabled={isLoadingOptions}
          >
            <option value="">Select Working Condition</option>
            {conditions.map((c, idx) => (
              <option key={idx} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Pickup Location pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              className="flex-1 border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-[#d72828]"
            />
            <button
              onClick={handleCheck}
              disabled={isChecking}
              className="bg-[#d72828] text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors"
            >
              {isChecking ? "Checking..." : "Check"}
            </button>
          </div>

          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

          {checkResult && (
            <div className="mt-4 text-sm text-gray-700 space-y-2 border-t pt-4">
              <p className="text-xs">
                Your new product delivery will be rejected if old product does not
                work, has different model & size.
              </p>
              <p className="font-semibold">
                Fixed Exchange value: ₹{Number(checkResult.price).toFixed(4)}
              </p>
              <p className="text-xs">
                Exchange service fee Rs. 0 will be charged
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="bg-[#d72828] text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-red-700 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleApply}
                  className="bg-[#7b519d] text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-[#684188] transition-colors"
                >
                  APPLY EXCHANGE
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
