"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ViewOrderPage() {
  const { order_number } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/getbyorderid?order_number=${order_number}`);
        const data = await res.json();
        if (data.success) {
          setOrder(data.order);
        } else {
          console.error("Order not found");
        }
      } catch (err) {
        console.error("Error fetching order", err);
      } finally {
        setLoading(false);
      }
    };

    if (order_number) {
      fetchOrder();
    }
  }, [order_number]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!order) return <p className="p-6 text-red-600">Order not found.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Order Details</h1>
      <p><strong>Order Number:</strong> {order.order_number}</p>
      <p><strong>Email:</strong> {order.email_address}</p>
      <p><strong>Amount:</strong> ₹{order.order_amount}</p>
      <p><strong>Status:</strong> {order.order_status}</p>
      <p><strong>Created At:</strong> {new Date(order.createdAt).toLocaleString()}</p>
      {/* Add more fields as needed */}
    </div>
  );
}
