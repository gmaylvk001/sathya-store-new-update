"use client";

import React, { useState, useEffect, useRef } from "react";
import { MdCancel, MdLocalShipping, MdVisibility } from "react-icons/md";
import { Icon } from '@iconify/react';
import DateRangePicker from '@/components/DateRangePicker';

export default function PendingOrders() {
  const [activeTab, setActiveTab] = useState("pending");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [alertMessage, setAlertMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalType, setModalType] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [error, setError] = useState("");
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [viewOrderDetails, setViewOrderDetails] = useState(null);
  
  const itemsPerPage = 20;
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null
  });
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setSelectedOrder(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredOrders = orders
    .filter((order) => order.delivery_type === "home")
    .filter((order) => {
      const matchesSearch = order.order_number
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        order.payment_status?.toLowerCase() === statusFilter.toLowerCase();

      let matchesDate = true;
      if (dateFilter.startDate && dateFilter.endDate && order.createdAt) {
        const orderDate = new Date(order.createdAt);
        const startDate = new Date(dateFilter.startDate);
        const endDate = new Date(dateFilter.endDate);

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        matchesDate = orderDate >= startDate && orderDate <= endDate;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });

  const pageCount = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const handleDateChange = ({ startDate, endDate }) => {
    setDateFilter({ startDate, endDate });
    setCurrentPage(1);
  };

  const clearDateFilter = () => {
    setDateFilter({
      startDate: null,
      endDate: null
    });
    setCurrentPage(1);
  };

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= pageCount) {
      setCurrentPage(pageNumber);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/orders/getorder?status=${activeTab}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      } else {
        console.error("API Error:", data.error);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
    setLoading(false);
  };

  const handleOrderUpdate = async (orderId, status, reason = "") => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/orders/update`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: selectedOrder,
          order_status: modalType === "cancel" ? "cancelled" : "shipped",
          cancellation_reason: modalType === "cancel" ? cancellationReason : "",
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        setAlertMessage(`Order status updated to ${status}`);
        setCancellationReason("");
        fetchOrders();
        setTimeout(() => setAlertMessage(null), 3000);
      } else {
        setError(data.error || "Failed to update order status");
      }
    } catch (error) {
      setError("An error occurred while updating the order");
      console.error("Error updating order:", error);
    }
  };

  const handleViewOrder = (order) => {
    setViewOrderDetails(order);
    setShowOrderDetailsModal(true);
  };

  return (
    <div className="container mx-auto p-4">
      {/* Alert Message */}
      {alertMessage && (
        <div className="bg-green-500 text-white px-4 py-2 rounded-md mb-4">
          {alertMessage}
        </div>
      )}

      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold">Home Delivery Orders</h2>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-5 h-[500px] overflow-x-auto border border-gray-200">
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              >
                <option value="All">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            <div className="w-full col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <DateRangePicker onDateChange={handleDateChange} />
                </div>
                {(dateFilter.startDate || dateFilter.endDate) && (
                  <button
                    onClick={clearDateFilter}
                    className="p-2 text-sm text-red-600 hover:text-red-800 bg-red-50 rounded-md"
                    title="Clear date filter"
                  >
                    <Icon icon="mdi:close-circle-outline" className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <hr className="border-t border-gray-200 mb-4" />

          {/* Orders Table */}
          <table className="w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2">Order ID</th>
                <th className="p-2">Customer</th>
                <th className="p-2">Mobile</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Status</th>
                <th className="p-2">Date</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => (
                  <tr key={order._id} className="text-center border hover:bg-gray-50">
                    <td className="px-4 py-2">{order.order_number}</td>
                    <td className="px-4 py-2">{order.customer_name || order.email_address}</td>
                    <td className="px-4 py-2">{order.order_phonenumber}</td>
                    <td className="px-4 py-2">₹{order.order_amount}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        order.order_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.order_status === 'shipped' ? 'bg-red-100 text-[#d72828]' :
                        order.order_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.order_status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 flex space-x-2 justify-center">
                      <button
                        className="w-7 h-7 bg-red-100 text-[#d72828] rounded-full inline-flex items-center justify-center hover:bg-red-200 transition-colors"
                        onClick={() => handleViewOrder(order)}
                        title="View Order"
                      >
                        <MdVisibility className="w-5 h-5" />
                      </button>
                      <button
                        className="w-7 h-7 bg-pink-100 text-pink-600 rounded-full inline-flex items-center justify-center hover:bg-pink-200 transition-colors"
                        onClick={() => {
                          setSelectedOrder(order._id);
                          setModalType("cancel");
                          setShowModal(true);
                        }}
                        title="Cancel Order"
                      >
                        <MdCancel className="w-5 h-5" />
                      </button>
                      <button
                        className="w-7 h-7 bg-green-100 text-green-600 rounded-full inline-flex items-center justify-center hover:bg-green-200 transition-colors"
                        onClick={() => {
                          setSelectedOrder(order._id);
                          setModalType("ship");
                          setShowModal(true);
                        }}
                        title="Ship Order"
                      >
                        <MdLocalShipping className="w-5 h-5"/>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
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
                disabled={currentPage === pageCount}
                className={`px-3 py-1.5 border border-gray-300 rounded-md ${
                  currentPage === pageCount
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-black bg-white hover:bg-gray-100"
                }`}
                aria-label="Next page"
              >
                »
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Action Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-96">
            <h2 className="text-xl font-bold mb-4">
              {modalType === "cancel" ? "Cancel Order" : "Ship Order"}
            </h2>
            
            {modalType === "cancel" && (
              <div className="mb-4">
                <label className="block mb-2 text-sm font-semibold">
                  Cancellation Reason
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full border rounded-md p-2 focus:ring-red-500 focus:border-red-500"
                  rows="3"
                  placeholder="Enter reason for cancellation"
                  required
                />
              </div>
            )}
            
            {error && <p className="text-red-500 mb-4">{error}</p>}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setError("");
                  setCancellationReason("");
                }}
                className="bg-gray-300 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleOrderUpdate(
                  selectedOrder, 
                  modalType === "cancel" ? "cancelled" : "shipped",
                  cancellationReason
                )}
                className={`px-4 py-2 rounded-md text-white ${
                  modalType === "cancel" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                } transition-colors`}
                disabled={modalType === "cancel" && !cancellationReason}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetailsModal && viewOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white p-4 rounded-md w-full max-w-6xl shadow-lg">
            
            {/* Close Button */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Order ({viewOrderDetails.order_number})</h2>
              <button
                className="text-gray-500 hover:text-black"
                onClick={() => {
                  setShowOrderDetailsModal(false);
                  setViewOrderDetails(null);
                }}
              >
                <Icon icon="mdi:close" className="w-6 h-6" />
              </button>
            </div>

            {/* Top Panels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Order Details */}
              <div className="border rounded p-3">
                <h3 className="font-semibold mb-2">Order Details</h3>
                <ul className="text-sm space-y-1">
                  <li><b>Payment:</b> {viewOrderDetails.payment_method}</li>
                  <li><b>Date:</b> {new Date(viewOrderDetails.createdAt).toLocaleDateString()}</li>
                  <li><b>Delivery:</b> {viewOrderDetails.delivery_type} ({viewOrderDetails.delivery_status || 'Not Assigned'})</li>
                  <li><b>Shipping:</b> Free Shipping</li>
                </ul>
              </div>

              {/* Customer Details */}
              <div className="border rounded p-3">
                <h3 className="font-semibold mb-2">Customer Details</h3>
                <ul className="text-sm space-y-1">
                  <li><b>Name:</b> {viewOrderDetails.customer_name}</li>
                  <li><b>Store:</b> Sathya Store</li>
                  <li><b>Email:</b> {viewOrderDetails.email_address}</li>
                  <li><b>Phone:</b> {viewOrderDetails.order_phonenumber}</li>
                </ul>
              </div>

              {/* Options */}
              <div className="border rounded p-3">
                <h3 className="font-semibold mb-2">Options</h3>
                <textarea
                  rows="3"
                  maxLength={160}
                  className="w-full border rounded p-2 text-sm"
                  placeholder="Invoice notes (Max 160 chars)"
                />
                <button className="mt-2 bg-[#d72828] hover:bg-[#d72828] text-white text-sm px-3 py-1 rounded">
                  Send SMS
                </button>
                <p className="text-xs text-red-600 mt-1">Note: Maximum 160 Characters allowed</p>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="border rounded p-3 mb-4">
              <h3 className="font-semibold mb-2">Delivery Address</h3>
              <div className="text-sm">
                {viewOrderDetails.shipping_address || "N/A"}
              </div>
            </div>

            {/* Product Table */}
            <div className="border rounded p-3">
              <h3 className="font-semibold mb-2">Items</h3>
              <table className="w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Product</th>
                    <th className="p-2 border">Model</th>
                    <th className="p-2 border">Quantity</th>
                    <th className="p-2 border">Unit Price</th>
                    <th className="p-2 border">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {viewOrderDetails.products?.map((product, idx) => (
                    <tr key={idx}>
                      <td className="p-2 border">{product.name}</td>
                      <td className="p-2 border">{product.model || '-'}</td>
                      <td className="p-2 border">{product.quantity}</td>
                      <td className="p-2 border">₹{product.price}</td>
                      <td className="p-2 border">₹{product.price * product.quantity}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="4" className="p-2 border text-right font-bold">Sub-Total</td>
                    <td className="p-2 border">₹{viewOrderDetails.order_amount}</td>
                  </tr>
                  <tr>
                    <td colSpan="4" className="p-2 border text-right font-bold">Shipping</td>
                    <td className="p-2 border">₹0</td>
                  </tr>
                  <tr className="bg-gray-100">
                    <td colSpan="4" className="p-2 border text-right font-bold">Total</td>
                    <td className="p-2 border font-bold">₹{viewOrderDetails.order_amount}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}