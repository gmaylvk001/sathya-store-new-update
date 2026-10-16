"use client";
import { useState, useEffect } from "react";

import SettingsComponent from "../../../app/admin/components/settings/settings";


export default function Dashboard() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(Date.now());
  }, []);

  return (
    <div>
      
      <SettingsComponent /> {/* Use the category component here */}
    </div>
  );
}
