"use client";
import { useState, useEffect } from "react";
import LandComponent from "@/components/land-page";

export default function LandPage() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(Date.now());
  }, []);

  return (
    <div>
      
      <LandComponent />
    </div>
  );
}
