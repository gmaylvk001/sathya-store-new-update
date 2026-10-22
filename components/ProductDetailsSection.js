'use client';
// import { useState, useEffect } from "react";
import { useState, useEffect, useRef,useMemo } from "react";
import { SiTicktick } from "react-icons/si";
import { TbBrandAppgallery } from "react-icons/tb";
import { FiBox, FiHash } from "react-icons/fi";
import Image from "next/image";
import { FaShoppingCart, FaStar } from "react-icons/fa";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { useHeaderdetails } from '@/context/HeaderContext';
import { toast } from 'react-toastify';
import { getDiscountInfo } from "@/lib/discountHelper";



function StarRating({ value, onChange }) {
    return (
      <div className="flex space-x-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <span
              className={`text-2xl ${
                star <= value ? "text-yellow-400" : "text-gray-300"
              }`}
            >
              ★
            </span>
          </button>
        ))}
      </div>
    );
  }

function DynamicTabs({ tabs, activeName, onTabChange }) {
    const titleize = (s) => {
      if (s === "manufacturer") return "Manufacturer Details";
      return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
    };

    return (
      <div>
<div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 gap-6 sm:gap-10 px-1">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => onTabChange && onTabChange(tab.name)}
           className={`py-3 sm:py-4 text-base sm:text-lg transition-all duration-200 border-b-[3px] -mb-[2px] whitespace-nowrap flex-shrink-0 ${
  activeName === tab.name
    ? "border-blue-600 text-blue-600 font-bold"
    : "border-transparent text-gray-600 font-medium hover:text-gray-900"
}`}
            >
              {titleize(tab.name)}
            </button>
          ))}
        </div>

        {/* Keep all tabs mounted; only the active one is visible.
           This preserves Flix DOM so it doesn't need to reload. */}
        {tabs.map((tab) => (
          <div
            key={tab.name}
            style={{ display: activeName === tab.name ? "block" : "none" }}
            className={
  tab.name === "overview" || tab.name === "manufacturer"
    ? "w-full px-4 py-6 text-left bg-gray-50"
    : "w-full px-4 py-6 text-left"
}
          >
            {tab.content}
          </div>
        ))}
      </div>
    );
  }
 function ReviewsTab({ reviewForm, setReviewForm, handleReviewSubmit, submitting, tabData, formatReviewDate }) {
  return (
    <div>
      <form onSubmit={handleReviewSubmit} className="bg-white p-4 rounded-md shadow mt-3">
        <h3 className="font-semibold text-left mb-2">Write a Review</h3>
        <input
          type="text"
          placeholder="Review Title"
          value={reviewForm.title}
          onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
          required
          className="w-full border rounded p-2 mb-2"
        />
        <StarRating value={reviewForm.rating} onChange={(rating) => setReviewForm(prev => ({ ...prev, rating }))} />
        <textarea
          placeholder="Write your comments..."
          value={reviewForm.comment}
          onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
          className="w-full border rounded p-2 mb-2"
          rows="3"
        />
        <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>

      <h2 className="text-sm font-bold text-left mt-3">Customer Reviews</h2>
      <div className="flex items-center mt-2">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`text-2xl ${i < Math.floor(tabData.reviews.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
        ))}
        <span className="text-gray-700 ml-2 text-sm">
          {tabData.reviews.rating.toFixed(1)} ({tabData.reviews.count} Reviews)
        </span>
      </div>

      {tabData.reviews.items.length > 0 ? (
        <div className="mt-4 space-y-3">
          {tabData.reviews.items.map((review, index) => (
            <div key={index} className={`border-b border-gray-300 pb-3 ${index === 0 ? "border-t" : ""}`}>
              <div className="flex text-lg items-baseline mt-1">
                {[...Array(5)].map((_, i) => (
                  <span className="text-yellow-400" key={i}>{i < review.rating ? '★' : '☆'}</span>
                ))}
                <p className="text-gray-700 font-medium text-sm ml-1">{review.title}</p>
              </div>
              <p className="text-gray-700 text-left mt-2 text-sm">{review.comment}</p>
              <p className="text-gray-400 text-left text-xs mt-1">
                Reviewed By {review.userName} on {formatReviewDate(review.date)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 mt-4 text-sm">No reviews yet. Be the first to review this product!</p>
      )}
    </div>
  );
}

function parseProductHighlights(highlights) {
  if (!Array.isArray(highlights)) return [];
  return highlights
    .flatMap((item) => String(item).split(/[\n,]+/).map((x) => x.trim()))
    .filter((item) => item.length > 0);
}

function parseKeyFeatures(keySpecs) {
  if (!Array.isArray(keySpecs)) return [];
  return keySpecs
    .flatMap((item) => String(item).split(/,(?![^(]*\))/))
    .map((f) => String(f).replace(/[{}\[\]"]/g, "").trim())
    .filter((f) => f.length > 0);
}

export default function ProductDetailsSection({ product, reviews=[], avgRating=0, reviewCount=0, manufacturerName="", manufacturerAddress="", flixInstanceActive = true, flixInpageAvailable = null}) {
  const [brand, setBrand] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  // NEW: ensure default tab is set only once per product id
  const defaultTabSetRef = useRef(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loadingRecentlyViewed, setLoadingRecentlyViewed] = useState(false);
  const { updateHeaderdetails, setIsLoggedIn, setUserData,setIsAdmin } = useHeaderdetails();
  const [brandName, setBrandName] = useState("");

  const productHighlights = useMemo(
    () => parseProductHighlights(product?.product_highlights),
    [product?.product_highlights],
  );
  const keyFeatures = useMemo(
    () => parseKeyFeatures(product?.key_specifications),
    [product?.key_specifications],
  );
 
  const tabData = {
    overview: product.overview || "No overview available.",
    description: product.description || "No description available.",
    videos: product.videos || [],
    overview: product.overview || "No overview available.",
    // reviews: {
    //   rating: product.rating || 0,
    //   count: product.reviews || 0,
    //   items: product.reviewItems || []
    // }
    reviews: {
      rating: avgRating,
      count: reviewCount,
      items: reviews.map(r => ({
        title: r.reviews_title,
        rating: r.reviews_rating,
        comment: r.reviews_comments,
        userName: r.user_id?.name || "Anonymous",
        date: r.created_date
      }))
    }
  };
  // Replace "tabs" with UI-aligned tabs only (videos is not rendered in tabsForUI)
  // const tabs = ["overview", "description", "videos", "reviews"];
  const uiTabs = ["overview", "specifications", "manufacturer", "reviews", "faq"];

  // Check if a tab has content
  const hasTabContent = (tabId) => {
    const PLACEHOLDER = "There is no product overview available for this item.";
    switch (tabId) {
      case "overview":
        return Boolean(
          ((product.overview && product.overview.trim() !== "" && product.overview.trim() !== PLACEHOLDER)) ||
          (product.overview_image &&
            (Array.isArray(product.overview_image)
              ? product.overview_image.length > 0
              : String(product.overview_image).split(",").filter(Boolean).length > 0)) ||
          (product.flix_data && (product.flix_data.inpage || product.flix_data.widget))
        );
      case "description":
        return product.description && product.description.trim() !== "";
      case "reviews":
        return true;
      // "videos" is intentionally ignored because it is not rendered in tabsForUI
      default:
        return false;
    }
  };

  // Only consider the tabs actually rendered by the UI
  const getFirstTabWithContent = () => {
    for (const tab of uiTabs) {
      if (hasTabContent(tab)) return tab;
    }
    return "overview";
  };

  // REPLACE the multi-effect activeTab setters with a single, one-time initializer per product
  useEffect(() => {
    // reset the one-time flag when product changes
    defaultTabSetRef.current = false;
  }, [product?._id]);

  useEffect(() => {
    if (!product || defaultTabSetRef.current) return;
    const firstAvailable = getFirstTabWithContent();
    setActiveTab(firstAvailable);
    defaultTabSetRef.current = true;
  }, [product, reviews?.length]);

  // DELETE this effect to prevent tab flicker and "overview" disappearing:
  // useEffect(() => {
  //   if (!product) return;
  //   const hasTextOrImages = /* ...existing code... */;
  //   if (flixLoaded || hasTextOrImages) { setActiveTab("overview"); } else if (...) { ... } else { ... }
  // }, [product?._id, flixLoaded]);

  // Keep any deep-link (#reviews) override
  const reviewsRef = useRef(null);
  useEffect(() => {
    if (window.location.hash === "#reviews") {
      setActiveTab("reviews");
      setTimeout(() => {
        const headerEl = document.querySelector("header"); // get header
        const headerHeight = headerEl ? headerEl.offsetHeight : 0;
  
        if (reviewsRef.current) {
          const y = reviewsRef.current.getBoundingClientRect().top + window.scrollY - headerHeight - 10; 
          // `-10` gives little gap below header
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }, 300);
    }
  }, []);
  const fetchBrand = async () => {
    try {
      const response = await fetch("/api/brand");
      const result = await response.json();
      if (result.error || !Array.isArray(result?.data)) {
        if (result.error) console.warn("Brand fetch:", result.error);
      } else {
        const data = result.data;

        // Format for react-select
        const brandOptions = data.map((b) => ({
          value: b._id,
          label: b.brand_name,
        }));

        setBrand(brandOptions);
        // 👉 If you already have the ID and want to get the label (e.g., when editing)
        if (product.brand) {
          const matched = brandOptions.find((b) => b.value === product.brand);
          // set brandName from matched label if product.brand is an id
          if (matched && matched.label) {
            setBrandName((prev) => (prev ? prev : matched.label));
          }
        }
      }
    } catch (error) {
      console.warn("Could not fetch brand:", error.message);
    }
  };
  // Removed premature initialActiveName calculation; it will be defined after tabsForUI.
  // const initialActiveName =
  //   tabsForUI.find((tab) => tab.content && tab.content !== "")?.name || null;
  useEffect(() => {
    fetchBrand();
  }, []);
  // Derive brandName from the product object or fallback fields; update when product/brand list changes
  useEffect(() => {
    if (!product) return;
    let derived = "";

    // product.brand may be an object or an id
    if (product.brand && typeof product.brand === "object" && product.brand.brand_name) {
      derived = product.brand.brand_name;
    } else if (product.brand) {
      const matched = Array.isArray(brand) ? brand.find((b) => b.value === product.brand) : null;
      if (matched?.label) derived = matched.label;
    } else if (product.brand_name) {
      derived = product.brand_name;
    } else if (product.manufacturer) {
      derived = product.manufacturer;
    }

    if (derived && derived !== brandName) {
      setBrandName(derived);
    }
  }, [product, brand]); // runs when product or brand options are ready

  // Set default active tab once per product
useEffect(() => {
  if (!product) return;
  setActiveTab("overview");
}, [product?._id]);
  const fetchRelatedProducts = async () => {
    try {
      setLoadingRelated(true);
      const response = await fetch(
        `/api/product/related?categoryId=${product.category._id}&excludeId=${product._id}&limit=4`
      );
      const data = await response.json();
      if (data.success) {
        setRelatedProducts(data.products);
      }
    } catch (error) {
      console.error("Error fetching related products:", error);
    } finally {
      setLoadingRelated(false);
    }
  };
  // put this near the top of your component (before return)
  const parseJSONSafe = (value) => {
    if (!value) return null;
    if (typeof value === "object") return value; // already an object
    if (typeof value !== "string") return null;

    const tryParse = (str) => {
      try {
        return JSON.parse(str);
      } catch {
        return undefined;
      }
    };

    let s = value.trim();

    // 1) direct parse
    let parsed = tryParse(s);
    if (parsed !== undefined) {
      // if parsed is a string again (double-encoded), recurse
      return typeof parsed === "string" ? parseJSONSafe(parsed) : parsed;
    }

    // 2) strip wrapping quotes if present and try again
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      s = s.slice(1, -1).trim();
      parsed = tryParse(s);
      if (parsed !== undefined) return typeof parsed === "string" ? parseJSONSafe(parsed) : parsed;
    }

    // 3) unescape common escaped quotes/slashes and try one last time
    try {
      const unescaped = s.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, "\\");
      parsed = tryParse(unescaped);
      if (parsed !== undefined) return typeof parsed === "string" ? parseJSONSafe(parsed) : parsed;
    } catch {}

    return null; // couldn't parse
  };
  const decodeAndClean = (str) => {
    if (!str) return "";

    // Create a temporary element to decode HTML entities
    const temp = document.createElement("textarea");
    temp.innerHTML = str;
    let decoded = temp.value;

    // Remove both actual LRM char and literal "&lrm;"
    decoded = decoded.replace(/\u200E/g, "").replace(/&lrm;/gi, "");

    return decoded.trim();
  };
  const fetchRecentlyViewed = async () => {
    try {
      setLoadingRecentlyViewed(true);
      const response = await fetch(`/api/product/recently-viewed?limit=4`);
      const data = await response.json();
      if (data.success) {
        setRecentlyViewed(data.products);
      }
    } catch (error) {
      // console.error("Error fetching recently viewed products:", error);
       toast.error("Error fetching recently viewed products:", error);
    } finally {
      setLoadingRecentlyViewed(false);
    }
  };
  const renderProductCard = (product) => {
    const { discountPercent: discountPercentage, showDiscount } = getDiscountInfo(
      product.price,
      product.special_price
    );

    return (
      <div key={product._id} className="border rounded-lg p-2 sm:p-3 hover:shadow-md transition-shadow relative">
        {showDiscount && (
          <span className={`px-1 sm:px-2 py-1 text-xs font-bold tracking-wider text-white rounded absolute top-1 sm:top-2 left-1 sm:left-2 ${
            discountPercentage > 30 ? "bg-blue-500" : "bg-orange-500"
          }`}>
            -{discountPercentage}% OFF
          </span>
        )}
        
        <Link href={`/product/${product.slug || product._id}`}>
          <div className="relative h-32 sm:h-40 w-full">
            <Image 
              src={`/uploads/products/${product.images?.[0]}` || "/placeholder.jpg"} 
              alt={product.name} 
              fill
              className="object-contain rounded-md"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/placeholder.jpg";
              }}
            />
          </div>
        </Link>

        <Link href={`/product/${product.slug || product._id}`}>
          <h3 className="text-xs sm:text-sm font-medium mt-1 sm:mt-2 hover:text-blue-600 line-clamp-2">{product.name}</h3>
        </Link>
        <p className="text-gray-600 text-xs">By {product.brand?.brand_name || "Our Store"}</p>
        <div className="flex items-center mt-1">
          <p className="text-sm sm:text-lg font-bold">${showDiscount ? product.special_price : (product.special_price || product.price)}</p>
          {showDiscount && (
            <p className="text-gray-500 text-xs sm:text-sm line-through ml-1 sm:ml-2">${product.price}</p>
          )}
        </div>
        <div className="flex items-center text-xs sm:text-sm mt-1">
          <FaStar className="text-yellow-400 text-xs sm:text-sm" /> 
          <span className="px-1">{product.rating?.toFixed(1) || "0.0"}</span>
          <span className="text-gray-500">({product.reviews || 0})</span>
        </div>
        <button 
          className="w-full mt-1 sm:mt-2 py-1 sm:py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center justify-center gap-1 sm:gap-2 transition duration-300"
          style={{ backgroundColor: '#e0e7ff', color: '#1d4ed8' }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#1d4ed8';
            e.target.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#e0e7ff';
            e.target.style.color = '#1d4ed8';
          }}
        >
          Add To Cart <FaShoppingCart className="text-xs sm:text-sm" />
        </button>
      </div>
    );
  };
  const renderLoadingSkeleton = (count = 4) => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        {[...Array(count)].map((_, index) => (
          <div key={index} className="border rounded-lg p-2 sm:p-3 shadow-md animate-pulse">
            <div className="bg-gray-200 h-32 sm:h-40 rounded-md"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded mt-1 sm:mt-2"></div>
            <div className="h-2 sm:h-3 bg-gray-200 rounded mt-1 w-3/4"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded mt-1 sm:mt-2 w-1/2"></div>
            <div className="h-8 sm:h-10 bg-gray-200 rounded-lg mt-1 sm:mt-2"></div>
          </div>
        ))}
      </div>
    );
  };
  function formatReviewDate(date) {
    const reviewDate = new Date(date);
    const now = new Date();
    const diffInDays = Math.floor((now - reviewDate) / (1000 * 60 * 60 * 24));

    if (diffInDays < 7) {
      return formatDistanceToNow(reviewDate, { addSuffix: true });
    } else {
      return format(reviewDate, "MMM d, yyyy"); 
    }
  }
  const [reviewForm, setReviewForm] = useState({
    title: "",
    rating: 0,
    comment: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const reslt = await fetch('/api/auth/check', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });

      const data1 = await reslt.json();
      if (!data1.loggedIn) {
        // Guard to avoid ReferenceError if openAuthModal is not defined
        if (typeof openAuthModal === 'function') {
          openAuthModal({
            error: 'Please login to continue.',
            onSuccess: () => handleReviewSubmit(),
          });
        }
        toast.error("Please login to continue!..");
        return;
      }

      if (data1.loggedIn) {
        const userId = data1.user?.userId || data1.user?._id;
        const productId = product._id;
        const res = await fetch(`/api/reviews/${product._id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            userId,
            productId,
            reviews_title: reviewForm.title,
            reviews_rating: reviewForm.rating,
            reviews_comments: reviewForm.comment,
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Review added successfully!");
          setReviewForm({ title: "", rating: 0, comment: "" });
        } else {
          toast.error(data.error || "Failed to submit review");
        }
      } else {
        toast.error("Please login to review the product!..");
      }
    } catch (error) {
      // console.error("Error submitting review:", error);
       toast.error("Error submitting review:", error);
    } finally {
      setSubmitting(false);
    }
  };
  // Small, controlled tab component: keep Overview mounted to preserve injected DOM

