"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Tag,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
} from "lucide-react";
import { FaShoppingCart } from "react-icons/fa";
import { useCart } from "@/context/CartContext";
import { useCompare } from "@/context/CompareContext";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { useRegion } from "@/context/RegionContext";

// Preset price ranges
const PRICE_PRESETS = [
  { label: "Below ₹5,000", min: 0, max: 5000 },
  { label: "₹5,000 - ₹10,000", min: 5000, max: 10000 },
  { label: "₹10,000 - ₹20,000", min: 10000, max: 20000 },
  { label: "₹20,000 - ₹50,000", min: 20000, max: 50000 },
  { label: "Above ₹50,000", min: 50000, max: 1000000 },
];

// Preset discounts
const DISCOUNT_PRESETS = [
  { label: "10% and Above", value: 10 },
  { label: "20% and Above", value: 20 },
  { label: "30% and Above", value: 30 },
  { label: "40% and Above", value: 40 },
  { label: "50% and Above", value: 50 },
  { label: "60% and Above", value: 60 },
  { label: "70% and Above", value: 70 },
];

function ProductCompareButton({ product }) {
  const { isInCompare, addToCompare, removeFromCompare } = useCompare();
  const [loading, setLoading] = useState(false);
  const inCompare = isInCompare(product?._id);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      if (inCompare) {
        await removeFromCompare(product._id);
      } else {
        await addToCompare(product);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`w-full py-1.5 px-3 border border-[#d72828] text-xs font-bold rounded uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors mb-2.5 ${inCompare
        ? "bg-[#d72828] text-white hover:bg-[#b52020]"
        : "bg-white text-[#d72828] hover:bg-red-50"
        }`}
    >
      {inCompare ? (
        <>
          <Check size={13} strokeWidth={2.8} />
          <span>IN COMPARE</span>
        </>
      ) : (
        <>
          <span className="text-sm font-extrabold leading-none">+</span>
          <span>ADD TO COMPARE</span>
        </>
      )}
    </button>
  );
}

function ProductCardImage({ src, alt }) {
  const placeholder = "/uploads/products/placeholder.jpg";
  const cleanFilename = src
    ? String(src).replace(/^\/?(uploads\/products\/)?/, "").replace(/^\/+/, "")
    : "";

  const initialSrc = !cleanFilename
    ? placeholder
    : cleanFilename.startsWith("http")
      ? cleanFilename
      : `/uploads/products/${cleanFilename}`;

  const [imgSrc, setImgSrc] = useState(initialSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(initialSrc);
    setHasError(false);
  }, [initialSrc]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      if (cleanFilename && !cleanFilename.startsWith("http")) {
        setImgSrc(`http://213.165.95.239:3001/uploads/products/${cleanFilename}`);
      } else {
        setImgSrc(placeholder);
      }
    } else {
      setImgSrc(placeholder);
    }
  };

  return (
    <Image
      src={imgSrc}
      alt={alt || "Product image"}
      width={190}
      height={190}
      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
      unoptimized
      onError={handleError}
    />
  );
}

