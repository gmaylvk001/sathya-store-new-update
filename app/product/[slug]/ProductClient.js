'use client';


import ProductDetailsSection from "@/components/ProductDetailsSection";
import OfferRibbonBadge from "@/components/OfferRibbonBadge";
import FlixMediaLoader from "@/components/FlixMediaLoader";
import ProductSkeleton from "@/components/ProductSkeleton";
import ProductVariantSelector from "@/components/ProductVariantSelector";
import ExchangeOfferSection from "@/components/ExchangeOfferSection";
// import RelatedProducts from "@/components/RelatedProducts";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";

import { ShieldHalf } from 'lucide-react';
import { Icon } from '@iconify/react';
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { FaStore, FaPhoneAlt } from "react-icons/fa";
import { FaShield } from "react-icons/fa6";
import { FaShoppingCart, FaHeart, FaShareAlt, FaRupeeSign, FaCartPlus, FaBell } from "react-icons/fa";
import { isOpenBoxEligible, CLEARANCE_PHONE } from "@/lib/openBoxHelper";
import { FiShoppingCart } from "react-icons/fi";
import { TbTruckDelivery } from "react-icons/tb";
import { IoFastFoodOutline, IoReload, IoCardOutline, IoShieldCheckmark, IoStorefront, IoLocationOutline } from "react-icons/io5";
import Link from "next/link";
import { useCart } from '@/context/CartContext';
import { useModal } from '@/context/ModalContext';
import { useRegion } from '@/context/RegionContext';
import ProductCard from "@/components/ProductCard";
import ProductAddtoCart from "@/components/ProductAddtoCart"
import AddToWishlistButton from "@/components/ProductCard";

import ProductBreadcrumb from "@/components/ProductBreadcrumb";
import RecentlyViewedProducts from '@/components/RecentlyViewedProducts';
import RelatedProducts from "@/components/RelatedProducts";
import PaymentOffers from "@/components/product/PaymentOffers";
import CompetitorPriceTracker from "@/components/CompetitorPriceTracker";
import ProductInstallationWarrantySection from "@/components/ProductInstallationWarrantySection";
import CompareButton from "@/components/CompareButton";
import ShareModal from "@/components/ShareModal";
import { useCompare } from "@/context/CompareContext";
import WarrantyBadge from "@/components/WarrantyBadge";
import BestPriceStrip from "@/components/product/BestPriceStrip";
import { getBestPrice } from "@/lib/offers/bestPriceUtils";
import { isExtendedWarrantyEligible } from "@/lib/productServiceEligibility";
import { ADD_CART_ALLOWED_MOVEMENTS } from "@/lib/addCartConfig";
import { v4 as uuidv4 } from "uuid";
import { getDiscountInfo } from "@/lib/discountHelper";


