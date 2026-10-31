import ProductStore from "@/models/product_store";
import UProductStore from "@/models/u_product_store";
import StoreListing from "@/models/store_listings";
import { normalizeRegion } from "@/lib/regionHelper";

const RESERVED_STORE_KEYS = new Set(["_id", "__v", "item_code"]);

/** Exist is_WH: 2 = warehouse, 0 = showroom */
export const STORE_IS_WH_WAREHOUSE = 2;
export const STORE_IS_WH_SHOWROOM = 0;

let branchCodeCache = null;
let branchCodeCacheAt = 0;
const BRANCH_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Branch codes from store_listings grouped by warehouse vs showroom.
 * Cached briefly — listings rarely change per request burst.
 */
export async function getStoreBranchCodesByWh() {
  const now = Date.now();
  if (branchCodeCache && now - branchCodeCacheAt < BRANCH_CACHE_TTL_MS) {
    return branchCodeCache;
  }

  const listings = await StoreListing.find({
    branch_code: { $nin: [null, ""] },
  })
    .select("branch_code is_WH store_owner")
    .lean();

  const warehouse = [];
  const showroom = [];
  for (const row of listings) {
    const code = String(row.branch_code || "").trim();
    if (!code || RESERVED_STORE_KEYS.has(code)) continue;
    const isWh = Number(row.is_WH);
    if (isWh === STORE_IS_WH_WAREHOUSE) warehouse.push(code);
    else if (isWh === STORE_IS_WH_SHOWROOM) showroom.push(code);
  }

  branchCodeCache = { warehouse, showroom };
  branchCodeCacheAt = now;
  return branchCodeCache;
}

function toQty(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Sum qty on a product_store / u_product_store doc for the given branch codes. */
export function sumStoreQtyForBranches(storeDoc, branchCodes) {
  if (!storeDoc || !Array.isArray(branchCodes) || branchCodes.length === 0) return 0;
  let total = 0;
  for (const code of branchCodes) {
    if (!code || RESERVED_STORE_KEYS.has(code)) continue;
    total += toQty(storeDoc[code]);
  }
  return total;
}

/**
 * Exist ProductController $display_stock:
 *
 * chk_display_store_stock == 1 ?
 *   YES → check warehouse (is_WH=2) then showroom (is_WH=0)
 *         via product_store / u_product_store
 *         → 'yes' or 'no'
 *   NO  → 'no'
 * Karnataka → force 'no'
 *
 * 'yes' = least / display-store stock only (WH empty, showroom has qty)
 *         → enquiry popup path on PDP (wired in a later step)
 *
 * @param {object} opts
 * @param {string} [opts.itemCode]
 * @param {number|string|boolean} [opts.chkDisplayStoreStock] product.chk_display_store_stock
 * @param {string} [opts.region] tamilnadu | karnataka | …
 * @param {boolean} [opts.useUniletStore] use u_product_store instead of product_store
 * @returns {Promise<{ display_stock: 'yes'|'no', reason: string, warehouseQty: number, showroomQty: number }>}
 */
export async function resolveDisplayStock({
  itemCode,
  chkDisplayStoreStock,
  region = "tamilnadu",
  useUniletStore = false,
} = {}) {
  const normalizedRegion = normalizeRegion(region) || "tamilnadu";

  if (normalizedRegion === "karnataka") {
    return {
      display_stock: "no",
      reason: "karnataka",
      warehouseQty: 0,
      showroomQty: 0,
    };
  }

  if (Number(chkDisplayStoreStock) !== 1) {
    return {
      display_stock: "no",
      reason: "flag_off",
      warehouseQty: 0,
      showroomQty: 0,
    };
  }

  const code = String(itemCode || "").trim();
  if (!code) {
    return {
      display_stock: "no",
      reason: "no_item_code",
      warehouseQty: 0,
      showroomQty: 0,
    };
  }

  const StoreModel = useUniletStore ? UProductStore : ProductStore;
  const storeDoc = await StoreModel.findOne({ item_code: code }).lean();
  if (!storeDoc) {
    return {
      display_stock: "no",
      reason: "no_store_row",
      warehouseQty: 0,
      showroomQty: 0,
    };
  }

  const { warehouse, showroom } = await getStoreBranchCodesByWh();
  const warehouseQty = sumStoreQtyForBranches(storeDoc, warehouse);

  // Warehouse has stock → normal online path (not “least store stock”)
  if (warehouseQty > 0) {
    return {
      display_stock: "no",
      reason: "warehouse_has_stock",
      warehouseQty,
      showroomQty: 0,
    };
  }

  const showroomQty = sumStoreQtyForBranches(storeDoc, showroom);

  // WH empty + showroom has qty → Exist $display_stock = 'yes' (least / display store)
  if (showroomQty > 0) {
    return {
      display_stock: "yes",
      reason: "showroom_only",
      warehouseQty,
      showroomQty,
    };
  }

  return {
    display_stock: "no",
    reason: "no_wh_no_showroom",
    warehouseQty,
    showroomQty,
  };
}

/** Convenience: attach display_stock fields onto a product-shaped object. */
export async function attachDisplayStock(product, region = "tamilnadu") {
  if (!product) return product;

  const useUniletStore = Boolean(
    product.isUnilet ||
      String(product.store_owner || product.vendor || "").toLowerCase() === "unilet"
  );

  const result = await resolveDisplayStock({
    itemCode: product.item_code,
    chkDisplayStoreStock: product.chk_display_store_stock,
    region,
    useUniletStore,
  });

  return {
    ...product,
    display_stock: result.display_stock,
    display_stock_reason: result.reason,
    display_stock_warehouse_qty: result.warehouseQty,
    display_stock_showroom_qty: result.showroomQty,
  };
}