const overviewContent = (
  <div className="w-full text-left" id="overview-tab">
    {product.overviewdescription && (
      <div className="mb-4">
        <h2 className="text-base font-bold text-gray-900 mb-2">{product.name} Overview</h2>
        <p className="text-sm text-gray-700 leading-relaxed">{product.overviewdescription}</p>
      </div>
    )}

    {keyFeatures.length > 0 && (
      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-900 mb-3">Key Features</h3>
        <ul className="space-y-2">
          {keyFeatures.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                {feature.charAt(0).toUpperCase() + feature.slice(1)}
              </li>
            ))}
        </ul>
      </div>
    )}
    {!product.overviewdescription &&
     keyFeatures.length === 0 &&
     productHighlights.length === 0 && (
      <p className="text-gray-500 text-sm py-4">There is no product overview available for this item.</p>
    )}
  </div>
);
const descriptionContent = (() => {
  // Enhanced sanitize function to detect "<p>null</p>" and other null patterns
  const isNullContent = (value) => {
    if (!value) return true;
    const strValue = String(value).trim().toLowerCase();
    
    // Check for various null patterns including HTML null
    const nullPatterns = [
      "", "null", "undefined", "n/a", "none", "-", 
      "null null", "undefined undefined", "nan",
      "<p>null</p>", "<p>undefined</p>", "<p>n/a</p>",
      "&lt;p&gt;null&lt;/p&gt;", "&lt;p&gt;undefined&lt;/p&gt;"
    ];
    
    return nullPatterns.includes(strValue) || 
           strValue.replace(/<[^>]*>/g, '').trim() === 'null' ||
           strValue === '<p></p>' ||
           strValue === '<p> </p>';
  };

  // Check if we have any real content
  const hasRealContent = () => {
    // Check description
    if (product?.description && !isNullContent(product.description)) {
      return true;
    }
    
    // Check specifications
    const specs = [
      product?.ingredients,
      product?.weight,
      product?.dimensions,
      product?.item_code
    ];
    
    return specs.some(spec => spec && !isNullContent(spec));
  };

  // If no real content, return null to hide the entire tab
  if (!hasRealContent()) {
    return null;
  }

  const descObj = parseJSONSafe(product?.description);
  const hasValidDescription = descObj && typeof descObj === "object" && Object.keys(descObj).length > 0;
  
  // Only show plain description if it's not null content
  const hasPlainDescription = product?.description && 
                            !isNullContent(product.description) && 
                            !descObj;

  // Build specifications - filter out null values
  const specifications = [
    {
      icon: <TbBrandAppgallery size={14} className="text-white" />,
      label: "Brand",
      value: Array.isArray(brand) ? brand.find((b) => b.value === product.brand)?.label : "",
    },
    {
      icon: <FiHash size={16} className="text-white" />,
      label: "Item Code", 
      value: product?.item_code,
    },
    {
      icon: <FiBox size={14} className="text-white" />,
      label: "Ingredients",
      value: product?.ingredients,
    },
    {
      icon: <FiBox size={14} className="text-white" />,
      label: "Weight",
      value: product?.weight,
    },
    {
      icon: <FiBox size={14} className="text-white" />,
      label: "Dimensions",
      value: product?.dimensions, 
    }
  ].filter(item => {
    const value = item.value;
    return value && !isNullContent(value);
  });

  const hasSpecifications = specifications.length > 0;

  const decodeAndClean = (html) => {
  if (!html) return "";

  let cleaned = html;

  // remove starting/ending quotes
  cleaned = cleaned.replace(/^"+|"+$/g, "");

  // remove <p>" and "</p>
  cleaned = cleaned.replace(/^<p>"/, "").replace(/"<\/p>$/, "");

  // decode escaped slashes
  cleaned = cleaned.replace(/\\"/g, '"');
  cleaned = cleaned.replace(/\\\//g, "/");

  // remove unicode invisible chars
  cleaned = cleaned.replace(/\\u200e/g, "");

  // decode html entities
  const txt = document.createElement("textarea");
  txt.innerHTML = cleaned;
  cleaned = txt.value;

  return cleaned;
};



  return (
    <div>
      {/* Product Description - only show if we have valid content */}
      {/* {(hasValidDescription || hasPlainDescription) && (
        <>
          <h2 className={`text-sm font-bold text-left`}>
            Product Description
          </h2>

          {hasValidDescription ? (
            <div className="mt-3 text-xs sm:text-sm text-gray-700 space-y-1">
              {Object.entries(descObj)
                .filter(([key, val]) => {
                  return key && val && !isNullContent(key) && !isNullContent(val);
                })
                .map(([key, val]) => {
                  const cleanKey = decodeAndClean(key);
                  const cleanVal = decodeAndClean(val);
                  return (
                    <div
                      key={cleanKey}
                      className="grid grid-cols-[150px,1fr] gap-x-2 items-start"
                    >
                      <div className={`text-xs sm:text-sm font-bold`}>
                        {cleanKey}:
                      </div>
                      <div className={`text-xs sm:text-sm`}>
                        {cleanVal}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div
              className="mt-3 text-xs sm:text-sm text-gray-700 prose prose-gray max-w-none text-left [&_table]:w-full [&_table]:border-collapse [&_table]:border [&_th]:border [&_td]:border [&_th]:p-2 [&_td]:p-2 [&_tr:nth-child(even)]:bg-gray-50 [&_th]:bg-gray-100 [&_th]:font-semibold"
              dangerouslySetInnerHTML={{
                __html: decodeAndClean(String(product?.description || "")),
              }}
            />
          )}
        </>
      )} */}

      {(hasValidDescription || hasPlainDescription) && (
        <>
          <h2 className="text-sm font-bold text-left">Product Description</h2>
          {hasValidDescription ? (
            <div className="mt-3 text-xs sm:text-sm text-gray-700 space-y-1">
              {Object.entries(descObj)
                .filter(([key, val]) => {
                  return (
                    key &&
                    val &&
                    !isNullContent(key) &&
                    !isNullContent(val)
                  );
                })
                .map(([key, val]) => {
                  const cleanKey = decodeAndClean(key);
                  const cleanVal = decodeAndClean(val);

                  return (
                    <div key={cleanKey} className="grid grid-cols-[150px,1fr] gap-x-2 items-start">
                      <div className="text-xs sm:text-sm font-bold">{cleanKey}:</div>
                      <div className="text-xs sm:text-sm">{cleanVal}</div>
                    </div>
                  );
                })}
            </div>
          ) : (
            (() => {
              const cleanedDescription = decodeAndClean(
                String(product?.description || "")
              );

              // table html iruka check
              const hasTableHtml = cleanedDescription.includes("<table") || cleanedDescription.includes("&lt;table");

              return (
                <div
                  className={
                    hasTableHtml
                      ? `
                        mt-3
                        text-xs sm:text-sm
                        text-gray-700
                        prose
                        prose-gray
                        max-w-none
                        text-left
                        overflow-x-auto

                        [&_table]:w-full
                        [&_table]:border
                        [&_table]:border-collapse

                        [&_th]:border
                        [&_td]:border

                        [&_th]:p-2
                        [&_td]:p-2

                        [&_th]:bg-gray-100
                        [&_th]:font-semibold

                        [&_tr:nth-child(even)]:bg-gray-50
                      `
                      : `
                        mt-3
                        text-xs sm:text-sm
                        text-gray-700
                        prose
                        prose-gray
                        max-w-none
                        text-left
                      `
                  }
                  dangerouslySetInnerHTML={{
                    __html: cleanedDescription,
                  }}
                />
              );
            })()
          )}
        </>
      )}

      {/* Product Specifications - only show if we have valid specifications */}
      {hasSpecifications && (
        <>
          <h2 className="text-sm font-bold mt-3 text-left">
            Product Specifications
          </h2>

          <ul className="mt-1 sm:mt-2 text-gray-700 text-xs sm:text-sm space-y-1">
            {specifications.map((item, idx) => (
              <li key={idx} className="flex items-center">
                <div className="w-5 h-5 flex items-center justify-center bg-gray-600 rounded-md mr-2">
                  {item.icon}
                </div>
                <div className="flex gap-x-1">
                  <strong className="text-xs sm:text-sm">
                    {item.label}:
                  </strong>
                  <span>{item.value}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
})();
  //const resolveFlixIds = (p = {}) => { ... }
{/*   {activeTab === "videos" && (
          <div>
            <h2 className={`text-sm font-bold transition-all duration-200 text-left mt-3`}>Product Videos</h2>
            {tabData.videos.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:gap-4 mt-2 sm:mt-4">
                {tabData.videos.map((video, index) => (
                  <div key={index} className="aspect-w-16 aspect-h-9">
                    <iframe
                      className="w-full h-48 sm:h-64 rounded-lg"
                      src={video.url}
                      title={video.title || `Product Video ${index + 1}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                    {video.title && (
                      <p className="mt-1 sm:mt-2 font-medium text-gray-800 text-sm sm:text-base">{video.title}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">No videos available for this product.</p>
            )}
          </div>
        )} */}

  const faqContent = (
  <div className="text-left max-w-3xl mx-auto">
    <h3 className="text-base font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
    {Array.isArray(product.faqs) && product.faqs.length > 0 ? (
      <div className="space-y-3">
        {product.faqs.map((faq, index) => (
          <details key={index} className="border border-gray-200 rounded-lg p-3 cursor-pointer">
            <summary className="font-medium text-sm text-gray-800 flex justify-between items-center">
              {faq.question}
              <span className="text-blue-600 text-lg">+</span>
            </summary>
            <p className="mt-2 text-sm text-gray-600">{faq.answer}</p>
          </details>
        ))}
      </div>
    ) : (
      <p className="text-sm text-gray-500">No FAQs available for this product.</p>
    )}
  </div>
); 
const manufacturerDbContent = (
  <div className="text-left max-w-3xl">
    {(manufacturerName || manufacturerAddress) ? (
      <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden shadow-sm">

        {/* Header */}
        <div className="flex items-center gap-4 p-5 border-b border-gray-100">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l6-4v18M19 21V11l-6-4M9 9h.01M9 12h.01M9 15h.01" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Manufacturer Information</h3>
            <p className="text-sm text-gray-500 mt-0.5">Details about the product manufacturer and brand.</p>
          </div>
        </div>

        {/* Manufacturer */}
        {manufacturerName && (
          <div className="flex items-center gap-4 p-5 border-b border-gray-100">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Manufacturer</p>
              <p className="text-base font-bold text-gray-900 mt-0.5">{manufacturerName}</p>
            </div>
          </div>
        )}

        {/* Address */}
        {manufacturerAddress && (
          <div className="flex items-center gap-4 p-5 border-b border-gray-100">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Registered Office Address</p>
              <p className="text-base font-bold text-gray-900 mt-0.5">{manufacturerAddress}</p>
            </div>
          </div>
        )}

        {/* Brand */}
        {brandName && (
          <div className="flex items-center gap-4 p-5">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500">Brand</p>
              <p className="text-base font-bold text-gray-900 mt-0.5">{brandName}</p>
            </div>
          </div>
        )}

      </div>
    ) : (
      <p className="text-sm text-gray-500">No manufacturer details available for this product.</p>
    )}
  </div>
);

const showFlixInManufacturer = flixInstanceActive && flixInpageAvailable === true;
const showDbManufacturer = !showFlixInManufacturer;

const manufacturerContent = (
  <div className="w-full text-left" id="manufacturer-tab">
    {flixInstanceActive ? (
      <div
        className="col-md-12 w-full"
        style={{
          display: showFlixInManufacturer ? "block" : "none",
          width: "100%",
        }}
      >
        <div id="flix-inpage" className="w-full" style={{ width: "100%" }} />
      </div>
    ) : null}
    {showDbManufacturer ? manufacturerDbContent : null}
  </div>
);
  // Build tabsForUI (name + content)
const tabsForUI = useMemo(() => [
  { name: "overview", content: overviewContent },
  { name: "specifications", content: descriptionContent },
  { name: "manufacturer", content: manufacturerContent },
  { name: "reviews", content: (
    <ReviewsTab
      reviewForm={reviewForm}
      setReviewForm={setReviewForm}
      handleReviewSubmit={handleReviewSubmit}
      submitting={submitting}
      tabData={tabData}
      formatReviewDate={formatReviewDate}
    />
  )},
  { name: "faq", content: faqContent },
], [reviewForm, submitting, tabData, overviewContent, descriptionContent, faqContent, manufacturerContent, flixInstanceActive, flixInpageAvailable]);
  // Compute initialActiveName AFTER tabsForUI is initialized
  const initialActiveName = (() => {
    const PLACEHOLDER = "There is no product overview available for this item.";
    const hasValidContent = (c) => {
      if (c === null || c === undefined || c === false) return false;
      if (typeof c === "string") {
        const trimmed = c.trim();
        if (!trimmed) return false;
        // Skip if placeholder message present
        if (trimmed.includes(PLACEHOLDER)) return false;
        return true;
      }
      if (Array.isArray(c)) return c.length > 0;
      return true; // JSX or other truthy content
    };
    const overview = tabsForUI.find(t => t.name.toLowerCase() === "overview");
    if (overview && hasValidContent(overview.content)) return overview.name;
    const firstWithContent = tabsForUI.find(t => hasValidContent(t.content));
    return firstWithContent ? firstWithContent.name : (tabsForUI[0]?.name || "");
  })();

  
return (
 <div className="mt-1 sm:mt-2 w-full">
    

    {/* Section 2 — Tabs */}
    <div className="bg-gray-100 py-4 px-2 sm:px-4 max-w-7xl mx-auto">
     <DynamicTabs
  tabs={tabsForUI}
  activeName={activeTab}
  onTabChange={setActiveTab}
/>
    </div>

  </div>
);
}