/**
 * Calculates Great-Circle / Haversine distance between two geographic coordinates in kilometers.
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined ||
    lat1 === null ||
    lon1 === null ||
    lat2 === null ||
    lon2 === null
  ) {
    return Infinity;
  }

  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);

  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) {
    return Infinity;
  }

  const R = 6371; // Radius of the Earth in km
  const dLat = ((nLat2 - nLat1) * Math.PI) / 180;
  const dLon = ((nLon2 - nLon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((nLat1 * Math.PI) / 180) *
      Math.cos((nLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Calculates delivery days based on distance from store/warehouse, matching Laravel formula:
 * days = ceil(min_distance / (kilometers / days))
 */
export const calculateDeliveryDays = (
  minDistanceKm,
  kmPerDay = 100,
  baseDays = 1
) => {
  if (!minDistanceKm || minDistanceKm <= 0) {
    return 1;
  }
  const speed = kmPerDay / baseDays;
  const computedDays = Math.ceil(minDistanceKm / speed);
  return Math.max(1, Math.min(computedDays, 7));
};

/**
 * Formats delivery message string
 */
export const formatDeliveryMessage = (days, isExactStoreMatch = false) => {
  if (isExactStoreMatch || days <= 1) {
    return "Delivery in One Day";
  }
  return `Delivery in ${days} Days`;
};
