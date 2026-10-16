"use client";
import { useState, useEffect } from "react";

import BulkFilterUploadPage from "../../components/filter/filter_upload";


export default function Dashboard() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(Date.now());
  }, []);

  return (
    <div>
      
      <BulkFilterUploadPage /> {/* Use the category component here */}
    </div>
  );
}