export default function AllProductsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateCartCount } = useCart();
  const { pincode: headerPincode, userLocation, region: currentRegion } = useRegion();
  const [isPending, startTransition] = useTransition();

  // State from URL
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || ""
  );
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || ""
  );
  const [selectedBrands, setSelectedBrands] = useState(
    searchParams.get("brand") ? searchParams.get("brand").split(",") : []
  );
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [selectedDiscount, setSelectedDiscount] = useState(
    searchParams.get("discount") || ""
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get("sort") || "featured"
  );

  // Data state
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    limit: 15,
  });
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);

  // Brand search within filter
  const [brandSearch, setBrandSearch] = useState("");

  // Mobile filter drawer state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Accordion toggle states
  const [catOpen, setCatOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);
  const [brandOpen, setBrandOpen] = useState(true);
  const [discountOpen, setDiscountOpen] = useState(true);
  const [expandedCats, setExpandedCats] = useState({});
  const [expandedSubs, setExpandedSubs] = useState({});

  const toggleCatExpand = (catSlug) => {
    setExpandedCats((prev) => ({
      ...prev,
      [catSlug]: !prev[catSlug],
    }));
  };

  const toggleSubExpand = (subSlug) => {
    setExpandedSubs((prev) => ({
      ...prev,
      [subSlug]: !prev[subSlug],
    }));
  };

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "15");
      if (search.trim()) params.set("search", search.trim());
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedBrands.length > 0)
        params.set("brand", selectedBrands.join(","));
      if (minPrice !== "") params.set("minPrice", String(minPrice));
      if (maxPrice !== "") params.set("maxPrice", String(maxPrice));
      if (selectedDiscount) params.set("discount", String(selectedDiscount));
      if (sortBy) params.set("sort", sortBy);

      const res = await fetch(`/api/all-products?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (data.success) {
        setProducts(data.products || []);
        setPagination(
          data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalProducts: 0,
            limit: 15,
          }
        );
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
        }
        if (data.brands && data.brands.length > 0) {
          setBrands(data.brands);
        }
      } else {
        toast.error(data.message || "Failed to load products");
      }
    } catch (err) {
      console.error("Error fetching all products:", err);
      toast.error("Unable to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    selectedCategory,
    selectedBrands,
    minPrice,
    maxPrice,
    selectedDiscount,
    sortBy,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Sync state to URL without reloading
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (search.trim()) params.set("search", search.trim());
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedBrands.length > 0)
      params.set("brand", selectedBrands.join(","));
    if (minPrice !== "") params.set("minPrice", String(minPrice));
    if (maxPrice !== "") params.set("maxPrice", String(maxPrice));
    if (selectedDiscount) params.set("discount", String(selectedDiscount));
    if (sortBy && sortBy !== "featured") params.set("sort", sortBy);

    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""
      }`;
    window.history.replaceState(null, "", newUrl);
  }, [
    page,
    search,
    selectedCategory,
    selectedBrands,
    minPrice,
    maxPrice,
    selectedDiscount,
    sortBy,
  ]);

  // Handlers
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleCategorySelect = (catSlugOrName, parentSlug = null) => {
    setSelectedCategory((prev) =>
      prev === catSlugOrName ? "" : catSlugOrName
    );
    if (parentSlug) {
      setExpandedCats((prev) => ({ ...prev, [parentSlug]: true }));
    }
    if (catSlugOrName) {
      setExpandedCats((prev) => ({ ...prev, [catSlugOrName]: true }));
      setExpandedSubs((prev) => ({ ...prev, [catSlugOrName]: true }));
    }
    setPage(1);
  };

  const handleBrandToggle = (brandIdentifier) => {
    setSelectedBrands((prev) => {
      const exists = prev.includes(brandIdentifier);
      const next = exists
        ? prev.filter((b) => b !== brandIdentifier)
        : [...prev, brandIdentifier];
      return next;
    });
    setPage(1);
  };

  const handlePriceApply = (e) => {
    e?.preventDefault?.();
    setPage(1);
    fetchProducts();
  };

  const handlePricePresetSelect = (preset) => {
    if (minPrice === String(preset.min) && maxPrice === String(preset.max)) {
      setMinPrice("");
      setMaxPrice("");
    } else {
      setMinPrice(String(preset.min));
      setMaxPrice(String(preset.max));
    }
    setPage(1);
  };

  const handleDiscountToggle = (value) => {
    setSelectedDiscount((prev) =>
      prev === String(value) ? "" : String(value)
    );
    setPage(1);
  };

  const handleClearAll = () => {
    setSearch("");
    setSearchInput("");
    setSelectedCategory("");
    setSelectedBrands([]);
    setMinPrice("");
    setMaxPrice("");
    setSelectedDiscount("");
    setSortBy("featured");
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    search ||
    selectedCategory ||
    selectedBrands.length > 0 ||
    minPrice !== "" ||
    maxPrice !== "" ||
    selectedDiscount ||
    sortBy !== "featured"
  );

  // Buy Now handler: Add to cart and immediately proceed to cart
  const handleBuyNow = async (product) => {
    if (!product.inStock) {
      toast.warning("This product is currently out of stock.");
      return;
    }

    setAddingId(product._id);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      let guestCartId = null;
      if (!token && typeof window !== "undefined") {
        guestCartId = localStorage.getItem("guestCartId") || uuidv4();
        localStorage.setItem("guestCartId", guestCartId);
      }

      const effectiveUserState =
        userLocation?.stateName ||
        userLocation?.state ||
        (currentRegion === "karnataka" ? "Karnataka" : "Tamil Nadu");
      const effectiveRegion =
        currentRegion ||
        userLocation?.region ||
        (effectiveUserState === "Karnataka" ? "karnataka" : "tamilnadu");

      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(guestCartId && { guestCartId }),
        },
        body: JSON.stringify({
          productId: product._id,
          quantity: 1,
          guestCartId: guestCartId || undefined,
          pincode: headerPincode || userLocation?.pincode || "",
          userState: effectiveUserState,
          region: effectiveRegion,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.cart?.totalItems != null) {
          updateCartCount(data.cart.totalItems);
        }
        toast.success("Added to cart! Redirecting to checkout...");
        router.push("/cart");
      } else {
        // Fallback: redirect directly to the PDP if special handling is needed
        router.push(`/product/${product.slug}`);
      }
    } catch (err) {
      console.error("Error during Buy Now:", err);
      router.push(`/product/${product.slug}`);
    } finally {
      setAddingId(null);
    }
  };

  // Filtered brands list based on search inside filter
  const visibleBrands = brands.filter((b) =>
    b.brand_name.toLowerCase().includes(brandSearch.toLowerCase().trim())
  );

  // Helper to format image URL
  const resolveImageUrl = (img) => {
    if (!img || typeof img !== "string") return "/no-catimg.png";
    if (img.startsWith("http")) return img;
    const cleanImg = img
      .replace(/^\/?(uploads\/products\/)?/, "")
      .replace(/^\/+/, "");
    return `/uploads/products/${cleanImg}`;
  };

  // Pagination page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPage(newPage);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Build pagination numbers
  const renderPaginationButtons = () => {
    const totalPages = pagination.totalPages;
    const current = pagination.currentPage;
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (current <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (current >= totalPages - 3) {
        pages.push(
          1,
          "...",
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(
          1,
          "...",
          current - 1,
          current,
          current + 1,
          "...",
          totalPages
        );
      }
    }

    return pages.map((p, idx) => {
      if (p === "...") {
        return (
          <span
            key={`dots-${idx}`}
            className="w-9 h-9 flex items-center justify-center text-gray-400 font-bold"
          >
            ...
          </span>
        );
      }
      const isActive = p === current;
      return (
        <button
          key={`page-${p}`}
          onClick={() => handlePageChange(p)}
          className={`w-9 h-9 rounded-md text-sm font-bold transition-colors ${isActive
            ? "bg-[#d72828] text-white shadow-sm"
            : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
        >
          {p}
        </button>
      );
    });
  };

  // Sidebar Filter Content (Shared between Desktop & Mobile)
  const FilterContent = (
    <div className="space-y-5 text-gray-800">
      {/* Categories Section */}
      <div className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-xs">
        <button
          onClick={() => setCatOpen(!catOpen)}
          className="w-full flex items-center justify-between p-3.5 bg-gray-50 text-left font-bold text-xs uppercase tracking-wider text-gray-700 hover:bg-gray-100 transition-colors border-b border-gray-100"
        >
          <span>CATEGORIES</span>
          {catOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {catOpen && (
          <div className="p-3.5 max-h-80 overflow-y-auto space-y-2 text-sm">
            {/* All Categories Option */}
            <button
              onClick={() => handleCategorySelect("")}
              className={`w-full text-left py-1 px-1 rounded transition-colors flex items-center gap-2.5 text-xs sm:text-sm ${selectedCategory === ""
                  ? "font-bold text-[#d72828]"
                  : "text-gray-700 hover:text-[#d72828] font-medium"
                }`}
            >
              <span className="text-[#d72828] font-black text-sm w-4 flex justify-center shrink-0">
                •
              </span>
              <span>All Categories</span>
            </button>

            {/* List of categories with bold red '+' matching screenshot */}
            {categories.map((c) => {
              const isSelected =
                selectedCategory === c.category_slug ||
                selectedCategory === c.category_name ||
                selectedCategory === c._id;
              const hasSub =
                Array.isArray(c.subcategories) && c.subcategories.length > 0;
              const isExpanded = Boolean(expandedCats[c.category_slug]);

              return (
                <div
                  key={c._id}
                  className="border-b border-gray-50 last:border-0 pb-1"
                >
                  {/* Level 1: Main Category */}
                  <div className="flex items-center justify-between py-1 group">
                    <div className="flex items-center gap-2 text-left text-xs sm:text-sm flex-1 min-w-0">
                      {/* Bold Red '+' or '-' button to toggle Level 2 */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasSub) toggleCatExpand(c.category_slug);
                        }}
                        className="w-4 h-4 flex items-center justify-center shrink-0 cursor-pointer hover:scale-115 transition-transform"
                        title={isExpanded ? "Collapse" : "Expand"}
                      >
                        {hasSub && isExpanded ? (
                          <Minus
                            size={15}
                            strokeWidth={3}
                            className="text-[#d72828]"
                          />
                        ) : (
                          <Plus
                            size={15}
                            strokeWidth={3}
                            className="text-[#d72828]"
                          />
                        )}
                      </button>

                      {/* Main Category Label */}
                      <button
                        type="button"
                        onClick={() => {
                          handleCategorySelect(c.category_slug);
                          if (hasSub && !isExpanded) toggleCatExpand(c.category_slug);
                        }}
                        className={`truncate text-left transition-colors flex-1 ${
                          isSelected
                            ? "font-bold text-[#d72828]"
                            : "text-gray-800 hover:text-[#d72828] font-medium"
                        }`}
                      >
                        {c.category_name}
                      </button>
                    </div>
                  </div>

                  {/* Level 2: Subcategories (when L1 is expanded) */}
                  {hasSub && isExpanded && (
                    <div className="pl-5 pt-1 pb-1 space-y-1.5 text-xs border-l-2 border-red-100 ml-2">
                      {c.subcategories.map((sub) => {
                        const isSubSelected =
                          selectedCategory === sub.category_slug ||
                          selectedCategory === sub.category_name ||
                          selectedCategory === sub._id;
                        const hasChildren =
                          Array.isArray(sub.children) && sub.children.length > 0;
                        const isSubExpanded = Boolean(
                          expandedSubs[sub.category_slug]
                        );

                        return (
                          <div key={sub._id} className="pb-0.5">
                            <div className="flex items-center justify-between py-0.5 group">
                              <div className="flex items-center gap-1.5 text-left flex-1 min-w-0">
                                {/* '+' button for Subcategory if it has children */}
                                {hasChildren ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSubExpand(sub.category_slug);
                                    }}
                                    className="w-3.5 h-3.5 flex items-center justify-center shrink-0 cursor-pointer hover:scale-115 transition-transform"
                                    title={isSubExpanded ? "Collapse" : "Expand"}
                                  >
                                    {isSubExpanded ? (
                                      <Minus
                                        size={12}
                                        strokeWidth={3}
                                        className="text-[#d72828]"
                                      />
                                    ) : (
                                      <Plus
                                        size={12}
                                        strokeWidth={3}
                                        className="text-[#d72828]"
                                      />
                                    )}
                                  </button>
                                ) : (
                                  <span className="w-3.5 text-gray-400 text-center shrink-0">
                                    •
                                  </span>
                                )}

                                {/* Subcategory Label */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleCategorySelect(
                                      sub.category_slug,
                                      c.category_slug
                                    );
                                    if (hasChildren && !isSubExpanded) {
                                      toggleSubExpand(sub.category_slug);
                                    }
                                  }}
                                  className={`truncate text-left transition-colors flex-1 ${
                                    isSubSelected
                                      ? "font-bold text-[#d72828]"
                                      : "text-gray-700 hover:text-[#d72828] font-medium"
                                  }`}
                                >
                                  {sub.category_name}
                                </button>
                              </div>
                            </div>

                            {/* Level 3: Child Categories (when L2 is expanded) */}
                            {hasChildren && isSubExpanded && (
                              <div className="pl-4 pt-1 pb-1 space-y-1 text-[11.5px] border-l border-red-200 ml-1.5">
                                {sub.children.map((child) => {
                                  const isChildSelected =
                                    selectedCategory === child.category_slug ||
                                    selectedCategory === child.category_name ||
                                    selectedCategory === child._id;
                                  return (
                                    <button
                                      key={child._id}
                                      type="button"
                                      onClick={() =>
                                        handleCategorySelect(
                                          child.category_slug,
                                          c.category_slug
                                        )
                                      }
                                      className={`w-full text-left py-0.5 px-1.5 rounded flex items-center gap-1.5 transition-colors ${
                                        isChildSelected
                                          ? "font-bold text-[#d72828] bg-red-50"
                                          : "text-gray-600 hover:text-[#d72828] hover:bg-gray-50"
                                      }`}
                                    >
                                      <span className="text-[#d72828] font-bold shrink-0 text-xs">
                                        •
                                      </span>
                                      <span className="truncate">
                                        {child.category_name}
                                      </span>
                                      {isChildSelected && (
                                        <Check
                                          size={11}
                                          className="shrink-0 ml-auto text-[#d72828]"
                                        />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Price Section */}
      <div className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-xs">
        <button
          onClick={() => setPriceOpen(!priceOpen)}
          className="w-full flex items-center justify-between p-3.5 bg-gray-50 text-left font-bold text-xs uppercase tracking-wider text-gray-700 hover:bg-gray-100 transition-colors border-b border-gray-100"
        >
          <span>PRICE</span>
          {priceOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {priceOpen && (
          <div className="p-3.5 space-y-3">
            {/* Custom Range Inputs with GO Button */}
            <form onSubmit={handlePriceApply} className="flex items-center gap-2">
              <input
                type="number"
                placeholder="From"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-[#d72828]"
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="number"
                placeholder="To"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-[#d72828]"
              />
              <button
                type="submit"
                className="bg-[#d72828] hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded text-xs tracking-wider transition-colors"
              >
                GO
              </button>
            </form>

            {/* Price Presets */}
            <div className="space-y-1.5 pt-1 border-t border-gray-100">
              {PRICE_PRESETS.map((preset, idx) => {
                const isSelected =
                  minPrice === String(preset.min) &&
                  maxPrice === String(preset.max);
                return (
                  <label
                    key={idx}
                    className="flex items-center gap-2 text-xs text-gray-600 hover:text-black cursor-pointer py-1"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handlePricePresetSelect(preset)}
                      className="accent-[#d72828] w-4 h-4 rounded"
                    />
                    <span>{preset.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Brand Section */}
      <div className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-xs">
        <button
          onClick={() => setBrandOpen(!brandOpen)}
          className="w-full flex items-center justify-between p-3.5 bg-gray-50 text-left font-bold text-xs uppercase tracking-wider text-gray-700 hover:bg-gray-100 transition-colors border-b border-gray-100"
        >
          <span>BRAND</span>
          {brandOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {brandOpen && (
          <div className="p-3.5 space-y-2.5">
            {/* Search Brand input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search Brands..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-[#d72828]"
              />
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>

            {/* Brand Checkboxes with counts */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {visibleBrands.length === 0 ? (
                <div className="text-xs text-gray-400 py-2 text-center">
                  No brands found
                </div>
              ) : (
                visibleBrands.map((b) => {
                  const isChecked =
                    selectedBrands.includes(b.brand_slug) ||
                    selectedBrands.includes(b.brand_name) ||
                    selectedBrands.includes(b._id);
                  return (
                    <label
                      key={b._id}
                      className="flex items-center justify-between text-xs text-gray-600 hover:text-black cursor-pointer py-0.5 select-none"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleBrandToggle(b.brand_slug)}
                          className="accent-[#d72828] w-4 h-4 rounded"
                        />
                        <span className="truncate">{b.brand_name}</span>
                      </div>
                      {b.count > 0 && (
                        <span className="text-[11px] text-gray-400 ml-1">
                          ({b.count})
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Discount Section */}
      <div className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-xs">
        <button
          onClick={() => setDiscountOpen(!discountOpen)}
          className="w-full flex items-center justify-between p-3.5 bg-gray-50 text-left font-bold text-xs uppercase tracking-wider text-gray-700 hover:bg-gray-100 transition-colors border-b border-gray-100"
        >
          <span>DISCOUNT</span>
          {discountOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {discountOpen && (
          <div className="p-3.5 space-y-1.5">
            {DISCOUNT_PRESETS.map((d) => {
              const isChecked = selectedDiscount === String(d.value);
              return (
                <label
                  key={d.value}
                  className="flex items-center gap-2 text-xs text-gray-600 hover:text-black cursor-pointer py-1 select-none"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleDiscountToggle(d.value)}
                    className="accent-[#d72828] w-4 h-4 rounded"
                  />
                  <span>{d.label}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Clear All Filters Button */}
      {hasActiveFilters && (
        <button
          onClick={handleClearAll}
          className="w-full py-2.5 px-3 border border-red-300 bg-red-50 hover:bg-red-100 text-[#d72828] text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors"
        >
          <RotateCcw size={13} />
          <span>Clear All Filters</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-[#f9fafb] min-h-screen pb-16">
      {/* ─── Top Breadcrumbs Bar matching screenshot ─── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between text-xs sm:text-sm">
          <h1 className="font-extrabold tracking-wider uppercase text-gray-800 text-sm sm:text-base">
            ALL PRODUCTS
          </h1>
          <div className="flex items-center gap-1.5 text-gray-500 font-medium">
            <Link href="/" className="hover:text-[#d72828] transition-colors">
              HOME
            </Link>
            <span>/</span>
            <span className="text-gray-800 font-bold uppercase">
              ALL PRODUCTS
            </span>
          </div>
        </div>
      </div>

      {/* ─── Main Content Container ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Mobile Filter Toggle & Controls Bar */}
        <div className="lg:hidden mb-4 flex items-center justify-between gap-3">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md font-bold text-xs text-gray-700 shadow-xs"
          >
            <SlidersHorizontal size={14} className="text-[#d72828]" />
            <span>Filters {hasActiveFilters && "(Active)"}</span>
          </button>
          <div className="text-xs text-gray-500">
            {pagination.totalProducts.toLocaleString("en-IN")} Products
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ─── Desktop Left Sidebar ─── */}
          <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-24">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="font-bold text-sm text-gray-800 uppercase tracking-wide">
                Filters
              </span>
              {hasActiveFilters && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-[#d72828] hover:underline font-semibold"
                >
                  Clear All
                </button>
              )}
            </div>
            {FilterContent}
          </aside>

          {/* ─── Right Main Products Section ─── */}
          <div className="flex-1 w-full min-w-0">
            {/* Top Toolbar: Search in Collection & Sorting */}
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
              {/* Search in this collection */}
              <form
                onSubmit={handleSearchSubmit}
                className="relative flex-1 max-w-md"
              >
                <input
                  type="text"
                  placeholder="Search in this collection..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-md text-xs sm:text-sm focus:outline-none focus:border-[#d72828]"
                />
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </form>

              {/* Sort By Dropdown & Count */}
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <span className="hidden md:inline text-xs text-gray-500 whitespace-nowrap">
                  Showing{" "}
                  {pagination.totalProducts > 0
                    ? `${(page - 1) * pagination.limit + 1} - ${Math.min(
                      page * pagination.limit,
                      pagination.totalProducts
                    )}`
                    : "0"}{" "}
                  of {pagination.totalProducts.toLocaleString("en-IN")}
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                    Sort by:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPage(1);
                    }}
                    className="border border-gray-300 rounded-md py-1.5 px-2.5 text-xs sm:text-sm bg-white font-medium text-gray-700 focus:outline-none focus:border-[#d72828]"
                  >
                    <option value="featured">Featured</option>
                    <option value="price-low-high">Price: Low to High</option>
                    <option value="price-high-low">Price: High to Low</option>
                    <option value="name-a-z">Name: A to Z</option>
                    <option value="name-z-a">Name: Z to A</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Active Filters Badges */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs text-gray-500 font-medium">
                  Active Filters:
                </span>
                {search && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-[#d72828] text-xs font-semibold rounded-full border border-red-200">
                    Search: {search}
                    <button
                      onClick={() => {
                        setSearch("");
                        setSearchInput("");
                      }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-[#d72828] text-xs font-semibold rounded-full border border-red-200">
                    Category: {selectedCategory}
                    <button onClick={() => setSelectedCategory("")}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                {selectedBrands.map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-[#d72828] text-xs font-semibold rounded-full border border-red-200"
                  >
                    Brand: {b}
                    <button onClick={() => handleBrandToggle(b)}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {(minPrice || maxPrice) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-[#d72828] text-xs font-semibold rounded-full border border-red-200">
                    Price: ₹{minPrice || 0} - ₹{maxPrice || "Max"}
                    <button
                      onClick={() => {
                        setMinPrice("");
                        setMaxPrice("");
                      }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {selectedDiscount && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-[#d72828] text-xs font-semibold rounded-full border border-red-200">
                    Discount: {selectedDiscount}%+
                    <button onClick={() => setSelectedDiscount("")}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                <button
                  onClick={handleClearAll}
                  className="text-xs text-gray-500 hover:text-[#d72828] underline font-medium ml-1"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* ─── Products List Cards ─── */}
            {loading ? (
              // Loading Skeleton
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col md:flex-row gap-5 animate-pulse"
                  >
                    <div className="w-44 h-44 bg-gray-200 rounded-md shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-100 rounded w-1/2" />
                      <div className="h-3 bg-gray-100 rounded w-5/6" />
                      <div className="h-3 bg-gray-100 rounded w-4/6" />
                      <div className="h-3 bg-gray-100 rounded w-3/6" />
                    </div>
                    <div className="w-48 flex flex-col items-end space-y-3 shrink-0">
                      <div className="h-4 bg-gray-200 rounded w-20" />
                      <div className="h-7 bg-gray-300 rounded w-28" />
                      <div className="h-6 bg-red-100 rounded w-36" />
                      <div className="h-10 bg-gray-200 rounded w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              // Empty State
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center my-6">
                <div className="w-16 h-16 bg-red-50 text-[#d72828] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={28} />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  No products found
                </h3>
                <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
                  We could not find any products matching your selected filters.
                  Try clearing or adjusting your filter criteria.
                </p>
                <button
                  onClick={handleClearAll}
                  className="bg-[#d72828] hover:bg-red-700 text-white font-bold py-2 px-6 rounded text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>Reset All Filters</span>
                </button>
              </div>
            ) : (
              // Product Cards List (Horizontal Layout from Reference)
              <div className="space-y-3.5">
                {products.map((product) => {
                  const origPrice = product.price || 0;
                  const specPrice = product.special_price || origPrice;
                  const hasDiscount =
                    product.hasDiscount ||
                    (origPrice > 0 && specPrice > 0 && specPrice < origPrice);
                  const discountPercent =
                    product.discountPercent ||
                    (hasDiscount
                      ? Math.round(((origPrice - specPrice) / origPrice) * 100)
                      : 0);

                  const isAdding = addingId === product._id;

                  return (
                    <div
                      key={product._id}
                      className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col md:flex-row items-center md:items-start gap-4 sm:gap-6 relative"
                    >
                      {/* Left: Product Image */}
                      <Link
                        href={`/product/${product.slug}`}
                        className="w-40 h-40 sm:w-48 sm:h-48 flex-shrink-0 flex items-center justify-center bg-white p-2 rounded-md overflow-hidden relative group"
                      >
                        <ProductCardImage
                          src={product.imgSrc}
                          alt={product.name}
                        />
                      </Link>

                      {/* Middle: Details & Bullet Highlights */}
                      <div className="flex-1 min-w-0 text-left w-full">
                        {product.brandName && (
                          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                            {product.brandName}
                          </span>
                        )}

                        <Link
                          href={`/product/${product.slug}`}
                          className="text-gray-900 font-bold text-sm sm:text-base hover:text-[#d72828] transition-colors line-clamp-2 block leading-snug uppercase"
                        >
                          {product.name}
                        </Link>

                        {/* Bullet Highlights List */}
                        {Array.isArray(product.highlights) &&
                          product.highlights.length > 0 && (
                            <ul className="text-xs sm:text-sm text-gray-600 space-y-1.5 my-3">
                              {product.highlights.map((highlight, hIdx) => (
                                <li
                                  key={hIdx}
                                  className="flex items-start gap-2"
                                >
                                  <span className="text-gray-400 font-bold leading-tight">
                                    •
                                  </span>
                                  <span className="leading-tight text-gray-700">
                                    {highlight}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}

                      </div>

                      {/* Right: Pricing, Stock, Compare, and Buy Now CTA (Image 2 design) */}
                      <div className="flex flex-col items-center justify-center w-full md:w-auto md:min-w-[190px] md:border-l md:border-gray-100 md:pl-6 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 text-center">
                        {/* Price Line: Red Strikethrough MRP followed by Black Bold Selling Price */}
                        <div className="flex items-center justify-center gap-2 mb-2">
                          {hasDiscount && origPrice > 0 && (
                            <span className="text-[#d72828] line-through font-semibold text-base sm:text-lg">
                              ₹{origPrice.toLocaleString("en-IN")}
                            </span>
                          )}
                          <span className="text-black font-extrabold text-xl sm:text-2xl">
                            ₹{specPrice.toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* In Stock Badge: Green pill with quantity */}
                        <div className="mb-3">
                          {product.inStock ? (
                            <span className="inline-block bg-[#1ea84c] text-white font-bold text-xs px-3.5 py-1 rounded shadow-xs select-none">
                              In Stock: {product.quantity ?? 1}
                            </span>
                          ) : (
                            <span className="inline-block bg-gray-400 text-white font-bold text-xs px-3.5 py-1 rounded shadow-xs select-none">
                              Out of Stock
                            </span>
                          )}
                        </div>

                        {/* + ADD TO COMPARE Button */}
                        <ProductCompareButton product={product} />

                        {/* Red BUY NOW Button with Cart Icon */}
                        <button
                          onClick={() => handleBuyNow(product)}
                          disabled={!product.inStock || isAdding}
                          className={`w-full font-bold py-2.5 px-5 rounded shadow-sm text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${!product.inStock
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : isAdding
                              ? "bg-red-700 text-white opacity-80 cursor-wait"
                              : "bg-[#d72828] hover:bg-red-700 active:scale-95 text-white"
                            }`}
                        >
                          {isAdding ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>BUYING...</span>
                            </>
                          ) : !product.inStock ? (
                            <span>OUT OF STOCK</span>
                          ) : (
                            <>
                              <FaShoppingCart className="text-white text-sm shrink-0" />
                              <span>BUY NOW</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── Bottom Pagination ─── */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-6">
                <span className="text-xs text-gray-500">
                  Page {pagination.currentPage} of {pagination.totalPages} (
                  {pagination.totalProducts.toLocaleString("en-IN")} products)
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Prev Button */}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className="p-2 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Page Numbers */}
                  {renderPaginationButtons()}

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="p-2 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Next Page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Mobile Slide-over Drawer for Filters ─── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-4 overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <span className="font-bold text-sm uppercase tracking-wide text-gray-800">
                Filter Products
              </span>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1">{FilterContent}</div>

            <div className="pt-4 border-t border-gray-200 mt-4">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full bg-[#d72828] text-white font-bold py-2.5 rounded text-xs uppercase tracking-wider"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

