import { getDiscountInfo } from "./discountHelper.js";

/**
 * Resolves product pricing and stock status based on region.
 * Karnataka users receive Unilet OwnerProduct prices and stock where available.
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

  if (isKarnataka && ownerProduct && ownerProduct.is_active) {
    const mrp = Number(ownerProduct.price) || Number(product.price) || 0;
    const offerPrice =
      Number(ownerProduct.offer_price) > 0
        ? Number(ownerProduct.offer_price)
        : Number(ownerProduct.price) > 0
        ? Number(ownerProduct.price)
        : Number(product.special_price) || Number(product.price) || 0;

    const effectivePrice = offerPrice > 0 ? offerPrice : mrp;
    const { discountPercent: discountPercentage, showDiscount } = getDiscountInfo(mrp, effectivePrice);
    const saveAmount = showDiscount ? mrp - effectivePrice : 0;
    const stock = Number(ownerProduct.stock) || 0;
    const inStock = stock > 0 && ownerProduct.stock_status !== "Out of Stock";

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
      deliveryDays: ownerProduct.delivery_days || 1,
    };
  }

  const mrp = Number(product.price) || 0;
  const specialPrice = Number(product.special_price) || 0;
  const effectivePrice = specialPrice > 0 && specialPrice < mrp ? specialPrice : mrp;
  const { discountPercent: discountPercentage, showDiscount } = getDiscountInfo(mrp, effectivePrice);
  const saveAmount = showDiscount ? mrp - effectivePrice : 0;
  const stock = Number(product.quantity) || 0;
  const inStock =
    (stock > 0 || product.movement === "CUS-Order") &&
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
    deliveryDays: 2,
  };
};

