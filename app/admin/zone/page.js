"use client";
import { useState, useEffect } from "react";

import ZonePage from "../components/zone/zone";


export default function Dashboard() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(Date.now());
  }, []);

  return (
    <div>
      
      <ZonePage /> {/* Use the category component here */}
    </div>
  );
}
