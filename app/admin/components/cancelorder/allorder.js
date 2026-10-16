'use client';
import { useRouter } from 'next/navigation'; // ← use this in App Router

import { useEffect, useState } from 'react';
import DateRangePicker from '@/components/DateRangePicker';

const OrdersTable = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [deliveryType, setDeliveryType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const itemsPerPage = 20;
  const router = useRouter();
  const [filtered, setFiltered] = useState([]);

 useEffect(() => {
  const fetchOrders = async () => {
    const res = await fetch('/api/allorders');
    const data = await res.json();

    const cancelledOrders = data.filter(order => order.order_status === 'cancelled');

    setOrders(cancelledOrders);
    setFiltered(cancelledOrders);
    setIsLoading(false);
  };
  fetchOrders();
}, []);


  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null
  });

 useEffect(() => {
  const applyFilters = () => {
    let updated = [...orders];

    if (status) {
      updated = updated.filter(o =>
        o.order_status?.toLowerCase() === status.toLowerCase()
      );
    }

    if (deliveryType) {
      updated = updated.filter(o =>
        o.delivery_type?.toLowerCase() === deliveryType.toLowerCase()
      );
    }

    if (paymentMethod) {
      updated = updated.filter(o =>
        o.payment_method?.toLowerCase() === paymentMethod.toLowerCase()
      );
    }

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      updated = updated.filter(
        o =>
          o.order_number?.toLowerCase().includes(lower) ||
          o.order_username?.toLowerCase().includes(lower)
      );
    }

    // ✅ Date filter
    if (dateFilter?.startDate && dateFilter?.endDate) {
      const startDate = new Date(dateFilter.startDate);
      const endDate = new Date(dateFilter.endDate);
      endDate.setHours(23, 59, 59, 999); // Include full end date

      updated = updated.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    setFiltered(updated);
  };

  applyFilters();
}, [
  status,
  deliveryType,
  paymentMethod,
  searchTerm,
  orders,
  dateFilter?.startDate,
  dateFilter?.endDate
]);




// Handle date change
  const handleDateChange = ({ startDate, endDate }) => {
    setDateFilter({ startDate, endDate });
    setCurrentPage(0);
  };
  
  const paginatedOrders = filtered.slice(
  currentPage * itemsPerPage,
  (currentPage + 1) * itemsPerPage
);


   // Pagination logic
    const pageCount = Math.ceil(filtered.length / itemsPerPage);
    const paginatedCategories = filtered.slice(
      currentPage * itemsPerPage,
      (currentPage + 1) * itemsPerPage
    );
  
    // Handle page change
    const paginate = (pageIndex) => {
      if (pageIndex >= 0 && pageIndex < pageCount) {
        setCurrentPage(pageIndex);
      }
    };
  
    // Reset current page when filters change
    useEffect(() => {
      setCurrentPage(0);
    }, [status, deliveryType, paymentMethod, searchTerm, orders, dateFilter]);

   


  return (
     <div className="container mx-auto">
      {/* Alert Message */}
      {/* {showAlert && (
        <div className="bg-green-500 text-white px-4 py-2 rounded-md mb-4 mt-5">
          {alertMessage}
        </div>
      )} */}

      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold">All Order</h2>
       
      </div>

      {isLoading ? (
        <p>Loading order...</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-5 h-[500px] overflow-x-auto border border-gray-200">
          {/* Search and Filter Section */}
        {/* Search and Filter Section */}
{/* Search and Filter Section */}
<div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end mb-4">

  {/* Search Input */}
  <div className="w-full"> 
    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
    <div className="relative">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3">
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2.5a7.5 7.5 0 010 15z"
          />
        </svg>
      </span>
      <input
        type="text"
        placeholder="Search all order..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
      />
    </div>
  </div>

  {/* Status Filter */}
  {/* <div className="w-full">
    <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
    <select
      value={status}
      onChange={e => setStatus(e.target.value)}
      className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
    >
      <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="order placed">Order Placed</option>
          <option value="invoiced">Order Invoiced</option>
          <option value="cancelled">Cancelled</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
    </select>
  </div> */}
  {/* Status Filter */}
  <div className="w-full">
    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Type</label>
    <select
      value={deliveryType}
      onChange={e => setDeliveryType(e.target.value)}
      className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
    >
          <option value="">All Delivery Types</option>
          <option value="home">Home Delivery</option>
          <option value="store_pickup">Store Pickup</option>
         {/* <option value="standard">Standard</option> */}
    </select>
  </div>

  <div className="w-full">
    <label className="block text-sm font-medium text-gray-700 mb-1">Payment method</label>
    <select
      value={paymentMethod}
      onChange={e => setPaymentMethod(e.target.value)}
      className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
    >
          <option value="">All Payment Methods</option>
          <option value="online">Online</option>
          <option value="cash">COD</option>
          {/* <option value="cod">COD</option> */}
    </select>
  </div>

  {/* Date Range Picker */}
  <div className="w-full col-span-1 md:col-span-1">
    <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
    <div className="relative w-full max-w-sm">
      <DateRangePicker onDateChange={handleDateChange} />
      {/* {dateFilter.startDate && dateFilter.endDate && (
        <button 
          onClick={clearDateFilter}
          className="mt-2 text-sm text-red-600 hover:text-red-800"
        >
          Clear date filter
        </button>
      )} */}
    </div>
  </div>
</div>



          {/* Categories Table */}
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2">Action</th>
                  <th className="p-2">Order Id</th>
                  <th className="p-2">Order status</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Date</th>
                </tr>
              </thead>
              <tbody>
{paginatedOrders.length ? (
  paginatedOrders.map((o, i) => (
    <tr key={i} className="border-t">
      <td className="p-2 border flex justify-center items-center">
        <button
          onClick={() => router.push(`/admin/Allorder/${o._id}`)}
          className="flex items-center gap-1 text-sm text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md transition-all shadow-sm"
        >
          👁 View
        </button>
      </td>
      <td className="p-2 border">{o.order_number}</td>
      <td className="p-2 border capitalize">{o.order_status}</td>
      <td className="p-2 border">{o.order_username}</td>
      <td className="p-2 border">₹{o.order_amount}</td>
      <td className="p-2 border">{new Date(o.createdAt).toLocaleDateString()}</td>
    </tr>
  ))
) : (
  <tr>
    <td colSpan="6" className="text-center text-gray-500 p-4">
      No orders found.
    </td>
  </tr>
)}

              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6 flex-wrap gap-3">
            <div className="text-sm text-gray-600">
              Showing {filtered.length === 0 ? 0 : currentPage * itemsPerPage + 1} to{" "}
              {Math.min((currentPage + 1) * itemsPerPage, filtered.length)} of{" "}
              {filtered.length} entries
            </div>

            <div className="pagination flex items-center space-x-1">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 0}
                className={`px-3 py-1.5 border border-gray-300 rounded-md ${
                  currentPage === 0
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-black bg-white hover:bg-gray-100"
                }`}
                aria-label="Previous page"
              >
                «
              </button>

              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  onClick={() => paginate(i)}
                  className={`px-3 py-1.5 border border-gray-300 rounded-md ${
                    currentPage === i
                      ? "bg-red-500 text-white"
                      : "text-black bg-white hover:bg-gray-100"
                  }`}
                  aria-label={`Page ${i + 1}`}
                  aria-current={currentPage === i ? "page" : undefined}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === pageCount - 1 || pageCount === 0}
                className={`px-3 py-1.5 border border-gray-300 rounded-md ${
                  currentPage === pageCount - 1 || pageCount === 0
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
    </div>
  );
};

export default OrdersTable;
