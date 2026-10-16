import { useEffect, useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import Image from "next/image";
import "swiper/css/navigation";
import ProductCard from "@/components/ProductCard";
import Addtocart from "@/components/AddToCart";
import { FaShareAlt } from "react-icons/fa";
import { getDiscountInfo } from "@/lib/discountHelper";

export default function CategoryMainPage({ categorySlug = "large-appliance" }) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subcategories, setSubcategories] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [noFound, setNoFound] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [featuredProducts, setFeaturedProducts] = useState({});
  const [selectedFilters, setSelectedFilters] = useState({
    categories: [],
    brands: [],
    price: { min: "", max: "" },
    ratings: [],
  });

  // FETCH FEATURED
  const fetchFeaturedProducts = async (ids, index) => {
    if (!ids.length) return;

    const res = await fetch(`/api/product/by-ids?ids=${ids.join(",")}`);
    const data = await res.json();

    setFeaturedProducts((prev) => ({
      ...prev,
      [index]: data.products || [],
    }));
  };

  // FETCH BANNERS
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);

        const res = await fetch(`/api/main-tird-sec/${categorySlug}`);
        const data = await res.json();

        if (data.success) {
          setBanners(data.data);

          data.data.forEach((group, index) => {
            console.log("group bgColor:", group.bgColor);
            const ids = group.top?.featured_products || [];
            fetchFeaturedProducts(ids, index);
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (categorySlug) fetchBanners();
  }, [categorySlug]);

  // FETCH PRODUCTS
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);

      const query = new URLSearchParams();

      query.set("categorySlug", categorySlug);

      if (selectedFilters.categories.length)
        query.set("categoryIds", selectedFilters.categories.join(","));

      if (selectedFilters.brands.length)
        query.set("brands", selectedFilters.brands.join(","));

      if (selectedFilters.price.min && selectedFilters.price.max) {
        query.set("minPrice", selectedFilters.price.min);
        query.set("maxPrice", selectedFilters.price.max);
      }

      if (selectedFilters.ratings.length)
        query.set("ratings", selectedFilters.ratings.join(","));

      query.set("page", page);
      query.set("limit", itemsPerPage);

      const res = await fetch(
        `/api/product/filter/main-cat-two?${query.toString()}`,
      );
      const data = await res.json();

      setProducts(data.products || []);
      setTotalProducts(data.total || 0);
      setNoFound(data.products?.length === 0);
    } catch (err) {
      console.error(err);
      setProducts([]);
      setNoFound(true);
    } finally {
      setLoadingProducts(false);
    }
  };
  const handleShare = async (product) => {
    const productUrl = `${window.location.origin}/product/${product.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          url: productUrl,
        });
      } else {
        await navigator.clipboard.writeText(productUrl);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error("Share failed:", err);
      }
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categorySlug, selectedFilters, page]);

  // FETCH SUBCATEGORIES
  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        const res = await fetch(
          `/api/subcategories?parentSlug=${categorySlug}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        setSubcategories(data.subcategories || []);
      } catch (err) {
        console.error(err);
      }
    };

    if (categorySlug) fetchSubcategories();
  }, [categorySlug]);

  // BRAND MAP
  const [brandMap, setBrandMap] = useState({});
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const fetchBrand = async () => {
    try {
      const response = await fetch("/api/brand");
      const result = await response.json();

      if (!result.error && Array.isArray(result?.data)) {
        const map = {};
        result.data.forEach((b) => {
          if (b?._id) {
            map[b._id] = b.brand_name;
          }
        });
        setBrandMap(map);
      }
    } catch (err) {
      console.warn("Could not fetch brand:", err.message);
    }
  };

  useEffect(() => {
    fetchBrand();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d72828]"></div>
      </div>
    );
  }

  return (
    <div className="bg-white mt-6">
      {banners.map((group, idx) => (
        <div key={idx} className="mt-6">
          {/* ── TOP BANNER ───────────────────────────────────────────── */}
          {group.top && (
            <a
              href={group.top.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={group.top.image}
                alt={group.top.name}
                className="w-full"
              />
            </a>
          )}

          {/* ── SUB BANNERS ──────────────────────────────────────────── */}
          {group.sub?.length > 0 && (
            // Full width color background wrapping all cards
            <div
              className="w-full mt-0  py-4 px-4"
              style={{ backgroundColor: group.bgColor || "#f0f0f0" }}
            >
              {group.sub.length < 5 ? (
                // Flexbox for 1–4 cards
                <div
                  className="grid gap-3 w-full"
                  style={{
                    gridTemplateColumns: `repeat(${group.sub.length}, 1fr)`,
                  }}
                >
                  {group.sub.map((sb, i) => (
                    <a
                      key={i}
                      href={sb.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block  overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
                    >
                      <img
                        src={sb.image}
                        alt={sb.name || `Sub banner ${i + 1}`}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                // Swiper for 5+ cards
                <Swiper
                  modules={[Navigation]}
                  navigation
                  spaceBetween={16}
                  breakpoints={{
                    0: { slidesPerView: 2 },
                    640: { slidesPerView: 3 },
                    1024: { slidesPerView: 4 },
                  }}
                  className="pb-2 customSwiper"
                >
                  {group.sub.map((sb, i) => (
                    <SwiperSlide key={i}>
                      <a
                        href={sb.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
                      >
                        <img
                          src={sb.image}
                          alt={sb.name || `Sub banner ${i + 1}`}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </a>
                    </SwiperSlide>
                  ))}
                </Swiper>
              )}
            </div>
          )}

          {/* ── FEATURED PRODUCTS ────────────────────────────────────── */}
          {featuredProducts[idx] && featuredProducts[idx].length > 0 && (
            <div className="bg-white p-4 rounded-lg mt-6">
              <h2 className="text-2xl font-bold mb-4">Best Deals</h2>
              <Swiper
                modules={[Navigation]}
                navigation
                spaceBetween={16}
                breakpoints={{
                  0: { slidesPerView: 2 },
                  640: { slidesPerView: 3 },
                  1024: { slidesPerView: 5 },
                }}
                className="customSwiper"
              >
                {featuredProducts[idx].map((product) => (
                  <SwiperSlide key={product._id}>
                    <div className="group relative bg-white rounded-lg border hover:border-red-200 transition-all shadow-sm hover:shadow-md flex flex-col h-full">
                      {/* Product Image */}
                      <div className="relative aspect-square bg-white">
                        <Link
                          href={`/product/${product.slug}`}
                          className="block mb-2"
                        >
                          {product.images?.[0] && (
                            <Image
                              src={
                                product.images[0].startsWith("http")
                                  ? product.images[0]
                                  : `/uploads/products/${product.images[0]}`
                              }
                              alt={product.name}
                              fill
                              className="object-contain p-2 md:p-4 transition-transform duration-300 group-hover:scale-105"
                              sizes="(max-width: 640px) 50vw, 33vw, 25vw"
                              onError={(e) => {
                                if (e?.currentTarget) {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = "/uploads/products/placeholder.jpg";
                                }
                              }}
                              unoptimized
                            />
                          )}
                        </Link>
                          {/* ✅ Clearance Sale Badge  */}
                           {(product.movement === "EOL" || product.movement === "FOCUS") && (
                          <span className="absolute bottom-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 animate-pulse tracking-wide uppercase">
                                🏷️ Clearance Sale
                              </span>
                              )}

                        {/* Discount Badge */}
                        {Number(product.special_price) > 0 &&
                          Number(product.special_price) <
                            Number(product.price) && (
                            <span className="absolute top-3 left-2 bg-orange-500 text-white tracking-wider text-xs font-bold px-2 py-0.5 rounded z-10">
                              -
                              {Math.round(
                                100 -
                                  (Number(product.special_price) /
                                    Number(product.price)) *
                                    100,
                              )}
                              %
                            </span>
                          )}

                        {/* Wishlist */}
                        <div className="absolute top-2 right-2">
                          <ProductCard
                            productId={product._id}
                            isOutOfStock={product.quantity === 0}
                          />
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-2 md:p-4 flex flex-col h-full">
                        <h4 className="text-xs text-gray-500 mb-2 uppercase">
                          <Link
                            href={`/brand/${
                              brandMap[product.brand]
                                ? brandMap[product.brand]
                                    .toLowerCase()
                                    .replace(/\s+/g, "-")
                                : ""
                            }`}
                            className="hover:text-[#d72828]"
                          >
                            {brandMap[product.brand] || ""}
                          </Link>
                        </h4>

                        <Link
                          href={`/product/${product.slug}`}
                          className="block mb-2 flex-1"
                        >
                          <h3 className="text-xs sm:text-sm font-medium text-[#d72828] hover:text-[#c02020] min-h-[32px] sm:min-h-[40px]">
                            {(() => {
                              const model = product.model_number
                                ? `(${product.model_number.trim()})`
                                : "";
                              const name = product.name
                                ? product.name.trim()
                                : "";
                              const maxLen = 40;
                              if (model) {
                                const remaining = maxLen - model.length - 1;
                                const truncatedName =
                                  name.length > remaining
                                    ? name.slice(0, remaining - 3) +
                                      `${model}...`
                                    : name;
                                return `${truncatedName} `;
                              } else {
                                return name.length > maxLen
                                  ? name.slice(0, maxLen - 3) + "..."
                                  : name;
                              }
                            })()}
                          </h3>
                          {/* Tooltip */}
                  <div className="absolute hidden group-hover:block left-3 -translate-y-full translate-y-[-1px] bg-[#d72828] text-white text-xs rounded px-2 py-1 max-w-[200px] whitespace-normal break-words shadow-md z-50">
                    {product.name}
                  </div>
                        </Link>

                        {/* Price */}
                        {(() => {
                          const { showDiscount } = getDiscountInfo(product.price, product.special_price);
                          return (
                            <div className="mb-3">
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-base font-semibold text-red-600">
                                  ₹{" "}
                                  {(showDiscount
                                    ? Math.round(product.special_price)
                                    : Math.round(product.price)
                                  ).toLocaleString()}
                                </span>
                                {showDiscount && (
                                  <span className="text-xs text-gray-500 line-through">
                                    ₹ {Math.round(product.price).toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        <h4
                          className={`text-xs mb-3 ${
                            product.quantity > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {product.quantity > 0
                            ? `In Stock, ${product.quantity} units`
                            : "Out Of Stock"}
                        </h4>

                        {/* Buttons */}
                        <div className="mt-auto flex items-center justify-between gap-2">
                          <Addtocart
                            productId={product._id}
                            stockQuantity={product.quantity}
                            special_price={product.special_price}
                            className="w-full text-xs sm:text-sm py-1.5"
                              movement={product.movement}
                          productName={product.name}
                             productSlug={product.slug}
                          />
                           {/* <button
                    type="button"
                    onClick={() => handleShare(product)}
                    className="bg-[#d72828] hover:bg-[#d72828] text-white p-1.5 rounded-full transition-colors duration-300 flex items-center justify-center flex-shrink-0"
                    title="Share this product"
                  >
                    <FaShareAlt className="w-5 h-5" />
                  </button> */}
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
