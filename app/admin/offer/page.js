"use client";
import { useState, useEffect } from "react";

import OfferComponent from "../../../app/admin/components/offer/offer";


export default function Dashboard() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(Date.now());
  }, []);

  return (
    <div>
      
      <OfferComponent /> {/* Use the offer component here */}
    </div>
  );
}
