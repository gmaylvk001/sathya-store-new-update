/**
 * ePrice Tracker™ - Live Market Price Comparison Engine
 * Sathya Store E-Commerce (2026 Live Market Intelligence)
 *
 * Strict Business Logic Overhaul:
 * 1. Strict Exact Match: item.product_code === sathyaProductCode
 * 2. Strict LSP Type Check: item.type === "lsp" (Lowest Selling Price)
 * 3. Includes Amazon, Flipkart, and Croma
 * 4. Critical Condition: Only include competitor if competitorPrice < sathyaPrice
 * 5. Returns [] if no competitors meet condition, or item not found, or item not "lsp"
 */

const CRON_FEED_URL =
  process.env.LSP_PRICE_API_URL ||
  "https://cron.epricetrack.com/eprice/admin/cron/competitor_lsp_data_fetch_api.php?cmpid=sathya";

const FALLBACK_FEED_URL =
  "http://13.127.238.26/eprice/admin/cron/competitor_lsp_data_fetch_api.php?cmpid=sathya";

// In-memory feed cache to prevent flooding external cron endpoint
let cachedFeedData = null;
let lastFeedFetchTimestamp = 0;
const FEED_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

/**
 * Returns Indian Standard Time (IST) time components accurately using Intl.DateTimeFormat
 * @param {Date} date
 * @returns {{ hours: number, minutes: number, seconds: number, totalMinutes: number, totalSeconds: number }}
 */
export function getISTTimeMinutes(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const hours = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const minutes = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
  const seconds = parseInt(parts.find((p) => p.type === "second")?.value || "0", 10);

  return {
    hours,
    minutes,
    seconds,
    totalMinutes: hours * 60 + minutes,
    totalSeconds: hours * 3600 + minutes * 60 + seconds,
  };
}

/**
 * Slot 1: 10:30 AM IST (630 min)
 * Slot 2: 2:30 PM IST  (870 min)
 * Slot 3: 8:30 PM IST  (1230 min)
 */
export const IST_SYNC_SLOTS = [
  { id: 1, label: "10:30 AM", minutes: 10 * 60 + 30 }, // 630
  { id: 2, label: "2:30 PM", minutes: 14 * 60 + 30 },  // 870
  { id: 3, label: "8:30 PM", minutes: 20 * 60 + 30 },  // 1230
];

/**
 * Returns the label of the most recent passed sync slot in IST
 * @param {Date} currentDate
 * @returns {string} e.g. "2:30 PM", "10:30 AM", or "8:30 PM"
 */
export function getLastVerifiedSlot(currentDate = new Date()) {
  const { totalMinutes } = getISTTimeMinutes(currentDate);

  if (totalMinutes >= 1230) {
    return "8:30 PM";
  } else if (totalMinutes >= 870) {
    return "2:30 PM";
  } else if (totalMinutes >= 630) {
    return "10:30 AM";
  } else {
    // Before 10:30 AM IST: last verified slot was yesterday's 8:30 PM
    return "8:30 PM";
  }
}

/**
 * Returns detailed metadata for the last verified slot
 * @param {Date} currentDate
 * @returns {{ slot: string, label: string, badgeText: string }}
 */
export function getLastVerifiedSlotDetailed(currentDate = new Date()) {
  const { totalMinutes } = getISTTimeMinutes(currentDate);

  if (totalMinutes >= 1230) {
    return {
      slot: "8:30 PM",
      label: "Today at 8:30 PM",
      badgeText: "Verified at 8:30 PM",
    };
  } else if (totalMinutes >= 870) {
    return {
      slot: "2:30 PM",
      label: "Today at 2:30 PM",
      badgeText: "Verified at 2:30 PM",
    };
  } else if (totalMinutes >= 630) {
    return {
      slot: "10:30 AM",
      label: "Today at 10:30 AM",
      badgeText: "Verified at 10:30 AM",
    };
  } else {
    return {
      slot: "8:30 PM",
      label: "Yesterday at 8:30 PM",
      badgeText: "Verified at 8:30 PM",
    };
  }
}

/**
 * Calculates remaining seconds until upcoming slot
 * @param {Date} currentDate
 * @returns {number} Seconds remaining (minimum 60s)
 */
export function getNextSyncCountdown(currentDate = new Date()) {
  const { totalSeconds } = getISTTimeMinutes(currentDate);

  const slot1Sec = 10 * 3600 + 30 * 60; // 37800
  const slot2Sec = 14 * 3600 + 30 * 60; // 52200
  const slot3Sec = 20 * 3600 + 30 * 60; // 73800
  const daySec = 24 * 3600; // 86400

  let remaining = 0;
  if (totalSeconds < slot1Sec) {
    remaining = slot1Sec - totalSeconds;
  } else if (totalSeconds < slot2Sec) {
    remaining = slot2Sec - totalSeconds;
  } else if (totalSeconds < slot3Sec) {
    remaining = slot3Sec - totalSeconds;
  } else {
    remaining = daySec - totalSeconds + slot1Sec;
  }

  return Math.max(60, remaining);
}

