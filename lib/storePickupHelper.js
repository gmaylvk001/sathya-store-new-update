/**
 * Helper utilities for Checkout Store Pickup Dropdown Search & District Filter
 * Delegates canonical district resolution and strict district isolation to lib/storeDistrictHelper.js.
 */

import {
  getCanonicalDistrict,
  KNOWN_TOWNS_TO_DISTRICT,
  filterStoresStrict,
  getDistrictsWithStoreCounts,
  isStoreInDistrict,
} from './storeDistrictHelper.js';

export {
  getCanonicalDistrict,
  KNOWN_TOWNS_TO_DISTRICT,
  filterStoresStrict,
  getDistrictsWithStoreCounts,
  isStoreInDistrict,
};

/**
 * Extracts and normalizes the canonical district name for a store.
 * Delegates to getCanonicalDistrict.
 */
export function getStoreDistrict(store) {
  return getCanonicalDistrict(store);
}

/**
 * Deterministically sorts stores first by District name (alphabetical), then by Store Title/Name (alphabetical).
 */
export function sortStoresByDistrictAndName(stores) {
  if (!Array.isArray(stores)) return [];
  return [...stores].sort((a, b) => {
    const distA = getStoreDistrict(a).toLowerCase();
    const distB = getStoreDistrict(b).toLowerCase();
    if (distA !== distB) {
      return distA.localeCompare(distB);
    }
    const nameA = String(a.title || a.organisation_name || a.name || '').toLowerCase();
    const nameB = String(b.title || b.organisation_name || b.name || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

/**
 * Filters stores using strict district matching and isolated search query evaluation.
 */
export function filterStores(stores, { district = 'all', searchQuery = '' } = {}) {
  return filterStoresStrict(stores, {
    selectedDistrict: district,
    searchQuery,
  });
}

/**
 * Aggregates unique districts with their store counts, sorted alphabetically.
 */
export function getDistrictsWithCounts(stores) {
  return getDistrictsWithStoreCounts(stores);
}

/**
 * Sanitizes phone numbers, stripping invalid values like 'NULL', 'null', 'undefined', 'N/A'.
 * Returns sanitized string or null.
 */
export function formatStorePhone(phone) {
  if (!phone) return null;
  const str = String(phone).trim();
  if (
    !str ||
    str.toLowerCase() === 'null' ||
    str.toLowerCase() === 'undefined' ||
    str.toLowerCase() === 'n/a' ||
    str.toLowerCase() === 'none'
  ) {
    return null;
  }
  return /\d/.test(str) ? str : null;
}
