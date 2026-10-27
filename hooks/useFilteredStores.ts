import { useMemo } from 'react';

/**
 * Shape of a Store object in the system
 */
export interface Store {
  _id?: string | number;
  id?: string | number;
  organisation_name?: string;
  title?: string;
  name?: string;
  store_name?: string;
  city?: string;
  district?: string;
  address?: string;
  location?: string;
  service_area?: string;
  zipcode?: string | number;
  branch_code?: string;
  location_id?: string;
  slug?: string;
  status?: string;
  [key: string]: any;
}

/**
 * Result returned by the useFilteredStores custom hook
 */
export interface UseFilteredStoresResult<T extends Store = Store> {
  filteredStores: T[];
  isFallback: boolean;
  hasMatches: boolean;
  userDistrict: string;
  fallbackMessage: string | null;
  statusMessage: string | null;
  [Symbol.iterator](): Generator<T[] | boolean | string | null, void, unknown>;
}

/**
 * useFilteredStores
 *
 * Isolated custom hook to filter stores based on user's current district (or city).
 * Performs case-insensitive matching across:
 * - store.district
 * - store.city
 * - store.address
 * - store.name / organisation_name / title / store_name
 *
 * If no stores match the district, it safely falls back to returning all stores
 * and sets `isFallback: true` with a descriptive `fallbackMessage` ("No stores found in [District]")
 * to prevent breaking the UI.
 *
 * @param stores - Array of all store items
 * @param userDistrict - Detected district (e.g., "Madurai", "Coimbatore")
 * @returns {UseFilteredStoresResult<T>} - Memoized result containing filtered stores and fallback state
 */
export function useFilteredStores<T extends Store = Store>(
  stores: T[] = [],
  userDistrict?: string | null
): UseFilteredStoresResult<T> {
  return useMemo(() => {
    const safeStores = Array.isArray(stores) ? stores : [];
    const rawDistrict = (userDistrict || '').toString().trim();

    // If no user district is specified, return all stores without fallback flag
    if (!rawDistrict) {
      const emptyResult: UseFilteredStoresResult<T> = {
        filteredStores: safeStores,
        isFallback: false,
        hasMatches: safeStores.length > 0,
        userDistrict: '',
        fallbackMessage: null,
        statusMessage: null,
        *[Symbol.iterator]() {
          yield safeStores;
          yield false;
          yield null;
        },
      };
      return emptyResult;
    }

    const normalizedDistrict = rawDistrict.toLowerCase();
    const capitalizedDistrict =
      rawDistrict.charAt(0).toUpperCase() + rawDistrict.slice(1);

    // Filter stores matching district, city, address, or name case-insensitively
    const matches = safeStores.filter((store) => {
      if (!store || typeof store !== 'object') return false;

      // 1. Match district field
      if (
        store.district &&
        typeof store.district === 'string' &&
        store.district.toLowerCase().includes(normalizedDistrict)
      ) {
        return true;
      }

      // 2. Match city field (e.g., "Madurai" <-> "madurai")
      if (
        store.city &&
        typeof store.city === 'string' &&
        (store.city.toLowerCase().includes(normalizedDistrict) ||
          normalizedDistrict.includes(store.city.toLowerCase()))
      ) {
        return true;
      }

      // 3. Match address field
      if (
        store.address &&
        typeof store.address === 'string' &&
        store.address.toLowerCase().includes(normalizedDistrict)
      ) {
        return true;
      }

      // 4. Match store name / title / organisation_name
      const storeName =
        store.name ||
        store.organisation_name ||
        store.title ||
        store.store_name ||
        '';
      if (
        typeof storeName === 'string' &&
        storeName.toLowerCase().includes(normalizedDistrict)
      ) {
        return true;
      }

      // 5. Match location or service_area if present
      const storeLocation = store.location || store.service_area || '';
      if (
        typeof storeLocation === 'string' &&
        storeLocation.toLowerCase().includes(normalizedDistrict)
      ) {
        return true;
      }

      return false;
    });

    const hasMatches = matches.length > 0;
    // Fallback applies when user specified a district but 0 stores matched
    const isFallback = !hasMatches && safeStores.length > 0;
    const fallbackMessage = isFallback
      ? `No stores found in ${capitalizedDistrict}`
      : null;

    const finalStores = hasMatches ? matches : safeStores;

    const result: UseFilteredStoresResult<T> = {
      filteredStores: finalStores,
      isFallback,
      hasMatches,
      userDistrict: capitalizedDistrict,
      fallbackMessage,
      statusMessage: fallbackMessage,
      *[Symbol.iterator]() {
        yield finalStores;
        yield isFallback;
        yield fallbackMessage;
      },
    };

    return result;
  }, [stores, userDistrict]);
}

export default useFilteredStores;
