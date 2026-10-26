"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  canLoginAs,
  establishSession,
  readStoredSession,
  userIdFromToken,
  clearBrowserAuth,
  AUTH_CONFLICT_MESSAGE,
} from "@/lib/clientAuthSession";

const schema = yup.object().shape({
  email: yup.string().required("Email is required").email("Invalid email format"),
  password: yup.string().required("Password is required").min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (redirectingRef.current) return;

    const goDashboard = (token, userId) => {
      if (redirectingRef.current) return;
      redirectingRef.current = true;
      // Repair cookies before full navigation (avoids login↔dashboard loop)
      establishSession({
        token,
        userId,
        role: "admin",
        source: "admin",
      });
      window.location.replace("/admin/dashboard");
    };

    const boot = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch("/api/auth/check", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data?.loggedIn && data?.role === "admin") {
          const uid = data.userId || userIdFromToken(token);
          if (uid) goDashboard(token, uid);
          return;
        }

        // Stale non-admin / invalid session sitting on admin login — clear lock only if not admin
        const existing = readStoredSession();
        if (existing?.role === "admin" && !data?.loggedIn) {
          clearBrowserAuth();
        }
      } catch {
        /* ignore */
      }
    };

    boot();
  }, [router]);

  const onSubmit = async (data) => {
    setLoading(true);
    setMessage("");

    try {
      // Block admin login if a different storefront account is already active
      const active = readStoredSession();
      if (active?.userId && active.role !== "admin") {
        throw new Error(AUTH_CONFLICT_MESSAGE);
      }

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Login failed");

      const adminUserId = result.userId || userIdFromToken(result.token);
      const gate = canLoginAs(adminUserId);
      if (!gate.ok) {
        throw new Error(gate.message || AUTH_CONFLICT_MESSAGE);
      }

      establishSession({
        token: result.token,
        userId: adminUserId,
        role: result.role || "admin",
        source: "admin",
      });

      setMessage("Login successful! ✅");
      redirectingRef.current = true;
      // Full navigation so middleware receives the new cookies
      window.location.replace("/admin/dashboard");
    } catch (error) {
      setMessage(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">Admin Login</h2>

        {message && (
          <p
            className={`text-center text-sm mb-3 ${
              message.includes("successful") ? "text-green-600" : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input {...register("email")} type="email" className="w-full px-4 py-2 border rounded-lg" placeholder="Enter your email" />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div className="mb-4 relative">
            <label className="block text-gray-700">Password</label>
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Enter your password"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-gray-500">
              {showPassword ? "🙈" : "👁️"}
            </button>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="w-full px-4 py-2 text-white bg-red-500 rounded-lg">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
