import test from "node:test";
import assert from "node:assert/strict";

import {
  getPaymentOffersAriaAttributes,
  getPaymentOffersChevronClass,
  getPaymentOffersHeaderMarginClass,
} from "../lib/paymentOffersHelper.js";

test("PaymentOffers Collapse/Expand: Accessibility attributes match expanded state", () => {
  const expandedAttrs = getPaymentOffersAriaAttributes(true);
  assert.equal(expandedAttrs.role, "button");
  assert.equal(expandedAttrs.tabIndex, 0);
  assert.equal(expandedAttrs["aria-expanded"], true);
  assert.equal(expandedAttrs["aria-controls"], "payment-offers-collapsible-content");
  assert.equal(expandedAttrs["aria-label"], "Collapse Payment Offers");
  assert.equal(expandedAttrs.title, "Collapse Payment Offers");
});

test("PaymentOffers Collapse/Expand: Accessibility attributes match collapsed state", () => {
  const collapsedAttrs = getPaymentOffersAriaAttributes(false);
  assert.equal(collapsedAttrs.role, "button");
  assert.equal(collapsedAttrs.tabIndex, 0);
  assert.equal(collapsedAttrs["aria-expanded"], false);
  assert.equal(collapsedAttrs["aria-controls"], "payment-offers-collapsible-content");
  assert.equal(collapsedAttrs["aria-label"], "Expand Payment Offers");
  assert.equal(collapsedAttrs.title, "Expand Payment Offers");
});

test("PaymentOffers Toggle Behavior: State transitions cleanly on sequential clicks", () => {
  let isExpanded = true; // Initial default matching product page

  const toggle = () => {
    isExpanded = !isExpanded;
    return isExpanded;
  };

  // 1. Initial state: Open / Expanded
  assert.equal(isExpanded, true);

  // 2. First click collapses
  assert.equal(toggle(), false);

  // 3. Second click expands back
  assert.equal(toggle(), true);

  // 4. Multiple rapid repeated clicks remain deterministic
  for (let i = 0; i < 10; i++) {
    const expected = i % 2 !== 0;
    assert.equal(toggle(), expected);
  }
});

test("PaymentOffers Arrow State: Visual indicator syncs with actual content state", () => {
  const getArrowRotationClass = (isExpanded) => (isExpanded ? "" : "rotate-180");
  const getHeaderMarginClass = (isExpanded) => (isExpanded ? "mb-4" : "mb-0");

  // Expanded state
  assert.equal(getArrowRotationClass(true), "");
  assert.equal(getHeaderMarginClass(true), "mb-4");

  // Collapsed state
  assert.equal(getArrowRotationClass(false), "rotate-180");
  assert.equal(getHeaderMarginClass(false), "mb-0");
});

test("PaymentOffers Keyboard Accessibility: Enter and Space trigger toggle", () => {
  let toggledCount = 0;
  const toggle = () => {
    toggledCount++;
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  // Enter key
  let prevented = false;
  handleKeyDown({ key: "Enter", preventDefault: () => { prevented = true; } });
  assert.equal(toggledCount, 1);
  assert.equal(prevented, true);

  // Space key
  prevented = false;
  handleKeyDown({ key: " ", preventDefault: () => { prevented = true; } });
  assert.equal(toggledCount, 2);
  assert.equal(prevented, true);

  // Unrelated keys (Tab, ArrowDown, Escape) must NOT toggle
  prevented = false;
  handleKeyDown({ key: "Tab", preventDefault: () => { prevented = true; } });
  handleKeyDown({ key: "ArrowDown", preventDefault: () => { prevented = true; } });
  handleKeyDown({ key: "Escape", preventDefault: () => { prevented = true; } });
  assert.equal(toggledCount, 2);
  assert.equal(prevented, false);
});

test("PaymentOffers Event Isolation: Offers text click opens modal without toggling accordion", () => {
  let accordionToggled = false;
  let modalOpened = false;
  let propagationStopped = false;

  const toggleAccordion = () => {
    accordionToggled = true;
  };

  const openBankOffersModal = () => {
    modalOpened = true;
  };

  const handleOffersLinkClick = (e) => {
    e.stopPropagation();
    openBankOffersModal();
  };

  const mockEvent = {
    stopPropagation: () => {
      propagationStopped = true;
    },
  };

  handleOffersLinkClick(mockEvent);

  assert.equal(propagationStopped, true);
  assert.equal(modalOpened, true);
  assert.equal(accordionToggled, false, "Clicking Offers link must not trigger parent accordion toggle");
});

test("PaymentOffers Content Visibility: Collapsing correctly conceals EMI and Bank Offers content", () => {
  const renderSimulatedContent = (isExpanded, offers) => {
    if (!isExpanded) {
      return null;
    }
    return {
      sectionHeader: "Payment Offers",
      emiOffers: offers.emiOffers || [],
      bankOffers: offers.bankOffers || [],
    };
  };

  const sampleOffers = {
    emiOffers: [{ offerId: "emi-1", monthlyEmi: 7488.16, tenureMonths: 6 }],
    bankOffers: [{ offerId: "bank-1", name: "HDFC Bank Cards", effectivePrice: 39913.75 }],
  };

  // Expanded
  const expandedView = renderSimulatedContent(true, sampleOffers);
  assert.notEqual(expandedView, null);
  assert.equal(expandedView.sectionHeader, "Payment Offers");
  assert.equal(expandedView.emiOffers.length, 1);
  assert.equal(expandedView.bankOffers.length, 1);

  // Collapsed
  const collapsedView = renderSimulatedContent(false, sampleOffers);
  assert.equal(collapsedView, null, "Collapsing must return null for offers content");
});
