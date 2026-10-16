"use client";

import React, { useState, useEffect } from "react";
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import {AuthModal} from '@/components/AuthModal';

export default function OrderComponent() {
  const [activeTab, setActiveTab] = useState("pending");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [alertMessage, setAlertMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalType, setModalType] = useState(""); // "cancel" or "ship"
  const [cancellationReason, setCancellationReason] = useState("");
  const [error, setError] = useState("");
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const itemsPerPage = 20;
  const tabs = [
    { id: "pending", label: "Pending Orders" },
    { id: "cancelled", label: "Cancelled Orders" },
    { id: "shipped", label: "Shipped Orders" },
  ];

    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authError, setAuthError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when search term changes
  }, [searchTerm]);

  const fetchOrders = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
      if (!token) {
        setShowAuthModal(true);
        setLoading(false);
        return;
      }

    try {

       const decoded = jwtDecode(token);
        const userId = decoded.userId;

      const response = await fetch(`/api/orders/getorder?status=${activeTab}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
    setLoading(false);
  };

  const handleOrderUpdate = async () => {
    if (!selectedOrder) return;

    if (modalType === "cancel" && !cancellationReason.trim()) {
      setError("Cancellation reason is required!");
      return;
    }

    setError("");

    if (modalType === "ship") {
      setConfirmationMessage("Are you sure you want to ship this order?");
      setShowConfirmationModal(true);
      return;
    }

    await processOrderUpdate();
  };

  const processOrderUpdate = async () => {
    try {
      const response = await fetch(`/api/orders/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: selectedOrder,
          order_status: modalType === "cancel" ? "cancelled" : "shipped",
          cancellation_reason: modalType === "cancel" ? cancellationReason : "",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowModal(false);
        setShowConfirmationModal(false);
        setCancellationReason("");
        setAlertMessage(
          modalType === "cancel"
            ? "Order has been cancelled successfully!"
            : "Order has been shipped successfully!"
        );
        fetchOrders();
        setTimeout(() => setAlertMessage(null), 3000);
      } else {
        setError(data.message || "Something went wrong!");
      }
    } catch (error) {
      setError("Failed to update order. Please try again!");
      console.error("Error updating order:", error);
    }
  };

  const handleConfirmation = (confirm) => {
    if (confirm) {
      processOrderUpdate();
    } else {
      setShowConfirmationModal(false);
    }
  };
  const handleDownloadInvoice = async (orderNumber) => {
    try {
      const response = await fetch(`/api/orders/invoice?order_id=${orderNumber}`);
  
      if (!response.ok) {
        // Try to get JSON error message if available
        let errorMsg = "Failed to download invoice";
        try {
          const errorData = await response.json();
          errorMsg = errorData?.error || errorMsg;
        } catch {
          // Ignore if response is not JSON
        }
        throw new Error(errorMsg);
      }
  
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
  
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice_${orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
  
      window.URL.revokeObjectURL(url); // Cleanup blob
    } catch (error) {
      console.error("Error downloading invoice:", error);
      // Optional: define `setError` somewhere if needed
      alert(error.message || "Failed to download invoice. Please try again.");
    }
  };
  
  const filteredOrders = orders.filter((order) =>
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="container mx-auto ">
      {alertMessage && (
        <div className="bg-green-500 text-white px-4 py-2 rounded-md mb-4">
          {alertMessage}
        </div>
      )}

      <div className="flex justify-between items-center mb-3">
        <h2 className="text-2xl font-bold">Order List</h2>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b-2 border-gray-200 mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setCurrentPage(1); // Reset to first page when tab changes
            }}
            className={`py-3 px-6 text-lg font-semibold rounded-t-lg ${
              activeTab === tab.id ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Box */}
      <div className="flex justify-start mb-5">
        <input
          type="text"
          placeholder="Search Order..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-2 border-gray-200 px-4 py-2 rounded-lg w-64 focus:outline-none focus:border-red-500"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-lg p-6 overflow-x-auto">
        {loading ? (
          <div className="text-center text-lg text-gray-600">Loading...</div>
        ) : paginatedOrders.length > 0 ? (
          <>
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2">Order ID</th>
                  <th className="border px-4 py-2">Email</th>
                  <th className="border px-4 py-2">Mobile</th>
              {/* <th className="border px-4 py-2">Product ID</th> */}
                  <th className="border px-4 py-2">Price</th>
                  <th className="border px-4 py-2">Order Status</th>
                  <th className="border px-4 py-2">Action</th>
                  {activeTab === "shipped" && <th className="border px-4 py-2">Invoice</th>}
                </tr>
              </thead>
              <tbody>
  
                {paginatedOrders.map((order) => (
                  <tr key={order._id} className="text-center border">
                    <td className="border px-4 py-2">{order.order_number}</td>
                    <td className="border px-4 py-2">{order.email_address}</td>
                    <td className="border px-4 py-2">{order.order_phonenumber}</td>
                 
                    <td className="border px-4 py-2">{order.order_amount}</td>
                    <td className="border px-4 py-2">{order.order_status}</td>
                    <td className="px-4 py-2 flex space-x-2">
                      {activeTab === "pending" && (
                        <>
                          <button
                            className="bg-red-500 text-white px-3 py-1 rounded"
                            onClick={() => {
                              setSelectedOrder(order._id);
                              setModalType("cancel");
                              setShowModal(true);
                            }}
                          >
                            Cancelled
                          </button>
                          <button
                            className="bg-green-500 text-white px-3 py-1 rounded"
                            onClick={() => {
                              setSelectedOrder(order._id);
                              setModalType("ship");
                              setShowModal(true);
                            }}
                          >
                            Shipped
                          </button>
                        </>
                      )}
                      {activeTab === "cancelled" && (
                        <span className="text-red-600 font-semibold">Cancelled</span>
                      )}
                      {activeTab === "shipped" && (
                        <span className="text-green-600 font-semibold">Shipped</span>
                      )}
                    </td>

                    {/* Show Invoice Column Only for Shipped Orders */}
                    {activeTab === "shipped" && (
                      <td className="border px-4 py-2">
                        <button onClick={() => handleDownloadInvoice(order.order_number)}>
                          Download Invoice
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <ul className="pagination flex justify-center mt-4" role="navigation" aria-label="Pagination">
              <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="page-link px-3 py-2 border rounded mx-1"
                  role="button"
                  aria-disabled={currentPage === 1}
                  aria-label="Previous page"
                  rel="prev"
                >
                  Previous
                </button>
              </li>

              {Array.from({ length: totalPages }, (_, index) => (
                <li key={index} className={`page-item ${currentPage === index + 1 ? "active" : ""}`}>
                  <button
                    onClick={() => setCurrentPage(index + 1)}
                    className={`page-link px-3 py-2 border rounded mx-1 ${
                      currentPage === index + 1 ? "bg-red-600 text-white" : "bg-gray-100"
                    }`}
                    role="button"
                    aria-current={currentPage === index + 1 ? "page" : undefined}
                    aria-label={`Page ${index + 1}`}
                  >
                    {index + 1}
                  </button>
                </li>
              ))}

              <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="page-link px-3 py-2 border rounded mx-1"
                  role="button"
                  aria-disabled={currentPage === totalPages}
                  aria-label="Next page"
                  rel="next"
                >
                  Next
                </button>
              </li>
            </ul>
          </>
        ) : (
          <div className="text-center text-lg text-gray-600">No orders found.</div>
        )}
      </div>

      {/* Cancellation Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">{modalType === "cancel" ? "Cancel Order" : "Ship Order"}</h2>

            {modalType === "cancel" && (
              <>
                <label className="block mb-2 font-semibold">Enter Reason</label>
                <textarea
                  className="w-full border border-gray-300 px-3 py-2 rounded-md mb-1"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  required
                />
                {error && <p className="text-red-500 text-sm">Reason is required.</p>}
              </>
            )}

            <div className="flex justify-end space-x-3 mt-4">
              <button onClick={() => setShowModal(false)} className="bg-gray-300 px-4 py-2 rounded-md">
                Close
              </button>
              <button onClick={handleOrderUpdate} className="bg-red-500 text-white px-4 py-2 rounded-md">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">
              {modalType === "cancel" ? "Confirm Cancellation" : "Confirm Shipping"}
            </h2>
            <p className="mb-4">{confirmationMessage}</p>
            <div className="flex justify-end space-x-3 mt-4">
              <button onClick={() => handleConfirmation(false)} className="bg-gray-300 px-4 py-2 rounded-md">
                No
              </button>
              <button onClick={() => handleConfirmation(true)} className="bg-red-500 text-white px-4 py-2 rounded-md">
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}