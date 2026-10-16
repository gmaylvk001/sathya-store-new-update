"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function OldLoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("login");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({ name: "", email: "", mobile: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const clearErrors = () => {
    setError("");
    setFieldErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearErrors();

    const guestId = typeof window !== "undefined" ? localStorage.getItem("guestCartId") : null;

    try {
      const endpoint = activeTab === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = activeTab === "login"
        ? { email: loginData.email, password: loginData.password, guestId }
        : { name: registerData.name, email: registerData.email, mobile: registerData.mobile, password: registerData.password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errorType === "email") {
          setFieldErrors({ email: data.error });
        } else if (data.errorType === "password") {
          setFieldErrors({ password: data.error });
        } else {
          setError(data.error || data.message || "Authentication failed");
        }
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.removeItem("guestCartId");
        window.location.href = "/";
      } else if (activeTab === "register") {
        // Registration successful, switch to login
        setActiveTab("login");
        setError("");
        setLoginData({ email: registerData.email, password: "" });
        alert("Registration successful! Please login.");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8">
        {!showForgotPassword ? (
          <>
            <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">
              {activeTab === "login" ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-sm text-gray-500 text-center mb-6">
              {activeTab === "login" ? "Login with your email & password" : "Register a new account"}
            </p>

            <div className="flex gap-4 mb-6 border-b">
              <button
                className={`pb-2 px-1 text-sm font-medium ${activeTab === "login" ? "border-b-2 border-[#d72828] text-[#d72828]" : "text-gray-500 hover:text-gray-700"}`}
                onClick={() => { setActiveTab("login"); clearErrors(); }}
              >
                Login
              </button>
              <button
                className={`pb-2 px-1 text-sm font-medium ${activeTab === "register" ? "border-b-2 border-[#d72828] text-[#d72828]" : "text-gray-500 hover:text-gray-700"}`}
                onClick={() => { setActiveTab("register"); clearErrors(); }}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === "register" && (
                <div>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    required
                  />
                </div>
              )}

              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={activeTab === "login" ? loginData.email : registerData.email}
                  onChange={(e) => {
                    if (activeTab === "login") {
                      setLoginData({ ...loginData, email: e.target.value });
                    } else {
                      setRegisterData({ ...registerData, email: e.target.value });
                    }
                    if (fieldErrors.email) clearErrors();
                  }}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm ${fieldErrors.email ? "border-red-500" : ""}`}
                  required
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-500">{fieldErrors.email}</p>
                )}
              </div>

              {activeTab === "register" && (
                <div>
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    value={registerData.mobile}
                    onChange={(e) => setRegisterData({ ...registerData, mobile: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    required
                  />
                </div>
              )}

              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={activeTab === "login" ? loginData.password : registerData.password}
                  onChange={(e) => {
                    if (activeTab === "login") {
                      setLoginData({ ...loginData, password: e.target.value });
                    } else {
                      setRegisterData({ ...registerData, password: e.target.value });
                    }
                    if (fieldErrors.password) clearErrors();
                  }}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm ${fieldErrors.password ? "border-red-500" : ""}`}
                  required
                  minLength={6}
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-500">{fieldErrors.password}</p>
                )}
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#d72828] text-white py-2.5 px-4 rounded-lg hover:bg-[#b91c1c] disabled:bg-gray-400 transition-colors duration-200 font-medium"
              >
                {loading ? "Processing..." : activeTab === "login" ? "Login" : "Register"}
              </button>

              {activeTab === "login" && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setForgotStep(1);
                      setForgotEmail(loginData.email || "");
                      setForgotOtp("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setForgotMessage("");
                      setForgotError("");
                    }}
                    className="text-sm text-[#d72828] hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </form>
          </>
        ) : (
          <>
            {/* Forgot Password Flow */}
            <button
              onClick={() => setShowForgotPassword(false)}
              className="text-sm text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
            >
              ← Back to Login
            </button>

            {forgotStep === 1 && (
              <>
                <h2 className="text-xl font-semibold mb-4">Reset Password</h2>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setForgotError(""); setForgotMessage(""); setForgotLoading(true);
                  try {
                    const res = await fetch("/api/auth/request-reset", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: forgotEmail }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || "Error sending OTP");
                    setForgotMessage("OTP sent to your email.");
                    setForgotStep(2);
                  } catch (err) {
                    setForgotError(err.message);
                  } finally {
                    setForgotLoading(false);
                  }
                }} className="space-y-4">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                  {forgotError && <p className="text-red-500 text-sm">{forgotError}</p>}
                  {forgotMessage && <p className="text-green-500 text-sm">{forgotMessage}</p>}
                  <button type="submit" disabled={forgotLoading} className="w-full bg-[#d72828] text-white py-2.5 rounded-lg hover:bg-[#b91c1c] disabled:bg-gray-400 font-medium">
                    {forgotLoading ? "Sending..." : "Send OTP"}
                  </button>
                </form>
              </>
            )}

            {forgotStep === 2 && (
              <>
                <h2 className="text-xl font-semibold mb-4">Enter OTP</h2>
                <p className="text-sm mb-3">Email: <strong>{forgotEmail}</strong></p>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setForgotError(""); setForgotMessage(""); setForgotLoading(true);
                  try {
                    const res = await fetch("/api/auth/verify-otp", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: forgotEmail, otp: forgotOtp }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || "Invalid OTP");
                    setForgotMessage("OTP verified. Please set your new password.");
                    setForgotStep(3);
                  } catch (err) {
                    setForgotError(err.message);
                  } finally {
                    setForgotLoading(false);
                  }
                }} className="space-y-4">
                  <input type="text" placeholder="Enter OTP" value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value)} required className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm" />
                  {forgotError && <p className="text-red-500 text-sm">{forgotError}</p>}
                  {forgotMessage && <p className="text-green-500 text-sm">{forgotMessage}</p>}
                  <button type="submit" disabled={forgotLoading} className="w-full bg-[#d72828] text-white py-2.5 rounded-lg hover:bg-[#b91c1c] disabled:bg-gray-400 font-medium">
                    {forgotLoading ? "Validating..." : "Validate OTP"}
                  </button>
                </form>
              </>
            )}

            {forgotStep === 3 && (
              <>
                <h2 className="text-xl font-semibold mb-4">Set New Password</h2>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setForgotError(""); setForgotMessage("");
                  if (newPassword !== confirmPassword) {
                    setForgotError("Passwords do not match.");
                    return;
                  }
                  setForgotLoading(true);
                  try {
                    const res = await fetch("/api/auth/reset-password", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, newPassword }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || "Error resetting password");
                    setForgotMessage("Password reset successful!");
                    setTimeout(() => {
                      setShowForgotPassword(false);
                      setActiveTab("login");
                    }, 1500);
                  } catch (err) {
                    setForgotError(err.message);
                  } finally {
                    setForgotLoading(false);
                  }
                }} className="space-y-4">
                  <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm" />
                  <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm" />
                  {forgotError && <p className="text-red-500 text-sm">{forgotError}</p>}
                  {forgotMessage && <p className="text-green-500 text-sm">{forgotMessage}</p>}
                  <button type="submit" disabled={forgotLoading} className="w-full bg-[#d72828] text-white py-2.5 rounded-lg hover:bg-[#b91c1c] disabled:bg-gray-400 font-medium">
                    {forgotLoading ? "Resetting..." : "Reset Password"}
                  </button>
                </form>
              </>
            )}
          </>
        )}

        <div className="mt-6 pt-4 border-t text-center">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
