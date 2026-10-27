/**
 * Helper utilities for Checkout Store Pickup Dropdown Search & District Filter
 * Provides district extraction, combined search/district filtering, predictable sorting,
 * and district count aggregation.
 */

// Comprehensive dictionary mapping town, city, area keywords to canonical district names
export const KNOWN_TOWNS_TO_DISTRICT = {
  // ── Tamil Nadu Districts & Towns ──
  madurai: 'Madurai',
  iyerbanglow: 'Madurai',
  sellur: 'Madurai',
  goripalayam: 'Madurai',
  mattuthavani: 'Madurai',
  simmakkal: 'Madurai',
  othakadai: 'Madurai',
  tirumangalam: 'Madurai',
  melur: 'Madurai',
  usilampatti: 'Madurai',

  chennai: 'Chennai',
  chromepet: 'Chennai',
  padi: 'Chennai',
  omr: 'Chennai',
  neelankarai: 'Chennai',
  washermenpet: 'Chennai',
  oldwashermenpet: 'Chennai',
  tambaram: 'Chennai',
  porur: 'Chennai',
  guindy: 'Chennai',
  velachery: 'Chennai',
  annanagar: 'Chennai',
  tnagar: 'Chennai',
  ambattur: 'Chennai',
  avadi: 'Chennai',
  perambur: 'Chennai',
  mylapore: 'Chennai',
  vadapalani: 'Chennai',
  medavakkam: 'Chennai',
  sholinganallur: 'Chennai',
  alwarpet: 'Chennai',
  adyar: 'Chennai',
  kilpauk: 'Chennai',
  royapettah: 'Chennai',
  triplicane: 'Chennai',

  coimbatore: 'Coimbatore',
  singanallur: 'Coimbatore',
  vadavalli: 'Coimbatore',
  annur: 'Coimbatore',
  goundermills: 'Coimbatore',
  tatabad: 'Coimbatore',
  mettupalayam: 'Coimbatore',
  pollachi: 'Coimbatore',
  sundarapuram: 'Coimbatore',
  kuniyamuthur: 'Coimbatore',
  saravanampatti: 'Coimbatore',
  gandhipuram: 'Coimbatore',
  sulur: 'Coimbatore',

  tiruchirapalli: 'Tiruchirappalli',
  tiruchirappalli: 'Tiruchirappalli',
  trichy: 'Tiruchirappalli',
  kattur: 'Tiruchirappalli',
  srirangam: 'Tiruchirappalli',
  thennur: 'Tiruchirappalli',
  ariyamangalam: 'Tiruchirappalli',
  tollgate: 'Tiruchirappalli',
  thillainagar: 'Tiruchirappalli',

  salem: 'Salem',
  meyyanur: 'Salem',
  annapark: 'Salem',
  dadagapatti: 'Salem',
  gugai: 'Salem',
  attur: 'Salem',
  omalur: 'Salem',
  mettur: 'Salem',
  edappadi: 'Salem',

  thanjavur: 'Thanjavur',
  kumbakonam: 'Thanjavur',
  pattukkottai: 'Thanjavur',
  thiruvaiyaru: 'Thanjavur',

  cuddalore: 'Cuddalore',
  virudhachalam: 'Cuddalore',
  vriddhachalam: 'Cuddalore',
  chidambaram: 'Cuddalore',
  neyveli: 'Cuddalore',
  panruti: 'Cuddalore',
  vadakuthu: 'Cuddalore',

  sivaganga: 'Sivaganga',
  sivagangai: 'Sivaganga',
  karaikudi: 'Sivaganga',
  devakottai: 'Sivaganga',
  manamadurai: 'Sivaganga',

  dharmapuri: 'Dharmapuri',
  kariamangalam: 'Dharmapuri',
  harur: 'Dharmapuri',
  palacode: 'Dharmapuri',

  viluppuram: 'Viluppuram',
  villupuram: 'Viluppuram',
  senji: 'Viluppuram',
  gingee: 'Viluppuram',
  tindivanam: 'Viluppuram',

  kallakurichi: 'Kallakurichi',
  ulundurpet: 'Kallakurichi',

  krishnagiri: 'Krishnagiri',
  hosur: 'Krishnagiri',
  pochampalli: 'Krishnagiri',

  namakkal: 'Namakkal',
  komarapalyam: 'Namakkal',
  komarapalayam: 'Namakkal',
  tiruchengode: 'Namakkal',
  rasipuram: 'Namakkal',
  paramathi: 'Namakkal',

  erode: 'Erode',
  sathyamangalam: 'Erode',
  gobichettipalayam: 'Erode',
  anthiyur: 'Erode',
  puliampatti: 'Erode',
  perundurai: 'Erode',
  bhavani: 'Erode',

  tiruppur: 'Tiruppur',
  tirupur: 'Tiruppur',
  avinashi: 'Tiruppur',
  palladam: 'Tiruppur',
  dharapuram: 'Tiruppur',
  udumalpet: 'Tiruppur',
  udumalaipettai: 'Tiruppur',
  vellakoil: 'Tiruppur',
  kangeyam: 'Tiruppur',

  dindigul: 'Dindigul',
  palani: 'Dindigul',
  kodaikanal: 'Dindigul',
  oddanchatram: 'Dindigul',

  theni: 'Theni',
  periyakulam: 'Theni',
  bodinayakanur: 'Theni',
  bodinayakkanur: 'Theni',
  bodi: 'Theni',
  cumbum: 'Theni',
  chinnamanur: 'Theni',
  andipatti: 'Theni',
  kombai: 'Theni',
  uthamapalayam: 'Theni',
  devadanapatti: 'Theni',

  tirunelveli: 'Tirunelveli',
  palayamkottai: 'Tirunelveli',
  ambasamudram: 'Tirunelveli',

  thoothukudi: 'Thoothukudi',
  tuticorin: 'Thoothukudi',
  kovilpatti: 'Thoothukudi',
  tiruchendur: 'Thoothukudi',

  virudhunagar: 'Virudhunagar',
  sivakasi: 'Virudhunagar',
  rajapalayam: 'Virudhunagar',
  aruppukkottai: 'Virudhunagar',
  srivilliputhur: 'Virudhunagar',

  vellore: 'Vellore',
  katpadi: 'Vellore',
  gudiyatham: 'Vellore',

  ranipet: 'Ranipet',
  tirupathur: 'Tirupathur',
  ambur: 'Tirupathur',
  vaniyambadi: 'Tirupathur',

  tiruvannamalai: 'Tiruvannamalai',
  polur: 'Tiruvannamalai',
  arani: 'Tiruvannamalai',

  kanchipuram: 'Kanchipuram',
  chengalpattu: 'Chengalpattu',
  maraimalainagar: 'Chengalpattu',

  tiruvallur: 'Tiruvallur',
  thiruvallur: 'Tiruvallur',
  ponneri: 'Tiruvallur',

  kanyakumari: 'Kanyakumari',
  nagercoil: 'Kanyakumari',
  marthandam: 'Kanyakumari',

  karur: 'Karur',
  kulithalai: 'Karur',

  pudukkottai: 'Pudukkottai',
  aranthangi: 'Pudukkottai',

  ramanathapuram: 'Ramanathapuram',
  ramnad: 'Ramanathapuram',
  paramakudi: 'Ramanathapuram',

  nagapattinam: 'Nagapattinam',
  velankanni: 'Nagapattinam',

  tiruvarur: 'Tiruvarur',
  thiruvarur: 'Tiruvarur',
  mannargudi: 'Tiruvarur',

  mayiladuthurai: 'Mayiladuthurai',
  sirkazhi: 'Mayiladuthurai',

  ariyalur: 'Ariyalur',
  perambalur: 'Perambalur',
  nilgiris: 'Nilgiris',
  ooty: 'Nilgiris',
  coonoor: 'Nilgiris',
  tenkasi: 'Tenkasi',
  sankarankovil: 'Tenkasi',

  // ── Kerala Districts & Towns ──
  kozhikode: 'Kozhikode',
  calicut: 'Kozhikode',
  kollam: 'Kollam',
  punalur: 'Kollam',
  kochi: 'Ernakulam',
  ernakulam: 'Ernakulam',
  thiruvananthapuram: 'Thiruvananthapuram',
  trivandrum: 'Thiruvananthapuram',
  thrissur: 'Thrissur',
  palakkad: 'Palakkad',
  kannur: 'Kannur',
  malappuram: 'Malappuram',
  kottayam: 'Kottayam',
  alappuzha: 'Alappuzha',
  kasaragod: 'Kasaragod',
  wayanad: 'Wayanad',
  idukki: 'Idukki',
  pathanamthitta: 'Pathanamthitta',

  // ── Andhra Pradesh Districts & Towns ──
  nuzvidu: 'Eluru',
  eluru: 'Eluru',
  kadiri: 'Sri Sathya Sai',
  tuni: 'Kakinada',
  kakinada: 'Kakinada',
  narsapur: 'West Godavari',
  kavali: 'Nellore',
  nellore: 'Nellore',
  vijayawada: 'NTR',
  guntur: 'Guntur',
  visakhapatnam: 'Visakhapatnam',
  tirupati: 'Tirupati',
  kurnool: 'Kurnool',
  anantapur: 'Anantapur',
  kadapa: 'YSR Kadapa',
  rajahmundry: 'East Godavari',
  ongole: 'Prakasam',
  chittoor: 'Chittoor',
  srikakulam: 'Srikakulam',
  vizianagaram: 'Vizianagaram',
  hyderabad: 'Hyderabad',
  secunderabad: 'Hyderabad',
  warangal: 'Warangal',

  // ── Karnataka Districts & Towns ──
  bengaluru: 'Bengaluru',
  bangalore: 'Bengaluru',
  mysuru: 'Mysuru',
  mysore: 'Mysuru',
  mangaluru: 'Dakshina Kannada',
  mangalore: 'Dakshina Kannada',
  hubballi: 'Dharwad',
  hubli: 'Dharwad',
  belagavi: 'Belagavi',
  davangere: 'Davangere',
  ballari: 'Ballari',
  shivamogga: 'Shivamogga',
  tumakuru: 'Tumakuru',
  udupi: 'Udupi'
};

