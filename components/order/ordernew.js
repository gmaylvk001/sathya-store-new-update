"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiChevronRight, FiClock, FiCheckCircle, FiTruck, FiShoppingBag } from "react-icons/fi";
import { RiAccountCircleFill } from "react-icons/ri";
import { FaAddressBook } from "react-icons/fa";
import { HiShoppingBag } from "react-icons/hi2";
import { FaHeart } from "react-icons/fa6";

export default function Order() {
  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/orders/get?status=${activeFilter}`);
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders);
        } else {
          console.error("Failed to fetch orders:", data.message);
          setOrders([]);
        }
      } catch (err) {
        console.error("Error:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [activeFilter]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-red-50 py-6 px-8 flex justify-between items-center border-b border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800">My Orders</h2>
        <div className="flex items-center space-x-2 text-sm mt-1">
          <span className="text-gray-600">🏠 Home</span>
          <FiChevronRight className="text-gray-400" />
          <span className="text-gray-500">Shop</span>
          <FiChevronRight className="text-gray-400" />
          <span className="text-customBlue font-medium">Orders</span>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-customBlue shadow-sm">
              <h3 className="text-lg font-semibold text-customBlue mb-6 border-b pb-2">My Account</h3>
              <nav className="space-y-2">
                {/* <Link href="/profile" className="nav-link"><RiAccountCircleFill className="icon" />Profile</Link>
                <Link href="/address" className="nav-link"><FaAddressBook className="icon" />Addresses</Link> */}
                <Link href="/order" className="nav-link"><HiShoppingBag className="icon" />Orders</Link>
                <Link href="/wishlist" className="nav-link"><FaHeart className="icon" />Wishlist</Link>
              </nav>
            </div>
          </div>``

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-customBlue shadow-sm">
              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-3 mb-6 pb-4 border-b border-gray-100">
                {["all", "pending", "shipped", "cancelled"].map(status => (
                  <button
                    key={status}
                    onClick={() => setActiveFilter(status)}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      activeFilter === status
                        ? status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : status === "shipped"
                          ? "bg-red-100 text-[#d72828]"
                          : status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-customBlue text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>

              {/* Orders Display */}
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <FiShoppingBag className="mx-auto text-4xl text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No orders found</h3>
                  <p className="text-gray-500 mt-1">You haven't placed any orders yet</p>
                  <button className="mt-6 px-6 py-2 bg-customBlue text-white rounded-lg hover:bg-[#d72828]">
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map(order => (
                    <div key={order._id} className="p-5 border border-gray-200 rounded-xl hover:shadow-md">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Image (static fallback if image not available) */}
                        <div className="w-full md:w-32 flex-shrink-0">
                          <img 
                            src="/user/gadgets.jpg" 
                            alt={order.order_details?.[0]?.product_name || "Product"} 
                            className="w-full h-32 object-contain rounded-lg border border-gray-200"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-500 mb-1">Order #{order.order_number}</p>
                              <h3 className="font-medium text-gray-800 mb-2">
                                {order.order_details?.[0]?.product_name || "N/A"}
                              </h3>
                              <p className="text-lg font-semibold text-gray-900 mb-3">Rs. {order.order_amount}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium self-start ${
                              order.order_status === 'shipped'
                                ? 'bg-green-100 text-green-800'
                                : order.order_status === 'cancelled'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {order.order_status}
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <FiTruck className="mr-2 text-gray-400" />
                              <span>Placed on {new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div>
                              <span>Payment: {order.payment_method || "N/A"}</span>
                            </div>
                          </div>
                          <div className="mt-6 flex flex-wrap gap-3">
                            <button className="px-4 py-2 bg-red-50 text-customBlue rounded-md hover:bg-red-100 flex items-center">
                              <FiShoppingBag className="mr-2" />
                              Buy it Again
                            </button>
                            <button className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
