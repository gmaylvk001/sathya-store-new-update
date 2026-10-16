"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import Link from "next/link";

export default function ExchangeOfferForm({ isEdit = false, initialData = null }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    categoryName: "",
    brand: "",
    type: "",
    condition: "ANY",
    zone: "",
    price: "",
    status: "Active",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        categoryName: initialData.categoryName || "",
        brand: initialData.brand || "",
        type: initialData.type || "",
        condition: initialData.condition || "ANY",
        zone: initialData.zone || "",
        price: initialData.price || "",
        status: initialData.status || "Active",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    const url = isEdit ? "/api/exchange-offers-condition/update" : "/api/exchange-offers-condition/add";
    const method = isEdit ? "PUT" : "POST";
    const payload = isEdit ? { ...formData, _id: initialData._id } : formData;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setSuccess(result.message);
        setTimeout(() => {
          router.push("/admin/exchange-offers-condition");
        }, 1500);
      } else {
        setError(result.error || "Failed to save offer.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 shadow-sm border rounded-lg max-w-3xl">
      <h2 className="text-2xl font-light text-gray-700 mb-6">
        {isEdit ? "Edit Exchange Offer" : "Create Exchange Offer"}
      </h2>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isEdit && initialData && (
          <div className="flex items-center">
            <label className="w-1/4 text-sm font-semibold text-gray-700">ID</label>
            <input
              type="text"
              value={initialData.id || ""}
              readOnly
              className="w-3/4 border rounded p-2 bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>
        )}
        <div className="flex items-center">
          <label className="w-1/4 text-sm font-semibold text-gray-700">Category Name</label>
          <input
            name="categoryName"
            value={formData.categoryName}
            onChange={handleChange}
            required
            className="w-3/4 border rounded p-2 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="flex items-center">
          <label className="w-1/4 text-sm font-semibold text-gray-700">Brand</label>
          <input
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            required
            className="w-3/4 border rounded p-2 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="flex items-center">
          <label className="w-1/4 text-sm font-semibold text-gray-700">Type</label>
          <input
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-3/4 border rounded p-2 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="flex items-center">
          <label className="w-1/4 text-sm font-semibold text-gray-700">Condition</label>
          <input
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            className="w-3/4 border rounded p-2 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="flex items-center">
          <label className="w-1/4 text-sm font-semibold text-gray-700">Zone</label>
          <input
            name="zone"
            value={formData.zone}
            onChange={handleChange}
            className="w-3/4 border rounded p-2 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="flex items-center">
          <label className="w-1/4 text-sm font-semibold text-gray-700">Price</label>
          <input
            name="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={handleChange}
            required
            className="w-3/4 border rounded p-2 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="flex items-center">
          <label className="w-1/4 text-sm font-semibold text-gray-700">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-3/4 border rounded p-2 focus:outline-none focus:border-blue-400 bg-white"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Link
            href="/admin/exchange-offers-condition"
            className="border px-4 py-2 rounded text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className={`px-4 py-2 text-white rounded flex items-center gap-2 ${
              isSaving ? "bg-green-400" : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {isSaving ? (
              <Icon icon="eos-icons:loading" className="animate-spin" />
            ) : (
              <Icon icon="mingcute:check-line" />
            )}
            {isEdit ? "Save" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
