"use client";
import { useState,useEffect } from "react";
import { motion } from "framer-motion";
import { ToastContainer, toast } from 'react-toastify';
import {jwtDecode} from 'jwt-decode';

export default function CheckoutPage() {
  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    businessName: "",
    country: "",
    address: "",
    landmark: "",
    city: "",
    state: "",
    postCode: "",
    phonenumber: "",
    email: "",
    additionalInfo: "",
  });

  const [useraddress, setUseraddress] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [useSavedAddress, setUseSavedAddress] = useState(false);

// const organizeUseraddress = (useraddressData) => {
//     // Assuming useraddressData is an array of objects
//     const organizedData = useraddressData.map((item) => {
//       return {
//         id: item._id,
//         firstName: item.firstName,
//         lastName: item.lastName,
//         businessName: item.businessName,
//         country: item.country,
//         address: item.address,
// }
//     });
//     setFormData(organizedData);
//   };
  const features = [
    { icon: "🚗", title: "Free Shipping", description: "Free shipping all over the US" },
    { icon: "🔒", title: "100% Satisfaction", description: "Guaranteed satisfaction with every order" },
    { icon: "💼", title: "Secure Payments", description: "We ensure secure transactions" },
    { icon: "💬", title: "24/7 Support", description: "We're here to help anytime" },
  ];

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Error State
  const [error, setError] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState('');
  // Order Summary
  const orderItems = [
    { id: 1, name: "HP Chromebook With Intel Celeron", price: 250 },
    { id: 2, name: "HP Chromebook With Intel Celeron", price: 250 },
    { id: 3, name: "HP Chromebook With Intel Celeron", price: 250 },
  ];

  const fetchAddress = async () => {
    const token = localStorage.getItem("token");
    console.log(token);
    if (!token) {
      setShowAuthModal(true);
      return;
    }
  
    try {
      const decoded = jwtDecode(token);
      const userId = decoded.userId;
      const email  = decoded.email;
      console.log("UserID:", userId);
      if (!userId) return;
  
      console.log("UserID:", userId);
  
      const res = await fetch(`/api/useraddress?user_id=${userId}`);
      const data = await res.json();
      setUseraddress(data.userAddress);
      const userAddress =data.userAddress;
      if (userAddress.length > 0) {
        const addr = userAddress[0];
        setFormData(prev => ({
          ...prev,
          firstName: addr.firstName || "",
          lastName: addr.lastName || "",
          country: addr.country || "",
          address: addr.address || "",
          city: addr.city || "",
          country : addr.country || "",
          state: addr.state || "",
          postCode: addr.postCode || "",
          phonenumber: addr.phonenumber || "",
          landmark:addr.landmark || "",
          email: addr.email || "",
          businessName : addr.businessName || "",
          additionalInfo: addr.additionalInfo || ""
        }));
      }
    } catch (error) {
      console.error("Error decoding token or fetching address:", error);
    }
  };
  
  // 2. Call fetchAddress in useEffect
  useEffect(() => {
    fetchAddress();
  }, []);

  // Handle Form Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Payment Selection
  const handlePaymentChange = (e) => {
    setPaymentMethod(e.target.value);

  };

  const handlePayment = async () => {
    if (paymentMethod === 'cash') {
      // Handle COD
      const orderData = {
        user_id: user.id,
        payment_mode: 'cod',
        status: 'pending',
        amount: totalAmount
      };
  
      try {
        const response = await fetch('/api/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(orderData)
        });
  
        if (response.ok) {
          toast.success('Order placed successfully!');
          router.push('/order-confirmation');
        }
      } catch (error) {
        toast.error('Failed to place order');
      }
    } else {
      // Handle online payment
      try {
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ amount: totalAmount })
        });
  
        const { clientSecret } = await response.json();
        // Implement your payment gateway logic here
      } catch (error) {
        toast.error('Failed to initialize payment');
      }
    }
  };

  // Handle Form Submission
  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  
  //   try {
  //     const token = localStorage.getItem("token");
  //     if (!token) {
  //       setShowAuthModal(true);
  //       return;
  //     }
  //     const decoded = jwtDecode(token);
  //     const userId = decoded.userId;
  //     //const email  = decoded.email;
      
  //     // Email Validation Regex
  //     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  //     // Phone Validation (10-digit number)
  //     const phoneRegex = /^[0-9]{10}$/;
  
  //     // Postal Code Validation (4 to 6 digits)
  //     const postCodeRegex = /^[0-9]{4,6}$/;
  
  //     // Validation Checks
  //     if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.postCode) {
  //       toast.error("Please fill in all required fields.");
  //       return;
  //     }
  //     if (!emailRegex.test(formData.email)) {
  //       toast.error("Please enter a valid email address.");
  //       return;
  //     }
  //     if (!phoneRegex.test(formData.phone)) {
  //       toast.error("Please enter a valid 10-digit phone number.");
  //       return;
  //     }
  //     if (!postCodeRegex.test(formData.postCode)) {
  //       toast.error("Please enter a valid postal code (4-6 digits).");
  //       return;
  //     }
  //     setError("");
  
  //     const totalAmount = orderItems.reduce((sum, item) => sum + item.price, 0);
  //     let paymentId = "";
  //     let paymentStatus = "";
  //     let paymentMode = "";
  
  //     if (paymentMethod === 'cash') {
  //       paymentId = "COD_" + Date.now();
  //       paymentStatus = "pending";
  //       paymentMode = "cash";
  //     } else if (paymentMethod === 'online') {
  //       console.log("Online Payment");
  //       return;
  //     } else {
  //       console.log("Invalid Payment Method");
  //       return;
  //     }
  //     console.log(useraddress);
  //     if(useraddress && useraddress._id !="" ) {
  //       const formDataToSend = new FormData();
  //       formDataToSend.append('userId', userId);
  //       formDataToSend.append('firstname', formData.firstName);
  //       formDataToSend.append('lastName', formData.lastName);
  //       formDataToSend.append('businessName', formData.businessName);
  //       formDataToSend.append('country', formData.country);
  //       formDataToSend.append('email', formData.email);
  //       formDataToSend.append('address', formData.address);
  //       formDataToSend.append('postCode', formData.postCode);
  //       formDataToSend.append('city', formData.city);
  //       formDataToSend.append('state', formData.state);
  //       formDataToSend.append('landmark', formData.landmark || '');
  //       formDataToSend.append('phonenumber', formData.phone);
  //       formDataToSend.append('altnumber', formData.altnumber || '');
  //       formDataToSend.append('gst_name', formData.gst_name || '');
  //       formDataToSend.append('gst_number', formData.gst_number || '');
  //       formDataToSend.append('additionalInfo', formData.additionalInfo || '');

  //       const addressRes = await fetch('/api/useraddress/add', {
  //         method: 'POST',
  //         body: formDataToSend,
  //       });

  //       if (!addressRes.ok) {
  //         throw new Error('Failed to save address');
  //       }
  //       const addressData = await addressRes.json();
  //       setUseraddress(addressData.userAddress);
  //       console.log(useraddress);
  //       console.log(useraddress[0]?._id);
  //       console.log(addressData.userAddress);
  //     }
  //     // Save Payment
  //     const paymentRes = await fetch('/api/payment', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         user_id: userId, // Assuming user is defined
  //         payment_mode: paymentMode,
  //         status: paymentStatus,
  //         modevalue: totalAmount,
  //         payment_id: paymentId,
  //         payment_Date: new Date(),
  //       }),
  //     });
  
  //     if (!paymentRes.ok) {
  //       throw new Error('Payment processing failed');
  //     }
  
  //     const paymentData = await paymentRes.json();
  
  //     // Save Order
  //     const orderRes = await fetch('/api/orders/add', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         user_id: userId,
  //         // cart_id: "some_cart_id",
  //         user_adddeliveryid: useraddress[0]?._id,
  //         order_username: `${formData.firstName} ${formData.lastName}`,
  //         order_phonenumber: formData.phone,
  //         email_address : formData.email,
  //         order_item: orderItems,
  //         order_amount: totalAmount,
  //         order_deliveryaddress: `${formData.address}, ${formData.city}, ${formData.state}, ${formData.country}, ${formData.postCode}`,
  //         payment_method: paymentMethod,
  //         payment_type: paymentMode,
  //         order_status: "pending",
  //         delivery_type: "standard",
  //         payment_id: paymentData._id,
  //         payment_status : paymentData.status,
  //         order_number: "ORD" + Date.now(),
  //         order_details: orderItems.map((item) => ({
  //           item_code: `ITEM${item.id}`,
  //           product_id: item.id,
  //           product_name: item.name,
  //           product_price: item.price,
  //           model: "N/A",
  //           user_id: user.id,
  //           coupondiscount: 0,
  //           created_at: new Date(),
  //           updated_at: new Date(),
  //           quantity: 1,
  //           store_id: "STORE01",
  //           orderNumber: "ORD" + Date.now(),
  //         })),
  //       }),
  //     });
  
  //     if (!orderRes.ok) {
  //       throw new Error('Order creation failed');
  //     }
  
  //     toast.success("Order placed successfully!");
      
  //   } catch (error) {
  //     console.error("Error submitting order:", error);
  //     toast.error("Failed to place order. Please try again.");
  //   }
  // };


  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setShowAuthModal(true);
        return;
      }
      const decoded = jwtDecode(token);
      const userId = decoded.userId;
  
      // Use saved address data if selected, otherwise use form data
      const addressData = useSavedAddress && selectedAddress !== null 
        ? useraddress[selectedAddress]
        : formData;
  
      // Validation Checks (only if not using saved address)
      if (!useSavedAddress || selectedAddress === null) {
        // Email Validation Regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // Phone Validation (10-digit number)
        const phoneRegex = /^[0-9]{10}$/;
        // Postal Code Validation (4 to 6 digits)
        const postCodeRegex = /^[0-9]{4,6}$/;
  
        if (!addressData.firstName || !addressData.lastName || !addressData.email || 
            !addressData.phonenumber || !addressData.postCode) {
          toast.error("Please fill in all required fields.");
          return;
        }
        if (!emailRegex.test(addressData.email)) {
          toast.error("Please enter a valid email address.");
          return;
        }
        if (!phoneRegex.test(addressData.phonenumber)) {
          toast.error("Please enter a valid 10-digit phone number.");
          return;
        }
        if (!postCodeRegex.test(addressData.postCode)) {
          toast.error("Please enter a valid postal code (4-6 digits).");
          return;
        }
      }
  
      setError("");
  
      const totalAmount = orderItems.reduce((sum, item) => sum + item.price, 0);
      let paymentId = "";
      let paymentStatus = "";
      let paymentMode = "";
  
      if (paymentMethod === 'cash') {
        paymentId = "COD_" + Date.now();
        paymentStatus = "pending";
        paymentMode = "cash";
      } else if (paymentMethod === 'online') {
        console.log("Online Payment");
        return;
      } else {
        console.log("Invalid Payment Method");
        return;
      }
  
      // Only save new address if not using saved address
      if (!useSavedAddress || selectedAddress === null) {
        const formDataToSend = new FormData();
        formDataToSend.append('userId', userId);
        formDataToSend.append('firstname', addressData.firstName);
        formDataToSend.append('lastName', addressData.lastName);
        formDataToSend.append('businessName', addressData.businessName || '');
        formDataToSend.append('country', addressData.country);
        formDataToSend.append('email', addressData.email);
        formDataToSend.append('address', addressData.address);
        formDataToSend.append('postCode', addressData.postCode);
        formDataToSend.append('city', addressData.city);
        formDataToSend.append('state', addressData.state);
        formDataToSend.append('landmark', addressData.landmark || '');
        formDataToSend.append('phonenumber', addressData.phonenumber);
        formDataToSend.append('altnumber', addressData.altnumber || '');
        formDataToSend.append('gst_name', addressData.gst_name || '');
        formDataToSend.append('gst_number', addressData.gst_number || '');
        formDataToSend.append('additionalInfo', addressData.additionalInfo || '');
  
        const addressRes = await fetch('/api/useraddress/add', {
          method: 'POST',
          body: formDataToSend,
        });
  
        if (!addressRes.ok) {
          throw new Error('Failed to save address');
        }
        const newAddressData = await addressRes.json();

        setUseraddress(prev => [...prev, newAddressData.userAddress]);
      }
  
      // Save Payment
      const paymentRes = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          payment_mode: paymentMode,
          status: paymentStatus,
          modevalue: totalAmount,
          payment_id: paymentId,
          payment_Date: new Date(),
        }),
      });
  
      if (!paymentRes.ok) {
        throw new Error('Payment processing failed');
      }
  
      const res = await paymentRes.json();
      const paymentData = res.paymentData;
      // Prepare delivery address string
      const deliveryAddress = useSavedAddress && selectedAddress !== null
        ? `${useraddress[selectedAddress].address}, ${useraddress[selectedAddress].city}, ${useraddress[selectedAddress].state}, ${useraddress[selectedAddress].country}, ${useraddress[selectedAddress].postCode}`
        : `${addressData.address}, ${addressData.city}, ${addressData.state}, ${addressData.country}, ${addressData.postCode}`;
  
      // Save Order
      console.log(addressData,paymentData);
      console.log(useSavedAddress,selectedAddress,useraddress);
      alert("addressData");
      const orderRes = await fetch('/api/orders/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          user_adddeliveryid: useSavedAddress && selectedAddress !== null 
            ? useraddress[selectedAddress]._id 
            :  useraddress[0]?._id,
          order_username: `${addressData.firstName} ${addressData.lastName}`,
          order_phonenumber: addressData.phonenumber,
          email_address: addressData.email,
          order_item: orderItems,
          order_amount: totalAmount,
          order_deliveryaddress: deliveryAddress,
          payment_method: paymentMethod,
          payment_type: paymentMode,
          order_status: "pending",
          delivery_type: "standard",
          payment_id: paymentData._id,
          payment_status: paymentData.status,
          order_number: "ORD" + Date.now(),
          order_details: orderItems.map((item) => ({
            item_code: `ITEM${item.id}`,
            product_id: item.id,
            product_name: item.name,
            product_price: item.price,
            model: "N/A",
            user_id: userId,
            coupondiscount: 0,
            created_at: new Date(),
            updated_at: new Date(),
            quantity: 1,
            store_id: "STORE01",
            orderNumber: "ORD" + Date.now(),
          })),
        }),
      });
  
      if (!orderRes.ok) {
        throw new Error('Order creation failed');
      }
  
      toast.success("Order placed successfully!");
      
    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error("Failed to place order. Please try again.");
    }
  };
  
  // Auth Modal Component
  const AuthModal = ({ onClose, onSuccess, error }) => {
    const [activeTab, setActiveTab] = useState('login');
    const [formData, setFormData] = useState({ email: '', password: '', name: '' });
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState('');
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setFormError('');
  
      try {
        const endpoint = activeTab === 'login' ? '/api/login' : '/api/register';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activeTab === 'login' ? {
            email: formData.email,
            password: formData.password
          } : {
            name: formData.name,
            email: formData.email,
            mobile:formData.mobile,
            password: formData.password
          }),
        });
  
        const data = await response.json();
        console.log(data);
        
        if (!response.ok) throw new Error(data.message || 'Authentication failed');
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        onSuccess();
      } catch (error) {
        console.error('Authentication error:', error);
        setFormError(error.message);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 w-96 max-w-full relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
  
          <div className="flex gap-4 mb-6 border-b">
            <button
              className={`pb-2 px-1 ${
                activeTab === 'login' 
                  ? 'border-b-2 border-[#d72828] text-[#d72828]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('login')}
            >
              Login
            </button>
            <button
              className={`pb-2 px-1 ${
                activeTab === 'register'
                  ? 'border-b-2 border-[#d72828] text-[#d72828]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('register')}
            >
              Register
            </button>
          </div>
  
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'register' && (
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
            {activeTab === 'register' && (
              <input
                type="mobile"
                placeholder="mobile"
                value={formData.mobile}
                onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            )}
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
            
            {(formError || error) && (
              <div className="text-red-500 text-sm">
                {formError || error}
              </div>
            )}
  
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#d72828] text-white py-2 px-4 rounded hover:bg-[#d72828] disabled:bg-gray-400 transition-colors duration-200"
            >
              {loading ? 'Processing...' : activeTab === 'login' ? 'Login' : 'Register'}
            </button>
          </form>
        </div>
      </div>
    );
  };
  


  return (

    <div className="bg-white min-h-screen">
            <ToastContainer position="top-right" autoClose={5000} />
      {/* 🟠 Wishlist Header Bar */}
      <div className="bg-red-50 py-6 px-8 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Checkout</h2>
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">🏠 Home</span>
          <span className="text-gray-500">›</span>
          <span className="text-orange-500 font-semibold">Checkout</span>
        </div>
      </div>


      <div className="max-w-9xl mx-auto rounded-lg p-8">
    {useraddress && useraddress.length > 0 && (
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Saved Addresses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {useraddress.map((item, index) => (
            <div 
              key={`address-${index}`} 
              className={`border p-4 rounded-lg cursor-pointer transition-all ${selectedAddress === index ? 'border-orange-500 bg-orange-50' : 'hover:border-gray-300'}`}
              onClick={() => setSelectedAddress(index)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{item.firstName} {item.lastName}</p>
                  <p className="text-sm text-gray-600">{item.address}</p>
                  <p className="text-sm text-gray-600">{item.city}, {item.state}, {item.postCode}</p>
                  <p className="text-sm text-gray-600">{item.country}</p>
                  <p className="text-sm text-gray-600">Phone: {item.phonenumber}</p>
                </div>
                {selectedAddress === index && (
                  <span className="text-orange-500">✓ Selected</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <button 
            onClick={() => setUseSavedAddress(!useSavedAddress)}
            className="text-orange-500 hover:text-orange-700 text-sm font-medium"
          >
            {useSavedAddress ? 'Use new address instead' : 'Use saved address'}
          </button>
        </div>
      </div>
    )}

    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left - Checkout Form */}
      <div className="w-full lg:w-2/3 bg-white border p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {useSavedAddress && selectedAddress !== null ? 'Selected Address' : 'Billing Details'}
        </h2>

        {error && <p className="text-red-500 text-bold-sm mb-4">{error}</p>}

        {useSavedAddress && selectedAddress !== null ? (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <p><span className="font-medium">Name:</span> {useraddress[selectedAddress].firstName} {useraddress[selectedAddress].lastName}</p>
              <p><span className="font-medium">Phone:</span> {useraddress[selectedAddress].phonenumber}</p>
              <p><span className="font-medium">Address:</span> {useraddress[selectedAddress].address}</p>
              <p><span className="font-medium">City:</span> {useraddress[selectedAddress].city}</p>
              <p><span className="font-medium">State:</span> {useraddress[selectedAddress].state}</p>
              <p><span className="font-medium">Country:</span> {useraddress[selectedAddress].country}</p>
              <p><span className="font-medium">Postal Code:</span> {useraddress[selectedAddress].postCode}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} className="border p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200" required/>
              <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} className="border p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200" required/>
            </div>

            <input type="text" name="businessName" placeholder="Business Name (Optional)" value={formData.businessName} onChange={handleChange} className="border p-2 rounded-md w-full mt-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200"/>
            <input type="text" name="country" placeholder="Country" value={formData.country} onChange={handleChange} className="border p-2 rounded-md w-full mt-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200"/>
            <input type="text" name="address" placeholder="House number and street name" value={formData.address} onChange={handleChange} className="border p-2 rounded-md w-full mt-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200"/>
            <input type="text" name="landmark" placeholder="landmark, suite, unit, etc. (Optional)" value={formData.landmark} onChange={handleChange} className="border p-2 rounded-md w-full mt-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200"/>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleChange} className="border p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200"/>
              <input type="text" name="state" placeholder="State/Province" value={formData.state} onChange={handleChange} className="border p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200"/>
            </div>

            <input type="text" name="postCode" placeholder="Post Code" value={formData.postCode} onChange={handleChange} className="border p-2 rounded-md w-full mt-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200"/>
            <input type="text" name="phonenumber" placeholder="phonenumber" value={formData.phonenumber} onChange={handleChange} className="border p-2 rounded-md w-full mt-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200" />
            <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className="border p-2 rounded-md w-full mt-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200" />

            <h3 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Additional Information</h3>
            <textarea name="additionalInfo" placeholder="Notes about your order" value={formData.additionalInfo} onChange={handleChange} className="border p-2 rounded-md w-full h-20 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200"></textarea>
          </form>
        )}
      </div>

      {/* Right - Order Summary */}
      <div className="w-full lg:w-1/3 bg-gray-50 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Orders</h3>

        <div className="border-b pb-3 mb-3">
          {orderItems.map((item) => (
            <div key={`order-item-${item.id}`} className="flex justify-between text-gray-600">
              <span>{item.name}</span>
              <span>${item.price.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between text-gray-800 font-semibold">
          <span>Subtotal:</span>
          <span>${orderItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-gray-800 font-semibold border-t pt-2 mt-2">
          <span>Total:</span>
          <span>${orderItems.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Payment Method</h3>
          <div className="space-y-2">
            {["bank", "check", "cash"].map((method) => (
              <label key={`payment-method-${method}`} className="flex items-center space-x-2">
                <input type="radio" name="payment" value={method} checked={paymentMethod === method} onChange={handlePaymentChange} className="w-4 h-4 text-orange-500"/>
                <span>{method === "bank" ? "Direct Bank Transfer" : method === "check" ? "Check Payment" : "Cash on Delivery"}</span>
              </label>
            ))}
          </div>
        </div>

        <button 
          onClick={handleSubmit} 
          className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition"
        >
          Place Order
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 mt-0">
      {features.map((feature, index) => (
        <motion.div
          key={`feature-${index}`}
          className="flex items-center bg-orange-100 p-6 rounded-2xl shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.3 }}
        >
          <div className="bg-orange-500 text-white p-4 rounded-full text-3xl">
            {feature.icon}
          </div>
          <div className="ml-5">
            <h3 className="text-xl font-bold">{feature.title}</h3>
            <p className="text-md text-gray-600">{feature.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
    {showAuthModal && (
      <AuthModal 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          fetchAddress();
        }}
        error={authError}
      />
    )}
    </div>
  );
}
