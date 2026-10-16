"use client";
import { useState, useEffect } from "react";

import OrderComponent from "../../../app/admin/components/order/order";


export default function Dashboard() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(Date.now());
  }, []);

  return (
    <div>
      
      <OrderComponent /> {/* Use the order component here */}
    </div>
  );
}
