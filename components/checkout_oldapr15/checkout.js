"use client";
import { useState } from "react";
import { motion } from "framer-motion";
export default function CheckoutComponent() {
    // Form State
    const [formData, setFormData] = useState({
      firstName: "",
      lastName: "",
      businessName: "",
      country: "",
      address: "",
      apartment: "",
      city: "",
      state: "",
      postCode: "",
      phone: "",
      email: "",
      additionalInfo: "",
    });
  
  
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
  
    // Order Summary
    const orderItems = [
      { id: 1, name: "HP Chromebook With Intel Celeron", price: 250 },
      { id: 2, name: "HP Chromebook With Intel Celeron", price: 250 },
      { id: 3, name: "HP Chromebook With Intel Celeron", price: 250 },
    ];
  
    // Handle Form Change
    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };
  
    // Handle Payment Selection
    const handlePaymentChange = (e) => {
      setPaymentMethod(e.target.value);
    };
  
    // Handle Form Submission
    const handleSubmit = (e) => {
      e.preventDefault();
    
      // Email Validation Regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
      // Phone Validation (10-digit number)
      const phoneRegex = /^[0-9]{10}$/;
    
      // Postal Code Validation (4 to 10 digits)
      const postCodeRegex = /^[0-9]{4,6}$/;
    
      // Validation Checks
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.postCode) {
        setError("Please fill in all required fields.");
        return;
      }
      if (!emailRegex.test(formData.email)) {
        setError("Please enter a valid email address.");
        return;
      }
      if (!phoneRegex.test(formData.phone)) {
        setError("Please enter a valid 10-digit phone number.");
        return;
      }
      if (!postCodeRegex.test(formData.postCode)) {
        setError("Please enter a valid postal code (4-6 digits).");
        return;
      }
    
      setError(""); // Clear error if validation passes
    
      const orderDetails = {
        customer: formData,
        items: orderItems,
        totalAmount: orderItems.reduce((sum, item) => sum + item.price, 0),
        paymentMethod,
      };
    
      console.log("Order Submitted: ", orderDetails);
    
      // Mock API call or database submission
      alert("Order placed successfully!");
    };
    
    return (
  
      <div className="bg-white min-h-screen">
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
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left - Checkout Form */}
          <div className="w-full lg:w-2/3 bg-white border p-6 rounded-lg shadow">
          
             {/* Coupon Section */}
             <div className="text-sm text-gray-700 mb-4 border border-gray-100 p-3 rounded-lg shadow">
          Have a coupon? <span className="text-orange-500 cursor-pointer">Click here to enter your code</span>
        </div>
           
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Billing Details</h2>
  
            {error && <p className="text-red-500 text-bold-sm mb-4">{error}</p>}
  
  
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} className="border p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200" required/>
                <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} className="border p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200" required/>
              </div>
  
              <input type="text" name="businessName" placeholder="Business Name (Optional)" value={formData.businessName} onChange={handleChange} className="border p-2 rounded-md w-full mt-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200"/>
              <input type="text" name="country" placeholder="Country" value={formData.country} onChange={handleChange} className="border p-2 rounded-md w-full mt-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200"/>
              <input type="text" name="address" placeholder="House number and street name" value={formData.address} onChange={handleChange} className="border p-2 rounded-md w-full mt-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200"/>
              <input type="text" name="apartment" placeholder="Apartment, suite, unit, etc. (Optional)" value={formData.apartment} onChange={handleChange} className="border p-2 rounded-md w-full mt-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200"/>
  
              <div className="grid grid-cols-2 gap-4 mt-3">
                <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleChange} className="border p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200"/>
                <input type="text" name="state" placeholder="State/Province" value={formData.state} onChange={handleChange} className="border p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200"/>
              </div>
  
              <input type="text" name="postCode" placeholder="Post Code" value={formData.postCode} onChange={handleChange} className="border p-2 rounded-md w-full mt-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200"/>
              <input type="text" name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} className="border p-2 rounded-md w-full mt-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200" />
              <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className="border p-2 rounded-md w-full mt-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200" />
  
              <h3 className="text-lg font-semibold text-gray-700 mt-6 mb-2">Additional Information</h3>
              <textarea name="additionalInfo" placeholder="Notes about your order" value={formData.additionalInfo} onChange={handleChange} className="border p-2 rounded-md w-full h-20 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-200"></textarea>
            </form>
          </div>
  
          {/* Right - Order Summary */}
          <div className="w-full lg:w-1/3 bg-gray-50 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Orders</h3>
  
            <div className="border-b pb-3 mb-3">
              {orderItems.map((item) => (
                <div key={item.id} className="flex justify-between text-gray-600">
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
                  <label key={method} className="flex items-center space-x-2">
                    <input type="radio" name="payment" value={method} checked={paymentMethod === method} onChange={handlePaymentChange} className="w-4 h-4 text-orange-500"/>
                    <span>{method === "bank" ? "Direct Bank Transfer" : method === "check" ? "Check Payment" : "Cash on Delivery"}</span>
                  </label>
                ))}
              </div>
            </div>
  
            <button onClick={handleSubmit} className="mt-6 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition">
              Place Order
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 mt-0">
      {features.map((feature, index) => (
        <motion.div
          key={index}
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
      </div>
    );
  }
  