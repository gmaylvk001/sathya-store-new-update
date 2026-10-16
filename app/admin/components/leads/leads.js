"use client";
import React, { useEffect, useState } from "react";
import { Icon } from '@iconify/react';

export default function LeadsComponent() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/leads/get");
      const data = await response.json();
      if (data.success) {
        setLeads(data.data);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.mobile?.includes(searchTerm) ||
      lead.lead_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Icon icon="ph:users-three-duotone" className="text-red-500 w-8 h-8" />
          Leads & Enquiries
        </h2>
        
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-full max-w-sm focus-within:ring-2 focus-within:ring-red-100 focus-within:border-red-400 transition-all">
          <Icon icon="ph:magnifying-glass" className="text-gray-400 w-5 h-5 mr-2" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            className="bg-transparent border-none outline-none w-full text-sm text-gray-700 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {alertMessage && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${alertType === "error" ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-600 border border-green-100"}`}>
          {alertMessage}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Lead Type</th>
                <th className="px-6 py-4">Product/Store</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(lead.createdAt || lead.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{lead.name}</td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{lead.mobile}</div>
                      <div className="text-gray-500 text-xs">{lead.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                        {lead.lead_type || 'Enquiry'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 truncate max-w-[200px]" title={lead.product_looking_for}>
                        {lead.product_looking_for || '-'}
                      </div>
                      <div className="text-gray-500 text-xs truncate max-w-[200px]" title={lead.store}>
                        {lead.store || '-'}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <Icon icon="ph:empty" className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p>No leads found matching your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
