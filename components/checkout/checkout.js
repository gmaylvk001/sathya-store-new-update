"use client";
import { useState, useEffect, useRef } from "react";
import { useCart } from '@/context/CartContext';
import { ToastContainer, toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import { AuthModal } from '@/components/AuthModal';
import { ga4BeginCheckout, ga4Purchase } from "@/utils/nextjs-event-tracking.js";
import { useModal } from "@/context/ModalContext";
import { isKarnatakaPincode } from "@/lib/regionHelper";
import { useRegion } from "@/context/RegionContext";
import useDetectLocation from "@/hooks/useDetectLocation";

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_TEST_KEY || '';
const IS_RAZORPAY_TEST_MODE = RAZORPAY_KEY.startsWith('rzp_test_');
const RAZORPAY_EMI_TEST_CARD = '5241 8100 0000 0000';

const BEA_CONTACT_PHONE = '9842344323';
const BEA_CONTACT_EMAIL = 'customercare@sathya.store';

const toCheckoutPhone = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
};

const toCheckoutEmail = (value) => {
  const email = String(value ?? '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
};

const FloatInput = ({ label, name, type = 'text', required, readOnly, value, onChange, onBlur, error, inputMode, maxLength, showLock, hint }) => (
  <div>
      <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        readOnly={readOnly}
        inputMode={inputMode}
        maxLength={maxLength}
        className={`peer w-full border rounded-lg pt-5 pb-1.5 px-3 text-sm outline-none transition
          ${showLock ? 'pr-10' : ''}
          ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
          ${error ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-300'
            : 'border-gray-300 focus:border-red-500 focus:ring-1 focus:ring-red-200'}`}
      />
      <label className={`absolute left-3 transition-all duration-150 pointer-events-none
        ${value ? 'top-1 text-[10px] text-gray-500' : 'top-3.5 text-sm text-gray-400'}`}>
        {label}{required && '*'}
      </label>
      {showLock && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </span>
      )}
    </div>
    {hint && <p className="text-xs text-gray-500 mt-1.5">{hint}</p>}
    {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
  </div>
);

// ─── Haversine distance (km) ────────────────────────────────────────────────
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Delivery Type Component ─────────────────────────────────────────────────
const DeliveryOptions = ({
  formData, handleChange,
  isDeliverySaved, setIsDeliverySaved,
  stores, nearestStores, setNearestStores,
  selectedPickupStore, setSelectedPickupStore,
  cartItems,
  hasPincodeMismatch,
  normDeliveryPin,
  normHeaderPin,
  setPincode,
}) => {
  const firstProduct = cartItems?.[0];
  const productLink = firstProduct
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/product/${firstProduct.productId || firstProduct.id}`
    : (typeof window !== 'undefined' ? window.location.href : '');
  const productMsg = firstProduct
    ? `Hi, I'd like to check availability for: ${firstProduct.name} - ${productLink}`
    : `Hi, I'd like to check product availability - ${productLink}`;

  const [loadingStores, setLoadingStores] = useState(false);
  const [showAllStores, setShowAllStores] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const prevPincode = useRef('');

  useEffect(() => {
    if (!hasPincodeMismatch) setPincodeError('');
  }, [hasPincodeMismatch]);

  // When postCode changes & store pickup selected → find nearest stores
  useEffect(() => {
    const pincode = formData.postCode;
    if (
      formData.deliveryType === 'store' &&
      pincode?.length === 6 &&
      pincode !== prevPincode.current
    ) {
      prevPincode.current = pincode;
      findNearestStores(pincode);
    }
  }, [formData.postCode, formData.deliveryType]);

  const findNearestStores = async (pincode) => {
    setLoadingStores(true);
    try {
      const res = await fetch(`/api/pincode/check?pincode=${pincode}`);
      const data = await res.json();

      if (!data.success || !data.stores?.length) {
        setNearestStores(stores.slice(0, 3).map(s => ({ ...s, distanceKm: null })));
        return;
      }


      const matchedStores = data.stores;

      setNearestStores(matchedStores);
      setSelectedPickupStore(matchedStores[0]._id);
      handleChange({ target: { name: "selectedStore", value: matchedStores[0]._id } });

    } catch (err) {
      console.error("Pincode check error:", err);
      setNearestStores(stores.slice(0, 3).map(s => ({ ...s, distanceKm: null })));
    } finally {
      setLoadingStores(false);
    }
  };

  const displayedStores = showAllStores ? nearestStores : nearestStores.slice(0, 3);

  return (
    <div className="mt-4">
      {/* Delivery Type Tabs */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Home Delivery */}
        <label
          className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
            ${formData.deliveryType === 'home'
              ? 'border-red-600 bg-red-50'
              : 'border-gray-200 bg-white hover:border-gray-300'}`}
        >
          <input
            type="radio"
            name="deliveryType"
            value="home"
            checked={formData.deliveryType === 'home'}
            onChange={handleChange}
            className="sr-only"
          />
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
            ${formData.deliveryType === 'home' ? 'bg-red-100' : 'bg-gray-100'}`}>
            <svg className={`w-5 h-5 ${formData.deliveryType === 'home' ? 'text-red-600' : 'text-gray-500'}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div>
            <p className={`text-sm font-medium ${formData.deliveryType === 'home' ? 'text-red-700' : 'text-gray-800'}`}>
              Home delivery
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Free delivery to your address</p>
          </div>
        </label>

        {/* Store Pickup */}
        <label
          className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
            ${formData.deliveryType === 'store'
              ? 'border-red-600 bg-red-50'
              : 'border-gray-200 bg-white hover:border-gray-300'}`}
        >
          <input
            type="radio"
            name="deliveryType"
            value="store"
            checked={formData.deliveryType === 'store'}
            onChange={handleChange}
            className="sr-only"
          />
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
            ${formData.deliveryType === 'store' ? 'bg-red-100' : 'bg-gray-100'}`}>
            <svg className={`w-5 h-5 ${formData.deliveryType === 'store' ? 'text-red-600' : 'text-gray-500'}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className={`text-sm font-medium ${formData.deliveryType === 'store' ? 'text-red-700' : 'text-gray-800'}`}>
              Store pickup
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Pick up from your nearest Sathya Stores showroom</p>
          </div>
        </label>
      </div>

      {/* Store Pickup → simple dropdown */}
      {formData.deliveryType === 'store' && (
        <div className="mt-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Store</label>
          <select
            name="selectedStore"
            value={formData.selectedStore}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
            required
          >
            <option value="">Select store</option>
            {stores.map((store) => (
              <option key={store._id} value={store.branch_code || store._id}>
                {store.title || store.organisation_name} {store.city ? `- ${store.city}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Save and Continue */}
      {!isDeliverySaved && (
        <>
          <button
            type="button"
            onClick={() => {
              if (hasPincodeMismatch) {
                setPincodeError(
                  `Delivery pincode (${normDeliveryPin}) does not match your selected location pincode (${normHeaderPin}). Please change the shipping address or update the location pincode at the top.`
                );
                return;
              }
              setPincodeError('');
              toast.success('Delivery method saved');
              setIsDeliverySaved(true);
            }}
            className="mt-4 bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 transition cursor-pointer"
          >
            Save and continue
          </button>
          {pincodeError && (
            <div role="alert" className="mt-3 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
              {pincodeError}
            </div>
          )}
        </>
      )}

      {isDeliverySaved && (
        <button
          type="button"
          onClick={() => setIsDeliverySaved(false)}
          className="mt-3 text-sm text-red-600 underline hover:text-red-700"
        >
          Change delivery method
        </button>
      )}
    </div>
  );
};

// ─── Add / Edit Address Form Component ────────────────────────────────────────
const AddressModalForm = ({
  addressModalType,
  editAddressId,
  savedAddresses,
  headerPincode,
  initialDetectedLocation = null,
  onSuccess,
  onCancel,
}) => {
  const isKarnatakaHeader = isKarnatakaPincode(headerPincode);

  let initialVals = {
    firstName: '',
    lastName: '',
    phone: '',
    alternate_phone: '',
    pincode: initialDetectedLocation?.pincode || headerPincode || '',
    locality: initialDetectedLocation?.locality || '',
    address_line1: '',
    address_line2: '',
    city: initialDetectedLocation?.city ? (initialDetectedLocation.city.charAt(0).toUpperCase() + initialDetectedLocation.city.slice(1)) : '',
    state: initialDetectedLocation?.state || (isKarnatakaHeader ? 'Karnataka' : 'Tamil Nadu'),
    landmark: '',
  };

  if (addressModalType === 'edit' && editAddressId) {
    const addr = savedAddresses.find((a) => a._id === editAddressId);
    if (addr) {
      const cleanVal = (val) => (!val || String(val).toUpperCase() === 'NULL' ? '' : val);
      const parts = cleanVal(addr.username).split(' ');
      initialVals = {
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
        phone: cleanVal(addr.phonenumber),
        alternate_phone: cleanVal(addr.altnumber),
        pincode: cleanVal(addr.pincode),
        locality: cleanVal(addr.locality),
        address_line1: cleanVal(addr.address1),
        address_line2: cleanVal(addr.address2),
        city: cleanVal(addr.city),
        state: cleanVal(addr.state) || (isKarnatakaPincode(addr.pincode) ? 'Karnataka' : 'Tamil Nadu'),
        landmark: cleanVal(addr.landmark),
      };
    }
  }

  const [formVals, setFormVals] = useState(initialVals);
  const [loadingPincode, setLoadingPincode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineNotice, setInlineNotice] = useState(null);

  const { isDetecting, detectLocation, error: detectError, clearError } = useDetectLocation();

  const handleDetectCurrentLocation = async () => {
    setInlineNotice(null);
    clearError();
    const result = await detectLocation({
      onSuccess: (loc) => {
        setFormVals((prev) => ({
          ...prev,
          pincode: loc.pincode || prev.pincode,
          locality: loc.locality || prev.locality,
          city: loc.city ? (loc.city.charAt(0).toUpperCase() + loc.city.slice(1)) : prev.city,
          state: loc.state || prev.state,
        }));
        toast.success(`Location detected: ${loc.city || loc.pincode}`);
      },
      onError: (errMsg) => {
        setInlineNotice(errMsg || 'Unable to retrieve location. Please type your pincode manually.');
      },
    });

    if (!result?.success) {
      setInlineNotice(result?.error || 'Unable to retrieve location. Please type your pincode manually.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormVals((prev) => ({ ...prev, [name]: value }));
  };

  const handlePincodeChange = async (e) => {
    const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
    let resolvedState = formVals.state;
    if (isKarnatakaPincode(pin)) {
      resolvedState = 'Karnataka';
    } else if (pin.startsWith('60') || pin.startsWith('61') || pin.startsWith('62') || pin.startsWith('63') || pin.startsWith('64')) {
      resolvedState = 'Tamil Nadu';
    } else if (pin.startsWith('67') || pin.startsWith('68') || pin.startsWith('69')) {
      resolvedState = 'Kerala';
    } else if (pin.startsWith('50')) {
      resolvedState = 'Telangana';
    } else if (pin.startsWith('51') || pin.startsWith('52') || pin.startsWith('53')) {
      resolvedState = 'Andhra Pradesh';
    }

    setFormVals((prev) => ({ ...prev, pincode: pin, state: resolvedState }));

    if (pin.length === 6) {
      setLoadingPincode(true);
      try {
        const res = await fetch('/api/pincode/check-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pincode: pin }),
        });
        const data = await res.json();
        if (data.status && data.city && data.city !== 'unknown') {
          setFormVals((prev) => ({
            ...prev,
            city: prev.city || (data.city.charAt(0).toUpperCase() + data.city.slice(1)),
            locality: prev.locality || data.locality || '',
            state: data.state || resolvedState,
          }));
        }
      } catch (err) {
        console.error('Pincode check error:', err);
      } finally {
        setLoadingPincode(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Session expired. Please log in.');
      return;
    }

    if (!formVals.pincode || formVals.pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit postal pincode');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        full_name: `${formVals.firstName.trim()} ${formVals.lastName.trim()}`.trim(),
        phone: formVals.phone,
        alternate_phone: formVals.alternate_phone || '',
        pincode: formVals.pincode,
        locality: formVals.locality || '',
        address_line1: formVals.address_line1,
        address_line2: formVals.address_line2 || '',
        city: formVals.city,
        state: formVals.state || (isKarnatakaPincode(formVals.pincode) ? 'Karnataka' : 'Tamil Nadu'),
        landmark: formVals.landmark || '',
        is_default_shipping: false,
        is_default_billing: false,
      };

      const url = addressModalType === 'edit' ? `/api/saved-address/${editAddressId}` : '/api/saved-address';
      const method = addressModalType === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.address) {
        await onSuccess(data.address);
      } else {
        toast.error(data.message || 'Failed to save address');
      }
    } catch (err) {
      console.error('Save address error:', err);
      toast.error('Failed to save address');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Top Delivery Pincode & Modern Detection Header Bar */}
      <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/90 flex flex-wrap items-center justify-between gap-2.5 text-xs text-gray-700 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">
            Delivery Pincode:{" "}
            <span className="text-[#d72828] font-bold">
              {formVals.pincode || "Not set"}
            </span>
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-600 font-medium">
            {formVals.state || (isKarnatakaPincode(formVals.pincode) ? "Karnataka" : "Tamil Nadu")}
          </span>
        </div>

        {/* Sleek Modern Detection Trigger Button */}
        <button
          type="button"
          onClick={handleDetectCurrentLocation}
          disabled={isDetecting}
          className="bg-red-50 hover:bg-red-100 text-[#d72828] border border-red-200 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-60 shadow-2xs"
          title="Detect my current location"
        >
          {isDetecting ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-[#d72828] border-t-transparent rounded-full animate-spin" />
              <span>Detecting...</span>
            </>
          ) : (
            <>
              <span className="text-[#d72828] text-xs leading-none">✦</span>
              <span>Detect my location</span>
            </>
          )}
        </button>
      </div>

      {/* Non-blocking inline error/warning notification */}
      {(detectError || inlineNotice) && (
        <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="text-amber-600 font-bold">ℹ</span>
            <span>{detectError || inlineNotice}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              clearError();
              setInlineNotice(null);
            }}
            className="text-amber-600 hover:text-amber-800 ml-2 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
          <input
            name="firstName"
            value={formVals.firstName}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:border-red-500 outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
          <input
            name="lastName"
            value={formVals.lastName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:border-red-500 outline-none text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number *</label>
          <input
            name="phone"
            value={formVals.phone}
            onChange={handleInputChange}
            required
            type="tel"
            pattern="[0-9]{10}"
            maxLength="10"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:border-red-500 outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Alternate Phone</label>
          <input
            name="alternate_phone"
            value={formVals.alternate_phone}
            onChange={handleInputChange}
            type="tel"
            pattern="[0-9]{10}"
            maxLength="10"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:border-red-500 outline-none text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-gray-700">
              Pincode *
            </label>
            <button
              type="button"
              onClick={handleDetectCurrentLocation}
              disabled={isDetecting}
              className="text-[#d72828] hover:text-red-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              {isDetecting ? (
                <span className="text-gray-400">Detecting…</span>
              ) : (
                <>
                  <span className="leading-none">✦</span>
                  <span>Use current location</span>
                </>
              )}
            </button>
          </div>
          <input
            name="pincode"
            value={formVals.pincode}
            onChange={handlePincodeChange}
            required
            pattern="[0-9]{6}"
            maxLength="6"
            placeholder="e.g. 560020 or 600001"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:border-red-500 outline-none text-sm font-medium"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Locality</label>
          <input
            name="locality"
            value={formVals.locality}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:border-red-500 outline-none text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Address Line 1 *</label>
          <textarea
            name="address_line1"
            value={formVals.address_line1}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:border-red-500 outline-none text-sm"
            rows="2"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Address Line 2</label>
          <textarea
            name="address_line2"
            value={formVals.address_line2}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:border-red-500 outline-none text-sm"
            rows="2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
          <input
            name="city"
            value={formVals.city}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:border-red-500 outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">State *</label>
          <input
            name="state"
            value={formVals.state}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:border-red-500 outline-none text-sm font-semibold"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Landmark</label>
          <input
            name="landmark"
            value={formVals.landmark}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:border-red-500 outline-none text-sm"
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : 'Save Address'}
        </button>
      </div>
    </form>
  );
};

// ─── Main CheckoutPage ───────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { openLiveDemoModal } = useModal();
  const { cartCount, updateCartCount } = useCart();
  const { pincode: headerPincode, region: headerRegion, selectedRegion, setPincode } = useRegion();
  const router = useRouter();
  const [stores, setStores] = useState([]);
  const [nearestStores, setNearestStores] = useState([]);
  const [selectedPickupStore, setSelectedPickupStore] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);


  const [formData, setFormData] = useState({
    firstName: '', lastName: '', businessName: '',
    country: 'India', address: '', landmark: '',
    city: '', state: 'Tamilnadu', postCode: '',
    phonenumber: '', email: '', additionalInfo: '',
    deliveryType: 'home', selectedStore: '',
    needGstInvoice: false, gst_number: '',
  });

  const [isDeliverySaved, setIsDeliverySaved] = useState(false);
  const [useraddress, setUseraddress] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [shippingAddressId, setShippingAddressId] = useState(null);
  const [billingAddressId, setBillingAddressId] = useState(null);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressModalType, setAddressModalType] = useState('shipping');
  const [editAddressId, setEditAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [error, setError] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderSummary, setOrderSummary] = useState({ discount: 0, subtotal: 0, total: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});
  const [shippingMethod, setShippingMethod] = useState('standard');

  const [isDetectingCheckoutLoc, setIsDetectingCheckoutLoc] = useState(false);
  const [locationPromptData, setLocationPromptData] = useState(null);
  const [prefilledDetectedLocation, setPrefilledDetectedLocation] = useState(null);
  const { detectLocation: triggerDetectLocation } = useDetectLocation();

  const handleDetectCheckoutLocation = async () => {
    setIsDetectingCheckoutLoc(true);
    const result = await triggerDetectLocation();
    setIsDetectingCheckoutLoc(false);

    if (!result?.success || !result?.data) {
      toast.info(result?.error || 'Unable to retrieve location. Please type your pincode manually.');
      return;
    }

    const detected = result.data;
    const detectedPin = String(detected.pincode).trim();

    // Verify delivery availability for detected pincode
    try {
      const checkRes = await fetch(`/api/pincode/check-delivery?pincode=${encodeURIComponent(detectedPin)}`);
      const checkData = await checkRes.json();
      if (checkData && checkData.serviceable === false && checkData.deliveryAvailable === false) {
        toast.warning(checkData.message || `Delivery may be limited for pincode ${detectedPin}.`);
      } else {
        toast.success(`Location detected: ${detected.city || detected.state} (${detectedPin})`);
      }
    } catch (checkErr) {
      console.warn("Delivery check error:", checkErr);
    }

    // Sync header location
    if (typeof setPincode === 'function' && detectedPin) {
      setPincode(detectedPin);
    }

    // Check if user has an existing selected shipping address
    if (currentShipping && currentShipping.pincode) {
      const currentPin = String(currentShipping.pincode).trim();
      if (currentPin !== detectedPin) {
        const matchingSaved = savedAddresses.find(
          (a) => String(a.pincode).trim() === detectedPin
        );
        setLocationPromptData({
          detected,
          matchingSaved,
          currentShipping,
        });
        return;
      }
    }

    // If no shipping address exists yet:
    if (!shippingAddressId || !currentShipping) {
      setPrefilledDetectedLocation(detected);
      setAddressModalType('new');
      setShowAddressModal(true);
    }
  };

  const extraCities = ["Ariyalur", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Salem", "Sivaganga", "Thanjavur", "Theni", "Thoothukudi", "Tirunelveli", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar", "Singanallur", "Sivananthapuram", "Vadavalli", "Annur", "Mettupalayam", "Thennur", "Ariyamangalam", "Komarapalayam", "Kattur"];

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await fetch('/api/store_listings/get');
        const json = await res.json();
        if (Array.isArray(json)) {
          setStores(json);
        } else if (json.data) {
          setStores(json.data);
        }
      } catch (err) { console.error('Fetch stores error:', err); }
    };
    fetchStores();
  }, []);

  useEffect(() => {
    const uniqueCities = [...new Set(stores.map(s => s.city))];
    // finalCities is derived in render
  }, [stores]);

  useEffect(() => {
    const buyNowData = localStorage.getItem('buyNowData');
    const checkoutData = localStorage.getItem('checkoutData');
    console.log("DEBUG raw checkoutData:", checkoutData);
    let skipCartFetch = false;
    if (buyNowData) {
      const p = JSON.parse(buyNowData);
      setCartItems(p.cart.items);
      setOrderSummary({ discount: 0, subtotal: p.total || 0, total: p.total || 0 });
      setAppliedCoupon(p.coupon || null);
      localStorage.setItem('checkoutData', JSON.stringify({ cart: p.cart, coupon: appliedCoupon, discount: 0, subtotal: p.total || 0, total: p.total || 0 }));
      localStorage.removeItem('buyNowData');
      skipCartFetch = true;
    } else if (checkoutData) {
      const p = JSON.parse(checkoutData);

      setCartItems(p.cart.items);
      setOrderSummary({ discount: p.discount || 0, subtotal: p.subtotal || 0, total: p.total || 0 });
      setAppliedCoupon(p.coupon || null);
      skipCartFetch = true;
    }
    fetchData(skipCartFetch);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentError = params.get('error');
    if (!paymentError) return;
    toast.error(paymentError, { autoClose: 8000 });
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  useEffect(() => {
    if (cartItems.length > 0 && orderSummary.total > 0) {
      ga4BeginCheckout({ items: cartItems, value: orderSummary.total });
    }
  }, [cartItems, orderSummary.total]);

  const currentShipping = savedAddresses.find((a) => a._id === shippingAddressId);
  const rawDeliveryPin = currentShipping?.pincode || formData.postCode || '';
  const normDeliveryPin = String(rawDeliveryPin).replace(/\D/g, '').trim();
  const normHeaderPin = String(headerPincode || '').replace(/\D/g, '').trim();
  const currentSt = currentShipping?.state || formData.state || '';

  const isKarnatakaHeaderLocation = isKarnatakaPincode(normHeaderPin) || headerRegion === 'karnataka';
  const pickupStores = isKarnatakaHeaderLocation
    ? stores.filter((s) => String(s.store_owner || '').trim().toLowerCase() === 'unilet')
    : stores;
  const matchesSelectedStore = (s) => s.branch_code === formData.selectedStore || s._id === formData.selectedStore;

  const selectedStoreObj = pickupStores.find(matchesSelectedStore) || stores.find(matchesSelectedStore);

  useEffect(() => {
    if (!formData.selectedStore || !stores.length) return;
    if (!pickupStores.some(matchesSelectedStore)) {
      setFormData((prev) => ({ ...prev, selectedStore: '' }));
    }
  }, [isKarnatakaHeaderLocation, formData.selectedStore, stores]);

  const isKarnatakaDelivery =
    isKarnatakaPincode(normDeliveryPin) ||
    /karnataka/i.test(currentSt);

  const isKarnatakaStorePickup =
    formData.deliveryType === 'store' &&
    (
      isKarnatakaPincode(normHeaderPin) ||
      isKarnatakaPincode(selectedStoreObj?.pincode || selectedStoreObj?.zip || '') ||
      /karnataka/i.test(selectedStoreObj?.state || '') ||
      /karnataka/i.test(selectedStoreObj?.city || '') ||
      isKarnatakaPincode(normDeliveryPin)
    );

  const isKarnataka = formData.deliveryType === 'store' ? Boolean(isKarnatakaStorePickup) : Boolean(isKarnatakaDelivery);

  const hasPincodeMismatch = Boolean(
    normDeliveryPin.length === 6 &&
    normHeaderPin.length === 6 &&
    normDeliveryPin !== normHeaderPin
  );

  useEffect(() => {
    if (hasPincodeMismatch && isDeliverySaved) {
      setIsDeliverySaved(false);
    }
  }, [hasPincodeMismatch, isDeliverySaved]);

  const fetchData = async (skipCartFetch = false) => {
    const token = localStorage.getItem('token');
    if (!token) { setShowAuthModal(true); setLoading(false); return; }
    try {
      const decoded = jwtDecode(token);
      const userId = decoded.userId;

      let contactEmail = toCheckoutEmail(decoded.email);
      let contactPhone = toCheckoutPhone(decoded.mobile);
      try {
        const authRes = await fetch('/api/auth/check', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.loggedIn) {
            contactEmail = toCheckoutEmail(authData.email || authData.user?.email) || contactEmail;
            contactPhone = toCheckoutPhone(authData.phone || authData.user?.mobile) || contactPhone;
          }
        }
      } catch (authErr) {
        console.error('Contact prefill auth check:', authErr);
      }

      if (!skipCartFetch) {
        const cartRes = await fetch('/api/cart', { headers: { Authorization: `Bearer ${token}` } });
        if (!cartRes.ok) throw new Error('Failed to fetch cart');
        const cartData = await cartRes.json();
        const items = cartData?.cart?.items || [];
        setCartItems(items);
        const sub = items.reduce((s, it) => s + ((it.price || 0) * (it.quantity || 1)), 0);
        const total = cartData?.cart?.totalPrice ?? sub;
        setOrderSummary({
          discount: 0,
          subtotal: total,
          total: total,
        });
      }
      const addrRes = await fetch(`/api/saved-address`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (addrRes.ok) {
        try {
          const addrData = await addrRes.json();
          const addresses = addrData?.addresses || [];
          setSavedAddresses(addresses);
          if (addresses.length > 0) {
            const normHeader = String(headerPincode || '').replace(/\D/g, '').trim();
            const isKarnatakaHeader = isKarnatakaPincode(normHeader) || headerRegion === 'karnataka';
            const matchedPin = normHeader ? addresses.find(a => String(a.pincode || '').replace(/\D/g, '').trim() === normHeader) : null;
            const matchedRegion = isKarnatakaHeader
              ? addresses.find(a => isKarnatakaPincode(String(a.pincode || '').replace(/\D/g, '')) || /karnataka/i.test(a.state))
              : addresses.find(a => !isKarnatakaPincode(String(a.pincode || '').replace(/\D/g, '')) && !/karnataka/i.test(a.state));

            const defaultShip = matchedPin || matchedRegion || addresses.find(a => a.is_default_shipping) || addresses[0];
            const defaultBill = matchedPin || matchedRegion || addresses.find(a => a.is_default_billing) || addresses[0];
            if (!contactPhone) {
              contactPhone = toCheckoutPhone(defaultShip.phonenumber);
            }
            setShippingAddressId(defaultShip._id);
            if (defaultShip._id !== defaultBill._id) {
              setBillingSameAsShipping(false);
              setBillingAddressId(defaultBill._id);
            } else {
              setBillingSameAsShipping(true);
              setBillingAddressId(defaultShip._id);
            }
          }
        } catch (parseErr) {
          setSavedAddresses([]);
        }
      }

      if (contactEmail || contactPhone) {
        setFormData((prev) => ({
          ...prev,
          email: prev.email || contactEmail,
          phonenumber: prev.phonenumber || contactPhone,
        }));
      }
    } catch (err) {
      console.error('fetchData error:', err);
      toast.error('Failed to load checkout data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Visual-only convenience: when switching to store pickup, surface "Pay at store" as the
    // highlighted payment option to match the in-store collection flow shown in the design.
    if (name === 'deliveryType') {
      if (value === 'store') {
        setPaymentMethod('Cash on Delivery');
      } else if (value === 'home' && paymentMethod === 'Cash on Delivery') {
        setPaymentMethod('online');
      }
    }
  };

  const handlePaymentChange = (method) => {
    setPaymentMethod(method);
  };

  const handleBlur = (e) => setTouched(prev => ({ ...prev, [e.target.name]: true }));

  const getFieldError = (name) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    const postCodeRegex = /^[1-9][0-9]{5}$/;
    if (!touched[name]) return null;
    switch (name) {
      case 'firstName': return !formData.firstName ? 'First name is required' : null;
      case 'lastName': return !formData.lastName ? 'Last name is required' : null;
      case 'email': return !formData.email ? 'Email is required' : !emailRegex.test(formData.email) ? 'Enter a valid email' : null;
      case 'phonenumber': return !formData.phonenumber ? 'Phone is required' : !phoneRegex.test(formData.phonenumber) ? 'Enter a valid 10-digit number' : null;
      case 'country': return !formData.country ? 'Country is required' : null;
      case 'address': return !formData.address ? 'Address is required' : null;
      case 'city': return !formData.city ? 'City is required' : null;
      case 'postCode': return !formData.postCode ? 'Post code is required' : !postCodeRegex.test(formData.postCode) ? 'Enter a valid 6-digit postal code' : null;
      default: return null;
    }
  };

  const initializeRazorpay = async () => await loadRazorpay();

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const createRazorpayOrder = async (amount, orderNumber) => {
    const res = await fetch('/api/create-razorpay-order', {
      method: 'POST', headers: getAuthHeaders(),
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        order_number: orderNumber || undefined,
      }),
    });
    return await res.json();
  };

  const handleOnlinePayment = async (totalAmount, isEmi = false, orderNumber = null) => {
    if (isEmi && totalAmount < 3000) {
      toast.error('EMI is available for orders of ₹3,000 and above.');
      setIsSubmitting(false);
      throw new Error('EMI minimum amount not met');
    }

    const razorpayLoaded = await initializeRazorpay();
    if (!razorpayLoaded) { toast.error('Razorpay SDK failed to load'); setIsSubmitting(false); return; }
    const orderResponse = await createRazorpayOrder(totalAmount, orderNumber);
    if (!orderResponse || !orderResponse.order || !orderResponse.order.id) {
      const errMsg = orderResponse?.error || 'Failed to initialize payment gateway';
      toast.error(errMsg);
      setIsSubmitting(false);
      throw new Error(errMsg);
    }
    const { order } = orderResponse;
    return new Promise((resolve, reject) => {
      const options = {
        key: RAZORPAY_KEY || process.env.NEXT_PUBLIC_RAZORPAY_TEST_KEY,
        amount: order.amount, currency: 'INR', name: 'Sathya Stores',
        description: isEmi ? 'EMI Payment' : 'Product Purchase', order_id: order.id,
        handler: async (response) => {
          try {
            const verificationRes = await fetch('/api/verify-payment', {
              method: 'POST', headers: getAuthHeaders(),
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                order_number: orderNumber,
              }),
            });
            const verificationData = await verificationRes.json();
            if (verificationRes.ok) {
              resolve({
                paymentId: response.razorpay_payment_id,
                status: 'paid',
                mode: isEmi || verificationData.isEmiPayment ? 'EMI' : 'online',
              });
            } else reject(new Error(verificationData.error || 'Payment verification failed'));
          } catch (err) { reject(err); }
        },
        prefill: { name: `${formData.firstName} ${formData.lastName}`, email: formData.email, contact: formData.phonenumber },
        theme: { color: '#dc2626' },
        modal: { ondismiss: () => { setIsSubmitting(false); reject(new Error('Payment window closed')); } },
      };

      if (isEmi) {
        if (IS_RAZORPAY_TEST_MODE) {
          toast.info(
            `Test mode: choose Card in Razorpay and use EMI test card ${RAZORPAY_EMI_TEST_CARD} (any CVV & future expiry).`,
            { autoClose: 12000 },
          );
          options.description = 'EMI test payment';
          options.config = {
            display: {
              sequence: ['card'],
              preferences: { show_default_blocks: true },
            },
          };
        } else {
          options.config = {
            display: {
              sequence: ['emi', 'card', 'netbanking', 'upi', 'wallet'],
              preferences: { show_default_blocks: true },
            },
          };
        }
      }

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      razorpay.on('payment.failed', (response) => { setIsSubmitting(false); reject(new Error(response.error.description)); });
    });
  };

  const handlePayuPayment = async ({ orderNumber, totalAmount, userId, customerName, customerEmail, customerPhone }) => {
    try {
      const initRes = await fetch('/api/payu/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: orderNumber,
          amount: totalAmount,
          firstname: customerName || 'Customer',
          email: customerEmail || 'customer@example.com',
          phone: customerPhone || '',
          productinfo: `Order #${orderNumber}`,
          user_id: userId,
        }),
      });

      const initData = await initRes.json();
      if (!initRes.ok || !initData.success) {
        const errMsg = initData?.error || 'Failed to initialize PayU payment';
        toast.error(errMsg);
        setIsSubmitting(false);
        throw new Error(errMsg);
      }

      const { action, params } = initData;

      // Dynamically submit form to PayU gateway
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = action;

      for (const [key, val] of Object.entries(params)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = val;
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
      return new Promise(() => {}); // Hold while browser redirects
    } catch (err) {
      setIsSubmitting(false);
      throw err;
    }
  };


  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalDiscount = cartItems.reduce((sum, item) => sum + (item.discount || 0), 0);
  const warrantyTotal = cartItems.reduce((sum, item) => sum + (item.warrantyData?.price || 0), 0);
  const selectedWarrantyYears = cartItems
    .map((item) => Number(item.warrantyData?.year) || 0)
    .filter((year) => year > 0);
  const selectedWarrantyYear = selectedWarrantyYears.length
    ? Math.max(...selectedWarrantyYears)
    : null;
  const warrantyBadgeLabel = selectedWarrantyYear
    ? `${selectedWarrantyYear} year${selectedWarrantyYear > 1 ? "s" : ""} warranty`
    : "Brand warranty";

  const mrpTotal = cartItems.reduce((sum, item) => sum + ((item.actual_price ?? item.price ?? 0) * item.quantity), 0);
  const itemDiscountTotal = cartItems.reduce((sum, item) => {
    const mrp = (item.actual_price ?? item.price ?? 0) * item.quantity;
    const selling = (item.price > 0 ? item.price : item.actual_price) * item.quantity;
    return sum + (mrp - selling);
  }, 0);
  const totalExchangeDiscount = cartItems.reduce((sum, item) => {
    return sum + (Number(item.exchangeOffer?.price || 0) * item.quantity);
  }, 0);
  const sellingPrice = mrpTotal - itemDiscountTotal;

  const uniqueCities = [...new Set(stores.map(s => s.city))];
  const finalCities = [...new Set([...uniqueCities, ...extraCities])].sort();

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (isSubmitting) return;
    setError('');
    console.log("Applied coupon at order time:", appliedCoupon);
    try {
      const token = localStorage.getItem('token');
      if (!token) { setShowAuthModal(true); return; }
      const decoded = jwtDecode(token);
      const userId = decoded.userId;
      const shippingAddress = savedAddresses.find(a => a._id === shippingAddressId);
      const billingAddress = billingSameAsShipping ? shippingAddress : savedAddresses.find(a => a._id === billingAddressId);

      if (hasPincodeMismatch) {
        toast.error(
          `Delivery pincode (${normDeliveryPin}) does not match your selected location pincode (${normHeaderPin}).`
        );
        setIsSubmitting(false);
        return;
      }

      if (formData.deliveryType === 'home' && paymentMethod === 'Cash on Delivery') {
        toast.error('Cash on delivery is not available for home delivery. Please select online payment.');
        setPaymentMethod('online');
        setIsSubmitting(false);
        return;
      }

      if (!shippingAddress) {
        toast.error('Please select a shipping address.');
        return;
      }
      if (!billingAddress) {
        toast.error('Please select a billing address.');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email || !emailRegex.test(formData.email)) {
        setTouched(prev => ({ ...prev, email: true }));
        toast.error('Please enter a valid email address.');
        return;
      }

      if (formData.deliveryType === 'store') {
        if (!formData.selectedStore) {
          toast.error('Please select a store.');
          return;
        }
        if (!formData.phonenumber) {
          toast.error('Please provide your phone number.');
          return;
        }
      }

      if (formData.needGstInvoice && !formData.gst_number?.trim()) {
        setTouched((prev) => ({ ...prev, gst_number: true }));
        toast.error('Please enter your GST number.');
        return;
      }

      const gstNumber = formData.needGstInvoice ? formData.gst_number.trim().toUpperCase() : '';

      setIsSubmitting(true);
      const totalAmount = orderSummary.total;
      let savedAddressId = shippingAddress?._id;
      let savedBillingId = billingAddress?._id;

      const deliveryAddress = shippingAddress ? [
        shippingAddress.address1, shippingAddress.address2,
        shippingAddress.locality, shippingAddress.landmark,
        shippingAddress.city, shippingAddress.state, "India", shippingAddress.pincode,
      ].filter(Boolean).join(', ') : [formData.address, formData.landmark, formData.city, formData.state, "India", formData.postCode].filter(Boolean).join(', ');

      const billingAddressStr = billingAddress ? [
        billingAddress.address1, billingAddress.address2,
        billingAddress.locality, billingAddress.landmark,
        billingAddress.city, billingAddress.state, "India", billingAddress.pincode,
      ].filter(Boolean).join(', ') : deliveryAddress;

      const comments = formData.additionalInfo || '';

      const orderUserName = formData.deliveryType === 'home' && shippingAddress ? shippingAddress.username : (formData.firstName || 'Customer');
      const orderPhone = formData.deliveryType === 'home' && shippingAddress ? shippingAddress.phonenumber : formData.phonenumber;
      const orderEmail = formData.email;

      const pickupStoreName = formData.deliveryType === 'store'
        ? (selectedStoreObj?.title || selectedStoreObj?.organisation_name)
        : undefined;

      const isKarnataka = formData.deliveryType === 'store'
        ? (
            isKarnatakaPincode(normHeaderPin) ||
            isKarnatakaPincode(selectedStoreObj?.pincode || selectedStoreObj?.zip || '') ||
            /karnataka/i.test(selectedStoreObj?.state || '') ||
            /karnataka/i.test(selectedStoreObj?.city || '') ||
            isKarnatakaPincode(normDeliveryPin)
          )
        : (
            isKarnatakaPincode(normDeliveryPin) ||
            isKarnatakaPincode(normHeaderPin) ||
            /karnataka/i.test(currentSt)
          );

      if (shippingAddress?.pincode) {
        try {
          setPincode(shippingAddress.pincode);
        } catch {}
      }

      let order_number = 'ORD' + Date.now() + (isKarnataka ? '-UL' : '');
      let paymentId = '', paymentStatus = '', paymentMode = '';

      if (paymentMethod === 'Cash on Delivery') {
        paymentId = 'COD_' + Date.now(); paymentStatus = 'pending'; paymentMode = 'Cash on Delivery';
      } else if (paymentMethod === 'pay_at_store') {
        paymentId = 'PAS_' + Date.now(); paymentStatus = 'pending'; paymentMode = 'Pay at Store';
      } else if (paymentMethod === 'online' || paymentMethod === 'emi') {
        try {
          const orderRes = await fetch('/api/orders/add', {
            method: 'POST', headers: getAuthHeaders(),
            body: JSON.stringify({
              user_id: userId,
              user_adddeliveryid: savedAddressId,
              user_addbillingid: savedBillingId,
              order_username: orderUserName,
              order_phonenumber: orderPhone, email_address: orderEmail,
              order_item: cartItems.map(item => ({
                ...item,
                warrantyData: item.warrantyData || null,
                store_id: formData.deliveryType === 'store' ? formData.selectedStore : (isKarnataka ? 'unilet' : null),
                coupondetails: appliedCoupon
                  ? [{ _id: appliedCoupon._id, offer_code: appliedCoupon.offer_code }]
                  : (Array.isArray(item.coupondetails) ? item.coupondetails : []),
              })),
              order_amount: totalAmount, order_deliveryaddress: deliveryAddress,
              order_billingaddress: billingAddressStr,
              promotion_code_applied: appliedCoupon?.offer_code || null,
              promotion_discount_applied: appliedCoupon ? (orderSummary.discount || 0) : 0,

              customer_comments: comments, payment_method: paymentMethod, payment_type: isKarnataka ? 'PayU' : paymentMode,
              order_status: 'payment_initialized',
              delivery_type: formData.deliveryType === 'store' ? 'store_pickup' : 'home',
              pickup_store: formData.deliveryType === 'store' ? formData.selectedStore : null,
              pickup_type: formData.deliveryType === 'store' ? formData.selectedStore : null,
              store_id: isKarnataka ? 'unilet' : (formData.deliveryType === 'store' ? formData.selectedStore : null),
              region: isKarnataka ? 'karnataka' : 'tamilnadu',
              order_owner: isKarnataka ? 'unilet' : 'sathya',
              gst_number: gstNumber,
              payment_id: '', payment_status: 'payment_initialized',
              order_number: order_number || undefined,
              pincode: normDeliveryPin || normHeaderPin,
              order_details: cartItems.map(item => ({ item_code: `ITEM${item.item_code}`, product_id: item.productId || item.id || item._id, product_name: item.name, product_price: item.price, model: 'N/A', user_id: userId, coupondiscount: 0, created_at: new Date(), updated_at: new Date(), quantity: item.quantity, store_id: formData.deliveryType === 'store' ? formData.selectedStore : (isKarnataka ? 'unilet' : 'STORE01'), orderNumber: order_number || undefined })),
            }),
          });
          const orderData = await orderRes.json();
          if (!orderRes.ok || !orderData.success) {
            toast.error(orderData?.message || 'Failed to initialize order');
            setIsSubmitting(false);
            return;
          }

          order_number = orderData?.order?.order_number || orderData?.orders?.[0]?.order_number || order_number;

          if (isKarnataka) {
            // Karnataka orders proceed directly to PayU gateway
            await handlePayuPayment({
              orderNumber: order_number,
              totalAmount: Number(orderData?.order?.order_amount) || totalAmount,
              userId,
              customerName: orderUserName,
              customerEmail: orderEmail,
              customerPhone: orderPhone,
            });
            return;
          }

          let result = await handleOnlinePayment(totalAmount, paymentMethod === 'emi', order_number);
          paymentId = result.paymentId; paymentStatus = result.status; paymentMode = result.mode;
        } catch (error) { toast.error(`Payment failed: ${error.message}`); setIsSubmitting(false); return; }
      }

      const paymentRes = await fetch('/api/payment', {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({
          user_id: userId,
          payment_mode: paymentMode,
          status: paymentStatus,
          modevalue: totalAmount,
          payment_id: paymentId,
          payment_Date: new Date(),
          order_number,
        }),
      });
      if (!paymentRes.ok) throw new Error('Payment processing failed');
      const paymentData = (await paymentRes.json()).paymentData;

      const orderRes = await fetch('/api/orders/add', {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({
          user_id: userId,
          user_adddeliveryid: savedAddressId,
          user_addbillingid: savedBillingId,
          order_username: orderUserName,
          order_phonenumber: orderPhone, email_address: orderEmail,
          order_item: cartItems.map(item => ({
            ...item,
            warrantyData: item.warrantyData || null,
            store_id: formData.deliveryType === 'store' ? formData.selectedStore : (isKarnataka ? 'unilet' : null),
            coupondetails: appliedCoupon
              ? [{ _id: appliedCoupon._id, offer_code: appliedCoupon.offer_code }]
              : (Array.isArray(item.coupondetails) ? item.coupondetails : []),
          })),
          order_amount: totalAmount, order_deliveryaddress: deliveryAddress,
          order_billingaddress: billingAddressStr,
          promotion_code_applied: appliedCoupon?.offer_code || null,
          promotion_discount_applied: appliedCoupon ? (orderSummary.discount || 0) : 0,

          customer_comments: comments, payment_method: paymentMethod, payment_type: paymentMode,
          order_status: paymentMethod === 'Cash on Delivery' || paymentMethod === 'pay_at_store' ? 'pending' : 'ordered',
          delivery_type: formData.deliveryType === 'store' ? 'store_pickup' : 'home',
          pickup_store: formData.deliveryType === 'store' ? formData.selectedStore : null,
          pickup_type: formData.deliveryType === 'store' ? formData.selectedStore : null,
          store_id: isKarnataka ? 'unilet' : (formData.deliveryType === 'store' ? formData.selectedStore : null),
          region: isKarnataka ? 'karnataka' : 'tamilnadu',
          order_owner: isKarnataka ? 'unilet' : 'sathya',
          pincode: normDeliveryPin || normHeaderPin,
          gst_number: gstNumber,
          payment_id: paymentData.payment_id, payment_status: paymentData.status,
          order_number: order_number || undefined,
          order_details: cartItems.map(item => ({ item_code: `ITEM${item.item_code}`, product_id: item.productId || item.id || item._id, product_name: item.name, product_price: item.price, model: 'N/A', user_id: userId, coupondiscount: 0, created_at: new Date(), updated_at: new Date(), quantity: item.quantity, store_id: formData.deliveryType === 'store' ? formData.selectedStore : (isKarnataka ? 'unilet' : 'STORE01'), orderNumber: order_number || undefined })),
        }),
      });
      if (!orderRes.ok) throw new Error('Order creation failed');

      const cartDelete = await fetch('/api/cart', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ clearAll: true }),
      });

      if (cartDelete.status === 401) { localStorage.removeItem('token'); router.push('/login'); return; }

      if (cartDelete.status === 200) {
        localStorage.removeItem('checkoutData'); localStorage.removeItem('appliedCoupon');
        const orderData = await orderRes.json();
        // ga4Purchase({ orderId: orderData.order.order_number, value: orderSummary.total, items: cartItems });

        // // SAP sync disabled for live — uncomment to send order data to SAP
        // await fetch('/api/send-order-detail-to-sap', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ order_number: orderData.order.order_number }),
        // });

        toast.success('Order placed successfully!');
        updateCartCount(0);
        router.push('/orders');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to place order. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto" />
          <p className="mt-4 text-gray-500 text-sm">Loading checkout…</p>
        </div>
      </div>
    );
  }

  // ─── Price summary helpers ─────────────────────────────────────────────────
  const productPrice = orderSummary.subtotal + orderSummary.discount;
  const shippingCost = shippingMethod === 'express' ? 299 : 0;
  const finalTotal = orderSummary.total + shippingCost;

  const handleAddressSaved = async (newOrUpdatedAddr) => {
    if (addressModalType === 'edit') {
      setSavedAddresses((prev) => prev.map((a) => (a._id === editAddressId ? newOrUpdatedAddr : a)));
      if (shippingAddressId === editAddressId && newOrUpdatedAddr.pincode) {
        await setPincode(newOrUpdatedAddr.pincode);
      }
      setAddressModalType('shipping');
      toast.success('Address updated successfully');
    } else {
      setSavedAddresses((prev) => [newOrUpdatedAddr, ...prev]);
      setShippingAddressId(newOrUpdatedAddr._id);
      if (billingSameAsShipping) {
        setBillingAddressId(newOrUpdatedAddr._id);
      }
      if (newOrUpdatedAddr.pincode) {
        await setPincode(newOrUpdatedAddr.pincode);
      }
      setShowAddressModal(false);
      toast.success('New address added & selected for delivery!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/40 text-gray-900 font-sans pb-16">
      {/* ── Top Step Progress Header ────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200/80 mb-6 py-4 px-4 sm:px-6 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <a href="/cart" className="text-gray-500 hover:text-[#d72828] transition-colors flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              <span>Back to Cart</span>
            </a>
            <span className="text-gray-300">/</span>
            <span className="text-[#d72828] font-extrabold">Secure Checkout</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-xs font-bold text-gray-400">
            <span className="text-[#d72828] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#d72828] text-white flex items-center justify-center text-[10px]">1</span>
              Contact & Delivery
            </span>
            <span className="text-gray-300">→</span>
            <span className={isDeliverySaved ? "text-[#d72828] flex items-center gap-1.5" : "flex items-center gap-1.5"}>
              <span className={`w-5 h-5 rounded-full ${isDeliverySaved ? 'bg-[#d72828] text-white' : 'bg-gray-200 text-gray-600'} flex items-center justify-center text-[10px]`}>2</span>
              Method
            </span>
            <span className="text-gray-300">→</span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px]">3</span>
              Payment & Order
            </span>
          </div>
        </div>
      </div>

      {/* ── Main layout ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* ══ LEFT — Form ═══════════════════════════════════════════════════ */}
          <div className="w-full lg:w-[58%] lg:pr-4">

            {/* 1. Contact Details */}
            <section className="mb-8">
              <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                Contact details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <FloatInput label="Phone number" name="phonenumber" type="tel" required
                    value={formData.phonenumber} onChange={handleChange} onBlur={handleBlur}
                    error={getFieldError('phonenumber')} />
                  {formData.phonenumber?.length === 10 && (
                    <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      We&apos;ll keep you updated on your order
                    </p>
                  )}
                </div>
                <FloatInput label="Email address" name="email" type="email" required
                  value={formData.email} onChange={handleChange} onBlur={handleBlur}
                  error={getFieldError('email')} />
              </div>
            </section>

            {/* 2. Delivery Options */}
            <section className="mb-8">
              <h2 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                Delivery options
              </h2>

              <DeliveryOptions
                formData={formData}
                handleChange={handleChange}
                isDeliverySaved={isDeliverySaved}
                setIsDeliverySaved={setIsDeliverySaved}
                stores={pickupStores}
                nearestStores={nearestStores}
                setNearestStores={setNearestStores}
                selectedPickupStore={selectedPickupStore}
                setSelectedPickupStore={setSelectedPickupStore}
                cartItems={cartItems}
                hasPincodeMismatch={hasPincodeMismatch}
                normDeliveryPin={normDeliveryPin}
                normHeaderPin={normHeaderPin}
                setPincode={setPincode}
              />

              {/* Address Selection UI (replaces inline form) */}
              {(formData.deliveryType === 'home' || formData.deliveryType === 'store') && (
                <div className="mt-6 space-y-4">
                  {/* Shipping Address Box */}
                  <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          Shipping Address
                        </h3>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={handleDetectCheckoutLocation}
                          disabled={isDetectingCheckoutLoc}
                          className="bg-red-50 hover:bg-red-100 text-[#d72828] border border-red-200 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-60 shadow-2xs"
                          title="Detect location and check delivery serviceability"
                        >
                          {isDetectingCheckoutLoc ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-[#d72828] border-t-transparent rounded-full animate-spin" />
                              <span>Detecting...</span>
                            </>
                          ) : (
                            <>
                              <span className="text-[#d72828] text-xs leading-none">✦</span>
                              <span>Detect Location</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddressModalType('shipping');
                            setShowAddressModal(true);
                          }}
                          className="text-red-600 text-sm font-medium hover:underline cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    </div>

                    {shippingAddressId && currentShipping ? (() => {
                      const addr = currentShipping;
                      const cleanVal = (val) => (!val || String(val).toUpperCase() === 'NULL') ? '' : val;
                      return (
                        <div className="text-sm text-gray-600">
                          <p className="font-semibold text-gray-800">{cleanVal(addr.username)}</p>
                          <p>{cleanVal(addr.address1)} {cleanVal(addr.address2) ? `, ${cleanVal(addr.address2)}` : ''}</p>
                          <p>{cleanVal(addr.city)}, {cleanVal(addr.state)} <strong>{cleanVal(addr.pincode)}</strong></p>
                          <p className="mt-1">Phone: {cleanVal(addr.phonenumber)}</p>
                        </div>
                      );
                    })() : (
                      <div className="py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-500 mb-2">Kindly add a Shipping Address</p>
                        <button type="button" onClick={() => { setAddressModalType('new'); setShowAddressModal(true); }} className="text-red-600 text-sm font-medium hover:underline">+ Add Address</button>
                      </div>
                    )}
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pl-1">
                    <input type="checkbox" className="rounded text-red-600 focus:ring-red-600 w-4 h-4"
                      checked={billingSameAsShipping}
                      onChange={(e) => {
                        setBillingSameAsShipping(e.target.checked);
                        if (e.target.checked) setBillingAddressId(shippingAddressId);
                      }} />
                    <span className="text-sm font-medium text-gray-700">Billing same as shipping</span>
                  </label>

                  {/* Billing Address Box */}
                  {!billingSameAsShipping && (
                    <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          Billing Address
                        </h3>
                        <button type="button" onClick={() => { setAddressModalType('billing'); setShowAddressModal(true); }} className="text-red-600 text-sm font-medium hover:underline">
                          Change
                        </button>
                      </div>

                      {billingAddressId && savedAddresses.find(a => a._id === billingAddressId) ? (() => {
                        const addr = savedAddresses.find(a => a._id === billingAddressId);
                        const cleanVal = (val) => (!val || String(val).toUpperCase() === 'NULL') ? '' : val;
                        return (
                          <div className="text-sm text-gray-600">
                            <p className="font-semibold text-gray-800">{cleanVal(addr.username)}</p>
                            <p>{cleanVal(addr.address1)} {cleanVal(addr.address2) ? `, ${cleanVal(addr.address2)}` : ''}</p>
                            <p>{cleanVal(addr.city)}, {cleanVal(addr.state)} {cleanVal(addr.pincode)}</p>
                            <p className="mt-1">Phone: {cleanVal(addr.phonenumber)}</p>
                          </div>
                        );
                      })() : (
                        <div className="py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
                          <p className="text-sm text-gray-500 mb-2">Kindly add a Billing Address</p>
                          <button type="button" onClick={() => { setAddressModalType('new'); setShowAddressModal(true); }} className="text-red-600 text-sm font-medium hover:underline">+ Add Address</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}


              {/* GST invoice (optional) — after delivery address inputs */}
              <div className="mt-4">
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 bg-white cursor-pointer hover:border-gray-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.needGstInvoice}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        needGstInvoice: e.target.checked,
                        gst_number: e.target.checked ? prev.gst_number : '',
                      }))
                    }
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800">
                      Need a GST Invoice?{' '}
                      <span className="font-normal text-gray-500">(optional)</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Tick to add your GST details and get a business invoice
                    </p>
                  </div>
                </label>
                {formData.needGstInvoice && (
                  <div className="mt-3">
                    <FloatInput
                      label="GST number"
                      name="gst_number"
                      required
                      value={formData.gst_number}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={
                        touched.gst_number && !formData.gst_number?.trim()
                          ? 'GST number is required'
                          : null
                      }
                      maxLength={15}
                    />
                  </div>
                )}
              </div>
            </section>

            {/* 3. Shipping Method */}
            <section className="mb-8">
              <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                Shipping method
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: 'standard', label: 'Standard delivery', sub: '3–5 working days', price: 'FREE', free: true },
                  { value: 'express', label: 'Express delivery', sub: '1–2 working days', price: '₹299', free: false, disabled: true },
                ].map(opt => (
                  <label key={opt.value}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all
    ${opt.disabled ? 'cursor-not-allowed opacity-50 border-gray-200 bg-gray-50' : shippingMethod === opt.value ? 'cursor-pointer border-red-600 bg-red-50' : 'cursor-pointer border-gray-200 bg-white hover:border-gray-300'}`}
                  >
                    <input type="radio" name="shippingMethod" value={opt.value}
                      checked={shippingMethod === opt.value}
                      onChange={() => !opt.disabled && setShippingMethod(opt.value)}
                      disabled={opt.disabled}
                      className="sr-only" />
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                      ${shippingMethod === opt.value ? 'border-red-600' : 'border-gray-300'}`}>
                      {shippingMethod === opt.value && <div className="w-2 h-2 rounded-full bg-red-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                          ${opt.free ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {opt.price}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.sub}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* 4. Payment Method */}
            <section className="mb-8">
              <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">4</span>
                Payment method
              </h2>
              {(() => {
                const currentShipping = savedAddresses.find(a => a._id === shippingAddressId);
                const currentPin = currentShipping?.pincode || formData.postCode || '';
                const currentSt = currentShipping?.state || formData.state || '';
                const isKarnatakaDelivery = isKarnatakaPincode(currentPin) || /karnataka/i.test(currentSt);

                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        {
                          value: 'online', icon: (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          ),
                          label: 'Online payment',
                          sub: 'UPI, Cards, Netbanking'
                        },
                        ...(formData.deliveryType === 'store' ? [{
                          value: 'Cash on Delivery', icon: (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          ),
                          label: 'Cash on delivery',
                          sub: 'Pay when you pickup at store'
                        }] : []),
                        {
                          value: 'emi', icon: (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          ), label: 'EMI options', sub: 'Easy EMI from leading banks'
                        },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handlePaymentChange(opt.value)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center
                            ${paymentMethod === opt.value
                              ? 'border-red-600 bg-red-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'}`}
                        >
                          <span className={paymentMethod === opt.value ? 'text-red-600' : 'text-gray-500'}>
                            {opt.icon}
                          </span>
                          <span className={`text-xs font-semibold ${paymentMethod === opt.value ? 'text-red-700' : 'text-gray-700'}`}>
                            {opt.label}
                          </span>
                          <span className="text-[10px] text-gray-400 leading-tight">{opt.sub}</span>
                        </button>
                      ))}
                    </div>
                    {paymentMethod === 'emi' && !isKarnataka && IS_RAZORPAY_TEST_MODE && (
                      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 leading-relaxed">
                        <p className="font-semibold mb-1">Razorpay test mode — EMI testing</p>
                        <p>
                          A separate EMI tab is usually not shown in test mode. After you continue, select{' '}
                          <span className="font-semibold">Card</span> in Razorpay and pay with test card{' '}
                          <span className="font-mono font-semibold">{RAZORPAY_EMI_TEST_CARD}</span>{' '}
                          (any CVV, any future expiry). Order amount must be ₹3,000 or above.
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </section>



            {/* Comments */}
            <section className="mb-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Comments (optional)</h3>
              <textarea
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleChange}
                placeholder="Notes about your order"
                rows={3}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-200 resize-none"
              />
            </section>

            {/* Policy links */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-red-600 mb-6">
              {[['Privacy Policy', '/privacy-policy'], ['Terms & Conditions', '/terms-and-conditions'], ['Shipping Policy', '/shipping'], ['Cancellation & Refund Policy', '/cancellation-policy']].map(([label, href]) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="underline hover:text-red-800">{label}</a>
              ))}
            </div>

            {/* Safe bar */}
            <div className="flex items-center gap-2 py-3 border-t text-xs text-gray-400">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Safe and secure checkout. Your data is 100% protected.
            </div>
          </div>

          {/* ══ RIGHT — Order Summary ═════════════════════════════════════════ */}
          <div className="w-full lg:w-[40%] xl:w-[38%] lg:sticky lg:top-24 self-start">
            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">

              {/* Order Summary Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/60">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Order Summary</h2>
                  <span className="text-[11px] font-bold text-[#d72828] bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                    {cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0)} items
                  </span>
                </div>
                <a href="/cart" className="text-xs font-bold text-[#d72828] hover:text-[#b91c1c] transition-colors flex items-center gap-1">
                  <span>Edit cart</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                </a>
              </div>
              {/* Cart items list (Luxury Card System) */}
              <div className="max-h-72 overflow-y-auto p-4 space-y-2.5 border-b border-gray-100 scrollbar-hide bg-gray-50/30">
                {cartItems.map((item) => {
                  const imgSrc = item.image
                    ? (item.image.startsWith("http") ? item.image : item.image.startsWith("/") ? item.image : `/uploads/products/${item.image}`)
                    : (item.images?.[0] ? (item.images[0].startsWith("http") ? item.images[0] : `/uploads/products/${item.images[0]}`) : "/uploads/sathyalogo.webp");

                  const itemPrice = (item.price > 0 ? item.price : item.actual_price) * item.quantity;

                  return (
                    <div
                      key={`oi-${item.productId}`}
                      className="flex items-center gap-3.5 p-3 rounded-xl bg-white border border-gray-200/80 shadow-2xs hover:border-red-200/80 hover:shadow-xs transition-all duration-200 group"
                    >
                      {/* Image Frame */}
                      <div className="relative w-16 h-16 flex-shrink-0 border border-gray-200/80 rounded-lg overflow-hidden bg-white p-1.5 flex items-center justify-center">
                        <img
                          src={imgSrc}
                          alt={item.name}
                          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/uploads/sathyalogo.webp"; }}
                        />
                        <span className="absolute -top-1 -right-1 bg-[#d72828] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-2xs border border-white">
                          {item.quantity}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-[#d72828] transition-colors">
                          {item.name}
                        </h4>

                        {item.warrantyData && (
                          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                            <svg className="w-3 h-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            {item.warrantyData.year}yr Warranty
                          </span>
                        )}
                      </div>

                      {/* Price */}
                      <div className="text-sm font-black text-gray-900 whitespace-nowrap text-right">
                        ₹{itemPrice.toLocaleString('en-IN')}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sold by Sathya Stores */}
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-xs font-bold text-gray-800">
                    Sathya Stores
                  </span>
                </div>
                <span className="text-[10px] border px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1 text-emerald-800 bg-emerald-100/80 border-emerald-200/80">
                  <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Authorized Store
                </span>
              </div>

              {/* Price details */}
              <div className="px-5 py-4 border-b border-gray-200 space-y-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-3">Price details</p>

                {/* MRP */}
                <div className="flex justify-between text-sm text-gray-700">
                  <span>product price</span>
                  <span>₹{mrpTotal.toLocaleString('en-IN')}</span>
                </div>

                {/* Item discount (MRP - selling) */}
                {itemDiscountTotal > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>−₹{itemDiscountTotal.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* Exchange Discount */}
                {totalExchangeDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Exchange Value</span>
                    <span>−₹{totalExchangeDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}


                {/* Warranty */}
                {warrantyTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1 text-purple-700">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      {cartItems.find(i => i.warrantyData)?.warrantyData?.name || 'Extended warranty'}
                    </span>
                    <span className="text-red-600 font-medium">₹{warrantyTotal.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {cartItems.some(item => item.warranty > 0) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-700">Sathya Stores Care warranty</span>
                    <span className="text-red-600 font-medium">
                      ₹{cartItems.reduce((s, i) => s + (i.warranty || 0), 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {/* Subtotal */}
                <div className="flex justify-between text-sm text-gray-700 font-medium border-t border-gray-100 pt-2">
                  <span>Subtotal</span>
                  <span>₹{orderSummary.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-700">
                  <span>Delivery</span>
                  {shippingCost === 0
                    ? <span className="text-green-600 font-medium">FREE</span>
                    : <span>₹{shippingCost}</span>
                  }
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <div>
                    <span className="text-sm font-semibold text-gray-800">Total payable</span>
                    <p className="text-[10px] text-gray-400">Inclusive of all taxes</p>
                  </div>
                  <span className="text-lg font-bold text-gray-900">₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2 px-5 py-4 border-b border-gray-200">
                {[
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    ), label: warrantyBadgeLabel
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ), label: 'Free installation'
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ), label: '10 days replacement'
                  },
                ].map(b => (
                  <div key={b.label} className="flex flex-col items-center gap-1 text-center">
                    <span className="text-red-600">{b.icon}</span>
                    <span className="text-[10px] text-gray-500">{b.label}</span>
                  </div>
                ))}
              </div>

              {/* Help box */}
              <div className="mx-5 mb-4 border border-gray-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Need help before you buy? Our experts are here for you!
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <a href="tel:9842344323"
                    className="flex items-center justify-center gap-1.5 border border-green-200 rounded-lg py-2 px-1 text-[11px] sm:text-xs font-medium text-green-700 hover:bg-green-50 transition">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call expert
                  </a>
                  <button
                    type="button"
                    onClick={openLiveDemoModal}
                    className="flex flex-col items-center justify-center gap-1 border border-[#c4b5fd] rounded-lg bg-[#f5f3ff] hover:bg-[#ede9fe] transition py-2 px-1 text-center w-full"
                  >
                    <svg className="w-4 h-4 text-[#5B4CF5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#5B4CF5] leading-tight">
                      Sathya Stores Live<br />Video Demo
                    </span>
                  </button>
                </div>
              </div>

              {/* CTA button */}
              <div className="px-5 pb-5">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || loading || cartItems.length === 0 || !isDeliverySaved || hasPincodeMismatch}
                  className={`w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all
                    ${isSubmitting || loading || cartItems.length === 0 || !isDeliverySaved || hasPincodeMismatch
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]'}`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      Continue to payment
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              {/* Sathya Stores Promise */}
              <div className="px-5 py-4 bg-white border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-3">Sathya Stores Promise —</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    {
                      icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ), label: '100% genuine products'
                    },
                    {
                      icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      ), label: 'Brand warranty'
                    },
                    {
                      icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      ), label: 'Safe & secure delivery'
                    },
                    {
                      icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      ), label: 'Professional installation'
                    },
                    {
                      icon: (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      ), label: '47+ showrooms support network'
                    },
                  ].map(b => (
                    <div key={b.label} className="flex flex-col items-center gap-1 text-center">
                      <span className="text-red-600">{b.icon}</span>
                      <span className="text-[9px] text-gray-500 leading-tight">{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-30 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-xs text-gray-500">Total payable</p>
          <p className="text-base font-bold text-gray-900">₹{finalTotal.toLocaleString('en-IN')}</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || loading || cartItems.length === 0 || !isDeliverySaved}
          className={`px-6 h-11 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all
            ${isSubmitting || loading || cartItems.length === 0 || !isDeliverySaved
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700'}`}
        >
          {isSubmitting ? 'Processing…' : 'Place order →'}
        </button>
      </div>

      {/* Auth modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => { setShowAuthModal(false); window.location.reload(); }}
        />
      )}

      {/* Full-screen processing overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-gray-900">Processing your order</h3>
            <p className="mt-2 text-sm text-gray-500">Please wait while we process your payment and order details.</p>
          </div>
        </div>
      )}

      {/* Address Selection Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">
                {addressModalType === 'new' ? 'Add New Address' : addressModalType === 'edit' ? 'Edit Address' : `Select ${addressModalType === 'shipping' ? 'Shipping' : 'Billing'} Address`}
              </h3>
              <button type="button" onClick={() => setShowAddressModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-5">
              {addressModalType !== 'new' && addressModalType !== 'edit' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {savedAddresses.map((addr) => {
                    const cleanVal = (val) => (!val || String(val).toUpperCase() === 'NULL' ? '' : val);
                    const isAddrKarnataka = isKarnatakaPincode(addr.pincode) || /karnataka/i.test(addr.state || '');
                    const isSelected =
                      addressModalType === 'shipping' ? shippingAddressId === addr._id : billingAddressId === addr._id;

                    return (
                      <div
                        key={addr._id}
                        onClick={async () => {
                          if (addressModalType === 'shipping') {
                            setShippingAddressId(addr._id);
                            if (addr.pincode) {
                              await setPincode(addr.pincode);
                            }
                          }
                          if (addressModalType === 'billing') {
                            setBillingAddressId(addr._id);
                          }
                          setShowAddressModal(false);
                        }}
                        className={`relative border-2 rounded-xl p-4 cursor-pointer hover:border-red-500 transition-colors ${
                          isSelected ? 'border-red-500 bg-red-50/60' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-800">{cleanVal(addr.username)}</p>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isAddrKarnataka
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {isAddrKarnataka ? 'Karnataka' : 'Tamil Nadu'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {cleanVal(addr.address1)} {cleanVal(addr.address2) ? `, ${cleanVal(addr.address2)}` : ''}
                        </p>
                        <p className="text-sm text-gray-600">
                          {cleanVal(addr.city)}, {cleanVal(addr.state)} <strong>{cleanVal(addr.pincode)}</strong>
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Phone: {cleanVal(addr.phonenumber)}</p>
                        <button
                          type="button"
                          className="absolute bottom-4 right-4 text-xs font-medium text-blue-600 hover:underline bg-white/80 px-2 py-1 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditAddressId(addr._id);
                            setAddressModalType('edit');
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {addressModalType !== 'new' && addressModalType !== 'edit' && (
                <button
                  type="button"
                  onClick={() => {
                    setEditAddressId(null);
                    setAddressModalType('new');
                  }}
                  className="text-red-600 font-medium hover:underline mb-4 inline-block"
                >
                  + Add New Address
                </button>
              )}

              {(addressModalType === 'new' || addressModalType === 'edit') && (
                <AddressModalForm
                  addressModalType={addressModalType}
                  editAddressId={editAddressId}
                  savedAddresses={savedAddresses}
                  headerPincode={headerPincode}
                  initialDetectedLocation={prefilledDetectedLocation}
                  onSuccess={(newAddr) => {
                    setPrefilledDetectedLocation(null);
                    handleAddressSaved(newAddr);
                  }}
                  onCancel={() => {
                    setPrefilledDetectedLocation(null);
                    if (savedAddresses.length > 0) {
                      setAddressModalType('shipping');
                    } else {
                      setShowAddressModal(false);
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Accessible Location Mismatch Confirmation Modal */}
      {locationPromptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#d72828] shrink-0 text-lg font-bold">
                ✦
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-snug">
                  Location Detected
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Detected: <strong className="text-gray-800">{locationPromptData.detected.city || locationPromptData.detected.state} ({locationPromptData.detected.pincode})</strong>
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 mb-5 space-y-1.5">
              <p>
                Your selected shipping address is currently set to pincode{" "}
                <strong className="text-gray-900">{locationPromptData.currentShipping.pincode}</strong> (
                {locationPromptData.currentShipping.city || locationPromptData.currentShipping.state}).
              </p>
              <p className="text-gray-500 pt-1 font-medium">
                Would you like to switch to an address matching your detected location?
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              {locationPromptData.matchingSaved ? (
                <button
                  type="button"
                  onClick={() => {
                    setShippingAddressId(locationPromptData.matchingSaved._id);
                    if (billingSameAsShipping) {
                      setBillingAddressId(locationPromptData.matchingSaved._id);
                    }
                    toast.success("Switched to matching saved address");
                    setLocationPromptData(null);
                  }}
                  className="flex-1 bg-[#d72828] hover:bg-red-700 text-white font-semibold text-xs py-2.5 px-4 rounded-lg transition-all cursor-pointer shadow-sm text-center"
                >
                  Switch to Saved Address
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPrefilledDetectedLocation(locationPromptData.detected);
                    setAddressModalType('new');
                    setShowAddressModal(true);
                    setLocationPromptData(null);
                  }}
                  className="flex-1 bg-[#d72828] hover:bg-red-700 text-white font-semibold text-xs py-2.5 px-4 rounded-lg transition-all cursor-pointer shadow-sm text-center"
                >
                  Add Address for {locationPromptData.detected.pincode}
                </button>
              )}
              <button
                type="button"
                onClick={() => setLocationPromptData(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs py-2.5 px-4 rounded-lg transition-all cursor-pointer text-center"
              >
                Keep Current
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}