import { getDiscountInfo } from "./discountHelper.js";
import { normalizeRegion } from "./regionHelper.js";
import OwnerProduct from "@/models/OwnerProduct";

/** on = Karnataka orders use OwnerProduct price. off, empty, or missing = Sathya catalog price. */
export function showUniletPriceToOrder() {
  return String(process.env.show_unilet_price_to_order || "").trim().toLowerCase() === "on";
}

/**
 * Resolves product pricing and stock status based on region.
 * Karnataka stock still comes from the active OwnerProduct.
 * OwnerProduct price is used only when show_unilet_price_to_order=on.
 * All other states receive default Sathya catalog pricing.
 */
export const resolveProductPrice = (product, ownerProduct = null, region = "tamilnadu") => {
  if (!product) {
    return {
      price: 0,
      special_price: 0,
      effectivePrice: 0,
      discountPercentage: 0,
      saveAmount: 0,
      showDiscount: false,
      inStock: false,
      stock: 0,
      isUnilet: false,
    };
  }

  const isKarnataka = region === "karnataka";
  const activeOwner = isKarnataka && ownerProduct && ownerProduct.is_active ? ownerProduct : null;

  if (activeOwner && showUniletPriceToOrder()) {
    const mrp = Number(activeOwner.price) || Number(product.price) || 0;
    const offerPrice =
      Number(activeOwner.offer_price) > 0
        ? Number(activeOwner.offer_price)
        : Number(activeOwner.price) > 0
        ? Number(activeOwner.price)
        : Number(product.special_price) || Number(product.price) || 0;

    const effectivePrice = offerPrice > 0 ? offerPrice : mrp;
    const { discountPercent: discountPercentage, showDiscount } = getDiscountInfo(mrp, effectivePrice);
    const saveAmount = showDiscount ? mrp - effectivePrice : 0;
    const stock = Number(activeOwner.stock) || 0;
    const inStock = stock > 0 && activeOwner.stock_status !== "Out of Stock";

    return {
      price: mrp,
      special_price: offerPrice < mrp ? offerPrice : 0,
      effectivePrice,
      discountPercentage,
      saveAmount,
      showDiscount,
      inStock,
      stock,
      isUnilet: true,
      deliveryDays: activeOwner.delivery_days || 1,
    };
  }

  const mrp = Number(product.price) || 0;
  const specialPrice = Number(product.special_price) || 0;
  const effectivePrice = specialPrice > 0 && specialPrice < mrp ? specialPrice : mrp;
  const { discountPercent: discountPercentage, showDiscount } = getDiscountInfo(mrp, effectivePrice);
  const saveAmount = showDiscount ? mrp - effectivePrice : 0;
  const ownerStock = activeOwner ? Number(activeOwner.stock) || 0 : null;
  const stock = ownerStock !== null ? ownerStock : Number(product.quantity) || 0;
  const inStock = activeOwner
    ? stock > 0 && activeOwner.stock_status !== "Out of Stock"
    : (stock > 0 || product.movement === "CUS-Order") &&
      product.stock_status !== "Out of Stock";

  return {
    price: mrp,
    special_price: specialPrice,
    effectivePrice,
    discountPercentage,
    saveAmount,
    showDiscount,
    inStock,
    stock,
    isUnilet: false,
    deliveryDays: activeOwner?.delivery_days || 2,
  };
};

export function readRequestRegion(request) {
  const url = request?.url ? new URL(request.url) : null;
  const raw =
    url?.searchParams.get("region") ||
    url?.searchParams.get("state") ||
    request?.cookies?.get?.("sathya_location")?.value ||
    "";
  if (!raw) return "tamilnadu";

  let value = raw;
  try {
    if (value.startsWith("%")) value = decodeURIComponent(value);
    if (value.startsWith("{")) {
      const parsed = JSON.parse(value);
      return normalizeRegion(parsed.region || parsed.state || parsed.stateName) || "tamilnadu";
    }
  } catch {
    // use the raw value below
  }
  return normalizeRegion(value) || "tamilnadu";
}

/** Replaces catalog price fields when Karnataka should use the owner-product price. */
export async function applyRegionPrices(products, region = "tamilnadu") {
  if (!Array.isArray(products) || products.length === 0) return products;
  const list = products.map((product) => (product?.toObject ? product.toObject() : product));
  if (region !== "karnataka" || !showUniletPriceToOrder()) return list;

  const ids = list.map((product) => product?._id).filter(Boolean);
  const codes = list.map((product) => product?.item_code).filter(Boolean);
  if (!ids.length && !codes.length) return list;
  const owners = await OwnerProduct.find({
    is_active: true,
    $or: [
      ...(ids.length ? [{ product_id: { $in: ids } }] : []),
      ...(codes.length ? [{ product_item_code: { $in: codes } }] : []),
    ],
  }).lean();

  const byProductId = new Map();
  const byCode = new Map();
  for (const owner of owners) {
    if (owner.product_id) byProductId.set(String(owner.product_id), owner);
    if (owner.product_item_code) byCode.set(String(owner.product_item_code), owner);
  }

  return list.map((product) => {
    const owner =
      byProductId.get(String(product?._id)) ||
      (product?.item_code ? byCode.get(String(product.item_code)) : null);
    const priceInfo = resolveProductPrice(product, owner, region);
    return {
      ...product,
      price: priceInfo.price,
      special_price: priceInfo.special_price,
      isUnilet: priceInfo.isUnilet,
    };
  });
}

