"use client";
import { useState, useEffect } from "react";

import DesignComponent from "../../../app/admin/components/design/design";


export default function Dashboard() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(Date.now());
  }, []);

  return (
    <div>
      
      <DesignComponent /> {/* Use the category component here */}
    </div>
  );
}
