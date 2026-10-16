"use client";
import { useState, useEffect } from "react";

import MainCategoryBannerManager from "../../../app/admin/components/main-cat/main-cat";


export default function Dashboard() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(Date.now());
  }, []);

  return (
    <div>
      
      <MainCategoryBannerManager /> {/* Use the category component here */}
    </div>
  );
}
