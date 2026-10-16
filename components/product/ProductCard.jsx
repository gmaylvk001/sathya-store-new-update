"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FaStar } from "react-icons/fa";
import AddToWishlistButton from "@/components/ProductCard";
import ProductAddtoCart from "@/components/AddToCart";
import CompareButton from "@/components/CompareButton";
import PriceBlock from "@/components/product/PriceBlock";
import BestPriceStrip from "@/components/product/BestPriceStrip";
import ProductCardTrustBadge from "@/components/product/ProductCardTrustBadge";
import { getBestPriceData } from "@/lib/offers/bestPriceUtils";
import { BankOffersModal } from "@/components/ProductOffersSection";

export default function ProductCard({
  product,
  variant = "default",
  onProductClick,
  className = "",
  checkMovement,
  compactMobile = true,
}) {
  const [currentImg, setCurrentImg] = useState(product?.imgSrc || "/uploads/products/placeholder.jpg");
  const [imgLoaded, setImgLoaded] = useState(false);
  const [retryFailed, setRetryFailed] = useState(false);

  React.useEffect(() => {
    setCurrentImg(product?.imgSrc || "/uploads/products/placeholder.jpg");
    setRetryFailed(false);
    setImgLoaded(false);
  }, [product?.imgSrc]);

  const assetFallbackBase = (process.env.NEXT_PUBLIC_ASSET_FALLBACK_URL || "https://estore.bharathelectronics.in").replace(/\/+$/, "");

  const handleImageError = () => {
    setImgLoaded(true);
    if (!retryFailed && currentImg && currentImg.startsWith("/uploads/products/") && !currentImg.includes("placeholder")) {
      const filename = currentImg.replace("/uploads/products/", "");
      setRetryFailed(true);
      setCurrentImg(`${assetFallbackBase}/uploads/products/${filename}`);
    } else {
      setRetryFailed(true);
      setCurrentImg("/uploads/products/placeholder.jpg");
    }
  };
  // Home page cards use the normal add-to-cart flow unless a section opts in.
  const isHomePage = usePathname() === "/";
  const applyMovementCheck = checkMovement ?? !isHomePage;

  if (!product) return null;

  // Assumes product has been mapped through lib/normalizeProduct
  const {
    _id,
    slug,
    name,
    currentPrice,
    originalPrice,
    hasDiscount,
    discountPercent,
    brandName,
    inStock,
    quantity,
    ratingValue,
    reviewCount,
    imgSrc,
    movement,
    special_price,
  } = product;

  const productUrl = `/product/${slug}`;

  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false);
  const bestPriceData = React.useMemo(() => getBestPriceData(product), [product]);

  const handleClick = () => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  const variantMap = {
    default: {
      imageContainer: "h-[150px] sm:h-[170px] p-3",
      contentArea: "p-3 sm:p-4",
      title: "text-xs sm:text-sm h-[2.4rem]",
      price: "text-sm sm:text-base",
    },
    compact: {
      imageContainer: "h-[120px] sm:h-[140px] p-2",
      contentArea: "p-2 sm:p-3",
      title: "text-[10px] sm:text-xs h-[2rem]",
      price: "text-xs sm:text-sm",
    },
    wide: {
      imageContainer: "h-[180px] sm:h-[220px] p-4",
      contentArea: "p-4 sm:p-5",
      title: "text-sm sm:text-base h-[3rem]",
      price: "text-base sm:text-lg",
    },
  };
  const variantClasses = variantMap[variant] || variantMap.default;

  return (
    <div
      className={`group relative bg-white rounded-[16px] border border-red-200/90 hover:border-[#d72828] shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden w-full min-w-0 select-none ${className}`}
    >
      {/* Top Image Container */}
      <div
        className={`relative w-full bg-[#f9fafb] flex items-center justify-center overflow-hidden ${
          compactMobile
            ? "h-[120px] sm:h-[170px] p-2 sm:p-3"
            : variantClasses.imageContainer
        }`}
      >
        {/* Top-left discount badge */}
        {hasDiscount && (
          <span className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 z-10 bg-gradient-to-r from-rose-600 to-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full shadow-xs tracking-wide">
            -{discountPercent}%
          </span>
        )}

        {/* Top-right Wishlist + Compare buttons */}
        <div
          className={`absolute ${
            compactMobile
              ? "top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 gap-1 sm:gap-1.5"
              : "top-2.5 right-2.5 gap-1.5"
          } z-10 flex flex-col`}
        >
          <AddToWishlistButton
            productId={_id}
            iconSize={compactMobile ? 12 : 14}
            className={`${
              compactMobile ? "w-6 h-6 sm:w-7 sm:h-7" : "w-7 h-7"
            } rounded-full bg-white/90 backdrop-blur-md shadow-xs border border-gray-100 flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all text-gray-600 hover:text-rose-600`}
          />
          <CompareButton
            product={product}
            variant="icon"
            className={`${
              compactMobile ? "w-6 h-6 sm:w-7 sm:h-7" : "w-7 h-7"
            } rounded-full bg-white/90 backdrop-blur-md shadow-xs border flex items-center justify-center transition-all active:scale-95`}
          />
        </div>

        <Link
          href={productUrl}
          onClick={handleClick}
          className="relative w-full h-full flex items-center justify-center"
        >
          {!imgLoaded && (
            <div className="absolute inset-0 bg-gray-100/60 animate-pulse rounded-lg" />
          )}
          <Image
            src={currentImg}
            alt={name || "Product Image"}
            fill
            sizes="(max-width: 640px) 70vw, (max-width: 1024px) 33vw, 20vw"
            className={`object-contain p-2 group-hover:scale-105 transition-transform duration-300 ease-out ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={handleImageError}
            unoptimized
          />
        </Link>
      </div>

      {/* Content Area */}
      <div
        className={`flex flex-col flex-1 bg-white ${
          compactMobile ? "p-2 sm:p-4" : variantClasses.contentArea
        }`}
      >
        <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider truncate mb-1 block">
          {brandName}
        </span>

        <Link href={productUrl} onClick={handleClick} className="block mb-1 sm:mb-1.5">
          <h4
            title={name}
            className={`font-semibold text-gray-900 group-hover:text-[#d72828] transition-colors leading-snug line-clamp-3 sm:line-clamp-2 ${
              compactMobile
                ? "text-[12px] sm:text-sm min-h-[3.15rem] sm:min-h-0 sm:h-[2.4rem]"
                : variantClasses.title
            }`}
          >
            {name}
          </h4>
        </Link>

        {/* Rating Section */}
        <div className="flex items-center gap-1 mb-1 h-4">
          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">
            <FaStar className="text-amber-500 text-[9px]" />
            <span>{(ratingValue > 0 ? ratingValue : 4.5).toFixed(1)}</span>
          </div>
          {reviewCount > 0 && (
            <span className="text-[10px] text-gray-400 font-medium">
              ({reviewCount})
            </span>
          )}
        </div>

        <PriceBlock 
          price={currentPrice} 
          mrp={originalPrice} 
          priceClass={compactMobile ? "text-[13px] sm:text-base" : variantClasses.price} 
        />

        {/* Stock Row */}
        <div className="flex items-center gap-1 mt-0.5 mb-1.5">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${inStock ? "bg-emerald-500" : "bg-rose-500"}`} />
          <span className={`text-[10px] sm:text-xs font-medium ${inStock ? "text-emerald-600" : "text-rose-600"}`}>
            {inStock ? "In Stock" : "Out of Stock"}
          </span>
        </div>

        <div
          className={`mt-auto ${
            compactMobile ? "pt-1.5 sm:pt-2 gap-1.5 sm:gap-2" : "pt-2 gap-2"
          } border-t border-gray-100 flex flex-col`}
        >
          <ProductAddtoCart
            productId={_id}
            stockQuantity={quantity}
            special_price={special_price}
            className={
              compactMobile
                ? "w-full text-xs font-bold !py-0 !mr-0 h-[32px] sm:h-auto min-h-[32px] rounded-xl transition-all shadow-2xs flex items-center justify-center whitespace-nowrap"
                : "w-full text-xs font-bold py-1.5 rounded-xl transition-all shadow-2xs"
            }
            movement={movement}
            productName={name}
            productSlug={slug}
            checkMovement={applyMovementCheck}
          />

          {bestPriceData ? (
            <BestPriceStrip 
              effectivePrice={bestPriceData.bestPrice} 
              onOffersClick={() => setIsOffersModalOpen(true)}
              compact={compactMobile}
            />
          ) : null}
        </div>
      </div>

      {isOffersModalOpen && bestPriceData && (
        <BankOffersModal
          basePrice={bestPriceData.basePrice}
          bankOffers={bestPriceData.bankOffers}
          bankEffectivePrice={bestPriceData.bestPrice}
          onClose={() => setIsOffersModalOpen(false)}
        />
      )}
    </div>
  );
}
