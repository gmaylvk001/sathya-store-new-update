"use client";

import { useRouter } from "next/navigation";

const LogoutButton = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Call logout API to track the logout event (optional)
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      // Remove JWT from localStorage
      localStorage.removeItem("authToken");

      // Redirect user to login page
      // router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <button onClick={handleLogout} className="btn btn-danger">
      Logout
    </button>
  );
};

export default LogoutButton;