function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition"
      >
        <span className="text-sm text-gray-700 pr-4">{question}</span>
        <span className={`text-gray-400 text-xl transition-transform duration-200 flex-shrink-0 ${open ? "rotate-45" : ""}`}>
          +
        </span>
      </button>
      {open && (
        <div className="px-4 pb-3 text-sm text-gray-500 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}



export default function ProductClient() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.sub_slug_one || params?.slug;

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [slug]);

  const [relatedProductsLoading, setRelatedProductsLoading] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [brand, setBrand] = useState([]);
  const [selectedRelatedProducts, setSelectedRelatedProducts] = useState([]);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const variantCacheRef = useRef({});
  const applyingVariantRef = useRef(false);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showEMIModal, setShowEMIModal] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [selectedWarrantyAmount, setSelectedWarrantyAmount] = useState(0);
  const [showNoWarrantyModal, setShowNoWarrantyModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [notifyMeSuccess, setNotifyMeSuccess] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState([]);
  const [isDesktop, setIsDesktop] = useState(false);
  const [flixInpageAvailable, setFlixInpageAvailable] = useState(null);
  const handleFlixInpage = useCallback(() => setFlixInpageAvailable(true), []);
  const handleFlixNoshow = useCallback(() => setFlixInpageAvailable(false), []);
  const [addOnProducts, setAddOnProducts] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [selectedWarrantyData, setSelectedWarrantyData] = useState(null);
  const { pincode: globalPincode, region: globalRegion, isInitialized } = useRegion();
  const [highlightOffer, setHighlightOffer] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { setSimilarProducts } = useCompare();

  const mainDiscountInfo = useMemo(
    () => getDiscountInfo(product?.price, product?.special_price),
    [product?.price, product?.special_price]
  );

  // Sync related products to compare context for similar product recommendations
  useEffect(() => {
    if (relatedProducts && relatedProducts.length > 0) {
      setSimilarProducts(relatedProducts);
    } else if (product?.related_products && product.related_products.length > 0) {
      setSimilarProducts(product.related_products);
    }
  }, [relatedProducts, product?.related_products, setSimilarProducts]);

  useEffect(() => {
    setHighlightOffer(null);

    if (!product?._id) {
      return;
    }

    // Wait until RegionContext initializes from localStorage/cookie to prevent wrong-state flash
    if (typeof isInitialized !== "undefined" && !isInitialized) {
      return;
    }

    // Missing / unknown state -> ribbon hidden
    if (!globalRegion || typeof globalRegion !== "string" || !globalRegion.trim()) {
      setHighlightOffer(null);
      return;
    }

    const currentRegion = globalRegion.trim();
    let active = true;

    const fetchHighlightOffer = async () => {
      try {
        const res = await fetch(
          `/api/highlighted-offer/check-product?productId=${encodeURIComponent(product._id)}&state=${encodeURIComponent(currentRegion)}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          if (active) setHighlightOffer(null);
          return;
        }
        const data = await res.json();
        if (active) {
          if (data?.hasOffer && (data?.labelText || data?.offerName)) {
            setHighlightOffer({
              offerName: data.offerName,
              labelText: data.labelText,
              labelColor: data.labelColor,
            });
          } else {
            setHighlightOffer(null);
          }
        }
      } catch (err) {
        console.error("Error checking highlighted offer:", err);
        if (active) setHighlightOffer(null);
      }
    };

    fetchHighlightOffer();

    return () => {
      active = false;
    };
  }, [product?._id, globalRegion, isInitialized]);

  const [deliveryPincode, setDeliveryPincode] = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [isCheckingDelivery, setIsCheckingDelivery] = useState(false);
  const [isEditingPincode, setIsEditingPincode] = useState(false);
  const deliveryRequestIdRef = useRef(0);

  useEffect(() => {
    if (globalPincode) {
      setDeliveryPincode(globalPincode);
    }
  }, [globalPincode]);

  const handleCheckDelivery = async (pin) => {
    const pinVal = (pin || deliveryPincode || globalPincode || "600001").toString().trim();
    if (!pinVal || pinVal.length !== 6 || !/^\d{6}$/.test(pinVal)) return;

    setDeliveryPincode(pinVal);
    const reqId = ++deliveryRequestIdRef.current;
    try {
      setIsCheckingDelivery(true);
      // Immediately reset delivery result so previous state does not linger
      setDeliveryInfo(null);
      const res = await fetch(
        `/api/pincode/check-delivery?pincode=${pinVal}&item_code=${product?.item_code || ""}&productId=${product?._id || ""}`
      );
      const data = await res.json();
      if (reqId === deliveryRequestIdRef.current) {
        setDeliveryInfo(data);
      }
    } catch (e) {
      console.error("Delivery check error:", e);
      if (reqId === deliveryRequestIdRef.current) {
        setDeliveryInfo({
          status: 0,
          available: false,
          serviceable: false,
          deliveryAvailable: false,
          message: "Not Available for Delivery at Your Location",
          deliveryMessage: "Not Available for Delivery at Your Location",
          pickupAvailable: false,
          pickupMessage: "Not Available",
        });
      }
    } finally {
      if (reqId === deliveryRequestIdRef.current) {
        setIsCheckingDelivery(false);
      }
    }
  };

  useEffect(() => {
    if (product?._id) {
      handleCheckDelivery(deliveryPincode || globalPincode || "600001");
    }
  }, [product?._id, product?.item_code, globalPincode]);

  const outlineActionBtnClass =
    "flex items-center justify-center gap-2 border border-gray-300 rounded-md bg-white px-4 py-2 text-sm font-medium text-[#d72828] hover:border-red-400 hover:bg-red-50 transition-colors whitespace-nowrap";
  const addToCartOutlineClass =
    "w-full border border-gray-300 rounded-md bg-white px-4 py-2.5 text-sm font-medium text-[#d72828] hover:border-red-400 hover:bg-red-50 transition-colors shadow-none";

  const isMovementAllowed = ADD_CART_ALLOWED_MOVEMENTS.includes(
    String(product?.movement || "").trim()
  );

  const addOnIds = Array.isArray(product?.add_ons)
    ? product.add_ons.map(id => id.toString())
    : [];


  useEffect(() => {
    console.log("useEffect triggered", product?._id, addOnIds);
  }, [product?._id]);

  useEffect(() => {
    if (!product?._id) return;
    // FAQs are stored on the product document; no separate FAQ API route exists
    setFaqs(Array.isArray(product.faqs) ? product.faqs : []);
  }, [product?._id]);

  useEffect(() => {
    if (!Array.isArray(product?.add_ons) || product.add_ons.length === 0) return;

    const ids = product.add_ons.map(id => id.toString());

    const fetchAddOnProducts = async () => {
      try {
        const res = await fetch("/api/product/addons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });

        const data = await res.json();
        setAddOnProducts(data.products || []);
      } catch (e) {
        setAddOnProducts([]);
      }
    };

    fetchAddOnProducts();
  }, [product?._id]);

  useEffect(() => {
    const fetchRecentlyViewed = async () => {
      // Step 1: localStorage safe read
      const storedString = localStorage.getItem("recentlyViewed");
      let stored = [];
      try {
        stored = JSON.parse(storedString) || [];
      } catch {
        stored = [];
      }

      // Step 2: array check
      if (!Array.isArray(stored)) stored = [];
      stored = stored.filter((p) => p && p._id);

      if (stored.length === 0) return;

      // Step 3: fetch brands and map
      try {
        const response = await fetch("/api/brand");
        const result = await response.json();

        if (!result.error) {
          const brandMap = {};
          result.data.forEach((b) => {
            brandMap[b._id] = b.brand_name;
          });

          const productsWithBrands = stored.map((p) => {
            const brandId = p.brand?._id || (typeof p.brand === "string" ? p.brand : null);
            const resolvedBrand =
              p.brand?.name ||
              p.brand?.brand_name ||
              (brandId && brandMap[brandId] ? brandMap[brandId] : "") ||
              p.brand_name ||
              p.brandName ||
              (typeof p.brand === "string" && !/^[0-9a-fA-F]{24}$/.test(p.brand) ? p.brand : "");

            return {
              ...p,
              brand: resolvedBrand || p.brand || "",
            };
          });

          setRecentlyViewedProducts(productsWithBrands);
        } else {
          setRecentlyViewedProducts(stored);
        }
      } catch {
        setRecentlyViewedProducts(stored);
      }
    };

    fetchRecentlyViewed();
  }, []);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    handleResize(); // run initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!product?.warranty_ids || product.warranty_ids.length === 0) return;

    fetch(`/api/warranties/by-item-nos?item_nos=${product.warranty_ids.join(",")}`)
      .then((r) => r.json())
      .then((d) => setWarranties(d.warranties || []));
  }, [product?._id]);
  const handleDecrease = () => {
    setQuantity(Math.max(1, quantity - 1));
    setQuantityWarning(false); // clear warning when decreasing
  };
  const handleIncrease = () => {
    if (quantity < product.quantity) {
      setQuantity(quantity + 1);
      setQuantityWarning(false); // clear warning if under limit
    } else {
      setQuantityWarning(true); // show warning if exceeding
    }
  };




  // // Function to fetch category products
  //   useEffect(() => {
  //     const fetchCategoryProducts = async () => {
  //       try {
  //         const res = await fetch(`/api/product/category/${categoryId}?limit=5`);
  //         const data = await res.json();
  //         if (data.success) {
  //           setCategoryProducts(data.products);
  //         }
  //       } catch (error) {
  //         console.error("Error fetching category products:", error);
  //       }
  //     };

  //     if (categoryId) fetchCategoryProducts();
  //   }, [categoryId]);



  const { updateCartCount } = useCart();
  const { openAuthModal } = useModal();
  const handleBuyNow = async (e = null) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
      e.stopPropagation();
    }

    // Only accept genuine plain exchangeOffer objects (no DOM elements or event wrappers)
    let exchangeOffer = null;
    if (
      e &&
      typeof e === 'object' &&
      !('nativeEvent' in e) &&
      !('target' in e) &&
      !('currentTarget' in e) &&
      typeof e.preventDefault !== 'function'
    ) {
      exchangeOffer = {
        id: e._id || e.id || null,
        title: e.title || e.name || e.product_name || null,
        price: Number(e.price || e.discount || e.value || 0),
        brand: typeof e.brand === 'string' ? e.brand : (e.brand?.name || null),
        model: e.model || null,
      };
    }

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      let isLoggedIn = false;
      let userData = null;

      if (token) {
        try {
          const response = await fetch("/api/auth/check", {
            method: "GET",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          isLoggedIn = data.loggedIn;
          userData = data.user;
        } catch (authErr) {
          console.warn("Auth check failed:", authErr);
        }
      }

      // ✅ If not logged in → use guestCartId
      let guestCartId = null;
      if (!isLoggedIn && typeof window !== "undefined") {
        guestCartId = localStorage.getItem("guestCartId") || uuidv4();
        localStorage.setItem("guestCartId", guestCartId);
      }

      const productPrice = Number(
        product?.special_price && Number(product.special_price) > 0
          ? product.special_price
          : product?.price || 0
      );

      const warrantyEligible = isExtendedWarrantyEligible(product);
      const effectiveWarrantyAmount = warrantyEligible
        ? Number(selectedWarrantyAmount || selectedExtendedWarranty || selectedWarrantyData?.amount || selectedWarrantyData?.price || 0)
        : 0;

      // Safe clean warranty object for checkout
      const activeWarranty = (warrantyEligible && selectedWarrantyData) ? {
        id: selectedWarrantyData._id || selectedWarrantyData.id || "ew-plan",
        title: selectedWarrantyData.title || selectedWarrantyData.name || "Extended Warranty",
        price: effectiveWarrantyAmount,
        duration: selectedWarrantyData.duration || selectedWarrantyData.period || ""
      } : null;

      // ✅ Add main product to cart
      try {
        const cartResponse = await fetch("/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(isLoggedIn && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            productId: product?._id,
            quantity: Number(quantity) || 1,
            selectedWarranty: Number(selectedWarranty || 0),
            selectedExtendedWarranty: effectiveWarrantyAmount,
            warrantyData: activeWarranty,
            ...(guestCartId && { guestCartId }),
          }),
        });

        if (cartResponse.ok) {
          const additionalProducts = [
            ...selectedFrequentProducts.map((p) => p._id),
            ...selectedRelatedProducts.map((p) => p._id),
          ].filter(Boolean);

          if (additionalProducts.length > 0) {
            await Promise.all(
              additionalProducts.map(async (id) => {
                try {
                  await fetch("/api/cart", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      ...(isLoggedIn && { Authorization: `Bearer ${token}` }),
                    },
                    body: JSON.stringify({
                      productId: id,
                      quantity: 1,
                      ...(guestCartId && { guestCartId }),
                    }),
                  });
                } catch (extraErr) {
                  console.warn("Extra product cart add failed:", extraErr);
                }
              })
            );
          }

          const cartData = await cartResponse.json();
          if (cartData?.cart?.totalItems) {
            updateCartCount(cartData.cart.totalItems + additionalProducts.length);
          }
        }
      } catch (cartApiErr) {
        console.warn("Cart API sync warning:", cartApiErr);
      }

      const resolvePrice = (p) =>
        p?.special_price && Number(p.special_price) > 0
          ? Number(p.special_price)
          : Number(p?.price || 0);

      // Clean, strictly serializable items array for checkout
      const cleanMainItem = {
        _id: product?._id,
        id: product?._id || product?.id,
        product: product?._id,
        name: product?.name || product?.title || "",
        title: product?.title || product?.name || "",
        slug: product?.slug || "",
        price: productPrice,
        special_price: Number(product?.special_price) || 0,
        quantity: Number(quantity) || 1,
        images: Array.isArray(product?.images) ? product.images : [],
        image: (product?.images && product.images[0]) || product?.image || "",
        warranty: Number(selectedWarranty) || 0,
        extendedWarranty: effectiveWarrantyAmount,
        warrantyData: activeWarranty,
        exchangeOffer: exchangeOffer ? {
          id: exchangeOffer.id,
          title: exchangeOffer.title,
          price: Number(exchangeOffer.price) || 0,
        } : null,
      };

      const cleanFrequentItems = selectedFrequentProducts.map((p) => ({
        _id: p._id,
        id: p._id || p.id,
        product: p._id,
        name: p.name || p.title || "",
        title: p.title || p.name || "",
        slug: p.slug || "",
        price: resolvePrice(p),
        quantity: 1,
        images: Array.isArray(p.images) ? p.images : [],
        image: (p.images && p.images[0]) || p.image || "",
      }));

      const cleanRelatedItems = selectedRelatedProducts.map((p) => ({
        _id: p._id,
        id: p._id || p.id,
        product: p._id,
        name: p.name || p.title || "",
        title: p.title || p.name || "",
        slug: p.slug || "",
        price: resolvePrice(p),
        quantity: 1,
        images: Array.isArray(p.images) ? p.images : [],
        image: (p.images && p.images[0]) || p.image || "",
      }));

      const items = [cleanMainItem, ...cleanFrequentItems, ...cleanRelatedItems];

      const total = items.reduce((sum, item) => {
        const basePrice = item.price * item.quantity;
        const wCost = (item.warranty || 0) * item.quantity;
        const extCost = (item.extendedWarranty || 0) * item.quantity;
        const exDiscount = (item.exchangeOffer?.price || 0) * item.quantity;
        return sum + basePrice + wCost + extCost - exDiscount;
      }, 0);

      const totalPrice = Math.max(0, total);

      // Ensure ONLY serializable plain primitives are stringified
      const checkoutItem = {
        productId: product?._id || product?.id,
        slug: product?.slug,
        title: product?.title || product?.name,
        price: productPrice,
        quantity: Number(quantity) || 1,
        selectedWarranty: activeWarranty,
        totalAmount: totalPrice,
      };

      // Safe serialization without DOM / React synthetic event leaks
      try {
        sessionStorage.setItem("buyNowItem", JSON.stringify(checkoutItem));
        localStorage.setItem(
          "buyNowData",
          JSON.stringify({ cart: { items }, total: totalPrice })
        );
        if (router && typeof router.push === "function") {
          router.push("/checkout");
        } else {
          window.location.href = "/checkout";
        }
      } catch (err) {
        console.error("Safe checkout serialization error:", err);
      }
    } catch (err) {
      console.error("Buy Now error:", err);
    }
  };

  const handleShareProduct = useCallback(() => {
    setIsShareModalOpen(true);
  }, []);




  // const warranties = product?.extend_warranty || [];



  // In your ProductPage component, add these state variables near the top:
  const [selectedFrequentProducts, setSelectedFrequentProducts] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [selectedWarranty, setSelectedWarranty] = useState(null);
  const [selectedExtendedWarranty, setSelectedExtendedWarranty] = useState(null);

  // Auto-reset warranty selection whenever product is not eligible for extended warranty
  useEffect(() => {
    if (product && !isExtendedWarrantyEligible(product)) {
      setSelectedWarrantyAmount(0);
      setSelectedExtendedWarranty(null);
      setSelectedWarranty(null);
      setSelectedWarrantyData(null);
    }
  }, [product?._id]);

  // Quick-deselect warranty handler from badge or summary
  const handleDeselectWarranty = useCallback(() => {
    setSelectedWarrantyAmount(0);
    setSelectedExtendedWarranty(null);
    setSelectedWarranty(null);
    setSelectedWarrantyData(null);
  }, []);

  const handleSelectWarranty = useCallback((w, amount) => {
    const numericAmount = Number(amount || w?.amount || w?.price || 0);
    setSelectedWarrantyData(w);
    setSelectedWarrantyAmount(numericAmount);
    setSelectedExtendedWarranty(numericAmount);
  }, []);

  const handleExchangeApply = (offer) => {
    if (offer) {
      handleBuyNow(offer);
    }
  };

  const [quantityWarning, setQuantityWarning] = useState(false);

  // Add this function to handle frequent product selection
  const toggleFrequentProduct = (product) => {
    setSelectedFrequentProducts(prev => {
      const existingIndex = prev.findIndex(p => p._id === product._id);
      if (existingIndex >= 0) {
        return prev.filter(p => p._id !== product._id);
      } else {
        return [...prev, product];
      }
    });
  };

  // Fetch related products
  // // Fetch related products
  // const fetchRelatedProducts = async () => {
  //   try {
  //     setLoading(true);
  //     const res = await fetch(`/api/product/related?productId=${product._id}`);
  //     const data = await res.json();

  //     if (!res.ok) {
  //       throw new Error(`API error: ${res.status} ${res.statusText}`);
  //     }

  //     if (res.ok && data.success) {
  //       setRelatedProducts(data.products || []);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching related products:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   if (product?._id) {
  //     fetchRelatedProducts(product._id);
  //   }
  // }, [product]);




  const categoryId = product?.category;
  const currentProductId = product?._id;
  const brandId = product?.brand;
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        const res = await fetch(
          `/api/product/relatedpro?category=${categoryId}&brand=${brandId}&exclude=${currentProductId}&limit=5`
        );
        const data = await res.json();
        console.log("current related products is:", data);

        if (res.ok) {
          if (data.success && data.products) {
            setRelatedProducts(data.products);
          } else if (data.relatedProducts) {
            setRelatedProducts(data.relatedProducts);
          } else {
            setRelatedProducts([]);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (categoryId && brandId) fetchRelatedProducts();
  }, [categoryId, brandId, currentProductId]);


  const toggleRelatedProduct = (product) => {
    setSelectedRelatedProducts(prev => {
      const existingIndex = prev.findIndex(p => p._id === product._id);
      if (existingIndex >= 0) {
        return prev.filter(p => p._id !== product._id);
      } else {
        return [...prev, product];
      }
    });
  };

  //  Add this useEffect to calculate the cart total whenever selected products change
  // Calculate cart total
  useEffect(() => {
    let total = product ? (product.special_price || product.price) * quantity : 0;

    selectedFrequentProducts.forEach(item => {
      total += (item.special_price || item.price);
    });

    // NEW: Add selected related products to total
    selectedRelatedProducts.forEach(item => {
      total += (item.special_price || item.price);
    });

    if (selectedWarranty) total += Number(selectedWarranty);
    const isEligibleWarranty = isExtendedWarrantyEligible(product);
    const extAmt = isEligibleWarranty ? Number(
      selectedWarrantyAmount ||
      selectedExtendedWarranty ||
      selectedWarrantyData?.amount ||
      selectedWarrantyData?.price ||
      0
    ) : 0;
    if (extAmt > 0) total += extAmt;

    setCartTotal(total);
  }, [
    selectedFrequentProducts,
    selectedRelatedProducts,
    product,
    quantity,
    selectedWarranty,
    selectedExtendedWarranty,
    selectedWarrantyAmount,
    selectedWarrantyData,
  ]);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      if (!product?._id) return;
      const ids = product?.featured_products?.length ? product.featured_products : [];
      try {
        const res = await fetch('/api/product/featured', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ids,
            category: product?.category,
            brand: product?.brand,
            limit: 2
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const fbtList = Array.isArray(data) ? data.slice(0, 2) : [];
          setFeaturedProducts(fbtList);
        }
      } catch (err) {
        console.error("FBT fetch error:", err);
      }
    };

    fetchFeaturedProducts();
  }, [product?._id, product?.category, product?.brand]);
  // derived main image
  const mainImage = (product?.images && product.images.length > 0 && product.images[selectedImageIndex]) ? product.images[selectedImageIndex] : "/uploads/products/placeholder.jpg";
  const matchedBrandForManufacturer = (() => {
    if (!product?.brand || !Array.isArray(brand)) return null;
    const brandId =
      typeof product.brand === "object"
        ? String(product.brand._id || product.brand.id || "")
        : String(product.brand);
    return brand.find((b) => String(b.value) === brandId) || null;
  })();

  // helper to resolve full path
  const resolveImagePath = (image) => {
    if (!image || typeof image !== "string" || image.trim() === "" || image === "null" || image === "undefined") {
      return "/uploads/products/placeholder.jpg";
    }
    const clean = image.trim();
    if (
      clean.startsWith("http") ||
      clean.startsWith("blob:") ||
      clean.startsWith("data:") ||
      clean.startsWith("/")
    ) return clean;
    return `/uploads/products/${clean}`;
  };

  const assetFallbackBase = (process.env.NEXT_PUBLIC_ASSET_FALLBACK_URL || "https://estore.bharathelectronics.in").replace(/\/+$/, "");

  const handleImageErrorFallback = (e, originalImage) => {
    const currentSrc = e?.currentTarget?.src || "";
    const clean = typeof originalImage === "string"
      ? originalImage.trim().replace(/^\/?(uploads\/products\/)?/, "").replace(/^\/+/, "")
      : "";
    if (clean && !currentSrc.includes(assetFallbackBase) && !currentSrc.includes("placeholder")) {
      e.currentTarget.src = `${assetFallbackBase}/uploads/products/${clean}`;
    } else {
      e.currentTarget.onerror = null;
      e.currentTarget.src = "/uploads/products/placeholder.jpg";
    }
  };


  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (product?.images?.[0]) {
      // setSelectedImage(`/uploads/products/${product.images[0]}`);
      setSelectedImage(product.images[0]);
    }
  }, [product?._id]);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0, visible: false });
  const imgRef = useRef(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const zoomContainerRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");     // <-- declare this
  const [showGoHome, setShowGoHome] = useState(false);
  const [showZoomLens, setShowZoomLens] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const zoomLensRef = useRef(null);
  const zoomResultRef = useRef(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [showWarrantyModal, setshowWarrantyModal] = useState(false);
  const [showGstInvoiceModal, setshowGstInvoiceModal] = useState(false);

  // ###### Show Customer Reviews ###### //
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    setFlixInpageAvailable(null);
  }, [product?._id]);

  useEffect(() => {
    const applyProductData = (data) => {
      setProduct(data);
      setSelectedImageIndex(0);
      setQuantity(1);
      if (data?.images?.[0]) setSelectedImage(`/uploads/products/${data.images[0]}`);
      if (data?.variantGroup?.products?.length) {
        const group = data.variantGroup;
        group.products.forEach((sibling) => {
          const cachedSibling = {
            ...sibling,
            variantGroup: group,
          };
          if (sibling?.slug) variantCacheRef.current[sibling.slug] = cachedSibling;
          if (sibling?._id) variantCacheRef.current[String(sibling._id)] = cachedSibling;
        });
        if (data.slug) {
          variantCacheRef.current[data.slug] = { ...data, variantGroup: group };
        }
      }
    };

    const fetchProduct = async () => {
      if (!slug) return;

      const cached = variantCacheRef.current[slug];
      if (cached) {
        applyingVariantRef.current = false;
        applyProductData(cached);
        setLoading(false);
        return;
      }

      try {
        setLoading((currentLoading) => (product ? currentLoading : true));
        const response = await fetch(`/api/product/${slug}`);

        if (!response.ok) {
          setErrorMessage("Content not loading. Please try again later.");
          setShowGoHome(true);
          return;
        }

        const data = await response.json();
        if (data.status !== "Active") {
          router.push("/404");
          return;
        }

        if (Array.isArray(data)) {
          const foundProduct = data.find((p) => p.slug === slug);
          if (!foundProduct) {
            throw new Error("Product not found");
          }
          applyProductData(foundProduct);
        } else if (data && data.slug) {
          applyProductData(data);
        } else {
          throw new Error("Invalid product data");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || "Something went wrong");
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  useEffect(() => {
    if (!product?._id) return;
    let cancelled = false;
    fetch(`/api/reviews/${product._id}`)
      .then((res) => res.json())
      .then((reviewsData) => {
        if (cancelled || !reviewsData.success) return;
        setReviews(reviewsData.reviews);
        setAvgRating(reviewsData.avgRating);
        setReviewCount(reviewsData.count);
      })
      .catch((error) => {
        console.error("Error fetching reviews:", error);
      });
    return () => {
      cancelled = true;
    };
  }, [product?._id]);

  const handleVariantSelect = (match) => {
    if (!match) return;
    const targetSlug = match.slug || String(match._id || "");
    if (!targetSlug) return;
    if (String(match._id) === String(product?._id) && targetSlug === String(slug)) return;

    const group = product?.variantGroup;
    const cached = {
      ...(variantCacheRef.current[targetSlug] || match),
      variantGroup: group,
    };
    variantCacheRef.current[targetSlug] = cached;
    applyingVariantRef.current = true;
    setProduct(cached);
    setSelectedImageIndex(0);
    setQuantity(1);
    setSelectedWarrantyAmount(0);
    setSelectedWarrantyData(null);
    if (cached?.images?.[0]) setSelectedImage(`/uploads/products/${cached.images[0]}`);

    const nextUrl = params?.sub_slug_one
      ? `/category/${params.slug}/${params.sub_slug}/${targetSlug}`
      : `/product/${targetSlug}`;
    if (typeof window !== "undefined" && window.location.pathname !== nextUrl) {
      window.history.pushState(null, "", nextUrl);
    }
  };

  useEffect(() => {
    const onPopState = () => {
      const currentSlug = window.location.pathname.split("/").filter(Boolean).pop();
      const cached = currentSlug ? variantCacheRef.current[currentSlug] : null;
      if (cached) {
        setProduct(cached);
        setSelectedImageIndex(0);
        if (cached?.images?.[0]) setSelectedImage(`/uploads/products/${cached.images[0]}`);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);




  const fetchBrand = async () => {
    try {
      const response = await fetch("/api/brand");
      const result = await response.json();
      if (result.error) {
        console.error(result.error);
      } else {
        const data = result.data;

        // Format for react-select
        const brandOptions = data.map((b) => ({
          value: b._id,
          label: b.brand_name,
          manufacturer_name: b.manufacturer_name || "",
          manufacturer_address: b.manufacturer_address || "",
        }));

        setBrand(brandOptions);
        // 👉 If you already have the ID and want to get the label (e.g., when editing)
        if (product?.brand) {
          const matched = brandOptions.find((b) => b.value === product.brand);
          // if (matched) console.log("Selected Brand Name:", matched.label);
        }

      }
    } catch (error) {
      console.error(error.message);
    }
  };

  useEffect(() => {
    fetchBrand();
  }, []);



  const handleThumbnailClick = (index) => {
    const imagePath = product.images?.[index];

    if (imagePath) {
      // Use same logic as main image src
      const finalSrc =
        imagePath.startsWith("http") ||
          imagePath.startsWith("blob:") ||
          imagePath.startsWith("data:")
          ? imagePath
          : `/uploads/products/${imagePath}`;

      setSelectedImage(finalSrc);
    }
  };

  // Handle mouse movement for zoom lens
  const handleMouseMove = (e) => {
    if (!imgRef.current || !zoomLensRef.current || !zoomResultRef.current) return;

    const { left, top, width, height } = imgRef.current.getBoundingClientRect();
    if (!width || !height) return;
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    // Keep position within bounds
    const boundedX = Math.max(0, Math.min(100, x));
    const boundedY = Math.max(0, Math.min(100, y));

    // Direct DOM updates for silky smooth 60fps tracking without triggering React component re-renders
    zoomLensRef.current.style.left = `calc(${boundedX}% - 75px)`;
    zoomLensRef.current.style.top = `calc(${boundedY}% - 75px)`;
    zoomResultRef.current.style.backgroundPosition = `${boundedX}% ${boundedY}%`;
  };

  const handleMouseEnter = () => {
    setShowZoomLens(true);
  };

  const handleMouseLeave = () => {
    setShowZoomLens(false);
  };

  const openLightbox = (index = 0) => {
    if (product?.images && product.images.length > 0) {
      setLightboxIndex(index);
      setLightboxOpen(true);
      setSelectedImage(product.images[index]);
    }
  };


  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const navigateLightbox = (direction) => {
    if (!product?.images || product.images.length === 0) return;

    let newIndex;
    if (direction === "prev") {
      newIndex =
        (selectedImageIndex - 1 + product.images.length) % product.images.length;
    } else {
      newIndex = (selectedImageIndex + 1) % product.images.length;
    }

    setSelectedImageIndex(newIndex);
  };

  // Handle keyboard events for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxOpen) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox('prev');
        if (e.key === 'ArrowRight') navigateLightbox('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, lightboxIndex]);

  if (loading) {
    return <ProductSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#d72828]">{error}</h2>
          <Link href="/" className="mt-4 inline-flex items-center text-[#d72828] hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return <ProductSkeleton />;
  }

  if (!product.name) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Product not found</h2>
          <Link href="/" className="mt-4 inline-flex items-center text-[#d72828] hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!product.images) {
    return <ProductSkeleton />;
  }

  const isOpenBox = isOpenBoxEligible(product);
  const isInStock = product?.stock_status === "In Stock" && Number(product?.quantity) > 0;

  const handleNotifyMe = (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setNotifyMeSuccess(true);
  };

  const scrollToRelatedProducts = (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    const el = document.querySelector('section[aria-label="Related Products"]');
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <FlixMediaLoader
        product={product}
        brandName={matchedBrandForManufacturer?.label || brand.find((b) => String(b.value) === String(product?.brand))?.label || ""}
        enabled={Boolean(product?._id) && brand.length > 0}
        onInpage={handleFlixInpage}
        onNoshow={handleFlixNoshow}
      />
      {errorMessage && (
        <div className="text-center mt-10">
          <p className="text-red-600 text-lg mb-3">{errorMessage}</p>
          {showGoHome && (
            <a
              href="/"
              className="inline-block px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
            >
              Go to Home Page
            </a>
          )}
        </div>
      )}


      <div className="container mx-auto px-2 md:px-4 pt-2 pb-8">

        {/* ===== MOBILE & TABLET VIEW (hidden on desktop) ===== */}
        <div className="block lg:hidden w-full">
          {/* Mobile Breadcrumb */}
          <ProductBreadcrumb product={product} className="mb-3 text-xs" />

          {/* 1. Product Image */}
          <div className="w-full relative">
            <div className="border border-gray-400 rounded-lg relative">
              <OfferRibbonBadge
                offerName={highlightOffer?.offerName}
                labelText={highlightOffer?.labelText}
                labelColor={highlightOffer?.labelColor}
              />
              <div
                className="relative aspect-square w-full px-4"
                onClick={() => openLightbox(0)}
                ref={zoomContainerRef}
              >
                <img
                  src={resolveImagePath(mainImage)}
                  alt={product?.name || "Product"}
                  className="w-full h-full object-contain rounded-xl"
                  ref={imgRef}
                  onError={(e) => handleImageErrorFallback(e, mainImage)}
                />
              </div>
            </div>

            {/* Thumbnails */}
            {product.images && product.images.filter(img => img && typeof img === "string" && img.trim() !== "").length > 0 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {product.images.filter(img => img && typeof img === "string" && img.trim() !== "").map((image, index) => (
                  <div key={index} className="flex-shrink-0">
                    <img
                      src={resolveImagePath(image)}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-16 h-16 border border-gray-400 rounded-lg cursor-pointer object-cover"
                      onClick={() => setSelectedImageIndex(index)}
                      onError={(e) => handleImageErrorFallback(e, image)}
                    />
                  </div>
                ))}
              </div>
            )}


          </div>

          {/* 2. Brand + Name + Price */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className="text-[#d72828] font-semibold text-sm uppercase tracking-wide">
                {brand.find((b) => b.value === product.brand)?.label || ""}
              </p>

            </div>
            <h1 className="text-lg font-bold text-gray-900 leading-snug mt-1">{product.name}</h1>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
              {product.model_number && <span>Model: {product.model_number}</span>}
              {product.model_number && product.item_code && <span className="text-gray-300">|</span>}
              {product.item_code && <span>SKU: {product.item_code}</span>}
            </div>
            {avgRating > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <span className="text-yellow-400 text-sm">★</span>
                <span className="text-sm font-semibold text-gray-800">{avgRating}</span>
                <span className="text-xs text-[#d72828] underline">({reviewCount} Reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="mt-3 border-t border-gray-200 pt-3">
              <div className="flex flex-col leading-tight">
                <span className="text-2xl font-bold text-[#d72828]">
                  ₹ {Number((product.special_price > 0 ? product.special_price : product.price) + (selectedWarrantyAmount || 0)).toLocaleString('en-IN')}
                </span>
                {selectedWarrantyAmount > 0 ? (
                  <div className="mt-1">
                    <WarrantyBadge
                      selectedWarranty={selectedWarrantyData}
                      selectedWarrantyAmount={selectedWarrantyAmount}
                      onDeselect={handleDeselectWarranty}
                    />
                  </div>
                ) : (
                  product.special_price > 0 && (
                    <span className="text-xs text-gray-500 mt-0.5">Special Price</span>
                  )
                )}
              </div>

              {mainDiscountInfo.showDiscount && (
                <div className="flex flex-col sm:flex-row w-full sm:items-start sm:justify-between gap-1.5 sm:gap-6 mt-2 sm:mt-3">
                  <div className="flex flex-wrap items-baseline gap-1.5 sm:flex-col sm:leading-tight sm:flex-1 sm:min-w-0 sm:pr-3 sm:border-r sm:border-gray-200">
                    <span className="text-xs sm:text-sm text-gray-500 line-through whitespace-nowrap">
                      MRP ₹ {Number(product.price).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] sm:text-xs text-gray-500 sm:mt-1 whitespace-nowrap">
                      (Inclusive of all taxes)
                    </span>
                  </div>

                  <div className="flex flex-col leading-tight sm:flex-1 sm:min-w-0 sm:px-3 sm:border-r sm:border-gray-200">
                    <div className="flex items-center flex-wrap gap-2">
                      <p className="text-green-600 font-semibold text-xs sm:text-sm flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>You Save ₹ {Number(product.price - product.special_price).toLocaleString('en-IN')}</span>
                      </p>
                      <span className="inline-block sm:hidden bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap">
                        {mainDiscountInfo.discountPercent}% OFF
                      </span>
                    </div>
                    <span className="text-[11px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
                      Price includes all applicable taxes
                    </span>
                  </div>

                  <div className="hidden sm:flex sm:flex-col sm:items-end sm:justify-start sm:flex-shrink-0 sm:pl-3">
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap">
                      {mainDiscountInfo.discountPercent}% OFF
                    </span>
                  </div>
                </div>
              )}

              {!mainDiscountInfo.showDiscount && (
                <p className="text-xs text-gray-400 mt-0.5">Price includes all applicable taxes</p>
              )}
            </div>

            {/* Stock */}
            <div className="mt-2">
              {product.stock_status === "In Stock" && product.quantity > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                    <span className="flex items-center justify-center w-3 h-3 rounded-full bg-green-600 flex-shrink-0">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    In Stock ({product.quantity} units)
                  </span>

                  {isOpenBox && (
                    <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs px-2.5 py-1 rounded-full font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>Clearance / Open Box Item - Direct Store/Phone Purchase Only</span>
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-red-600 font-semibold text-sm">✗ Out of Stock</span>
              )}
              <p className="text-xs text-gray-600 mt-1">
                Sold by <span className="font-semibold">Sathya Stores</span>
              </p>
            </div>

            {/* FlixMedia minisite target */}
            <div className="key-fea"></div>
            {!isDesktop ? (
              <div id="flix-minisite" className="flix-minisite-container w-full" />
            ) : null}

            {/* Share / Compare / Wishlist (Mobile) */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <button
                type="button"
                onClick={handleShareProduct}
                className={`w-full ${outlineActionBtnClass}`}
                title="Share this product"
              >
                <FaShareAlt className="w-3.5 h-3.5 text-[#d72828] shrink-0" />
                <span className="truncate">Share</span>
              </button>
              <CompareButton
                product={product}
                variant="text"
                iconSize={14}
                label="Compare"
                activeLabel="✓ Compare"
                className={`w-full ${outlineActionBtnClass}`}
              />
              <AddToWishlistButton
                productId={product._id}
                label="Wishlist"
                iconSize={14}
                className={`w-full ${outlineActionBtnClass}`}
              />
            </div>

            {/* Variants + Quantity + Buy Now + Add to Cart */}
            <div className="mt-3">
              <ProductVariantSelector
                variantGroup={product.variantGroup}
                currentProductId={product._id}
                onSelect={handleVariantSelect}
              />
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded px-2 py-1 gap-3">
                  <button onClick={handleDecrease} className="text-gray-600 font-bold text-base">−</button>
                  <span className="text-sm font-semibold w-5 text-center">{quantity}</span>
                  <button onClick={handleIncrease} className="text-gray-600 font-bold text-base">+</button>
                </div>
                {quantityWarning && <p className="text-red-500 text-xs">Max {product.quantity} only</p>}
              </div>

              {/* Live Price Summary above Mobile Actions if Warranty Selected */}
              {isExtendedWarrantyEligible(product) && selectedWarrantyAmount > 0 && (
                <div className="py-1.5 px-3 bg-emerald-50/70 border border-emerald-200/80 rounded-md mb-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 font-semibold">Total Price:</span>
                    <span className="font-bold text-[#d72828] text-sm">
                      ₹ {Number(((product.special_price > 0 ? product.special_price : product.price) * quantity) + selectedWarrantyAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <span className="block text-[10.5px] text-gray-500 font-normal mt-0.5">
                    Includes ₹{Number((product.special_price > 0 ? product.special_price : product.price) * quantity).toLocaleString("en-IN")} product + ₹{selectedWarrantyAmount.toLocaleString("en-IN")} warranty
                  </span>
                </div>
              )}

              {!isInStock && (
                <div className="flex flex-col gap-2">
                  <div className="w-full bg-gray-200 text-gray-700 font-bold py-2.5 rounded-lg flex items-center justify-center text-xs uppercase tracking-wider cursor-not-allowed border border-gray-300 select-none">
                    Currently Out of Stock
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleNotifyMe}
                      disabled={notifyMeSuccess}
                      className={`flex-1 font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider transition-all cursor-pointer ${
                        notifyMeSuccess
                          ? "bg-emerald-600 text-white cursor-default"
                          : "bg-[#f59e0b] hover:bg-[#d97706] text-white shadow-sm active:scale-95"
                      }`}
                    >
                      <FaBell className="w-3.5 h-3.5" />
                      {notifyMeSuccess ? "Notified ✓" : "Notify Me"}
                    </button>
                    <div className="flex-1 border-2 border-emerald-500 text-emerald-700 bg-emerald-50 font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 text-xs">
                      <FaStore className="w-3.5 h-3.5 flex-shrink-0" />
                      In Store
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={scrollToRelatedProducts}
                    className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1 text-xs transition-colors cursor-pointer"
                  >
                    <span>View Similar Products</span>
                    <span className="text-[12px] font-bold text-[#d72828]">↓</span>
                  </button>
                </div>
              )}
              {product.stock_status === "In Stock" && product.quantity > 0 && !isMovementAllowed && (
                <div className="flex gap-3">
                  <div className="flex-1 bg-gray-300 text-gray-600 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm cursor-not-allowed">
                    Sold Out Online
                  </div>
                  <div className="flex-1 border border-emerald-500 text-emerald-700 bg-emerald-50 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm">
                    <FaStore className="w-4 h-4" />
                    Available in Store
                  </div>
                </div>
              )}
              {product.stock_status === "In Stock" && product.quantity > 0 && isMovementAllowed && (
                <div className="flex gap-3">
                  {isOpenBox ? (
                    <a
                      href={`tel:${CLEARANCE_PHONE}`}
                      className="flex-1 flex items-center justify-center gap-2.5 py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-md transition-all duration-200 cursor-pointer active:scale-95 text-center"
                      title="Call to Order Clearance Unit"
                    >
                      <FaPhoneAlt className="w-4 h-4 flex-shrink-0 text-white self-center" />
                      <div className="flex flex-col items-center text-center leading-tight">
                        <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">CALL TO ORDER</span>
                        <span className="text-[9px] sm:text-[10px] font-medium opacity-90 tracking-wide mt-0.5">(CLEARANCE UNIT)</span>
                      </div>
                    </a>
                  ) : (
                    <button
                      onClick={() => handleBuyNow()}
                      className="flex-1 font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm bg-[#d72828] hover:bg-[#c02020] text-white cursor-pointer"
                    >
                      <FaStore className="w-4 h-4" />
                      Buy Now
                    </button>
                  )}
                  <div className="flex-1">
                    <ProductAddtoCart
                      productId={product._id}
                      stockQuantity={product.quantity}
                      quantity={quantity}
                      additionalProducts={[...selectedFrequentProducts.map((p) => p._id), ...selectedRelatedProducts.map((p) => p._id)]}
                      extendedWarranty={isExtendedWarrantyEligible(product) ? selectedWarrantyAmount : 0}
                      selectedFrequentProducts={selectedFrequentProducts}
                      selectedRelatedProducts={selectedRelatedProducts}
                      warrantyData={isExtendedWarrantyEligible(product) ? selectedWarrantyData : null}
                      buttonLabel={isOpenBox ? "Enquire to Buy" : "Add to Cart"}
                      buttonClassName={addToCartOutlineClass}
                      movement={product.movement}
                      productName={product.name}
                      productSlug={product.slug}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Standard Mobile/Desktop Shared Wrapper Container */}
          <div className="w-full block">
            {!isDesktop && (
              <div className="mt-4">
                <ExchangeOfferSection
                  productCategory={product.sub_category_new_name ? product.sub_category_new_name.replace(/##/g, ",") : (product.categoryName || "")}
                  onExchangeApply={handleExchangeApply}
                />
                <PaymentOffers
                  product={product}
                  externalShowEmiModal={showEMIModal}
                  onExternalCloseEmiModal={() => setShowEMIModal(false)}
                />
                <CompetitorPriceTracker product={product} className="mt-3" />
                <ProductInstallationWarrantySection
                  product={product}
                  warranties={warranties}
                  selectedWarrantyData={selectedWarrantyData}
                  onSelectWarranty={handleSelectWarranty}
                  className="mt-3"
                />
              </div>
            )}
          </div>
          {/* Add Ons — Mobile */}
          {addOnProducts.filter(item => item.quantity > 0 && item.status === "Active").length > 0 && (
            <div className="mt-4 border border-gray-300 rounded-lg bg-white">
              <div className="px-4 py-4">
                <h2 className="text-sm font-bold text-[#d72828] underline mb-2">Add Ons</h2>
                {addOnProducts.filter(item => item.quantity > 0 && item.status === "Active").slice(0, 3).map((item) => (
                  <div key={item._id} className="flex items-start mb-4">
                    <input type="checkbox" className="mt-2 mr-3"
                      checked={selectedRelatedProducts.some(p => p._id === item._id)}
                      onChange={() => toggleRelatedProduct(item)} />
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <img
                        src={resolveImagePath(item.images?.[0] || item.image)}
                        alt={item.name || "Addon"}
                        className="w-14 h-14 object-contain"
                        onError={(e) => handleImageErrorFallback(e, item.images?.[0] || item.image)}
                      />
                      <div className="text-sm flex-1 min-w-0">
                        <Link href={`/product/${item.slug}`}>
                          <h3 className="text-xs font-medium hover:text-[#d72828] line-clamp-2">{item.name}</h3>
                        </Link>
                        <span className="text-sm font-semibold text-red-600">
                          ₹ {(item.special_price > 0 ? item.special_price : item.price).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Extended Warranty — Mobile */}
          {warranties.length > 0 && isExtendedWarrantyEligible(product) && (
            <div className="border border-gray-200 rounded-lg p-4 mt-3">
              <div className="flex items-center gap-2 mb-3">
                <FaShield className="text-[#d72828] w-5 h-5" />
                <h3 className="font-bold text-sm text-gray-800">Add Extended Warranty</h3>
              </div>

              {/* No Warranty option */}
              <label className="flex items-center justify-between py-2 border-b border-gray-100 cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="warranty_mobile"
                    checked={selectedWarrantyData === null}
                    onChange={() => {
                      setSelectedWarrantyData(null);
                      setSelectedWarrantyAmount(0);
                    }}
                    className="accent-[#d72828]"
                  />
                  <span className="text-sm text-gray-700">No Extended Warranty</span>
                </div>
              </label>

              {/* Warranty options */}
              {[...warranties]
                .sort((a, b) => (a.year || 0) - (b.year || 0))
                .map((w, index) => (
                  <label
                    key={w.item_no || index}
                    className="flex items-center justify-between py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="warranty_mobile"
                        checked={selectedWarrantyData?.item_no === w.item_no}
                        onChange={() => {
                          setSelectedWarrantyData(w);
                          setSelectedWarrantyAmount(w.price);
                        }}
                        className="accent-[#d72828]"
                      />
                      <span className="text-sm text-gray-700">{w.year} Year Extended Warranty</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      ₹ {w.price.toLocaleString("en-IN")}
                    </span>
                  </label>
                ))}
            </div>
          )}
          {/* 4. ProductDetailsSection (Highlights, Overview, Specs, Reviews, FAQ) */}
          <div className="mt-4">
            <ProductDetailsSection
              key={product._id}
              product={product}
              reviews={reviews}
              avgRating={avgRating}
              reviewCount={reviewCount}
              manufacturerName={matchedBrandForManufacturer?.manufacturer_name}
              manufacturerAddress={matchedBrandForManufacturer?.manufacturer_address}
              flixInstanceActive={!isDesktop}
              flixInpageAvailable={flixInpageAvailable}
            />
          </div>

          {/* 5. Frequently Bought Together */}
          {featuredProducts?.filter(item => item.stock_status === "In Stock").length > 0 && (
            <div className="mt-4 border border-gray-300 rounded-lg bg-white p-3">
              <h3 className="font-bold text-xs text-gray-900 border-b border-gray-200 pb-2 mb-3 uppercase tracking-wide">Frequently Bought Together:</h3>
              <div className="space-y-3">
                {featuredProducts.slice(0, 2).map((item, index) => (
                  <div key={item._id || index} className={`flex items-start gap-2.5 pb-2.5 border-b border-gray-100 last:border-0 ${!isInStock ? 'opacity-60' : ''}`}>
                    <input
                      type="checkbox"
                      className="mt-1 accent-[#d72828] cursor-pointer w-4 h-4 disabled:cursor-not-allowed disabled:opacity-50"
                      checked={!isInStock ? false : selectedFrequentProducts.some(p => p._id === item._id)}
                      onChange={() => {
                        if (isInStock) toggleFrequentProduct(item);
                      }}
                      disabled={!isInStock}
                      title={!isInStock ? "Main product is out of stock" : ""}
                    />
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <img
                        src={resolveImagePath(item.images?.[0] || item.image)}
                        alt={item.name || "Product"}
                        className="w-12 h-12 object-contain flex-shrink-0 rounded border border-gray-200"
                        onError={(e) => handleImageErrorFallback(e, item.images?.[0] || item.image)}
                      />
                      <div className="text-xs flex-1 min-w-0">
                        <Link href={`/product/${item.slug}`} className="block hover:underline">
                          <h4 className="font-medium text-gray-800 line-clamp-2 text-[11px] leading-snug">{item.name}</h4>
                        </Link>
                        <div className="flex flex-col mt-1">
                          {getDiscountInfo(item?.price, item?.special_price).showDiscount && (
                            <span className="text-[10px] text-gray-400 line-through">
                              ₹ {Number(item?.price).toLocaleString('en-IN')}
                            </span>
                          )}
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-gray-500 font-medium">Buy Together for</span>
                            <span className="font-bold text-[#d72828]">
                              ₹ {Number(item?.special_price > 0 ? item.special_price : item?.price || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar Products */}
          {relatedProducts.filter(item => item.quantity > 0 && item.status === "Active").length > 0 && (
            <div className="mt-4 border border-gray-300 rounded-lg bg-white">
              <div className="px-4 py-4">
                <h2 className="text-sm font-bold text-[#d72828] underline mb-2">Similar Products</h2>
                {relatedProducts.filter(item => item.quantity > 0 && item.status === "Active").slice(0, 3).map((item, index) => (
                  <div key={item._id || index} className="flex items-start mb-4">
                    <input type="checkbox" className="mt-2 mr-3"
                      checked={selectedRelatedProducts.some(p => p._id === item._id)}
                      onChange={() => toggleRelatedProduct(item)} />
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <img
                        src={resolveImagePath(item.images?.[0] || item.image)}
                        alt={item.name || "Related"}
                        className="w-14 h-14 object-contain"
                        onError={(e) => handleImageErrorFallback(e, item.images?.[0] || item.image)}
                      />
                      <div className="text-sm flex-1 min-w-0">
                        <Link href={`/product/${item.slug}`} className="block mb-1">
                          <h3 className="text-xs font-medium hover:text-[#d72828] line-clamp-2">{item.name}</h3>
                        </Link>
                        <span className="text-sm font-semibold text-red-600">
                          ₹ {(item.special_price && item.special_price > 0 && item.special_price < item.price ? item.special_price : item.price).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. Add Selected to Cart */}
          {(selectedRelatedProducts.length > 0 || selectedFrequentProducts.length > 0) && (
            <div className="mt-4 sticky bottom-0 bg-white border-t border-gray-200 pt-3 pb-3 z-10">
              {(selectedRelatedProducts.length > 0 || selectedFrequentProducts.length > 0) && (
                <div className="w-full bg-[#d72828] text-white font-semibold py-2 rounded-md flex items-center justify-between px-4 mb-2">
                  <div className="flex items-center gap-2">
                    <FaCartPlus className="text-white w-5 h-5" />
                    <span className="text-sm font-semibold">Cart Total</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold">₹{cartTotal.toLocaleString('en-IN')}</span>
                    <Link href="/cart" className="text-[11px] text-white hover:underline">View Cart</Link>
                  </div>
                </div>
              )}
              <ProductAddtoCart
                productId={product._id}
                stockQuantity={product.quantity}
                quantity={quantity}
                additionalProducts={[...selectedFrequentProducts.map((p) => p._id), ...selectedRelatedProducts.map((p) => p._id)]}
                extendedWarranty={selectedWarrantyAmount}
                selectedFrequentProducts={selectedFrequentProducts}
                selectedRelatedProducts={selectedRelatedProducts}
                warrantyData={selectedWarrantyData}
                buttonLabel="Add Selected to Cart"
                buttonClassName="bg-[#d72828] text-white"
                movement={product.movement}
                productName={product.name}
                productSlug={product.slug}
              />
            </div>
          )}


        </div>
        {/* ===== END MOBILE & TABLET VIEW ===== */}

        {/* ===== DESKTOP VIEW (hidden on mobile/tablet) ===== */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6 items-stretch mt-2 w-full relative">

          {/* ==================== COLUMN 1: PRODUCT GALLERY (4 cols / ~33% width) ==================== */}
          <div className="lg:col-span-4 min-w-0 self-stretch">
            <div className="flex flex-col gap-3 sticky top-[118px] z-10">
              {/* Main Image Container with Zoom */}
              <div className="border border-gray-300 rounded-lg p-2 bg-white relative">
                <OfferRibbonBadge
                  offerName={highlightOffer?.offerName}
                  labelText={highlightOffer?.labelText}
                  labelColor={highlightOffer?.labelColor}
                />
                <div
                  className="relative aspect-square w-full px-4 flex items-center justify-center cursor-pointer"
                  onMouseMove={handleMouseMove}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => openLightbox(0)}
                  ref={zoomContainerRef}
                >
                  <img
                    src={resolveImagePath(mainImage)}
                    alt={product?.name || "Product"}
                    className="w-full h-full object-contain rounded-lg"
                    ref={imgRef}
                    onError={(e) => handleImageErrorFallback(e, mainImage)}
                  />
                  {showZoomLens && (
                    <div
                      className="absolute border-2 border-white bg-white bg-opacity-30 pointer-events-none"
                      style={{ width: '150px', height: '150px', left: 0, top: 0, borderRadius: '50%', transform: 'translateZ(0)', zIndex: 10 }}
                      ref={zoomLensRef}
                    />
                  )}
                </div>
                {showZoomLens && (
                  <div
                    className="absolute hidden md:block left-full ml-4 top-0 bg-no-repeat bg-white border rounded-lg overflow-hidden shadow-2xl"
                    style={{
                      backgroundImage: `url(${resolveImagePath(product?.images?.[selectedImageIndex])})`,
                      backgroundSize: '200%',
                      backgroundPosition: '50% 50%',
                      zIndex: 30, height: '400px', width: '525px'
                    }}
                    ref={zoomResultRef}
                  />
                )}
              </div>

              {/* Thumbnails Strip */}
              {product.images && product.images.filter(img => img && typeof img === "string" && img.trim() !== "").length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {product.images.filter(img => img && typeof img === "string" && img.trim() !== "").map((image, index) => (
                    <div key={index} className="flex-shrink-0">
                      <img
                        src={resolveImagePath(image)}
                        alt={`Thumbnail ${index + 1}`}
                        className={`w-16 h-16 border rounded-lg cursor-pointer object-cover transition-all duration-200 ${selectedImageIndex === index ? 'border-[#d72828] ring-2 ring-red-500 scale-105' : 'border-gray-300 hover:border-gray-400 opacity-80 hover:opacity-100'
                          }`}
                        onClick={() => setSelectedImageIndex(index)}
                        onError={(e) => handleImageErrorFallback(e, image)}
                      />
                    </div>
                  ))}
                </div>
              )}



              {/* Lightbox Modal */}
              {lightboxOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-6 overflow-y-auto" onClick={closeLightbox}>
                  <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md sm:max-w-2xl mx-auto flex flex-col items-center max-h-[80vh] sm:max-h-[70vh] p-3 sm:p-6 mt-[10rem] sm:mt-32" onClick={(e) => e.stopPropagation()}>
                    <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 z-50" onClick={closeLightbox}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="relative w-full flex items-center justify-center">
                      <img src={resolveImagePath(product?.images?.[selectedImageIndex])} alt={product?.name || "Product"} className="object-contain max-h-[60vh] sm:max-h-[50vh] w-full rounded-md" onError={(e) => handleImageErrorFallback(e, product?.images?.[selectedImageIndex])} />
                    </div>
                    <div className="w-full border-t border-gray-300 my-3"></div>
                    {product.images && product.images.filter(img => img && typeof img === "string" && img.trim() !== '' && img.trim().toLowerCase() !== 'null').length > 0 && (
                      <div className="flex justify-center flex-wrap gap-2 sm:gap-3">
                        {product.images.filter(img => img && typeof img === "string" && img.trim() !== '' && img.trim().toLowerCase() !== 'null').map((image, index) => (
                          <img key={index} src={resolveImagePath(image)} alt={`Thumbnail ${index + 1}`}
                            className={`object-cover w-14 h-14 sm:w-16 sm:h-16 rounded-sm cursor-pointer hover:scale-105 ${selectedImageIndex === index ? 'ring-2 ring-red-500' : ''}`}
                            onClick={() => setSelectedImageIndex(index)}
                            onError={(e) => handleImageErrorFallback(e, image)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* ==================== RIGHT SIDE: COLUMNS 2 + 3 AREA (8 cols / ~67% width) ==================== */}
          <div className="lg:col-span-8 flex flex-col gap-4 min-w-0 self-stretch">
            <div className="grid grid-cols-8 gap-6 items-start">
              {/* ==================== COLUMN 2: PRODUCT INFORMATION & DETAILS (5 cols) ==================== */}
              <div className="col-span-5 flex flex-col gap-3 min-w-0">
                {/* 1. BREADCRUMBS AT TOP OF COLUMN 2 */}
                <ProductBreadcrumb product={product} className="mb-1 text-xs w-full overflow-hidden" />

                {/* Brand Link */}
                {brand.find((b) => b.value === product.brand)?.label && (
                  <p className="text-[#d72828] font-bold text-xs uppercase tracking-wider">
                    From {brand.find((b) => b.value === product.brand)?.label} Store
                  </p>
                )}

                {/* Title */}
                <h1 className="text-xl font-bold text-gray-900 leading-snug">{product.name}</h1>

                {/* Stock Status & Product Code / SKU */}
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  {product.stock_status === "In Stock" && product.quantity > 0 ? (
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold">
                      ✓ In Stock ({product.quantity} units)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-semibold">
                      ✗ Out of Stock
                    </span>
                  )}
                  {(product.item_code || product.model_number) && (
                    <span className="text-gray-500 font-medium">
                      {product.item_code ? `(Product Code: ${product.item_code})` : ''} {product.model_number ? `| Model: ${product.model_number}` : ''}
                    </span>
                  )}
                </div>

                <ProductVariantSelector
                  variantGroup={product.variantGroup}
                  currentProductId={product._id}
                  onSelect={handleVariantSelect}
                />

                <div className="key-fea"></div>
                {isDesktop ? (
                  <div id="flix-minisite" className="flix-minisite-container w-full" />
                ) : null}

                {/* Rating & Reviews */}
                {avgRating > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-green-600 text-white font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      {avgRating} ★
                    </span>
                    <span className="text-gray-500 font-medium">({reviewCount} Verified Ratings & Reviews)</span>
                  </div>
                )}

                {/* Price & Offer Block */}
                <div className="border-t border-b border-gray-200 py-3 my-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-3xl font-black text-[#d72828]">
                      ₹ {Number((product.special_price > 0 ? product.special_price : product.price) + (isExtendedWarrantyEligible(product) ? (selectedWarrantyAmount || 0) : 0)).toLocaleString('en-IN')}
                    </span>
                    {isExtendedWarrantyEligible(product) && selectedWarrantyAmount > 0 && (
                      <WarrantyBadge
                        selectedWarranty={selectedWarrantyData}
                        selectedWarrantyAmount={selectedWarrantyAmount}
                        onDeselect={handleDeselectWarranty}
                      />
                    )}
                    {mainDiscountInfo.showDiscount && (
                      <>
                        <span className="text-sm text-gray-400 line-through font-medium">
                          M.R.P: ₹ {Number(product.price + (isExtendedWarrantyEligible(product) ? (selectedWarrantyAmount || 0) : 0)).toLocaleString('en-IN')}
                        </span>
                        <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                          {mainDiscountInfo.discountPercent}% OFF
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">Inclusive of all taxes</p>
                </div>

                {/* Available Offers Component */}
                <div className="mt-3">
                  <ExchangeOfferSection
                    productCategory={product.sub_category_new_name ? product.sub_category_new_name.replace(/##/g, ",") : (product.categoryName || "")}
                    onExchangeApply={handleExchangeApply}
                  />
                  <PaymentOffers
                    product={product}
                    externalShowEmiModal={showEMIModal}
                    onExternalCloseEmiModal={() => setShowEMIModal(false)}
                  />
                </div>

                {/* Delivery Options & Badges Card (Screenshot Reference Exact Match) */}
                <div className="border border-gray-200 rounded-xl p-3.5 bg-white shadow-2xs mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">Delivery Options:</span>
                    {!isEditingPincode ? (
                      <div className="flex items-center gap-2 border border-gray-200 rounded-md px-2.5 py-1 bg-white shadow-2xs">
                        <IoLocationOutline className="text-gray-500 w-3.5 h-3.5" />
                        <span className="text-xs font-bold text-gray-800">
                          {deliveryPincode || globalPincode || "600001"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingPincode(true)}
                          className="text-xs font-bold text-[#d72828] hover:underline ml-1 cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleCheckDelivery(deliveryPincode);
                          setIsEditingPincode(false);
                        }}
                        className="flex items-center gap-1.5 bg-white border border-gray-300 rounded px-2 py-1 shadow-2xs"
                      >
                        <IoLocationOutline className="text-gray-500 w-3.5 h-3.5" />
                        <input
                          type="text"
                          value={deliveryPincode}
                          onChange={(e) =>
                            setDeliveryPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
                          }
                          placeholder="Enter Pincode"
                          maxLength={6}
                          autoFocus
                          className="w-20 text-xs focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={isCheckingDelivery}
                          className="text-xs font-bold text-[#d72828] hover:underline ml-1 cursor-pointer disabled:opacity-50"
                        >
                          {isCheckingDelivery ? "..." : "Check"}
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Regular Delivery | Store Pickup Split Box */}
                  <div className="border border-gray-200 rounded-lg grid grid-cols-2 divide-x divide-gray-200 bg-white mt-2.5">
                    <div className="p-2.5 text-center">
                      <span className="text-xs font-black text-gray-900 block tracking-tight">
                        REGULAR DELIVERY
                      </span>
                      <span
                        className={`text-[11px] font-medium block mt-0.5 ${isCheckingDelivery
                          ? "text-gray-500"
                          : deliveryInfo?.available === false
                            ? "text-red-600"
                            : "text-green-600"
                          }`}
                      >
                        {isCheckingDelivery
                          ? "Checking delivery..."
                          : deliveryInfo?.available === false
                            ? (deliveryInfo?.message || "Not Available for Delivery at Your Location")
                            : (deliveryInfo?.message || "Delivery in 2 Days")}
                      </span>
                    </div>
                    <div className="p-2.5 text-center">
                      <span className="text-xs font-black text-gray-900 block tracking-tight">
                        STORE PICKUP
                      </span>
                      <span
                        className={`text-[11px] font-medium block mt-0.5 ${isCheckingDelivery
                          ? "text-gray-500"
                          : deliveryInfo?.pickupAvailable === false || deliveryInfo?.available === false
                            ? "text-gray-400"
                            : "text-green-600"
                          }`}
                      >
                        {isCheckingDelivery
                          ? "Checking..."
                          : deliveryInfo?.pickupAvailable === false || deliveryInfo?.available === false
                            ? (deliveryInfo?.pickupMessage || "Not Available")
                            : "Reserve & Collect at Store"}
                      </span>
                    </div>
                  </div>

                  {/* GST Invoice & Genuine Badges (Inside Card 2) */}
                  <div className="flex items-center justify-between text-xs text-gray-600 mt-3 pt-1">
                    <div className="flex items-center gap-1.5 font-medium">
                      <IoCardOutline className="text-[#d72828] w-4 h-4 flex-shrink-0" />
                      <span>GST Invoice Available</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <IoShieldCheckmark className="text-green-600 w-4 h-4 flex-shrink-0" />
                      <span>100% Genuine Product</span>
                    </div>
                  </div>
                </div>

              </div>


              {/* ==================== COLUMN 3: FREQUENTLY BOUGHT TOGETHER & CTAS (3 cols) ==================== */}
              <div className="col-span-3 min-w-0">
                <div className="flex flex-col gap-2.5">

                  {/* 1. FREQUENTLY BOUGHT TOGETHER (EXACTLY 2 PRODUCTS, BACKEND CONTROLLED) - 1ST POSITION */}
                  {featuredProducts && featuredProducts.filter(item => item.stock_status === "In Stock").length > 0 && (
                    <div className="border border-gray-200 rounded-lg shadow-sm bg-white p-3">
                      <h3 className="font-bold text-xs text-gray-900 border-b border-gray-200 pb-2 mb-3 uppercase tracking-wide">
                        Frequently Bought Together:
                      </h3>
                      <div className="space-y-3">
                        {featuredProducts.slice(0, 2).map((item, index) => (
                          <div key={item._id || index} className={`flex items-start gap-2.5 pb-2.5 border-b border-gray-100 last:border-0 ${!isInStock ? 'opacity-60' : ''}`}>
                            <input
                              type="checkbox"
                              className="mt-1 accent-[#d72828] cursor-pointer w-4 h-4 disabled:cursor-not-allowed disabled:opacity-50"
                              checked={!isInStock ? false : selectedFrequentProducts.some(p => p._id === item._id)}
                              onChange={() => {
                                if (isInStock) toggleFrequentProduct(item);
                              }}
                              disabled={!isInStock}
                              title={!isInStock ? "Main product is out of stock" : ""}
                            />
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <img
                                src={resolveImagePath(item.images?.[0] || item.image)}
                                alt={item.name || "Product"}
                                className="w-12 h-12 object-contain flex-shrink-0 rounded border border-gray-200"
                                onError={(e) => handleImageErrorFallback(e, item.images?.[0] || item.image)}
                              />
                              <div className="text-xs flex-1 min-w-0">
                                <Link href={`/product/${item.slug}`} className="block hover:underline">
                                  <h4 className="font-medium text-gray-800 line-clamp-2 text-[11px] leading-snug">{item.name}</h4>
                                </Link>
                                <div className="flex flex-col mt-1">
                                  {getDiscountInfo(item?.price, item?.special_price).showDiscount && (
                                    <span className="text-[10px] text-gray-400 line-through">
                                      ₹ {Number(item?.price).toLocaleString('en-IN')}
                                    </span>
                                  )}
                                  <div className="flex items-center gap-1 text-[11px]">
                                    <span className="text-gray-500 font-medium">Buy Together for</span>
                                    <span className="font-bold text-[#d72828]">
                                      ₹ {Number(item?.special_price > 0 ? item.special_price : item?.price || 0).toLocaleString('en-IN')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. PROTECTION / EXTENDED WARRANTY (MIDDLE OF COLUMN 3) */}
                  {warranties.length > 0 && isExtendedWarrantyEligible(product) && (
                    <div className="border border-gray-200 rounded-lg shadow-sm bg-white p-3">
                      <div className="flex items-center gap-1.5 mb-2 border-b border-gray-200 pb-2">
                        <FaShield className="text-[#d72828] w-4 h-4" />
                        <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wide">
                          Want to protect your product?
                        </h3>
                      </div>

                      <div className="space-y-2 text-xs">
                        <label className="flex items-center justify-between p-1.5 rounded cursor-pointer hover:bg-gray-50">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="warranty_desktop_col3"
                              checked={selectedWarrantyData === null}
                              onChange={() => {
                                setSelectedWarrantyData(null);
                                setSelectedWarrantyAmount(0);
                              }}
                              className="accent-[#d72828]"
                            />
                            <span className="text-gray-700">No Protection Plan</span>
                          </div>
                        </label>

                        {[...warranties]
                          .sort((a, b) => (a.year || 0) - (b.year || 0))
                          .map((w, index) => (
                            <label
                              key={w.item_no || index}
                              className="flex items-center justify-between p-1.5 border-t border-gray-100 cursor-pointer hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="warranty_desktop_col3"
                                  checked={selectedWarrantyData?.item_no === w.item_no}
                                  onChange={() => {
                                    setSelectedWarrantyData(w);
                                    setSelectedWarrantyAmount(w.price);
                                  }}
                                  className="accent-[#d72828]"
                                />
                                <span className="text-gray-800 font-medium">{w.year} Year Warranty</span>
                              </div>
                              <span className="font-bold text-gray-900">₹ {w.price.toLocaleString("en-IN")}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* 1. PRIMARY ACTION BUTTONS: BUY NOW & ADD TO CART (INSIDE COLUMN 3) */}
                  <div className="flex flex-col gap-2 bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                    {/* Live Price Summary */}
                    <div className="pb-2 border-b border-gray-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-700 font-semibold">Total Price:</span>
                        <span className="font-extrabold text-base text-[#d72828]">
                          ₹ {Number(
                            ((product.special_price > 0 ? product.special_price : product.price) * (isInStock ? quantity : 1)) +
                            (isInStock && isExtendedWarrantyEligible(product) ? (selectedWarrantyAmount || 0) : 0)
                          ).toLocaleString("en-IN")}
                        </span>
                      </div>
                      {isInStock && isExtendedWarrantyEligible(product) && selectedWarrantyAmount > 0 && (
                        <span className="block text-[11px] text-gray-500 font-normal mt-0.5">
                          Includes ₹{Number((product.special_price > 0 ? product.special_price : product.price) * quantity).toLocaleString("en-IN")} product + ₹{selectedWarrantyAmount.toLocaleString("en-IN")} warranty
                        </span>
                      )}
                    </div>

                    {/* Quantity selector (visible for in-stock products only) */}
                    {isInStock && (
                      <div className="flex items-center justify-between text-xs bg-gray-50 border border-gray-200 rounded p-2 mb-1">
                        <span className="font-medium text-gray-700">Quantity:</span>
                        <div className="flex items-center border border-gray-300 bg-white rounded px-2 py-0.5 gap-3">
                          <button onClick={handleDecrease} className="text-gray-600 font-bold text-sm hover:text-[#d72828]">−</button>
                          <span className="text-xs font-bold w-4 text-center">{quantity}</span>
                          <button onClick={handleIncrease} className="text-gray-600 font-bold text-sm hover:text-[#d72828]">+</button>
                        </div>
                      </div>
                    )}

                    {isInStock ? (
                      !isMovementAllowed ? (
                        <>
                          <div className="w-full bg-gray-300 text-gray-600 font-extrabold py-3 rounded-lg flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-not-allowed">
                            Sold Out Online
                          </div>
                          <div className="w-full border-2 border-emerald-500 text-emerald-700 bg-emerald-50 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm">
                            <FaStore className="w-4 h-4 flex-shrink-0" />
                            Available in Store
                          </div>
                        </>
                      ) : (
                        <>
                          {/* BUY NOW Button or Call to Order for Clearance */}
                          {isOpenBox ? (
                            <a
                              href={`tel:${CLEARANCE_PHONE}`}
                              className="flex items-center justify-center gap-3 w-full py-3 px-5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-md transition-all duration-200 cursor-pointer active:scale-95 text-center"
                              title="Call to Order Clearance Unit"
                            >
                              <FaPhoneAlt className="w-5 h-5 flex-shrink-0 text-white self-center" />
                              <div className="flex flex-col items-center text-center leading-tight">
                                <span className="text-sm font-extrabold uppercase tracking-wider">CALL TO ORDER</span>
                                <span className="text-[10px] font-medium opacity-90 tracking-wide mt-0.5">(CLEARANCE UNIT)</span>
                              </div>
                            </a>
                          ) : (
                            <button
                              onClick={() => handleBuyNow()}
                              className="w-full font-extrabold py-3 rounded-lg flex items-center justify-center gap-2 text-sm uppercase tracking-wider shadow-md transition-all bg-[#d72828] hover:bg-red-700 text-white cursor-pointer active:scale-95"
                            >
                              <FaStore className="w-4 h-4 flex-shrink-0" />
                              Buy Now
                            </button>
                          )}

                          {/* ADD TO CART Button */}
                          <ProductAddtoCart
                            productId={product._id}
                            stockQuantity={product.quantity}
                            quantity={quantity}
                            additionalProducts={[...selectedFrequentProducts.map((p) => p._id), ...selectedRelatedProducts.map((p) => p._id)]}
                            extendedWarranty={isExtendedWarrantyEligible(product) ? selectedWarrantyAmount : 0}
                            selectedFrequentProducts={selectedFrequentProducts}
                            selectedRelatedProducts={selectedRelatedProducts}
                            warrantyData={isExtendedWarrantyEligible(product) ? selectedWarrantyData : null}
                            buttonLabel={isOpenBox ? "Enquire to Buy" : "Add To Cart"}
                            buttonClassName="w-full border-2 border-[#d72828] text-[#d72828] hover:bg-red-50 font-bold py-2.5 rounded-lg text-sm transition-all shadow-none"
                            movement={product.movement}
                            productName={product.name}
                            productSlug={product.slug}
                          />
                        </>
                      )
                    ) : (
                      /* Out of Stock CTAs (Modern Croma/Flipkart e-commerce pattern) */
                      <div className="flex flex-col gap-2 pt-0.5">
                        {/* Currently Out of Stock grey badge */}
                        <div className="w-full bg-gray-200 text-gray-700 font-extrabold py-3 rounded-lg flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-not-allowed select-none border border-gray-300">
                          Currently Out of Stock
                        </div>

                        {/* 🔔 Notify Me When Available Button */}
                        <button
                          type="button"
                          onClick={handleNotifyMe}
                          disabled={notifyMeSuccess}
                          className={`w-full font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-all cursor-pointer ${
                            notifyMeSuccess
                              ? "bg-emerald-600 text-white cursor-default"
                              : "bg-[#f59e0b] hover:bg-[#d97706] text-white shadow-sm active:scale-95"
                          }`}
                        >
                          <FaBell className="w-3.5 h-3.5" />
                          {notifyMeSuccess ? "Notification Registered ✓" : "Notify Me When Available"}
                        </button>

                        {/* 🏪 Available in Store Button */}
                        <div className="w-full border-2 border-emerald-500 text-emerald-700 bg-emerald-50 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs uppercase tracking-wide">
                          <FaStore className="w-4 h-4 flex-shrink-0" />
                          Available in Store
                        </div>

                        {/* View Similar Products Smooth Scroll Button */}
                        <button
                          type="button"
                          onClick={scrollToRelatedProducts}
                          className="w-full border border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer mt-0.5"
                        >
                          <span>View Similar Products</span>
                          <span className="text-[12px] font-bold text-[#d72828]">↓</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 2. ACTIONS BAR: Share | Compare | Wishlist (Clean single-line alignment) */}
                  <div className="flex items-center justify-between border border-gray-200 py-2.5 px-3 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50 rounded-lg gap-2 whitespace-nowrap overflow-hidden">
                    <button
                      type="button"
                      onClick={handleShareProduct}
                      className="flex items-center gap-1.5 hover:text-[#d72828] transition cursor-pointer shrink-0"
                    >
                      <FaShareAlt className="text-gray-500 w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>
                    <span className="text-gray-300 select-none">|</span>
                    <CompareButton
                      product={product}
                      variant="text"
                      iconSize={14}
                      label="Compare"
                      activeLabel="✓ In Compare"
                      className="flex items-center gap-1.5 hover:text-[#d72828] transition bg-transparent p-0 border-0 shadow-none text-xs sm:text-sm text-gray-700 font-semibold cursor-pointer shrink-0 whitespace-nowrap"
                    />
                    <span className="text-gray-300 select-none">|</span>
                    <AddToWishlistButton
                      productId={product._id}
                      label="Wishlist"
                      iconSize={14}
                      className="flex items-center gap-1.5 hover:text-[#d72828] transition bg-transparent p-0 border-0 shadow-none text-xs sm:text-sm text-gray-700 font-semibold cursor-pointer shrink-0 whitespace-nowrap"
                    />
                  </div>

                  {/* 5. LIVE MARKET PRICE COMPARISON (ePrice Tracker™) */}
                  <CompetitorPriceTracker product={product} />

                </div>
              </div>

            </div>

            {/* ==================== EXTENDED WARRANTY & INSTALLATION (Spans Columns 2 + 3) ==================== */}
            <ProductInstallationWarrantySection
              product={product}
              warranties={warranties}
              selectedWarrantyData={selectedWarrantyData}
              onSelectWarranty={handleSelectWarranty}
              className="mt-1"
            />
          </div>

        </div>
        {/* END DESKTOP VIEW GRID */}

        {/* DESKTOP FULL-WIDTH PRODUCT DETAILS & SPECIFICATIONS SECTION */}
        <div className="hidden lg:block w-full mt-8">
          <ProductDetailsSection
            key={`desktop-${product._id}`}
            product={product}
            reviews={reviews}
            avgRating={avgRating}
            reviewCount={reviewCount}
            manufacturerName={matchedBrandForManufacturer?.manufacturer_name}
            manufacturerAddress={matchedBrandForManufacturer?.manufacturer_address}
            flixInstanceActive={isDesktop}
            flixInpageAvailable={flixInpageAvailable}
          />
        </div>




        <RelatedProducts
          relatedProducts={product?.related_products}
          currentProductId={product?._id}
          categoryId={product?.category}
          brandId={product?.brand}
        />
        <RecentlyViewedProducts products={recentlyViewedProducts} />
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        product={product}
      />
    </div>
  );
}


