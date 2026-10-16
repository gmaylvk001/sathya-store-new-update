"use client";
import { useState, useEffect } from "react";
import CategoryProductManager from "../components/main-cat-prod/main-cat-prod";


export default function Dashboard() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(Date.now());
  }, []);

  return (
    <div>
      
      <CategoryProductManager /> {/* Use the category component here */}
    </div>
  );
}
