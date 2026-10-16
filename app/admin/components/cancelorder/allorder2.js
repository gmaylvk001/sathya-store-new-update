'use client';
import { useEffect, useState } from 'react';

const OrdersTable = () => {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');
  const [deliveryType, setDeliveryType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await fetch('/api/allorders');
      const data = await res.json();
      setOrders(data);
      setFiltered(data);
    };
    fetchOrders();
  }, []);

  useEffect(() => {
  const applyFilters = () => {
    let updated = [...orders];

    if (status) {
      updated = updated.filter(o => o.order_status?.toLowerCase() === status.toLowerCase());
    }
    if (deliveryType) {
      updated = updated.filter(o => o.delivery_type?.toLowerCase() === deliveryType.toLowerCase());
    }
    if (paymentMethod) {
      updated = updated.filter(o => o.payment_method?.toLowerCase() === paymentMethod.toLowerCase());
    }
    if (searchTerm.trim()) {
  const lower = searchTerm.toLowerCase();
  updated = updated.filter(
    o =>
      o.order_number?.toLowerCase().includes(lower) ||
      o.order_username?.toLowerCase().includes(lower)
  );
}


    setFiltered(updated);
  };

  applyFilters();
}, [status, deliveryType, paymentMethod, searchTerm, orders]);


  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by Order ID or Name"
          className="w-full md:w-1/3 border p-2 rounded"
        />
        <select value={status} onChange={e => setStatus(e.target.value)} className="border p-2 rounded">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="order placed">Order Placed</option>
          <option value="invoiced">Order Invoiced</option>
          <option value="cancelled">Cancelled</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>

        <select value={deliveryType} onChange={e => setDeliveryType(e.target.value)} className="border p-2 rounded">
          <option value="">All Delivery Types</option>
          <option value="home delivery">Home Delivery</option>
          <option value="store pickup">Store Pickup</option>
          <option value="standard">Standard</option>
        </select>

        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="border p-2 rounded">
          <option value="">All Payment Methods</option>
          <option value="online">Online</option>
          <option value="cash">Cash</option>
          <option value="cod">COD</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border bg-white text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Action</th>
              <th className="p-2 border">Order ID</th>
              <th className="p-2 border">Order Status</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((o, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2 border">
                    <button className="text-[#d72828]">View</button>
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
    </div>
  );
};

export default OrdersTable;
