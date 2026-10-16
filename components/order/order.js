"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiChevronRight, FiClock, FiCheckCircle, FiTruck, FiShoppingBag, FiXCircle, FiRefreshCw } from 'react-icons/fi';
import { RiAccountCircleFill } from "react-icons/ri";
import { ToastContainer, toast } from 'react-toastify';
import { FaAddressBook } from "react-icons/fa";
import { HiShoppingBag } from "react-icons/hi2";
import { FaHeart } from "react-icons/fa6";
import { AuthModal } from '@/components/AuthModal';

const ORDER_TOAST_ID = "orders-toast";
const orderToast = {
  containerId: ORDER_TOAST_ID,
  autoClose: false,
  closeOnClick: false,
};

const getImageUrl = (img) => {
  if (!img) return null;
  const str = String(img).trim();
  if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:')) return str;
  if (str.startsWith('/uploads/products/')) return str;
  if (str.startsWith('/')) return str;
  return `/uploads/products/${str}`;
};

export default function Order() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(true);
  const [allOrders, setAllOrders] = useState([]);
  const [orderCounts, setOrderCounts] = useState({ total: 0, exist: 0, newOrders: 0 });
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelComments, setCancelComments] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [fetchingOrders, setFetchingOrders] = useState(false);
  const itemsPerPage = 5;
  const router = useRouter();

  const loadOrders = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setShowAuthModal(true);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/orders/get`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders data');
      }
      const data = await response.json();
      const visible = data?.orders || [];
      const existOrders = visible.filter((order) => {
        const existId = order.exist_id;
        return existId !== undefined && existId !== null && String(existId).trim() !== "" && String(existId).toLowerCase() !== "null";
      });
      setOrderCounts({
        total: visible.length,
        exist: existOrders.length,
        newOrders: visible.length - existOrders.length,
      });
      setAllOrders(visible);
      setCurrentPage(1);
    } catch (error) {
      toast.error("Failed to load orders data", orderToast);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadOrders();
  }, []);

  // Tabs filter the already-loaded orders locally
  const filteredOrders = useMemo(
    () =>
      activeFilter === "cancelled"
        ? allOrders.filter((order) => String(order.order_status || "").toLowerCase() === "cancelled")
        : allOrders,
    [allOrders, activeFilter]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  const handleFetchExistOrders = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setShowAuthModal(true);
      return;
    }

    setFetchingOrders(true);
    try {
      const response = await fetch("/api/orders/fetch-exist", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to fetch orders");
      }
      toast.success(data.message || "Orders fetched successfully", orderToast);
      setLoading(true);
      await loadOrders();
    } catch (error) {
      toast.error(error.message || "Failed to fetch orders", orderToast);
      console.error(error);
    } finally {
      setFetchingOrders(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getPaymentStatusLabel = (order) => {
    const raw = String(order.payment_status || "").trim();
    if (!raw) return "Not specified";
    const key = raw.toLowerCase();
    if (["paid", "captured", "success", "successful", "completed"].includes(key)) return "Paid";
    if (["pending", "created", "authorized", "payment_initialized", "unpaid"].includes(key)) return "Pending";
    if (["failed", "failure"].includes(key)) return "Failed";
    if (["cancelled", "canceled"].includes(key)) return "Cancelled";
    return raw;
  };

  const getPaymentMethodLabel = (order) => {
    const raw = String(
      order.payment_method || order.payment_type || order.payment_mode || ""
    ).trim();
    if (!raw) return "";
    const key = raw.toLowerCase();
    if (key === "cod" || key.includes("cash on delivery") || key.includes("cash on deliver")) {
      return "Cash on Delivery";
    }
    if (key === "online") return "Online";
    if (key === "emi") return "EMI";
    if (key.includes("pay at store") || key === "pay_at_store") return "Pay at Store";
    return raw;
  };

  const getPaymentStatusClass = (label) => {
    const key = String(label || "").toLowerCase();
    if (key === "paid") return "bg-green-100 text-green-800";
    if (key === "pending") return "bg-amber-100 text-amber-800";
    if (key === "failed" || key === "cancelled") return "bg-rose-100 text-rose-800";
    return "bg-gray-100 text-gray-700";
  };

  const getStatusKey = (status) => String(status || "").toLowerCase();

  // Spec: show Request Cancel only for online, non-warranty, Pending/Processing orders with no prior cancel request
  const canCancelOrder = (order) => {
    // 1. Already has a cancel request → hide
    if (order?.cancel_exists) return false;

    // 2. Must be an online order (order_details_new.type defaults to "online")
    const orderType = String(order?.type || "online").trim().toLowerCase();
    if (orderType !== "online") return false;

    // 3. Must NOT be a warranty item
    const hasWarrantyItem = (order?.order_item || []).some(
      (item) => Number(item.is_warranty) === 1
    );
    if (hasWarrantyItem) return false;

    // 4. Status must map to Pending or Processing
    const key = getStatusKey(order?.order_status);
    const allowed = new Set([
      "ordered",          // → Pending
      "order placed",     // → Pending
      "order accepted",   // → Processing
      "billed",           // → Processing (creates waiting request)
    ]);
    return allowed.has(key);
  };

  const getStatusBadge = (status) => {
    const key = getStatusKey(status);
    // Spec mapping: ordered/Order Placed → Pending, Order Accepted/Billed → Processing
    const styles = {
      pending: "bg-amber-100 text-amber-800",
      cancelled: "bg-rose-100 text-rose-800",
      shipped: "bg-indigo-100 text-indigo-800",
      "order placed": "bg-amber-100 text-amber-800",
      failure: "bg-red-100 text-red-800",
      payment_initialized: "bg-slate-100 text-slate-800",
      "payment initiated": "bg-slate-100 text-slate-800",
      "order accepted": "bg-sky-100 text-sky-800",
      complete: "bg-green-100 text-green-800",
      ordered: "bg-amber-100 text-amber-800",
      billed: "bg-sky-100 text-sky-800",
    };
    const labels = {
      pending: "Pending",
      cancelled: "Cancelled",
      shipped: "Shipped",
      "order placed": "Pending",
      failure: "Failure",
      payment_initialized: "Payment Initialized",
      "payment initiated": "Payment Initiated",
      "order accepted": "Processing",
      complete: "Completed",
      ordered: "Pending",
      billed: "Processing",
    };
    return {
      className: styles[key] || "bg-gray-100 text-gray-800",
      label: labels[key] || status || "Pending",
    };
  };

  const handleBuyAgain = () => {
    router.push('/');
  };

  const CANCEL_REASONS = [
    { value: "price too high", label: "Item Price/shipping cost is too high" },
    { value: "bought elsewhere", label: "Bought it from somewhere else" },
    { value: "mistake", label: "Order placed by mistake" },
    { value: "change address", label: "Need to change shipping address" },
    { value: "others", label: "My reason is not listed" },
  ];

  const handleCancelClick = (order) => {
    setSelectedOrder(order);
    setCancelReason("");
    setCancelComments("");
    setCancelFeedback(null);
    setCancelSubmitting(false);
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (cancelSubmitting) return;

    if (!cancelReason.trim()) {
      setCancelFeedback({ type: "error", message: "Please select a reason" });
      return;
    }

    setCancelSubmitting(true);
    setCancelFeedback(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch("/api/cancel_order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          reason: cancelReason,
          comments: cancelComments,
          cancel_order_number: selectedOrder?.order_number || "",
          cancel_order_id: selectedOrder?._id || "",
          customer_id: selectedOrder?.user_id || "",
          order_status: selectedOrder?.order_status || "",
        }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(data?.message || data?.result || "something is wrong. Please try again later!");
      }

      const resultText = String(data?.result || "").trim();
      if (resultText === "Success") {
        const isCancelled = data?.order_status === "Cancelled";
        setCancelFeedback({
          type: "success",
          message: isCancelled
            ? "Your order has been cancelled successfully."
            : "Your cancellation request has been submitted. We will notify you once it is processed.",
        });
        // Update local state: mark cancel_exists so button hides, update status if cancelled
        setAllOrders((prev) =>
          prev.map((order) =>
            order._id === selectedOrder._id
              ? {
                  ...order,
                  order_status: isCancelled ? "Cancelled" : order.order_status,
                  cancel_exists: true,
                }
              : order
          )
        );
        setTimeout(() => {
          setShowCancelConfirm(false);
          setSelectedOrder(null);
          setCancelReason("");
          setCancelComments("");
          setCancelFeedback(null);
          setCancelSubmitting(false);
        }, 2500);
        return;
      }

      setCancelFeedback({
        type: "error",
        message: resultText || data?.message || "something is wrong. Please try again later!",
      });
      setCancelSubmitting(false);
    } catch (error) {
      console.error(error);
      setCancelFeedback({
        type: "error",
        message: error.message || "something is wrong. Please try again later!",
      });
      setCancelSubmitting(false);
    }
  };

  const handleCancelReject = () => {
    if (cancelSubmitting) return;
    setShowCancelConfirm(false);
    setSelectedOrder(null);
    setCancelReason("");
    setCancelComments("");
    setCancelFeedback(null);
  };

  const pageCount = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const paginate = (page) => {
    if (page >= 1 && page <= pageCount) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <ToastContainer
        containerId={ORDER_TOAST_ID}
        position="top-right"
        autoClose={false}
        closeOnClick={false}
      />
      
      
      {/* Mobile Header */}
      <div className="lg:hidden bg-white py-4 px-4 shadow-sm flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-800">My Orders</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFetchExistOrders}
            disabled={fetchingOrders}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium disabled:opacity-50"
          >
            <FiRefreshCw className={fetchingOrders ? "animate-spin" : ""} />
            {fetchingOrders ? "Fetching..." : "Fetch"}
          </button>
          {/* <span className="inline-flex items-center px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
            LatesOrdersFetched
          </span> */}
        </div>
      </div>
      
      {/* Desktop Header */}
      <div className="hidden lg:block bg-red-50 py-6 px-8 flex justify-between items-center border-b border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800">My Orders</h2>
        <div className="flex items-center space-x-2 text-sm mt-1">
          <span className="text-gray-600">🏠 Home</span>
          <FiChevronRight className="text-gray-400" />
          <span className="text-gray-500">Shop</span>
          <FiChevronRight className="text-gray-400" />
          <span className="text-red-600 font-medium">Orders</span>
        </div>
      </div>

      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Sidebar Navigation - Desktop */}
          <div className="hidden lg:block w-full lg:w-72 flex-shrink-0">
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-red-600 transition-all duration-300 shadow-sm">
              <h3 className="text-lg font-semibold text-red-600 mb-6 pb-2 border-b border-gray-100">My Account</h3>
              <nav className="space-y-2">
                <Link href="/orders" className="w-full flex items-center gap-2 px-5 py-3 text-base font-medium text-gray-600 rounded-lg hover:text-red-600 hover:bg-red-50 hover:pl-6 transition-all">
                  <HiShoppingBag className="text-red-600 text-xl" />
                  <span>Orders</span>
                </Link>
                <Link href="/wishlist" className="w-full flex items-center gap-2 px-5 py-3 text-base font-medium text-gray-600 rounded-lg hover:text-red-600 hover:bg-red-50 hover:pl-6 transition-all">
                  <FaHeart className="text-red-600 text-xl" />
                  <span>Wishlist</span>
                </Link>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 hover:border-red-600 transition-all duration-300 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Your orders</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFetchExistOrders}
                    disabled={fetchingOrders}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 disabled:opacity-50"
                    title="Fetch exist orders"
                  >
                    <FiRefreshCw className={fetchingOrders ? "animate-spin" : ""} />
                    {fetchingOrders ? "Fetching..." : "Fetch"}
                  </button>
                  {/* <span className="inline-flex items-center px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                    LatesOrdersFetched
                  </span> */}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 sm:mb-6">
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-500">Total orders</p>
                  <p className="text-xl font-semibold text-gray-900">{orderCounts.total}</p>
                </div>
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                  <p className="text-xs text-blue-700">Exist orders</p>
                  <p className="text-xl font-semibold text-blue-800">{orderCounts.exist}</p>
                </div>
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-xs text-emerald-700">New website orders</p>
                  <p className="text-xl font-semibold text-emerald-800">{orderCounts.newOrders}</p>
                </div>
              </div>
              {/* Order Filters — All + Cancelled only.
                  To restore Pending / Shipped / Delivered tabs, uncomment them in the array below. */}
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6 pb-2 sm:pb-4 border-b border-gray-100 overflow-x-auto pb-2">
                {['all', /* 'pending', 'shipped', 'delivered', */ 'cancelled'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium flex items-center whitespace-nowrap ${
                      activeFilter === filter
                        ? filter === 'all'
                          ? 'bg-customBlue text-white'
                          : filter === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : filter === 'shipped'
                          ? 'bg-red-100 text-[#d72828]'
                          : filter === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {/* {filter === 'pending' && <FiClock className="mr-1" />} */}
                    {/* {filter === 'shipped' && <FiTruck className="mr-1" />} */}
                    {/* {filter === 'delivered' && <FiCheckCircle className="mr-1" />} */}
                    {filter === 'cancelled' && <FiXCircle className="mr-1" />}
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>

              {/* Orders List */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-customBlue mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading your orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <FiShoppingBag className="mx-auto text-4xl text-gray-300 mb-3 sm:mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No orders found</h3>
                  <p className="text-gray-500 mt-1 text-sm sm:text-base">
                    {activeFilter === 'all' 
                      ? "You haven't placed any orders yet" 
                      : `No ${activeFilter} orders found`}
                  </p>
                  <Link href="/" className="mt-4 sm:mt-6 inline-block px-4 sm:px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {paginatedOrders.map((order) => {
                    const statusKey = getStatusKey(order.order_status);
                    const paymentLabel = getPaymentStatusLabel(order);
                    const paymentMethodLabel = getPaymentMethodLabel(order);

                    // Stepper: determine current step index
                    const STEPPER_STEPS = [
                      { key: "ordered", label: "Ordered" },
                      { key: "order placed", label: "Order Placed" },
                      { key: "order accepted", label: "Order Accepted" },
                      { key: "billed", label: "Order Billed" },
                    ];
                    const activeStepIndex = STEPPER_STEPS.findIndex(
                      (s) => s.key === statusKey
                    );
                    const isCancelledOrFailure = statusKey === "cancelled" || statusKey === "failure" || statusKey === "complete";

                    const firstItem = order.order_item?.[0] || {};
                    const sellingPrice = firstItem.price || firstItem.product_price || order.order_amount;
                    const checkoutDiscount = firstItem.coupondiscount || 0;
                    const quantity = firstItem.quantity || 1;

                    const formatDate = (d) => {
                      if (!d) return "N/A";
                      const dt = new Date(d);
                      if (Number.isNaN(dt.getTime())) return "N/A";
                      return dt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
                    };
                    const formatTime = (d) => {
                      if (!d) return "N/A";
                      const dt = new Date(d);
                      if (Number.isNaN(dt.getTime())) return "N/A";
                      return dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
                    };

                    return (
                    <div key={order._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
                      {/* ── Header Bar: Order ID + Request Cancel ── */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                        <h4 className="text-sm sm:text-base font-bold text-gray-800 tracking-wide">
                          {order.order_number || order._id}
                        </h4>
                        <div className="flex items-center gap-3">
                          {canCancelOrder(order) && (
                            <button
                              onClick={() => handleCancelClick(order)}
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
                            >
                              Request Cancel
                            </button>
                          )}
                          {String(order.type || "online").trim().toLowerCase() === "offline" && order.invoice && (
                            <a
                              href={order.invoice}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors flex items-center gap-1"
                            >
                              Download Invoice
                            </a>
                          )}
                          {statusKey === "cancelled" && (
                            <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Cancelled</span>
                          )}
                          {statusKey === "failure" && (
                            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">Failure</span>
                          )}
                          {statusKey === "complete" && (
                            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">Completed</span>
                          )}
                        </div>
                      </div>

                      {/* ── Body: Image | Details | Meta ── */}
                      <div className="flex flex-col lg:flex-row p-4 gap-4 lg:gap-5">
                        {/* Product Image */}
                        <div className="w-28 sm:w-32 lg:w-36 flex-shrink-0 mx-auto lg:mx-0">
                          {firstItem.image ? (
                            <img
                              src={getImageUrl(firstItem.image)}
                              alt={firstItem.name || firstItem.product_name || "Product"}
                              className="w-full h-28 sm:h-32 object-contain rounded border border-gray-100"
                            />
                          ) : (
                            <div className="w-full h-28 sm:h-32 bg-gray-50 rounded border border-gray-100 flex items-center justify-center">
                              <FiShoppingBag className="text-2xl text-gray-300" />
                            </div>
                          )}
                        </div>

                        {/* Product Details (middle column) */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-1.5 leading-snug">
                            {firstItem.name || firstItem.product_name || "Product"}
                            {order.order_item?.length > 1 && (
                              <span className="text-gray-500 font-normal"> + {order.order_item.length - 1} more</span>
                            )}
                          </h3>

                          <p className="text-lg sm:text-xl font-bold text-[#d72828] mb-2">
                            ₹ {Number(order.order_amount || 0).toLocaleString("en-IN")}
                          </p>

                          {/* Warranty Data */}
                          {order.order_item?.some(item => item.warrantyData?.name) && (
                            <div className="mb-2">
                              {order.order_item.filter(item => item.warrantyData?.name).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-1 text-xs text-[#d72828] bg-red-50 px-2 py-0.5 rounded w-fit mb-1">
                                  🛡️ <span>{item.warrantyData.year} Yr Warranty</span>
                                  <span className="text-gray-500">— {item.warrantyData.name}</span>
                                  <span className="font-bold text-red-500 ml-1">₹{item.warrantyData.price}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Detail rows - table style for clean alignment */}
                          <table className="text-xs sm:text-sm text-gray-600 border-separate" style={{ borderSpacing: "0 2px" }}>
                            <tbody>
                              <tr>
                                <td className="text-gray-500 pr-1 whitespace-nowrap align-top">Selling Price</td>
                                <td className="text-gray-500 pr-2 align-top">:</td>
                                <td className="font-medium text-gray-800">₹{Number(sellingPrice || 0).toLocaleString("en-IN")}</td>
                              </tr>
                              <tr>
                                <td className="text-gray-500 pr-1 whitespace-nowrap align-top">Checkout Offer Discount</td>
                                <td className="text-gray-500 pr-2 align-top">:</td>
                                <td className="font-medium text-gray-800">₹{Number(checkoutDiscount || 0).toLocaleString("en-IN")}</td>
                              </tr>
                              <tr>
                                <td className="text-gray-500 pr-1 whitespace-nowrap align-top">Quantity</td>
                                <td className="text-gray-500 pr-2 align-top">:</td>
                                <td className="font-medium text-gray-800">{quantity}</td>
                              </tr>
                              <tr>
                                <td className="text-gray-500 pr-1 whitespace-nowrap align-top">Payment Method</td>
                                <td className="text-gray-500 pr-2 align-top">:</td>
                                <td className="font-medium text-gray-800">{paymentMethodLabel || "N/A"}{paymentLabel === "Paid" ? ` (${paymentLabel})` : ""}</td>
                              </tr>
                              {order.delivery_date && (
                                <tr>
                                  <td className="text-gray-500 pr-1 whitespace-nowrap align-top">Estimated Delivery Date</td>
                                  <td className="text-gray-500 pr-2 align-top">:</td>
                                  <td className="font-medium text-gray-800">{formatDate(order.delivery_date)}</td>
                                </tr>
                              )}
                              {String(order.type || "online").trim().toLowerCase() !== "offline" && (
                                <tr>
                                  <td className="text-gray-500 pr-1 whitespace-nowrap align-top">Tracking Details</td>
                                  <td className="text-gray-500 pr-2 align-top">:</td>
                                  <td className="font-medium text-gray-800"></td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Right Meta Column */}
                        <div className="flex-shrink-0 lg:w-48 lg:border-l lg:border-gray-200 lg:pl-4">
                          <div className="flex flex-row lg:flex-col flex-wrap gap-3 lg:gap-3 text-xs sm:text-sm border-t lg:border-t-0 border-gray-100 pt-3 lg:pt-0">
                            <div>
                              <p className="text-gray-400 flex items-center gap-1 mb-0.5">
                                <FiClock className="text-[10px]" /> Order Date
                              </p>
                              <p className="font-medium text-gray-800">{formatDate(order.createdAt)}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 flex items-center gap-1 mb-0.5">
                                <FiClock className="text-[10px]" /> Created Time
                              </p>
                              <p className="font-medium text-gray-800">{formatTime(order.createdAt)}</p>
                            </div>
                            {order.pickup_type && (
                              <div>
                                <p className="text-gray-400 flex items-center gap-1 mb-0.5">
                                  <FiTruck className="text-[10px]" /> Store
                                </p>
                                <p className="font-medium text-gray-800">{order.pickup_type}</p>
                              </div>
                            )}
                            {order.store_id && !order.pickup_type && (
                              <div>
                                <p className="text-gray-400 flex items-center gap-1 mb-0.5">
                                  <FiTruck className="text-[10px]" /> Channel
                                </p>
                                <p className="font-medium text-gray-800">{order.store_id}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ── Status Stepper ── */}
                      {!isCancelledOrFailure && String(order.type || "online").trim().toLowerCase() !== "offline" && (
                        <div className="px-4 pb-4 pt-2">
                          <div className="relative flex items-center justify-between">
                            {/* Background connector line */}
                            <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200 z-0" />
                            {/* Active connector line */}
                            {activeStepIndex > 0 && (
                              <div
                                className="absolute top-3 left-0 h-0.5 bg-[#d72828] z-10 transition-all duration-500"
                                style={{ width: `${(activeStepIndex / (STEPPER_STEPS.length - 1)) * 100}%` }}
                              />
                            )}

                            {STEPPER_STEPS.map((step, idx) => {
                              const isActive = idx === activeStepIndex;
                              const isCompleted = idx < activeStepIndex;
                              return (
                                <div key={step.key} className="relative z-20 flex flex-col items-center" style={{ width: `${100 / STEPPER_STEPS.length}%` }}>
                                  <div
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                      isActive
                                        ? "bg-[#d72828] border-[#d72828] shadow-md shadow-red-200"
                                        : isCompleted
                                        ? "bg-[#d72828] border-[#d72828]"
                                        : "bg-white border-gray-300"
                                    }`}
                                  >
                                    {(isActive || isCompleted) && (
                                      <FiCheckCircle className="text-white text-xs" />
                                    )}
                                  </div>
                                  <span className={`mt-1.5 text-[10px] sm:text-xs text-center leading-tight ${
                                    isActive ? "text-[#d72828] font-semibold" : isCompleted ? "text-[#d72828] font-medium" : "text-gray-400"
                                  }`}>
                                    {step.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Cancelled/Failure/Complete status bar */}
                      {isCancelledOrFailure && (
                        <div className={`px-4 py-2.5 text-xs font-medium flex items-center gap-1.5 ${
                          statusKey === "cancelled" ? "bg-rose-50 text-rose-700"
                          : statusKey === "failure" ? "bg-red-50 text-red-700"
                          : "bg-green-50 text-green-700"
                        }`}>
                          {statusKey === "cancelled" && <><FiXCircle /> Order was cancelled on {formatDateTime(order.updatedAt)}</>}
                          {statusKey === "failure" && <><FiXCircle /> Payment failed on {formatDateTime(order.createdAt)}</>}
                          {statusKey === "complete" && <><FiCheckCircle /> Order completed on {formatDateTime(order.updatedAt)}</>}
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}

              {!loading && filteredOrders.length > 0 && (
                <div className="flex justify-between items-center mt-6 flex-wrap gap-3">
                  <div className="text-sm text-gray-600">
                    Showing {filteredOrders.length > 0 ? startIndex + 1 : 0} to{" "}
                    {Math.min(startIndex + itemsPerPage, filteredOrders.length)} of{" "}
                    {filteredOrders.length} entries
                  </div>

                  <div className="pagination flex items-center space-x-1">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-1.5 border border-gray-300 rounded-md ${
                        currentPage === 1
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-black bg-white hover:bg-gray-100"
                      }`}
                      aria-label="Previous page"
                    >
                      «
                    </button>

                    {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => paginate(page)}
                        className={`px-3 py-1.5 border border-gray-300 rounded-md ${
                          currentPage === page
                            ? "bg-red-500 text-white"
                            : "text-black bg-white hover:bg-gray-100"
                        }`}
                        aria-label={`Page ${page}`}
                        aria-current={currentPage === page ? "page" : undefined}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === pageCount || pageCount === 0}
                      className={`px-3 py-1.5 border border-gray-300 rounded-md ${
                        currentPage === pageCount || pageCount === 0
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-black bg-white hover:bg-gray-100"
                      }`}
                      aria-label="Next page"
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Cancellation Request Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 relative shadow-xl">
            <button
              type="button"
              onClick={handleCancelReject}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none"
              aria-label="Close"
            >
              ×
            </button>

            <h3 className="text-xl font-semibold text-gray-800 mb-6 pr-8">
              Order Cancellation Request
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Reason
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  disabled={cancelSubmitting}
                  className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:bg-gray-100"
                >
                  <option value="">Select Reason</option>
                  {CANCEL_REASONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments
                </label>
                <textarea
                  value={cancelComments}
                  onChange={(e) => setCancelComments(e.target.value)}
                  rows={4}
                  disabled={cancelSubmitting}
                  className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 resize-y disabled:bg-gray-100"
                />
              </div>

              {cancelFeedback && (
                <div
                  className={`text-sm rounded-md px-3 py-2 ${
                    cancelFeedback.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {cancelFeedback.message}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={handleCancelConfirm}
                disabled={cancelSubmitting}
                className="px-8 py-2.5 bg-[#d72828] hover:bg-[#c02020] text-white text-sm font-bold uppercase tracking-wide rounded disabled:opacity-50"
              >
                {cancelSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            window.location.reload();
          }}
          error={authError}
        />
      )}
    </div>
  );
}