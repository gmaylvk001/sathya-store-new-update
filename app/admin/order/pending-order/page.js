"use client";
import { useState, useEffect } from "react";

import PendingOrders from "@/app/admin/components/order/PendingOrders";


export default function Dashboard() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(Date.now());
  }, []);

  return (
    <div>
      
      <PendingOrders /> {/* Use the order component here */}
    </div>
  );
}
