"use client";
import { useState, useEffect } from "react";

import CategoryBannerManager from "../../../app/admin/components/main-cat-flash/main-cat-flash";


export default function Dashboard() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(Date.now());
  }, []);

  return (
    <div>
      
      <CategoryBannerManager /> {/* Use the category component here */}
    </div>
  );
}
