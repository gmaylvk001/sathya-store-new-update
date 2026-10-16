'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { FaPhoneAlt,  FaStore  } from "react-icons/fa";
import { MdDateRange } from "react-icons/md";
import { IoWalletSharp } from "react-icons/io5";
import { IoMdMail } from "react-icons/io";
import { TbTruckDelivery } from "react-icons/tb";
import { MdOutlineLocalShipping, MdDeliveryDining, MdContacts } from "react-icons/md";

const OrderDetails = () => {
  const params = useParams();
  const orderId = params?.orderId;
  const [isUpdating, setIsUpdating] = useState(false);
 const [stores, setStores] = useState([]);
  // FOR ORDER HISTORY
  const [status, setStatus] = useState("");
  const [comment, setComment] = useState("");

  const [order, setOrder] = useState(null);

  // 🔹 Fetch Stores
  useEffect(() => {
    fetch("/api/store/get")
      .then(res => res.json())
      .then(data => {
        console.log("Store API Response:", data);

        // IMPORTANT: change this if API returns {data: []}
        setStores(Array.isArray(data) ? data : data.data || []);
      })
      .catch(err => console.error("Store fetch error:", err));
  }, []);

const addHistory = async () => {
  if (!status || !comment) {
    toast.error("Please select a status and add a comment");
    return;
  }

  setIsUpdating(true);
  try {
    const res = await fetch(`/api/abandantorder/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        comment,
        customer_notified: true,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Failed to update history:", data);
      toast.error("Failed to update history");
    } else {
      console.log("✅ History updated", data);
      setOrder(data);
      setStatus("");
      setComment("");
      toast.success("History updated successfully!");
    }
  } catch (err) {
    console.error("❌ Network error:", err);
    toast.error("Network error occurred");
  } finally {
    setIsUpdating(false);
  }
};
  useEffect(() => {
    if (orderId) {
      fetch(`/api/abandantorder/${orderId}`)
        .then(res => res.json())
        .then(data => setOrder(data))
        .catch(err => console.error("Fetch error:", err));
    }
  }, [orderId]);

  


  if (!order) return <p className="text-center mt-10">Loading...</p>;
  // console.log('Order:', order);


  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto bg-white">
      {/* Title */}
      <h2 className="text-2xl font-semibold text-gray-700">Orders</h2>
      <ToastContainer />

      {/* Top Grid */}
      <div className="grid grid-cols-3 gap-6">
  {/* Order Details */}
  <div className="bg-white shadow rounded overflow-hidden">
    <table className="w-full text-sm text-gray-700">
      <thead>
        <tr className="bg-gray-100 border-b">
          <th className="p-2 text-left" colSpan={4}>Order Details</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b">
          <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
            <IoWalletSharp className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
            Payment:
          </td>
          <td className="p-2">{order.payment_mode}</td>
        </tr>
        <tr className="border-b">
          <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
            <MdDateRange className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
            Date: </td>
          <td className="p-2 ">{new Date(order.created_at).toLocaleDateString()}</td>
        </tr>
       
        {/* <tr className="border-b">
          <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
            <MdDeliveryDining className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
            Pickup:</td>
          <td className="p-2">
            {order.delivery_type === "store_pickup" ? (
              <span className="py-0.5 text-white px-2 bg-red-500 rounded">{order.delivery_type}</span>
            ):(
              order.delivery_type
            )}
            
          </td>
        </tr> */}
        <tr>
          <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
            <MdOutlineLocalShipping className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
            Shipping:</td>
          <td className="p-2"> Free Shipping</td>
        </tr>
      </tbody>
    </table>
  </div>

  {/* Customer Details */}
  <div className="bg-white shadow rounded overflow-hidden">
    <table className="w-full text-sm text-gray-700">
      <thead>
        <tr className="bg-gray-100 border-b">
          <th className="p-2 text-left" colSpan={2}>Customer Details</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b">
          <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
            <MdContacts className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
            Name:</td>
          <td className="p-2">{order.order_username}</td>
        </tr>
        {/* <tr className="border-b">
          <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
            <FaPhoneAlt className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
            Phone:</td>
          <td className="p-2">{order.order_phonenumber}</td>
        </tr> */}
        <tr className="border-b"> 
          <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
            <FaStore className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
            store:</td>
         {/* <td className="p-2">{order.order_details?.[0]?.store_id}</td> */}
         <td className="p-2">
          {
            stores.find(s =>
              String(s._id) === String(order?.order_details?.[0]?.store_id)
            )?.organisation_name || ""
          }
        </td>

        </tr>
        {/* <tr>
          <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
            <IoMdMail className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
            email:</td>
          <td className="p-2">{order.email_address}</td>
        </tr> */}
      </tbody>
    </table>
  </div>

  {/* Options / Invoice */}
  <div className="bg-white shadow rounded overflow-hidden">
    <table className="w-full text-sm text-gray-700">
      <thead>
        <tr className="bg-gray-100 border-b">
          <th className="p-2 text-left" colSpan={2}>Options</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b">
          <td className="p-2" colSpan={2}>
            <textarea
              className="w-full border rounded p-2 text-sm"
              placeholder="Note: Maximum 150 characters allowed"
              maxLength={150}
              rows={3}
            />
          </td>
        </tr>
        <tr>
          <td className="p-2" colSpan={2}>
            <button className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600 w-full">
              Generate Invoice
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>


      {/* Order Info */}
      <div className="bg-white p-4 shadow rounded">
        <h3 className="font-semibold text-gray-600 border-b pb-2">Order #{order.order_number}</h3>
        {/* Address */}
        <div className="mt-4">
  <table className="w-full border text-sm text-gray-700">
    <thead>
      <tr className="bg-gray-100 border-b">
        <th className="p-2 text-left">Delivery Address</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td className="p-2">{order.order_deliveryaddress}</td>
      </tr>
    </tbody>
  </table>
</div>



        {/* Product Table */}
        <div className="mt-4">
          <table className="w-full border text-sm text-gray-700">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-2 text-left">Product</th>
                <th className="p-2 text-left">Model</th>
                <th className="p-2 text-center">Qty</th>
                <th className="p-2 text-right">Unit Price</th>
                <th className="p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
{order.cart_items?.map((item, i) => {
  // Log each item for debugging
  console.log(`Item ${i}:`, item);
  
  // Calculate the price - use order_amount if product_price is 0
  const itemPrice = item.price === 0 ? parseFloat(order.price) : item.price;
  const totalPrice = item.quantity * itemPrice;
  
  return (
    <tr key={i} className="border-b">
      <td className="p-2">
        {item.slug ? (
          <a 
            href={`/product/${item.slug}`} 
            className="text-[#d72828] hover:text-[#c02020] hover:underline"
          >
            {item.name} - ({item.item_code.replace(/^ITEM/, "")})
          </a>
        ) : (
          <span>
            {item.name} - ({item.item_code.replace(/^ITEM/, "")})
          </span>
        )}
      </td>
      {/* <td className="p-2">{item.model}</td> */}
      <td className="p-2 text-center">{item.quantity}</td>
      <td className="p-2 text-right text-red-600">₹{itemPrice}</td>
      <td className="p-2 text-right text-red-600">₹{totalPrice}</td>
    </tr>
  );
})}
  {order.order_item.map((item, index) =>
  item.extendedWarranty > 0 && (
    <tr key={index} className="font-semibold">
      <td colSpan="4" className="p-2 text-right text-[#d72828]">
        Extended Warranty:
      </td>
      <td className="p-2 text-right text-red-600">
        ₹{item.extendedWarranty}
      </td>
    </tr>
  )
)}

  <tr className="font-semibold">
    <td colSpan="4" className="p-2 text-right">Sub-Total:</td>
    <td className="p-2 text-right">₹{order.order_amount}</td>
    {/* <td className="p-2 text-right">₹0.00</td> */}
  </tr>
  <tr>
    <td colSpan="4" className="p-2 text-right">Shipping:</td>
    {/* <td className="p-2 text-right">₹{order.shipping_fee}</td> */}
     <td className="p-2 text-right">₹0.00</td>
  </tr>
  <tr className="font-bold bg-gray-100">
    <td colSpan="4" className="p-2 text-right">Total:</td>
    <td className="p-2 text-right">₹{order.order_amount}</td>
  </tr>
</tbody>

          </table>
        </div>
</div>
</div>
  );
};

export default OrderDetails;
