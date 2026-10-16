'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaPhoneAlt,  FaStore  } from "react-icons/fa";
import { MdDateRange } from "react-icons/md";
import { IoWalletSharp } from "react-icons/io5";
import { IoMdMail } from "react-icons/io";
import { TbTruckDelivery } from "react-icons/tb";
import { MdOutlineLocalShipping, MdDeliveryDining, MdContacts } from "react-icons/md";

const OrderDetails = () => {
  const params = useParams();
  const orderId = params?.orderId;

  const [order, setOrder] = useState(null);

  const orderr = {
    history: [
      {
        date: '2025-07-22T12:00:00Z',
        comment: 'Order placed by user',
        status: 'Pending',
        customer_notified: true,
      },
      {
        date: '2025-07-23T08:30:00Z',
        comment: 'Order packed and ready to ship',
        status: 'Processing',
        customer_notified: false,
      },
      {
        date: '2025-07-23T14:00:00Z',
        comment: 'Order shipped via BlueDart',
        status: 'Shipped',
        customer_notified: true,
      },
    ],
  };


  useEffect(() => {
    if (orderId) {
      fetch(`/api/allorders/${orderId}`)
        .then(res => res.json())
        .then(data => setOrder(data))
        .catch(err => console.error("Fetch error:", err));
    }
  }, [orderId]);

  if (!order) return <p className="text-center mt-10">Loading...</p>;
  console.log('Order:', order);


  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto bg-white">
      {/* Title */}
      <h2 className="text-2xl font-semibold text-gray-700">Orders</h2>

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
          <td className="p-2">{order.payment_method}</td>
        </tr>
        <tr className="border-b">
          <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
            <MdDateRange className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
            Date: </td>
          <td className="p-2 ">{new Date(order.createdAt).toLocaleDateString()}</td>
        </tr>
       
        <tr className="border-b">
          <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
            <MdDeliveryDining className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
            Pickup:</td>
          <td className="p-2">{order.delivery_type}</td>
        </tr>
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
        <tr className="border-b">
          <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
            <FaPhoneAlt className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
            Phone:</td>
          <td className="p-2">{order.order_phonenumber}</td>
        </tr>
        <tr className="border-b"> 
          <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
            <FaStore className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
            store:</td>
         <td className="p-2">{order.order_details[0]?.store_id}</td>

        </tr>
        <tr>
          <td className="p-2 flex items-center gap-2 font-semibold text-gray-700">
            <IoMdMail className="bg-red-500 text-white p-1 rounded-md w-6 h-6" />
            email:</td>
          <td className="p-2">{order.email_address}</td>
        </tr>
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
  {order.order_details?.map((item, i) => (
    <tr key={i} className="border-b">
      <td className="p-2">{item.product_name}</td>
      <td className="p-2">{item.model}</td>
      <td className="p-2 text-center">{item.quantity}</td>
      <td className="p-2 text-right">₹{item.product_price}</td>
      <td className="p-2 text-right">₹{item.quantity * item.product_price}</td>
    </tr>
  ))}
  <tr className="font-semibold">
    <td colSpan="4" className="p-2 text-right">Sub-Total:</td>
    {/* <td className="p-2 text-right">₹{order.sub_total}</td> */}
    <td className="p-2 text-right">₹0.00</td>
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

      {/* Order History */}
      <div className="bg-white p-4 shadow rounded">
      {/* <h3 className="font-semibold text-gray-600 border-b pb-2">Order History</h3>

      <table className="w-full text-sm mt-3 border text-gray-700">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="p-2">Date Added</th>
            <th className="p-2">Comment</th>
            <th className="p-2">Status</th>
            <th className="p-2 text-center">Customer Notified</th>
          </tr>
        </thead>
        <tbody>
          {orderr.history.map((entry, i) => (
            <tr key={i} className="border-b">
              <td className="p-2">{new Date(entry.date).toLocaleDateString()}</td>
              <td className="p-2">{entry.comment}</td>
              <td className="p-2">{entry.status}</td>
              <td className="p-2 text-center">
                {entry.customer_notified ? 'Yes' : 'No'}
              </td>
            </tr>
          ))}
        </tbody>
      </table> */}

      {/* Add Order History Form */}
      {/* <div className="mt-6">
        <h4 className="font-semibold text-gray-600 border-b pb-2">Add Order History</h4>
        <select className="w-full border p-2 mb-3 rounded text-sm">
          <option>Choose Status</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Failed">Failed</option>
        </select>
        <textarea
          className="w-full border rounded p-2 text-sm"
          rows={3}
          placeholder="Comment"
        ></textarea>
        <button className="bg-red-500 text-white px-4 py-2 rounded mt-2 hover:bg-red-700">
          Add History
        </button>
      </div> */}
    </div>
    </div>
  );
};

export default OrderDetails;
