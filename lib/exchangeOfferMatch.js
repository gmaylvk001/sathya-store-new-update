const ANY_REGEX = /^(any|all)$/i;

export function isAnyValue(value) {
  return value == null || String(value).trim() === "" || ANY_REGEX.test(String(value).trim());
}

export function normalizeOfferValue(value, fallback = "ANY") {
  const text = String(value ?? "").trim();
  if (!text || ANY_REGEX.test(text)) return fallback;
  return text;
}

function compactText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

export function fieldMatches(offerValue, selectedValue) {
  if (isAnyValue(offerValue) || isAnyValue(selectedValue)) return true;
  const offer = String(offerValue).trim().toLowerCase();
  const selected = String(selectedValue).trim().toLowerCase();
  if (offer === selected) return true;
  const compactOffer = compactText(offer);
  const compactSelected = compactText(selected);
  if (!compactOffer || !compactSelected) return false;
  if (compactOffer === compactSelected) return true;
  const shorter = compactOffer.length <= compactSelected.length ? compactOffer : compactSelected;
  const longer = shorter === compactOffer ? compactSelected : compactOffer;
  return shorter.length >= 3 && longer.includes(shorter);
}

export function categoryMatches(offerCategory, productCategory) {
  if (isAnyValue(offerCategory)) return true;
  const selected = String(productCategory || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return selected.includes(String(offerCategory).trim().toLowerCase());
}

export function specificityScore(offer, { zone = "", zoneAliases = [] } = {}) {
  let score = 0;
  if (!isAnyValue(offer.categoryName)) score += 8;
  if (!isAnyValue(offer.type)) score += 4;
  if (!isAnyValue(offer.brand)) score += 4;
  if (!isAnyValue(offer.condition)) score += 2;
  if (!isAnyValue(offer.zone)) {
    const offerZone = String(offer.zone).trim().toLowerCase();
    const aliases = [zone, ...zoneAliases]
      .map((item) => String(item || "").trim().toLowerCase())
      .filter(Boolean);
    if (aliases.includes(offerZone)) score += 3;
  }
  return score;
}

export function uniqueSorted(values) {
  return [...new Set(values.map((item) => String(item || "").trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}

export function collectDescendantIds(categories, parentId) {
  const root = String(parentId);
  const childrenByParent = new Map();
  for (const category of categories) {
    const parent = category.parentid && category.parentid !== "none" ? String(category.parentid) : null;
    if (!parent) continue;
    if (!childrenByParent.has(parent)) childrenByParent.set(parent, []);
    childrenByParent.get(parent).push(String(category._id));
  }

  const ids = [root];
  const queue = [root];
  while (queue.length) {
    const current = queue.shift();
    for (const childId of childrenByParent.get(current) || []) {
      if (!ids.includes(childId)) {
        ids.push(childId);
        queue.push(childId);
      }
    }
  }
  return ids;
}
