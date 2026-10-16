"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCart } from '@/context/CartContext';
import Link from "next/link";

const slugify = (str) => {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
};

const features = [
  { icon: "🚗", title: "Free Shipping", description: "Free shipping all over the US" },
  { icon: "🔒", title: "100% Satisfaction", description: "Guaranteed satisfaction with every order" },
  { icon: "💼", title: "Secure Payments", description: "We ensure secure transactions" },
  { icon: "💬", title: "24/7 Support", description: "We're here to help anytime" },
];

const ConfirmModal = ({ show, onClose, onConfirm }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 text-center shadow-xl"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Remove item?</h3>
          <p className="text-gray-500 mb-4">Are you sure you want to delete this item from your cart?</p>
          <div className="flex justify-center space-x-4">
            <button
              className="px-4 py-2 bg-gray-200 rounded-lg text-gray-700 hover:bg-gray-300"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-[#d72828] text-white rounded-lg hover:bg-[#d72828]"
              onClick={onConfirm}
            >
              Yes, Delete
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const SuccessModal = ({ show, message, onClose }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 text-center shadow-xl"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
        >
          <h3 className="text-xl font-semibold text-green-600 mb-2">Success!</h3>
          <p className="text-gray-500 mb-4">{message}</p>
          <button
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            onClick={onClose}
          >
            OK
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const CouponModal = ({ show, onClose, coupon, onApply, onChange, couponError, isValidating }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Apply Coupon</h3>
          <div className="flex mb-2">
            <input
              type="text"
              value={coupon}
              onChange={onChange}
              placeholder="Enter coupon code"
              className="flex-1 px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              onClick={onApply}
              disabled={isValidating}
              className="px-4 py-2 bg-[#d72828] text-white rounded-r-lg hover:bg-[#d72828] disabled:bg-[#d72828]"
            >
              {isValidating ? 'Applying...' : 'Apply'}
            </button>
          </div>
          {/* Error message with animation */}
          <AnimatePresence>
            {couponError && (
              <motion.p 
                className="text-red-500 text-sm mb-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {couponError}
              </motion.p>
            )}
          </AnimatePresence>
          <button
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            onClick={onClose}
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
export default function CartComponent() {
  const router = useRouter();
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { cartCount, updateCartCount } = useCart();
  
  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Coupon states
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          return;
        }

        const response = await fetch('/api/cart', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          method: "GET"
        });

        if (!response.ok) {
           const datares = await response.json();
          if (
            datares.error === "Token has expired" ||
            datares.error === "Invalid token" ||
            datares.error === "Authorization token required"
          ) {
            localStorage.removeItem("token");
            window.location.reload(); // refresh page
            return;
          }
        }

        const data = await response.json();
        // Initialize discount for each item to 0
        const itemsWithDiscount = data.cart.items.map(item => ({
          ...item,
          discount: 0
        }));
        
        setCartData({
          ...data.cart,
          items: itemsWithDiscount
        });

        // Check if there's a coupon in localStorage
        const savedCoupon = localStorage.getItem('appliedCoupon');
        if (savedCoupon) {
          const coupon = JSON.parse(savedCoupon);
          setAppliedCoupon(coupon);
          // Apply discount to items when loading
          applyDiscountToItems(coupon, itemsWithDiscount);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCartData();
  }, [router]);

  // Apply discount to specific items based on coupon
  const applyDiscountToItems = (coupon, items) => {
    if (!coupon || !coupon.offer_product || !items) return items;
    
    return items.map(item => {
      // Check if this item is eligible for discount
      const isEligible = coupon.offer_product.includes(item.productId);
      
      // Calculate discount for this item
      let discount = 0;
      let coupondetails = [];
      if (isEligible) {
        if (coupon.offer_type === "percentage") {
          coupondetails.push(coupon);
          discount = item.price * item.quantity * (coupon.percentage / 100);
        } else if (coupon.offer_type === "fixed_price") {
          // Fixed price discount is divided among eligible items
          const eligibleItems = items.filter(i => coupon.offer_product.includes(i.productId));
          discount = coupon.fixed_price / eligibleItems.length;
            coupondetails.push(coupon);
        }
      }
      
      return {
        ...item,
        discount: parseFloat(discount.toFixed(2)),
        coupondetails :coupondetails
      };
    });
  };

const updateQuantity = async (productId, newQuantity, original_quantity = null) => {
  try {
    if (original_quantity !== null && newQuantity > original_quantity) {
      setSuccessMessage("Requested quantity exceeds available stock.");
      setShowSuccessModal(true);
      return;
    }

    const token = localStorage.getItem('token');
    const response = await fetch('/api/cart', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ productId, quantity: newQuantity })
    });

    if (!response.ok) {
      throw new Error('Failed to update quantity');
    }

    const updatedCart = await response.json();

    // ✅ Merge with existing items so image/name don’t vanish
    const itemsWithDiscount = updatedCart.cart.items.map(item => {
      const existingItem = cartData.items.find(i => i.productId === item.productId);
      return {
        ...existingItem, // keeps image, name, etc.
        ...item,         // updates quantity, price
        discount: existingItem ? existingItem.discount : 0,
        original_quantity: existingItem?.original_quantity ?? item.original_quantity ?? Infinity // ✅ keep stock info
      };
    });

    setCartData({
      ...updatedCart.cart,
      items: itemsWithDiscount
    });

    updateCartCount(updatedCart.cart.totalItems);

    // Reapply coupon if exists
    if (appliedCoupon) {
      const itemsWithUpdatedDiscount = applyDiscountToItems(appliedCoupon, itemsWithDiscount);
      setCartData(prev => ({
        ...prev,
        items: itemsWithUpdatedDiscount
      }));
    }

    setSuccessMessage("Quantity updated successfully");
    setShowSuccessModal(true);

  } catch (err) {
    console.error('Update quantity error:', err);
    setError(err.message);
  }
};


  const confirmRemoveItem = (productId) => {
    setProductToDelete(productId);
    setShowConfirmModal(true);
  };

  const removeItem = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId: productToDelete })
      });

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      const updatedCart = await response.json();
      
      // Preserve discounts for remaining items
      const itemsWithDiscount = updatedCart.cart.items.map(item => {
        const existingItem = cartData.items.find(i => i.productId === item.productId);
        return {
          ...item,
          discount: existingItem ? existingItem.discount : 0
        };
      });
      
      setCartData({
        ...updatedCart.cart,
        items: itemsWithDiscount
      });
      
      updateCartCount(updatedCart.cart.totalItems);
      
      // Remove coupon if it was product-specific and the product is removed
      if (appliedCoupon && appliedCoupon.offer_product && appliedCoupon.offer_product.includes(productToDelete)) {
        setAppliedCoupon(null);
        localStorage.removeItem('appliedCoupon');
        
        // Remove discounts from all items
        setCartData(prev => ({
          ...prev,
          items: prev.items.map(item => ({
            ...item,
            discount: 0
          }))
        }));
      }
      
      setSuccessMessage("Item removed from cart");
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Remove item error:', err);
      setError(err.message);
    } finally {
      setShowConfirmModal(false);
      setProductToDelete(null);
    }
  };
