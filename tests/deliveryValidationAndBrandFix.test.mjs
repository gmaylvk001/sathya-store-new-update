import test from "node:test";
import assert from "node:assert/strict";
import { normalizeProduct } from "../lib/normalizeProduct.js";
import {
  isValidPincode,
  isKarnatakaPincode,
  lookupPincode,
} from "../lib/regionHelper.js";
import {
  calculateHaversineDistance,
  calculateDeliveryDays,
  formatDeliveryMessage,
} from "../lib/distanceCalculator.js";

// ============================================================================
// RECENTLY VIEWED & STOREFRONT BRAND NORMALIZATION REGRESSION TESTS
// ============================================================================

test("normalizeProduct: Never fallback brand to 'SATHYA' when brand is missing or empty", () => {
  const rawProduct = {
    _id: "prod-001",
    name: "Generic Unbranded Cable",
    price: 499,
    quantity: 10,
    stock_status: "In Stock",
  };

  const normalized = normalizeProduct(rawProduct);
  assert.equal(normalized.brandName, "", "Brand name should be empty, not 'SATHYA'");
  assert.notEqual(normalized.brandName, "SATHYA", "Must not invent 'SATHYA' brand");
});

test("normalizeProduct: Resolves brand from brandMap using ObjectId brand key", () => {
  const brandId = "60d5ecb8b5c9c61234567890";
  const rawProduct = {
    _id: "prod-002",
    name: "OLED Smart TV",
    brand: brandId,
    price: 85000,
    quantity: 5,
    stock_status: "In Stock",
  };
  const brandMap = {
    [brandId]: "Sony",
  };

  const normalized = normalizeProduct(rawProduct, brandMap);
  assert.equal(normalized.brandName, "Sony", "Should resolve Sony from brandMap via ID");
});

test("normalizeProduct: Resolves brand from nested brand object", () => {
  const rawProduct = {
    _id: "prod-003",
    name: "Galaxy S24 Ultra",
    brand: { _id: "brand-samsung", name: "Samsung" },
    price: 129999,
    quantity: 3,
    stock_status: "In Stock",
  };

  const normalized = normalizeProduct(rawProduct);
  assert.equal(normalized.brandName, "Samsung", "Should resolve brand from brand.name");
});

test("normalizeProduct: Infers brand from product name first word when in brandMap", () => {
  const rawProduct = {
    _id: "prod-004",
    name: "LG Double Door Refrigerator",
    price: 32000,
    quantity: 2,
    stock_status: "In Stock",
  };
  const brandMap = {
    "brand-lg": "LG",
    "brand-whirlpool": "Whirlpool",
  };

  const normalized = normalizeProduct(rawProduct, brandMap);
  assert.equal(normalized.brandName, "LG", "Should infer LG from first word");
});

test("normalizeProduct: Correctly handles inStock flag when boolean or string", () => {
  const instockItem = {
    _id: "prod-005",
    inStock: true,
    price: 1000,
  };
  assert.equal(normalizeProduct(instockItem).inStock, true);

  const outOfStockItem = {
    _id: "prod-006",
    stock_status: "Out of Stock",
    quantity: 0,
    price: 1000,
  };
  assert.equal(normalizeProduct(outOfStockItem).inStock, false);
});

// ============================================================================
// DELIVERY VALIDATION & REGION HELPER REGRESSION TESTS
// ============================================================================

test("isValidPincode: Validates standard 6-digit Indian postal codes", () => {
  assert.equal(isValidPincode("600001"), true);
  assert.equal(isValidPincode("560001"), true);
  assert.equal(isValidPincode("12345"), false, "5 digits is invalid");
  assert.equal(isValidPincode("6000001"), false, "7 digits is invalid");
  assert.equal(isValidPincode("60000A"), false, "alphanumeric is invalid");
  assert.equal(isValidPincode(""), false, "empty string is invalid");
  assert.equal(isValidPincode(null), false, "null is invalid");
});

test("lookupPincode: Rejects invalid civilian pincodes starting with 0 or 9", async () => {
  const pinStartingZero = await lookupPincode("012345");
  assert.equal(pinStartingZero.status, "error");
  assert.equal(pinStartingZero.isValid, false);
  assert.equal(pinStartingZero.isServiceable, false);

  const pinStartingNine = await lookupPincode("999999");
  assert.equal(pinStartingNine.status, "error");
  assert.equal(pinStartingNine.isValid, false);
  assert.equal(pinStartingNine.isServiceable, false);
});

test("lookupPincode: Resolves known city pincodes accurately", async () => {
  const chennaiResult = await lookupPincode("600001");
  assert.equal(chennaiResult.status, "success");
  assert.equal(chennaiResult.isValid, true);
  assert.equal(chennaiResult.city, "chennai");
  assert.equal(chennaiResult.region, "tamilnadu");
  assert.ok(chennaiResult.latitude > 12 && chennaiResult.latitude < 14);
  assert.ok(chennaiResult.longitude > 79 && chennaiResult.longitude < 81);

  const bangaloreResult = await lookupPincode("560001");
  assert.equal(bangaloreResult.status, "success");
  assert.equal(bangaloreResult.isValid, true);
  assert.equal(bangaloreResult.region, "karnataka");
});

test("isKarnatakaPincode: Identifies Karnataka prefixes (56-59)", () => {
  assert.equal(isKarnatakaPincode("560001"), true);
  assert.equal(isKarnatakaPincode("590001"), true);
  assert.equal(isKarnatakaPincode("600001"), false);
});

test("calculateHaversineDistance: Accurately calculates km distance between coordinates", () => {
  // Chennai (13.0827, 80.2707) to Coimbatore (11.0168, 76.9558) is ~420-430 km
  const dist = calculateHaversineDistance(13.0827, 80.2707, 11.0168, 76.9558);
  assert.ok(dist >= 400 && dist <= 450, `Distance should be ~420km, got ${dist}`);
});

test("calculateDeliveryDays and formatDeliveryMessage: Produces accurate delivery SLA", () => {
  const oneDay = calculateDeliveryDays(30, 100, 1);
  assert.equal(oneDay, 1);
  assert.equal(formatDeliveryMessage(oneDay, false), "Delivery in One Day");

  const twoDays = calculateDeliveryDays(150, 100, 1);
  assert.equal(twoDays, 2);
  assert.equal(formatDeliveryMessage(twoDays, false), "Delivery in 2 Days");

  const multiDays = calculateDeliveryDays(350, 100, 1);
  assert.equal(multiDays, 4);
  assert.equal(formatDeliveryMessage(multiDays, false), "Delivery in 4 Days");
});
