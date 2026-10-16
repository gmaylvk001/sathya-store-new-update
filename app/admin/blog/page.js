"use client";
import { useState, useEffect } from "react";

import BlogComponent from "../../../app/admin/components/blog/blog";


export default function Dashboard() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(Date.now());
  }, []);

  return (
    <div>
      
      <BlogComponent /> {/* Use the category component here */}
    </div>
  );
}