const validateCoupon = async () => {
  if (!couponCode.trim()) {
    setCouponError("Please enter a coupon code");
    return;
  }

  setIsValidatingCoupon(true);
  setCouponError("");

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        couponCode,
        cartItems: cartData.items,
        userId: localStorage.getItem('userId')
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Invalid coupon code');
    }

    // Apply discount to eligible items
    const itemsWithDiscount = applyDiscountToItems(data.coupon, cartData.items);
    
    // Update state
    setAppliedCoupon(data.coupon);
    localStorage.setItem('appliedCoupon', JSON.stringify(data.coupon));
    setCartData(prev => ({
      ...prev,
      items: itemsWithDiscount
    }));
    
    setCouponCode("");
    setShowCouponModal(false);
    setSuccessMessage("Coupon applied successfully!");
    setShowSuccessModal(true);
  } catch (err) {
    setCouponError(err.message);
    // Auto-close the modal after 2 seconds only for "not found" errors
    if (err.message.includes("not found") || err.message.includes("Invalid")) {
      setTimeout(() => {
        setShowCouponModal(false);
        setCouponError(""); // Clear error after closing
      }, 2000);
    }
  } finally {
    setIsValidatingCoupon(false);
  }
};
  // const validateCoupon = async () => {
  //   if (!couponCode.trim()) {
  //     setCouponError("Please enter a coupon code");
  //     return;
  //   }

  //   setIsValidatingCoupon(true);
  //   setCouponError("");

  //   try {
  //     const token = localStorage.getItem('token');
  //     const response = await fetch('/api/coupons/validate', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${token}`
  //       },
  //       body: JSON.stringify({ 
  //         couponCode,
  //         cartItems: cartData.items,
  //         userId: localStorage.getItem('userId')
  //       })
  //     });

  //     const data = await response.json();

  //     if (!response.ok) {
  //       throw new Error(data.message || 'Failed to validate coupon');
  //     }

  //     // Apply discount to eligible items
  //     const itemsWithDiscount = applyDiscountToItems(data.coupon, cartData.items);
      
  //     // Update state
  //     setAppliedCoupon(data.coupon);
  //     localStorage.setItem('appliedCoupon', JSON.stringify(data.coupon));
  //     setCartData(prev => ({
  //       ...prev,
  //       items: itemsWithDiscount
  //     }));
      
  //     setCouponCode("");
  //     setShowCouponModal(false);
  //     setSuccessMessage("Coupon applied successfully!");
  //     setShowSuccessModal(true);
  //   } catch (err) {
  //     setCouponError(err.message);
  //   } finally {
  //     setIsValidatingCoupon(false);
  //   }
  // };

  const removeCoupon = () => {
    // Remove discounts from all items
    setCartData(prev => ({
      ...prev,
      items: prev.items.map(item => ({
        ...item,
        discount: 0
      }))
    }));
    
    setAppliedCoupon(null);
    localStorage.removeItem('appliedCoupon');
    setSuccessMessage("Coupon removed successfully");
    setShowSuccessModal(true);
  };

  const calculateSubtotal = () => {
    if (!cartData) return 0;
    
    return cartData.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity) + (item.warranty || 0) + (item.extendedWarranty || 0);
    }, 0);
  };

  const calculateDiscount = () => {
    if (!appliedCoupon || !cartData) return 0;
    
    return cartData.items.reduce((sum, item) => sum + (item.discount || 0), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    return subtotal - discount;
  };

  const proceedToCheckout = () => {

  if (!cartData) return;

  // Calculate totals

  const subtotal = calculateSubtotal();

  const discount = calculateDiscount();

  const total = calculateTotal();

  // Save cart and coupon data to localStorage for checkout page

  localStorage.setItem('checkoutData', JSON.stringify({

    cart: {

      ...cartData,

      items: cartData.items.map(item => ({

        ...item,

        // Ensure all relevant fields are included

        productId: item.productId,

        name: item.name,

        price: item.price,

        quantity: item.quantity,

        warranty: item.warranty || 0,

        extendedWarranty: item.extendedWarranty || 0,

        discount: item.discount || 0,

        image: item.image

      }))

    },

    coupon: appliedCoupon,

    discount,

    subtotal,

    total

  }));

  router.push('/checkout');

};
 

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 bg-red-50 rounded-lg max-w-md mx-4">
          <p className="text-[#d72828] font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!cartData || cartData.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md mx-4">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet</p>
          <button 
            onClick={() => router.push('/index')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Modals */}
      <ConfirmModal
        show={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setProductToDelete(null);
        }}
        onConfirm={removeItem}
      />
      <SuccessModal
        show={showSuccessModal}
        message={successMessage}
        onClose={() => setShowSuccessModal(false)}
      />
     <CouponModal
  show={showCouponModal}
  onClose={() => {
    setShowCouponModal(false);
    setCouponError(""); // Clear error when closing manually
  }}
  coupon={couponCode}
  onApply={validateCoupon}
  onChange={(e) => setCouponCode(e.target.value)}
  couponError={couponError}
  isValidating={isValidatingCoupon}