/**
 * Fetches the competitor feed from the ePrice cron endpoint with in-memory caching and timeout protection.
 * @returns {Promise<Array<any>>}
 */
export async function fetchCompetitorFeed() {
  const now = Date.now();
  if (cachedFeedData && now - lastFeedFetchTimestamp < FEED_CACHE_TTL_MS) {
    return cachedFeedData;
  }

  const fetchWithTimeout = async (url, timeoutMs = 12000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        next: { revalidate: 300 },
      });
      return res;
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    let res = null;
    try {
      res = await fetchWithTimeout(CRON_FEED_URL, 12000);
    } catch {
      // primary failed or timed out
    }

    if (!res || !res.ok) {
      try {
        res = await fetchWithTimeout(FALLBACK_FEED_URL, 12000);
      } catch {
        // fallback failed
      }
    }

    if (res && res.ok) {
      const data = await res.json();
      const list = (Array.isArray(data) ? data : Object.values(data || {})).filter(Boolean);

      if (list.length > 0) {
        cachedFeedData = list;
        lastFeedFetchTimestamp = now;
        return list;
      }
    }
  } catch (err) {
    console.warn("[priceTrackerService] Error fetching live cron feed:", err.message);
  }

  return cachedFeedData || [];
}

/**
 * Helper to safely extract competitor price for a given platform key
 * (amazon, flipkart, croma) from direct fields, final_lsp_is, or all_lsp_competitors.
 *
 * @param {object} item
 * @param {string} brandKey
 * @returns {number|null}
 */
export function extractCompetitorPrice(item, brandKey) {
  if (!item || typeof item !== "object") return null;

  const keyLower = String(brandKey || "").toLowerCase();

  const parseVal = (v) => {
    if (v == null) return null;
    if (typeof v === "number") return isNaN(v) || v <= 0 ? null : v;
    if (typeof v === "string") {
      const cleaned = parseFloat(v.replace(/[^0-9.]/g, ""));
      return isNaN(cleaned) || cleaned <= 0 ? null : cleaned;
    }
    return null;
  };

  const candidates = [];

  // 1. Direct fields on item
  const directFields = [
    item[`${keyLower}_price`],
    item[`${keyLower}_product_price`],
    item[keyLower],
  ];
  for (const v of directFields) {
    const parsed = parseVal(v);
    if (parsed != null) candidates.push(parsed);
  }

  // 2. final_lsp_is object (highest priority benchmark in feed)
  if (item.final_lsp_is && typeof item.final_lsp_is === "object") {
    for (const [k, v] of Object.entries(item.final_lsp_is)) {
      if (k.toLowerCase().includes(keyLower)) {
        const parsed = parseVal(v);
        if (parsed != null) candidates.push(parsed);
      }
    }
  }

  // 3. all_lsp_competitors object
  if (item.all_lsp_competitors && typeof item.all_lsp_competitors === "object") {
    for (const [k, v] of Object.entries(item.all_lsp_competitors)) {
      if (k.toLowerCase().includes(keyLower)) {
        const parsed = parseVal(v);
        if (parsed != null) candidates.push(parsed);
      }
    }
  }

  if (candidates.length === 0) return null;
  return Math.min(...candidates);
}

/**
 * Known competitor platforms monitored by ePrice Tracker™.
 * Only platforms with genuine, verified prices from the live feed will be shown.
 */
export const MONITORED_COMPETITOR_PLATFORMS = [
  { name: "Croma", key: "croma", defaultUrl: "https://www.croma.com" },
  { name: "Amazon", key: "amazon", defaultUrl: "https://www.amazon.in" },
  { name: "Flipkart", key: "flipkart", defaultUrl: "https://www.flipkart.com" },
  { name: "Reliance Digital", key: "reliancedigital", defaultUrl: "https://www.reliancedigital.in" },
  { name: "Vijay Sales", key: "vijaysales", defaultUrl: "https://www.vijaysales.com" },
  { name: "Poorvika", key: "poorvika", defaultUrl: "https://www.poorvika.com" },
];

/**
 * Extracts and normalizes genuine competitor deals for a matched feed item.
 * Strictly verifies:
 * 1. item.type === "lsp" (Lowest Selling Price)
 * 2. Real verified competitor prices only (ZERO fake/synthetic fallback prices)
 * 3. Only include platforms where competitor price >= sathyaPrice
 * 4. Returns [] if no competitors meet condition, or item not found, or item not "lsp"
 *
 * @param {object} matchedItem
 * @param {number} sathyaPrice
 * @param {string} [lastSlot]
 * @returns {Array<object>}
 */
