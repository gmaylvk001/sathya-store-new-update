import Category from "@/models/ecom_category_info";
import ComboOffer from "@/models/comboOffer";
import Product from "@/models/product";
import md5 from "md5";
import { isComboStorefrontVisible, syncComboLifecycleStatus } from "./expiryEngine";
import { resolveStockStatus } from "./stockEngine";

export const COMBO_CATEGORY_NAME = "Combo Offers";
export const COMBO_CATEGORY_SLUG = "combo-offers";

function convertSlug(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

/**
 * Ensure root "Combo Offers" category exists. Returns category doc.
 */
export async function ensureComboOffersCategory() {
  let cat = await Category.findOne({
    $or: [
      { category_slug: COMBO_CATEGORY_SLUG },
      { category_name: COMBO_CATEGORY_NAME },
    ],
  });

  if (cat) return cat;

  const slug = COMBO_CATEGORY_SLUG || convertSlug(COMBO_CATEGORY_NAME);
  cat = await Category.create({
    category_name: COMBO_CATEGORY_NAME,
    category_slug: slug,
    md5_cat_name: md5(slug),
    parentid: "none",
    parentid_new: "none",
    status: "Inactive",
    meta_title: "Combo Offers",
    meta_description: "Exclusive AI-powered combo offers and bundles",
    meta_keyword: "combo offers, bundles, deals",
    position: 0,
  });

  return cat;
}

/**
 * Sync lifecycle statuses, linked products, then show/hide Combo Offers category
 * based on whether ≥1 combo is storefront-visible.
 */
export async function syncComboCategoryVisibility() {
  const now = new Date();
  const combos = await ComboOffer.find({
    status: { $ne: "draft" },
  });

  for (const combo of combos) {
    const next = syncComboLifecycleStatus(combo, now);
    if (combo.status !== next) {
      combo.status = next;
      await combo.save();
    }

    if (combo.productId) {
      const stock = resolveStockStatus(combo.comboStock);
      const visible = isComboStorefrontVisible(combo, now);
      await Product.findByIdAndUpdate(combo.productId, {
        $set: {
          quantity: stock.quantity,
          stock_status: stock.stock_status,
          status: visible ? "Active" : "Inactive",
          updatedAt: now,
        },
      });
    }
  }

  const all = await ComboOffer.find({ productId: { $ne: null } }).lean();
  const hasVisible = all.some((c) => isComboStorefrontVisible(c, now));

  const cat = await ensureComboOffersCategory();
  const desired = hasVisible ? "Active" : "Inactive";
  if (cat.status !== desired) {
    cat.status = desired;
    cat.updatedAt = new Date();
    await cat.save();
  }

  return {
    categoryId: cat._id,
    categoryStatus: desired,
    visibleCombos: all.filter((c) => isComboStorefrontVisible(c, now)).length,
  };
}

/**
 * Filter category list for nav APIs — drop Combo Offers when Inactive
 * or when explicitly empty (status already handles Inactive).
 */
export function filterCategoriesForNav(categories = []) {
  return (categories || []).filter((cat) => {
    if (cat.status !== "Active") return false;
    return true;
  });
}