/>

    {/* Header */}
      <div className=" sm:pl-[3rem] sm:pr-[2rem] flex flex-col sm:flex-row justify-between items-center gap-2 my-[35px]">
        <div style={{ "--heading-color": "#d72828" }}>
          <h1 className="font-bold text-[1.75rem] text-[#d72828]"> My Cart</h1>
        </div>
        
      </div>

       {/* Main Content */}

        
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-[35px] px-4 sm:pl-[3rem] sm:pr-[2rem] py-0">
        
        {/* Left Side - Cart Table (big width) */}
        <div className="lg:col-span-2">
          <div className="overflow-x-auto bg-white rounded-lg border">
              <table className="min-w-full border">
                      <thead className="bg-white-50 border-b">
                        <tr>
                          <th className="py-3 px-4 text-center text-gray-500 text-sm font-semibold cursor-pointer ">Product</th>
                          <th className="text-center text-gray-500 text-sm font-semibold cursor-pointer ">Quantity</th>
                          <th className="text-center text-gray-500 text-sm font-semibold cursor-pointer ">Subtotal</th>
                          <th className="text-center text-gray-500 text-sm font-semibold cursor-pointer ">&emsp;</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cartData.items.map((item) => (
                          <Fragment key={item.productId}>
                            {/* Product Row */}
                         
                            <tr className="border-b px-0 py-8">
                                <td className="flex items-center py-4 px-4 gap-3">
                                <Image
                                  src={`/uploads/products/${item.image}`}
                                  alt={item.name}
                                  width={100}
                                  height={100}
                                  className="rounded-md"
                                />
                                <div className="relative group w-full  py-0">
                                  {/* Vertical stack for item info */}
                                  <div className="flex flex-col gap-1">
                                    {/* Item Code */}
                                    <h3 className="py-1 text-gray-500 text-xs font-semibold cursor-pointer hover:text-[#c02020]"cstyle={{ fontSize: ".95rem" }}>
                                      {item.item_code}
                                    </h3>

                                    {/* Product Name */}
                                    <Link href={`/product/${slugify(item.name)}`}>
                                      <p className="py-1  font-semibold text-xs  text-[#d72828] hover:text-[#c02020] break-words whitespace-normal" style={{ fontSize: ".95rem" }}>
                                        {item.name.length > 35 ? item.name.slice(0, 35) + "..." : item.name}
                                      </p>
                                    </Link>

                                    {/* Tooltip for full name */}
                                    <div className="py-1 absolute z-10 hidden group-hover:block bg-black text-white text-sm px-2 py-1 rounded shadow-md top-full mt-1 max-w-xs w-max whitespace-normal" style={{ fontSize: ".95rem" }}>
                                      {item.name}
                                    </div>

                                    {/* Prices */}
                                    <div className="flex items-center gap-2 ">
                                      <h3 className="text-gray-500 text-sm font-semibold" style={{ fontSize: ".85rem" }}>₹{item.price.toFixed(2)}</h3>
                                      <h3 className="text-gray-400 text-sm line-through" style={{ fontSize: ".85rem" }} >₹{item.price.toFixed(2)}</h3>
                                    </div>
                                  </div>
                                </div>
                                </td>
                                
                                <td className="py-4 px-4 text-center ">
                                  <div className="flex justify-center items-center gap-2 border border-gray-300 rounded p-1">
                                    <button
                                      className="px-2 py-1 text-black  hover:text-[#d72828] transition-colors rounded"
                                      onClick={() => updateQuantity(item.productId, item.quantity - 1, null)}
                                      disabled={item.quantity <= 1}
                                    >
                                      −
                                    </button>
                                    <span>{item.quantity}</span>
                                    <button
                                      className="px-2 py-1 text-black  hover:text-[#d72828] transition-colors rounded"
                                      onClick={() =>
                                        updateQuantity(item.productId, item.quantity + 1, item.original_quantity)
                                      }
                                    >
                                      +
                                    </button>
                                    
                                  </div>
                                  <button
                                    className="text-gray-500 text-xs font-semibold cursor-pointer hover:text-[#c02020]"
                                    onClick={() => confirmRemoveItem(item.productId)}
                                  >
                                    Remove
                                  </button>
                                </td>
                                <td className=" text-center font-semibold text-gray-900 text-sm font-semibold cursor-pointer ">
                                  ₹{(item.price * item.quantity).toFixed(2)}  
                                </td>
                                <td className="mt-2 py-4  text-center ">
                                    &emsp;
                                    </td>
                                
                            </tr>
                         
                              {(item.warranty > 0 || item.extendedWarranty > 0) && (
                                <tr className="border-b px-0 py-8 bg-gray-200">
                                    <td className="mt-2 py-4  text-center ">
                                    
                                    </td>
                                  
                                    <td className="mt-2 py-4   text-center ">
                                      <h3 className="text-center  text-gray-500 text-sm  font-semibold cursor-pointer py-1 ">
                                          Product Subtotal<br />
                                      </h3>
                                      <h3 className="text-center  text-gray-500 text-sm  font-semibold cursor-pointer py-1 ">
                                          Warranty<br />
                                      </h3>
                                      <h3 className="text-center  text-gray-500 text-sm  font-semibold cursor-pointer py-1 ">
                                          Extended Warranty<br />
                                      </h3>
                                      <h3 className="text-center  text-gray-500 text-sm  font-semibold cursor-pointer py-1 ">
                                          Discount<br />
                                      </h3>
                                    
                                    </td>

                                    <td className="mt-2 py-4  text-center ">
                                      <h3 className="text-center text-gray-500 text-sm font-semibold cursor-pointer py-1">
                                          ₹{(item.price * item.quantity).toFixed(2)}<br />
                                      </h3>
                                      <h3 className="text-center font-semibold text-gray-500 text-sm font-semibold cursor-pointer py-1">
                                          {item.warranty > 0 ? `₹${item.warranty.toFixed(2)}` : "-"}<br />
                                      </h3>
                                      <h3 className="text-center font-semibold text-gray-500 text-sm font-semibold cursor-pointer py-1">
                                          {item.extendedWarranty > 0 ? `₹${item.extendedWarranty.toFixed(2)}` : "-"}<br />
                                      </h3>
                                      <h3 className="text-center font-semibold text-gray-500 text-sm font-semibold cursor-pointer py-1">
                                          {item.discount > 0 ? `-₹${item.discount.toFixed(2)}` : "-"}
                                      </h3>
                                    
                                    </td>
                                    <td className="mt-2 py-4  text-center ">
                                    &emsp;
                                    </td>
                                    
                                </tr>
                              )}
                        

                            {/* Breakdown Row */}
                            {/* <tr className="bg-gray-50">
                              <td colSpan={4} className="py-3 px-4 text-right text-sm font-medium text-gray-500">
                                Product Subtotal
                                {(item.warranty > 0 || item.extendedWarranty > 0 || item.discount > 0) && (
                                  <>
                                    {item.warranty > 0 && <><br />Warranty</>}
                                    {item.extendedWarranty > 0 && <><br />Extended Warranty</>}
                                    {item.discount > 0 && <><br />Discount</>}
                                  </>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center text-sm font-semibold">
                                ₹{(item.price * item.quantity).toFixed(2)}
                                {(item.warranty > 0 || item.extendedWarranty > 0 || item.discount > 0) && (
                                  <>
                                    {item.warranty > 0 && <><br />₹{item.warranty.toFixed(2)}</>}
                                    {item.extendedWarranty > 0 && <><br />₹{item.extendedWarranty.toFixed(2)}</>}
                                    {item.discount > 0 && <><br />-₹{item.discount.toFixed(2)}</>}
                                  </>
                                )}
                              </td>
                            </tr> */}
                          </Fragment>
                        ))}

                        {/* ✅ Final Item Total Row (only once) */}
                        {/* <tr className="border-t bg-gray-100">
                          <td colSpan={4} className="py-3 px-4 text-right font-bold">Item Total:
      ₹{cartData.items.reduce(
                              (acc, item) =>
                                acc +
                                (item.price * item.quantity) +
                                (item.warranty || 0) +
                                (item.extendedWarranty || 0) -
                                (item.discount || 0),
                              0
                            ).toFixed(2)}

                          </td>
                        </tr> */}
                      </tbody>
              </table>
          </div>
            {/* Continue Shopping Button */}
          {/* <div className="flex justify-between items-center mt-6 flex-wrap gap-2">
            <button
              className="text-gray-500 hover:underline"
              onClick={() => router.push("/index")}
            >
              ← Continue Shopping
            </button>
          </div> */}
        </div>

        {/* Right Side - Cart Totals (small width) */}
        <div className="lg:col-span-1 bg-white p-3 rounded-lg border ">
          {/* Cart Totals content */}
          <h3 className="text-gray-500 text-sm font-semibold cursor-pointer">Cart Total</h3>
                
                {/* Coupon Section */}
                {/* <div className="mt-4">
                  {appliedCoupon ? (
                    <div className="bg-white-200 p-2 mt-0  rounded-lg flex justify-between text-red-500 text-large  cursor-pointer">
                      <span>YOU SAVED ₹{calculateTotal().toFixed(2)}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCouponModal(true)}
                      className="w-full py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
                      style={{
                        border: "1px solid #d72828",
                        color: "#d72828",
                        backgroundColor: "transparent",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#d72828"; // light blue
                        e.currentTarget.style.color = "white"; // optional if you want white text on hover
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#d72828";
                      }}
                    >
                      Apply Coupon
                    </button>
                  )}
                  {couponError && (
                    <p className="text-red-500 text-sm mb-2">{couponError}</p>
                  )}
                </div> */}
                
                <div className=" p-4 rounded-lg space-y-3">
                  <div className="flex justify-between text-gray-600 text-gray-500 text-sm font-semibold cursor-pointer ">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-900">
                      ₹{calculateSubtotal().toFixed(2)}
                    </span>
                    
                  </div>
                  <hr className="my-2 border-gray-300" />
                  {appliedCoupon && (
                    <div className="flex justify-between text-gray-600 text-gray-500 text-sm font-semibold cursor-pointer">
                      <span>Discount</span>
                      <span className="font-semibold text-green-600">
                        -₹{calculateDiscount().toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600 text-gray-500 text-sm font-semibold cursor-pointer">
                    <span>Estimated Delivery</span>
                    <span className="font-semibold text-gray-900">Free</span>
                  </div>
                  <hr className="my-2 border-gray-300" />
                  <div className="flex justify-between text-gray-600 text-gray-500 text-sm font-semibold cursor-pointer">
                    <span>Estimated Taxes</span>
                    <span className="font-semibold text-gray-900">₹0.00</span>
                  </div>
                  <hr className="my-2 border-gray-300" />
                </div>
              
                {/* Total price section */}
                <div className="bg-gray-200 p-4 mt-4  rounded-lg flex justify-between text-gray-900 font-bold text-gray-500 text-sm font-semibold cursor-pointer">
                  <span>Total</span>
                  <span className="text-gray-900 text-sm font-semibold cursor-pointer">
                    ₹{calculateTotal().toFixed(2)}
                  </span>
                </div>
              
              <button
                className="mt-4 text-white w-full py-3 rounded-md hover:brightness-110 transition-all text-gray-500 text-sm font-semibold cursor-pointer"
                style={{ backgroundColor: "#d72828" }}
                onClick={proceedToCheckout}
              >
                Checkout
              </button>

        </div>

      </div>

  </div>
  
  );
}