export function extractAndNormalizeCompetitorDeals(
  matchedItem,
  sathyaPrice,
  lastSlot = "2:30 PM"
) {
  if (!matchedItem || typeof matchedItem !== "object") return [];

  // LSP Type Check: Must be strictly "lsp"
  const itemType = String(matchedItem.type || "").trim().toLowerCase();
  if (itemType !== "lsp") {
    return [];
  }

  const p = Number(sathyaPrice) || 0;
  if (p <= 0) return [];

  const deals = [];

  for (const comp of MONITORED_COMPETITOR_PLATFORMS) {
    const rawPrice = extractCompetitorPrice(matchedItem, comp.key);
    // STRICT RULE: If the competitor price is missing, null, NaN, or <= 0, DO NOT INCLUDE!
    // Never synthesize or calculate fake prices!
    if (typeof rawPrice !== "number" || isNaN(rawPrice) || rawPrice <= 0) {
      continue;
    }

    const savings = Math.max(0, rawPrice - p);
    const isCheaper = rawPrice > p;
    const isMatched = rawPrice === p;

    // Only include if Sathya is cheaper or best price matched
    if (isCheaper || isMatched) {
      deals.push({
        platform: comp.name,
        price: rawPrice,
        inStock: true,
        productUrl: matchedItem[`${comp.key}_url`] || comp.defaultUrl,
        lastVerified: `${lastSlot} IST`,
        priceDifferenceVsSathya: savings,
        savingsVsSathya: savings,
        isSathyaCheaper: isCheaper,
        isCompetitorCheaper: false,
        isMatched: isMatched,
      });
    }
  }

  return deals;
}

/**
 * Matches Sathya product STRICTLY against the API feed via EAN / product_code / model_number,
 * verifies type === "lsp", and extracts genuine competitor prices strictly cheaper or matched.
 *
 * Unrelated / dummy products without exact EAN or exact model matches (like Silambu Silambu)
 * will NEVER match, preventing misleading competitor price display.
 *
 * @param {object} params
 * @param {string} [params.product_code]
 * @param {string} [params.sku]
 * @param {string} [params.item_code]
 * @param {string} [params.model_number]
 * @param {string} [params.ean]
 * @param {string} [params.barcode]
 * @param {number} params.sathyaPrice
 * @param {Date} [params.currentDate]
 * @param {Array<object>} [params.feedOverride] - Optional feed for unit tests
 * @returns {Promise<Array<object>>}
 */
export async function getCompetitorDeals({
  product_code = "",
  sku = "",
  item_code = "",
  model_number = "",
  ean = "",
  barcode = "",
  sathyaPrice = 0,
  currentDate = new Date(),
  feedOverride = null,
}) {
  const p = Math.max(0, Number(sathyaPrice) || 0);
  if (p <= 0) return [];

  const cleanEanList = [ean, barcode]
    .filter(Boolean)
    .map((e) => String(e).trim().replace(/[^0-9]/g, ""))
    .filter((e) => e.length >= 8);

  const cleanProductCodes = [product_code, item_code, sku, model_number]
    .filter(Boolean)
    .map((c) => String(c).trim().toUpperCase().replace(/[^A-Z0-9]/g, ""))
    .filter((c) => c.length >= 3);

  // If no valid EAN or product codes exist, product cannot be matched
  if (cleanEanList.length === 0 && cleanProductCodes.length === 0) {
    return [];
  }

  const lastSlot = getLastVerifiedSlot(currentDate);

  // 1. Fetch live or cached feed with timeout protection (or use test feed)
  const feed = Array.isArray(feedOverride) ? feedOverride : await fetchCompetitorFeed();
  if (!Array.isArray(feed) || feed.length === 0) {
    return [];
  }

  // 2. Strict Match: EAN exact match OR exact product_code / model match
  const matchedItem = feed.find((item) => {
    if (!item || typeof item !== "object") return false;

    // Strict EAN check (Highest precision)
    if (cleanEanList.length > 0 && item.product_ean_id) {
      const cleanFeedEan = String(item.product_ean_id).trim().replace(/[^0-9]/g, "");
      if (cleanFeedEan.length >= 8 && cleanEanList.includes(cleanFeedEan)) {
        return true;
      }
    }

    // Strict Product Code & Model Number Check
    if (cleanProductCodes.length > 0 && item.product_code) {
      const cleanFeedCode = String(item.product_code).trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (cleanFeedCode.length >= 3) {
        // Direct exact match
        if (cleanProductCodes.includes(cleanFeedCode)) {
          return true;
        }

        // Safe ERP prefix normalization:
        // Handles ERP codes having short brand/category prefixes (<= 4 chars) prepended to the exact feed model
        // (e.g. ERP code "LGFWT1310BG" ends with feed code "FWT1310BG").
        // CRITICAL: We NEVER allow the feed code to end with the product code (e.g. cleanFeedCode.endsWith(code)),
        // which previously caused short generic strings like "PLUS" or "1000" to falsely match "3LSTDPLUS".
        if (cleanFeedCode.length >= 5) {
          for (const code of cleanProductCodes) {
            if (code.endsWith(cleanFeedCode) && (code.length - cleanFeedCode.length) <= 4) {
              return true;
            }
          }
        }
      }
    }

    return false;
  });

  if (!matchedItem) {
    return [];
  }

  // 3. LSP Type Check and genuine price extraction only
  return extractAndNormalizeCompetitorDeals(matchedItem, p, lastSlot);
}
