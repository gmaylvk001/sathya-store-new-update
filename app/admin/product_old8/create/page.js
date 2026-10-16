"use client";
import { useState, useEffect } from "react";

import ProductComponent from "@/app/admin/components/product/create";



export default function Dashboard() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(Date.now());
  }, []);

  return (
    <div className="px-2">
      
      <ProductComponent /> {/* Use the category component here */}
    </div>
  );
}
