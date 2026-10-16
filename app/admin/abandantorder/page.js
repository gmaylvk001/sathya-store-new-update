"use client";
import { useState, useEffect } from "react";
import AbandantOrdersTable from "../components/abandantorder/abandantorder";


export default function Dashboard() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(Date.now());
  }, []);

  return (
    <div>
      
      <AbandantOrdersTable /> 
    </div>
  );
}