/**
 * Extracts and normalizes the canonical district name for a store.
 * Strict priority order:
 * 1. Direct store.district field
 * 2. Direct store.city checked against known towns/districts dictionary
 * 3. Authoritative 6-digit Indian PIN code prefix
 * 4. store.service_area / store.location keywords
 * 5. store.title / organisation_name keywords
 * 6. Address word tokens
 * 7. Clean store.city formatted
 */
export function getStoreDistrict(store) {
  if (!store || typeof store !== 'object') return 'Other';

  // 1. Direct district field if already set
  if (store.district && typeof store.district === 'string' && store.district.trim()) {
    const rawDist = store.district.trim();
    const cleanDist = rawDist.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (KNOWN_TOWNS_TO_DISTRICT[cleanDist]) {
      return KNOWN_TOWNS_TO_DISTRICT[cleanDist];
    }
    return rawDist.charAt(0).toUpperCase() + rawDist.slice(1);
  }

  // 2. Direct store.city check against known district / town mapping
  if (store.city && typeof store.city === 'string' && store.city.trim()) {
    const rawCity = store.city.trim();
    const cleanCity = rawCity.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (KNOWN_TOWNS_TO_DISTRICT[cleanCity]) {
      return KNOWN_TOWNS_TO_DISTRICT[cleanCity];
    }
    return rawCity.charAt(0).toUpperCase() + rawCity.slice(1);
  }

  // 3. Fallback: Parse store.address backwards to get destination city/district, avoiding street names like "Madurai Road"
  if (store.address && typeof store.address === 'string') {
    const tokens = store.address.toLowerCase().split(/[\s,.-]+/).filter(Boolean);
    const roadIndicators = new Set(['road', 'rd', 'street', 'st', 'highway', 'hwy', 'salai', 'bypass', 'lane']);
    for (let i = tokens.length - 1; i >= 0; i--) {
      const cleanToken = tokens[i].replace(/[^a-z0-9]/g, '');
      const nextToken = i < tokens.length - 1 ? tokens[i + 1].replace(/[^a-z0-9]/g, '') : '';
      if (roadIndicators.has(nextToken)) {
        continue; // Skip street/road names like "Madurai Road"
      }
      if (cleanToken && KNOWN_TOWNS_TO_DISTRICT[cleanToken]) {
        return KNOWN_TOWNS_TO_DISTRICT[cleanToken];
      }
    }
  }

  // 4. Pincode prefix check with accurate district boundaries (Theni vs Madurai)
  const pinRaw = String(store.zipcode || store.pincode || store.zip || store.address || '');
  const pinMatch = pinRaw.match(/\b(6\d{5}|5\d{5})\b/);
  if (pinMatch) {
    const pin = parseInt(pinMatch[1], 10);
    // Theni district pincodes (625512 - 625533, 625562, 625579, 625601 - 625605)
    if ((pin >= 625512 && pin <= 625533) || pin === 625562 || pin === 625579 || (pin >= 625601 && pin <= 625605)) {
      return 'Theni';
    }
    const p3 = Math.floor(pin / 1000);
    if (p3 === 628) return 'Thoothukudi';
    if (p3 === 627) return 'Tirunelveli';
    if (p3 === 625) return 'Madurai';
    if (p3 >= 600 && p3 <= 603) return 'Chennai';
    if (p3 === 641 || p3 === 642) return 'Coimbatore';
    if (p3 === 620 || p3 === 621) return 'Tiruchirappalli';
    if (p3 === 636) return 'Salem';
    if (p3 === 638) return 'Erode';
    if (p3 === 637) return 'Namakkal';
    if (p3 === 624) return 'Dindigul';
    if (p3 >= 612 && p3 <= 614) return 'Thanjavur';
    if (p3 === 635) return 'Krishnagiri';
    if (p3 === 607 || p3 === 608) return 'Cuddalore';
    if (p3 === 605 || p3 === 606) return 'Viluppuram';
    if (p3 === 622) return 'Pudukkottai';
    if (p3 === 626) return 'Virudhunagar';
    if (p3 === 629) return 'Kanyakumari';
    if (p3 === 630) return 'Sivaganga';
    if (p3 === 639) return 'Karur';
    if (p3 === 673) return 'Kozhikode';
    if (p3 === 691) return 'Kollam';
    if (p3 === 682) return 'Ernakulam';
    if (p3 >= 560 && p3 <= 591) return 'Bengaluru';
  }

  // 5. Scan store.service_area or store.location
  const locFields = [store.service_area, store.location].filter(Boolean).join(' ');
  if (locFields) {
    const cleanLoc = locFields.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [key, dist] of Object.entries(KNOWN_TOWNS_TO_DISTRICT)) {
      if (cleanLoc.includes(key)) {
        return dist;
      }
    }
  }

  // 6. Scan store.title / organisation_name
  if (store.title || store.organisation_name) {
    const cleanTitle = String(store.title || store.organisation_name).toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [key, dist] of Object.entries(KNOWN_TOWNS_TO_DISTRICT)) {
      if (cleanTitle.includes(key)) {
        return dist;
      }
    }
  }

  // 7. Fallback to clean store.city if present
  if (store.city && typeof store.city === 'string' && store.city.trim()) {
    const c = store.city.trim();
    return c.charAt(0).toUpperCase() + c.slice(1);
  }

  return 'Other';
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
    const nameA = String(a.title || a.organisation_name || '').toLowerCase();
    const nameB = String(b.title || b.organisation_name || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

/**
 * Filters stores using strict district matching and search query compound evaluation.
 * Evaluates District match AND search query match.
 */
export function filterStores(stores, { district = 'all', searchQuery = '' } = {}) {
  if (!Array.isArray(stores)) return [];
  const q = String(searchQuery || '').trim().toLowerCase();
  const selectedDist = String(district || 'all').trim().toLowerCase();

  return stores.filter((store) => {
    if (!store || typeof store !== 'object') return false;

    // 1. Strict District Filter (EXACT match against store.district only)
    if (selectedDist !== 'all') {
      const storeDistrict = getStoreDistrict(store).trim().toLowerCase();
      if (storeDistrict !== selectedDist) {
        return false;
      }
    }

    // 2. Search Query Filter: checks ONLY store.name, store.address, store.city
    if (q) {
      const title = String(store.title || store.organisation_name || store.name || store.store_name || '').toLowerCase();
      const city = String(store.city || '').toLowerCase();
      const address = String(store.address || store.location || '').toLowerCase();

      const matches = title.includes(q) || city.includes(q) || address.includes(q);
      if (!matches) return false;
    }

    return true;
  });
}

/**
 * Aggregates unique districts with their store counts, sorted alphabetically.
 */
export function getDistrictsWithCounts(stores) {
  if (!Array.isArray(stores)) return [];
  const counts = {};
  stores.forEach((store) => {
    const d = getStoreDistrict(store);
    counts[d] = (counts[d] || 0) + 1;
  });
  return Object.keys(counts)
    .sort((a, b) => a.localeCompare(b))
    .map((district) => ({
      name: district,
      count: counts[district],
    }));
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

