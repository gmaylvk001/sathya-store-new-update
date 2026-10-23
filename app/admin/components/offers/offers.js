"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { FaEdit } from "react-icons/fa";
import { Icon } from "@iconify/react";
import ReactPaginate from "react-paginate";
import Link from "next/link";
import Image from "next/image";

export default function OffersComponent() {
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Product search state inside modal
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [productSearchResults, setProductSearchResults] = useState([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState([]);

  const [newOffer, setNewOffer] = useState({
    offerName: "",
    slug: "",
    description: "",
    banner: "",
    isActive: true,
    products: [],
  });

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 15;

  const fetchOffers = async () => {
    try {
      const response = await fetch("/api/offer-module");
      const data = await response.json();
      setOffers(data.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching offers:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  const generateSlug = (name = "") =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "offerName") {
      setNewOffer((prev) => ({
        ...prev,
        offerName: value,
        slug: generateSlug(value),
      }));
      return;
    }
    if (type === "checkbox") {
      setNewOffer((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    setNewOffer((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setEditingOffer((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    setEditingOffer((prev) => ({ ...prev, [name]: value }));
  };

  // Search products for mapping
  const searchTimeoutRef = useRef(null);
  const handleProductSearch = (query) => {
    setProductSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query || query.trim().length < 2) {
      setProductSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingProducts(true);
      try {
        const res = await fetch(`/api/product/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setProductSearchResults(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Error searching products:", err);
      } finally {
        setIsSearchingProducts(false);
      }
    }, 300);
  };

  const addProductToOffer = (product, isEdit = false) => {
    const pId = String(product._id);
    if (isEdit) {
      const currentList = Array.isArray(editingOffer.products) ? editingOffer.products : [];
      if (!currentList.some((id) => String(id) === pId)) {
        setEditingOffer((prev) => ({
          ...prev,
          products: [...currentList, pId],
        }));
        setSelectedProductDetails((prev) => [...prev, product]);
      }
    } else {
      const currentList = Array.isArray(newOffer.products) ? newOffer.products : [];
      if (!currentList.some((id) => String(id) === pId)) {
        setNewOffer((prev) => ({
          ...prev,
          products: [...currentList, pId],
        }));
        setSelectedProductDetails((prev) => [...prev, product]);
      }
    }
  };

  const removeProductFromOffer = (productId, isEdit = false) => {
    const pId = String(productId);
    if (isEdit) {
      setEditingOffer((prev) => ({
        ...prev,
        products: (prev.products || []).filter((id) => String(id) !== pId),
      }));
    } else {
      setNewOffer((prev) => ({
        ...prev,
        products: (prev.products || []).filter((id) => String(id) !== pId),
      }));
    }
    setSelectedProductDetails((prev) => prev.filter((p) => String(p._id) !== pId));
  };

  // Open add modal
  const handleOpenAddModal = () => {
    setNewOffer({
      offerName: "",
      slug: "",
      description: "",
      banner: "",
      isActive: true,
      products: [],
    });
    setSelectedProductDetails([]);
    setProductSearchQuery("");
    setProductSearchResults([]);
    setIsModalOpen(true);
  };

  // Open edit modal and load products
  const handleEditOffer = async (offer) => {
    setEditingOffer({
      ...offer,
      isActive: offer.isActive !== false,
      products: Array.isArray(offer.products) ? offer.products.map(String) : [],
    });
    setSelectedProductDetails([]);
    setProductSearchQuery("");
    setProductSearchResults([]);
    setIsEditModalOpen(true);

    if (Array.isArray(offer.products) && offer.products.length > 0) {
      try {
        const ids = offer.products.join(",");
        const res = await fetch(`/api/product/by-ids?ids=${ids}`);
        if (res.ok) {
          const data = await res.json();
          setSelectedProductDetails(data.products || []);
        }
      } catch (err) {
        console.error("Error loading offer products:", err);
      }
    }
  };

  const handleAddOffer = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch("/api/offer-module/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOffer),
      });

      const result = await response.json();
      if (response.ok) {
        setIsModalOpen(false);
        fetchOffers();
        setNewOffer({
          offerName: "",
          slug: "",
          description: "",
          banner: "",
          isActive: true,
          products: [],
        });
        setSuccessMessage("Offer Added Successfully");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      } else {
        alert(result.error || "Failed to add offer");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error adding offer. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateOffer = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch("/api/offer-module/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingOffer._id,
          offerName: editingOffer.offerName,
          slug: editingOffer.slug,
          description: editingOffer.description || "",
          banner: editingOffer.banner || "",
          isActive: editingOffer.isActive,
          products: editingOffer.products || [],
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setIsEditModalOpen(false);
        fetchOffers();
        setEditingOffer(null);
        setSuccessMessage("Offer Updated Successfully");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      } else {
        alert(result.error || "Failed to update offer");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error updating offer. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (offerId) => {
    setOfferToDelete(offerId);
    setShowConfirmationModal(true);
  };

  const handleDeleteOffer = async () => {
    try {
      const response = await fetch("/api/offer-module/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: offerToDelete }),
      });

      const result = await response.json();
      if (response.ok) {
        setSuccessMessage("Offer Deleted Successfully");
        setShowSuccessModal(true);
        fetchOffers();
      } else if (result.hasProducts) {
        setSuccessMessage(result.error);
        setShowSuccessModal(true);
      } else {
        alert(result.error || "Failed to delete offer");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setShowConfirmationModal(false);
      setOfferToDelete(null);
      setTimeout(() => setShowSuccessModal(false), 2000);
    }
  };

  const filteredOffers = offers.filter(
    (offer) =>
      offer.offerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pageCount = Math.ceil(filteredOffers.length / itemsPerPage);
  const totalEntries = filteredOffers.length;
  const startEntry = currentPage * itemsPerPage + 1;
  const endEntry = Math.min((currentPage + 1) * itemsPerPage, totalEntries);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  const getProductImage = (p) => {
    if (!p) return "/uploads/products/placeholder.jpg";
    if (Array.isArray(p.images) && p.images[0]) {
      const img = p.images[0];
      return img.startsWith("http") ? img : `/uploads/products/${img.replace(/^\/?(uploads\/products\/)?/, "")}`;
    }
    return "/uploads/products/placeholder.jpg";
  };

  const renderOfferRows = () => {
    return filteredOffers
      .slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
      .map((offer, index) => {
        const productCount = Array.isArray(offer.products) ? offer.products.length : (offer.productsCount || 0);
        return (
          <tr key={offer._id} className="text-center border-b hover:bg-gray-50 transition-colors">
            <td className="p-3 text-left pl-4 text-xs text-gray-500 font-mono">
              {totalEntries - (currentPage * itemsPerPage + index)}
            </td>
            <td className="p-3 text-left">
              <span
                className="text-blue-600 font-semibold cursor-pointer hover:underline block"
                onClick={() => handleEditOffer(offer)}
              >
                {offer.offerName}
              </span>
              {offer.description && (
                <span className="text-xs text-gray-400 line-clamp-1 mt-0.5">{offer.description}</span>
              )}
            </td>
            <td className="p-3 text-left">
              <div className="flex items-center gap-1.5">
                <code className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-200">
                  /offers/{offer.slug}
                </code>
                <a
                  href={`/offers/${offer.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Preview Offer Page"
                >
                  <Icon icon="mdi:open-in-new" className="w-4 h-4" />
                </a>
              </div>
            </td>
            <td className="p-3">
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-medium">
                <Icon icon="mdi:package-variant" className="w-3.5 h-3.5" />
                {productCount} {productCount === 1 ? "Product" : "Products"}
              </span>
            </td>
            <td className="p-3">
              {offer.isActive !== false ? (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 border border-gray-200 px-2.5 py-0.5 rounded-full text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Inactive
                </span>
              )}
            </td>
            <td className="p-3 text-xs text-gray-500">{formatDate(offer.createdAt)}</td>
            <td className="p-3">
              <div className="flex items-center gap-2 justify-center">
                <button
                  onClick={() => handleEditOffer(offer)}
                  className="px-2.5 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 flex items-center gap-1.5 text-xs font-medium"
                  title="Edit Offer & Products"
                >
                  <FaEdit className="w-3 h-3 text-blue-600" /> Edit
                </button>
                <button
                  onClick={() => handleDeleteClick(offer._id)}
                  className="px-2.5 py-1.5 border border-red-200 rounded bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-1 text-xs font-medium"
                  title="Delete"
                >
                  <Icon icon="mingcute:delete-2-line" className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </td>
          </tr>
        );
      });
  };

  return (
    <div className="container mx-auto px-4 py-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Icon icon="mdi:sale" className="text-red-600 w-7 h-7" />
            Offers Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Create offer slugs, manage promotional campaigns, and assign storefront products.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold shadow-sm transition"
        >
          <Icon icon="ic:baseline-add" className="w-5 h-5" /> New Offer
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
          <Icon icon="line-md:loading-loop" className="w-8 h-8 text-red-600 mx-auto animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Loading offers...</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm border rounded-xl overflow-hidden border-gray-200">
          {/* Search bar */}
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search offer by name or slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 border-gray-300"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">
                <Icon icon="ic:baseline-search" className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Total Offers: <strong className="text-gray-800">{filteredOffers.length}</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100/70 border-b border-gray-200 text-gray-700 text-xs uppercase tracking-wider">
                  <th className="p-3 text-left pl-4 font-semibold w-14">#</th>
                  <th className="p-3 text-left font-semibold">Offer Name</th>
                  <th className="p-3 text-left font-semibold">Slug URL</th>
                  <th className="p-3 font-semibold text-center w-36">Mapped Products</th>
                  <th className="p-3 font-semibold text-center w-28">Status</th>
                  <th className="p-3 font-semibold text-center w-32">Created</th>
                  <th className="p-3 font-semibold text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredOffers.length > 0 ? (
                  renderOfferRows()
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-gray-400">
                      No offers found. Click "New Offer" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalEntries > itemsPerPage && (
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-200 gap-3">
              <div className="text-xs text-gray-500">
                Showing {startEntry} to {endEntry} of {totalEntries} offers
              </div>
              <ReactPaginate
                previousLabel={"«"}
                nextLabel={"»"}
                breakLabel={"..."}
                pageCount={pageCount}
                marginPagesDisplayed={2}
                pageRangeDisplayed={3}
                onPageChange={handlePageClick}
                containerClassName={"flex items-center space-x-1 text-sm"}
                activeClassName={"bg-red-600 text-white font-bold"}
                pageLinkClassName={"px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"}
                previousLinkClassName={"px-2.5 py-1 border border-gray-300 rounded hover:bg-gray-50"}
                nextLinkClassName={"px-2.5 py-1 border border-gray-300 rounded hover:bg-gray-50"}
              />
            </div>
          )}
        </div>
      )}

      {/* CREATE OFFER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Create New Offer</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Set offer details and assign products to appear on the storefront page.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddOffer} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Offer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="offerName"
                    value={newOffer.offerName}
                    onChange={handleInputChange}
                    placeholder="e.g. Weekend Offers, Big Discounts"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Slug URL <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setNewOffer((prev) => ({
                          ...prev,
                          slug: generateSlug(prev.offerName),
                        }))
                      }
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Regenerate
                    </button>
                  </div>
                  <div className="flex items-center">
                    <span className="bg-gray-100 border border-r-0 border-gray-300 text-gray-500 text-xs px-2.5 py-2.5 rounded-l-lg font-mono">
                      /offers/
                    </span>
                    <input
                      name="slug"
                      value={newOffer.slug}
                      onChange={handleInputChange}
                      placeholder="weekend-offers"
                      className="w-full border border-gray-300 rounded-r-lg p-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Description & Active Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Offer Description / Tagline (Optional)
                  </label>
                  <textarea
                    name="description"
                    rows={2}
                    value={newOffer.description}
                    onChange={handleInputChange}
                    placeholder="Short description displayed on the offer page banner/header..."
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Active Status
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={newOffer.isActive}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-red-600 rounded focus:ring-red-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-800 block">
                        {newOffer.isActive ? "Active on Store" : "Inactive / Draft"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {newOffer.isActive ? "Visible in footer & direct link" : "Hidden from customers"}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Product Assignment Section */}
              <div className="border-t border-gray-200 pt-5">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Icon icon="mdi:cart-plus" className="text-red-600 w-4 h-4" />
                      Assign Products to this Offer
                    </h4>
                    <p className="text-xs text-gray-500">
                      Search and select store products to show on <code className="bg-gray-100 px-1 py-0.5 rounded">/offers/{newOffer.slug || "..."}</code>
                    </p>
                  </div>
                  <span className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-full font-bold">
                    {selectedProductDetails.length} Selected
                  </span>
                </div>

                {/* Product Search Box */}
                <div className="relative mb-3">
                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => handleProductSearch(e.target.value)}
                    placeholder="Type product name, item code, or model to search..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400">
                    {isSearchingProducts ? (
                      <Icon icon="line-md:loading-loop" className="w-4 h-4 animate-spin text-red-600" />
                    ) : (
                      <Icon icon="ic:baseline-search" className="w-4 h-4" />
                    )}
                  </span>
                </div>

                {/* Search Results Dropdown/List */}
                {productSearchResults.length > 0 && (
                  <div className="mb-4 max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y bg-gray-50">
                    {productSearchResults.map((p) => {
                      const isAlreadyAdded = selectedProductDetails.some((item) => String(item._id) === String(p._id));
                      return (
                        <div
                          key={p._id}
                          className="p-2.5 flex items-center justify-between hover:bg-white transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 relative bg-white border rounded shrink-0 overflow-hidden">
                              <Image
                                src={getProductImage(p)}
                                alt={p.name || "Product"}
                                fill
                                className="object-contain p-1"
                                unoptimized
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                              <p className="text-[11px] text-gray-500">
                                {p.item_code ? `Code: ${p.item_code} | ` : ""}
                                ₹{(p.special_price || p.price || 0).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={isAlreadyAdded}
                            onClick={() => addProductToOffer(p, false)}
                            className={`px-3 py-1 rounded text-xs font-semibold shrink-0 ${
                              isAlreadyAdded
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-red-600 text-white hover:bg-red-700"
                            }`}
                          >
                            {isAlreadyAdded ? "Added" : "+ Add"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Selected Products Chips/List */}
                {selectedProductDetails.length > 0 ? (
                  <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1.5 bg-white">
                    {selectedProductDetails.map((p) => (
                      <div
                        key={p._id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 relative bg-white border rounded shrink-0 overflow-hidden">
                            <Image
                              src={getProductImage(p)}
                              alt={p.name || "Product"}
                              fill
                              className="object-contain p-0.5"
                              unoptimized
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate max-w-md">{p.name}</p>
                            <p className="text-[11px] text-gray-500">
                              ₹{(p.special_price || p.price || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeProductFromOffer(p._id, false)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove from offer"
                        >
                          <Icon icon="mdi:close-circle" className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg text-xs text-gray-400 bg-gray-50/50">
                    No products assigned yet. Use the search box above to add products to this offer.
                  </div>
                )}
              </div>

              {/* Form Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Icon icon="line-md:loading-loop" className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Icon icon="mingcute:check-line" className="w-4 h-4" /> Create Offer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT OFFER MODAL */}
      {isEditModalOpen && editingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Edit Offer: {editingOffer.offerName}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update offer slug, description, active status, and assign or remove products.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
                >
                  <Icon icon="mdi:close" className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateOffer} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Offer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="offerName"
                    value={editingOffer.offerName || ""}
                    onChange={handleEditInputChange}
                    placeholder="e.g. Weekend Offers"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Slug URL <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingOffer((prev) => ({
                          ...prev,
                          slug: generateSlug(prev.offerName),
                        }))
                      }
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Regenerate
                    </button>
                  </div>
                  <div className="flex items-center">
                    <span className="bg-gray-100 border border-r-0 border-gray-300 text-gray-500 text-xs px-2.5 py-2.5 rounded-l-lg font-mono">
                      /offers/
                    </span>
                    <input
                      name="slug"
                      value={editingOffer.slug || ""}
                      onChange={handleEditInputChange}
                      placeholder="weekend-offers"
                      className="w-full border border-gray-300 rounded-r-lg p-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Description & Active Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Offer Description / Tagline (Optional)
                  </label>
                  <textarea
                    name="description"
                    rows={2}
                    value={editingOffer.description || ""}
                    onChange={handleEditInputChange}
                    placeholder="Short description displayed on the offer page banner/header..."
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Active Status
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={editingOffer.isActive !== false}
                      onChange={handleEditInputChange}
                      className="w-4 h-4 text-red-600 rounded focus:ring-red-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-800 block">
                        {editingOffer.isActive !== false ? "Active on Store" : "Inactive / Draft"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {editingOffer.isActive !== false
                          ? "Visible in footer & direct link"
                          : "Hidden from customers"}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Product Assignment Section */}
              <div className="border-t border-gray-200 pt-5">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Icon icon="mdi:cart-plus" className="text-red-600 w-4 h-4" />
                      Manage Assigned Products
                    </h4>
                    <p className="text-xs text-gray-500">
                      Search and select products for{" "}
                      <a
                        href={`/offers/${editingOffer.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-600 underline font-mono"
                      >
                        /offers/{editingOffer.slug}
                      </a>
                    </p>
                  </div>
                  <span className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-full font-bold">
                    {selectedProductDetails.length} Assigned
                  </span>
                </div>

                {/* Product Search Box */}
                <div className="relative mb-3">
                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => handleProductSearch(e.target.value)}
                    placeholder="Type product name, item code, or model to search..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400">
                    {isSearchingProducts ? (
                      <Icon icon="line-md:loading-loop" className="w-4 h-4 animate-spin text-red-600" />
                    ) : (
                      <Icon icon="ic:baseline-search" className="w-4 h-4" />
                    )}
                  </span>
                </div>

                {/* Search Results Dropdown/List */}
                {productSearchResults.length > 0 && (
                  <div className="mb-4 max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y bg-gray-50">
                    {productSearchResults.map((p) => {
                      const isAlreadyAdded = selectedProductDetails.some((item) => String(item._id) === String(p._id));
                      return (
                        <div
                          key={p._id}
                          className="p-2.5 flex items-center justify-between hover:bg-white transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 relative bg-white border rounded shrink-0 overflow-hidden">
                              <Image
                                src={getProductImage(p)}
                                alt={p.name || "Product"}
                                fill
                                className="object-contain p-1"
                                unoptimized
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                              <p className="text-[11px] text-gray-500">
                                {p.item_code ? `Code: ${p.item_code} | ` : ""}
                                ₹{(p.special_price || p.price || 0).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={isAlreadyAdded}
                            onClick={() => addProductToOffer(p, true)}
                            className={`px-3 py-1 rounded text-xs font-semibold shrink-0 ${
                              isAlreadyAdded
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-red-600 text-white hover:bg-red-700"
                            }`}
                          >
                            {isAlreadyAdded ? "Added" : "+ Add"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Selected Products Chips/List */}
                {selectedProductDetails.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1.5 bg-white">
                    {selectedProductDetails.map((p) => (
                      <div
                        key={p._id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100 hover:bg-gray-100/60 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 relative bg-white border rounded shrink-0 overflow-hidden">
                            <Image
                              src={getProductImage(p)}
                              alt={p.name || "Product"}
                              fill
                              className="object-contain p-0.5"
                              unoptimized
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate max-w-md">{p.name}</p>
                            <p className="text-[11px] text-gray-500">
                              ₹{(p.special_price || p.price || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeProductFromOffer(p._id, true)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove from offer"
                        >
                          <Icon icon="mdi:close-circle" className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg text-xs text-gray-400 bg-gray-50/50">
                    No products assigned yet. Use the search box above to add products to this offer.
                  </div>
                )}
              </div>

              {/* Form Footer */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => handleDeleteClick(editingOffer._id)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium flex items-center gap-1.5"
                >
                  <Icon icon="mingcute:delete-2-line" className="w-4 h-4" /> Delete Offer
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Icon icon="line-md:loading-loop" className="w-4 h-4 animate-spin" /> Updating...
                      </>
                    ) : (
                      <>
                        <Icon icon="mingcute:check-line" className="w-4 h-4" /> Update Offer
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
              <Icon icon="mingcute:delete-2-line" className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Offer?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this offer? This will remove the offer page and its product assignments.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setShowConfirmationModal(false);
                  setOfferToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOffer}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-bold"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
          <div className="bg-white rounded-xl p-5 max-w-sm mx-4 text-center shadow-2xl border border-gray-100 flex items-center gap-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100 shrink-0">
              <Icon icon="mdi:check" className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900 text-left">{successMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
