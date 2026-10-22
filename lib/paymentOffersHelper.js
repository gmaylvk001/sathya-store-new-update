/**
 * lib/paymentOffersHelper.js
 * Helpers for PaymentOffers collapse/expand state and accessibility attributes.
 */

/**
 * Returns WAI-ARIA and accessible attributes for the Payment Offers accordion toggle.
 * @param {boolean} isExpanded
 * @returns {Object}
 */
export function getPaymentOffersAriaAttributes(isExpanded) {
  const expanded = Boolean(isExpanded);
  return {
    role: "button",
    tabIndex: 0,
    "aria-expanded": expanded,
    "aria-controls": "payment-offers-collapsible-content",
    "aria-label": expanded ? "Collapse Payment Offers" : "Expand Payment Offers",
    title: expanded ? "Collapse Payment Offers" : "Expand Payment Offers",
  };
}

/**
 * Helper to determine chevron arrow CSS transform based on collapse state.
 * @param {boolean} isExpanded
 * @returns {string}
 */
export function getPaymentOffersChevronClass(isExpanded) {
  return isExpanded ? "" : "rotate-180";
}

/**
 * Helper to determine header margin based on collapse state.
 * @param {boolean} isExpanded
 * @returns {string}
 */
export function getPaymentOffersHeaderMarginClass(isExpanded) {
  return isExpanded ? "mb-4" : "mb-0";
}
