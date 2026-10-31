import { cache } from "react";
import dbConnect from "@/lib/db";
import Product from "@/models/product";
import OwnerProduct from "@/models/OwnerProduct";
import { normalizeRegion, isUniletProduct } from "@/lib/regionHelper";
import { resolveProductPrice } from "@/lib/priceResolver";
import {
  attachVariantGroupToProduct,
  applyRegionPricingToVariantGroup,
} from "@/lib/variantGroup";
import { resolveBestPriceForProduct } from "@/lib/bestPriceResolver";
import ExtendedWarranty from "@/models/ecom_products_extended_warrent";
import { isExtendedWarrantyEligible } from "@/lib/productServiceEligibility";

// In-memory micro-cache (TTL 60s) for high-frequency staging/production reads
const productCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

function getCached(key) {
  const item = productCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    productCache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data) {
  if (productCache.size > 200) {
    const oldestKey = productCache.keys().next().value;
    productCache.delete(oldestKey);
  }
  productCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Fetch and construct full product response for PDP / API with maximum concurrency.
 */
export async function getProductData(slug, region = "tamilnadu") {
  if (!slug) return null;

  const normalizedRegion = normalizeRegion(region);
  const cacheKey = `${slug}::${normalizedRegion}`;
  const memoryHit = getCached(cacheKey);
  if (memoryHit) {
    return JSON.parse(JSON.stringify(memoryHit));
  }

  await dbConnect();

  // 1. Fetch main active product by slug using compound index { slug: 1, status: 1 }
  const product = await Product.findOne({
    slug,
    status: "Active",
  }).lean();

  if (!product) {
    return null;
  }

  // 2. Concurrently fetch Karnataka owner product if applicable
  let ownerProduct = null;
  if (normalizedRegion === "karnataka" || isUniletProduct(product)) {
    ownerProduct = await OwnerProduct.findOne({
      owner_id: "unilet",
      $or: [
        ...(product._id ? [{ product_id: product._id }] : []),
        ...(product.item_code ? [{ product_item_code: product.item_code }, { vendor_item_code: product.item_code }] : []),
        { product_item_code: "UNILETEC383BIKSTM" },
      ],
      is_active: true,
    }).lean();
  }

  const priceInfo = resolveProductPrice(product, ownerProduct, normalizedRegion);

  const responseProduct = {
    ...product,
    _id: String(product._id),
    price: priceInfo.price,
    special_price: priceInfo.special_price,
    quantity: priceInfo.stock,
    stock_status: priceInfo.inStock ? "In Stock" : "Out of Stock",
    isUnilet: priceInfo.isUnilet,
    usingLsp: Boolean(priceInfo.usingLsp),
    resolvedRegion: normalizedRegion,
    status: "Active",
  };

  // 3. Network Waterfall Optimization: Run variant group resolution, best price calculation,
  // and extended warranty lookup in parallel via Promise.all
  const [_, bestPriceDetails, extWarranty] = await Promise.all([
    (async () => {
      if (responseProduct.variantGroupId) {
        await attachVariantGroupToProduct(responseProduct);
        await applyRegionPricingToVariantGroup(responseProduct, normalizedRegion);
      } else {
        responseProduct.variantGroup = null;
      }
    })(),
    resolveBestPriceForProduct(responseProduct),
    (async () => {
      if (!isExtendedWarrantyEligible(responseProduct)) {
        return null;
      }
      if (
        (!responseProduct.extend_warranty || responseProduct.extend_warranty.length === 0) &&
        product.item_code
      ) {
        return ExtendedWarranty.findOne({
          item_code: product.item_code,
          status: "Active",
        })
          .select("extend_warranty")
          .lean()
          .catch((err) => {
            console.error("Error fetching extended warranty:", err);
            return null;
          });
      }
      return null;
    })(),
  ]);

  responseProduct.bestPriceDetails = bestPriceDetails;
  responseProduct.best_price =
    bestPriceDetails?.bestPriceDisplay ??
    responseProduct.special_price ??
    responseProduct.price;

  if (!isExtendedWarrantyEligible(responseProduct)) {
    responseProduct.extend_warranty = [];
  } else if (extWarranty?.extend_warranty?.length) {
    responseProduct.extend_warranty = extWarranty.extend_warranty;
  }

  // Strip non-serializable fields if any
  const cleanData = JSON.parse(JSON.stringify(responseProduct));
  setCache(cacheKey, cleanData);
  return cleanData;
}

/**
 * React request-deduplicated version for Next.js SSR (shared across generateMetadata and Page component)
 */
export const getProductDataCached = cache(async (slug, region = "tamilnadu") => {
  return getProductData(slug, region);
});
