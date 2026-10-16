"use client";
import { useState, useEffect } from "react";

import HomeDelivery from "@/app/admin/components/order/HomeDelivery";


export default function Dashboard() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(Date.now());
  }, []);

  return (
    <div>
      
      <HomeDelivery /> {/* Use the order component here */}
    </div>
  );
}
