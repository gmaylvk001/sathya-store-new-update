"use client";
import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";

function formatLeadDate(value) {
  if (!value) return { date: "-", time: "" };
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return { date: "-", time: "" };
    const date = d.toISOString().slice(0, 10);
    const time = d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    return { date, time };
  } catch {
    return { date: "-", time: "" };
  }
}

export default function LeadsComponent() {
  const router = useRouter();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const leadsPerPage = 20;

  useEffect(() => {
    if (
      typeof document !== "undefined" &&
      /(?:^|;\s*)session_store=unilet(?:;|$)/.test(document.cookie)
    ) {
      router.replace("/admin/unilet-dashboard");
      return;
    }
    fetchLeads();
  }, [router]);

  const showAlert = (message, type) => {
    setAlertMessage(message);
    setAlertType(type);
    setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, 3000);
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/leads/get", { cache: "no-store" });
      const data = await response.json();
      if (response.status === 403) {
        showAlert(data.message || "Sathya view only", "error");
        router.replace("/admin/dashboard");
        return;
      }
      if (data.success) {
        setLeads(Array.isArray(data.data) ? data.data : []);
      } else {
        showAlert(data.message || "Failed to load leads", "error");
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
      showAlert("Error fetching leads", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!leadToDelete?._id || saving) return;
    setSaving(true);
    try {
      const response = await fetch("/api/leads/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadToDelete._id }),
      });
      const result = await response.json();
      if (result.success) {
        setLeads((prev) => prev.filter((lead) => lead._id !== leadToDelete._id));
        showAlert("Lead deleted successfully", "success");
      } else {
        showAlert(result.message || "Failed to delete lead", "error");
      }
    } catch (error) {
      console.error("Error deleting lead:", error);
      showAlert("Error deleting lead", "error");
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
      setLeadToDelete(null);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      lead.name?.toLowerCase().includes(q) ||
      lead.email?.toLowerCase().includes(q) ||
      lead.mobile?.includes(searchTerm) ||
      lead.store?.toLowerCase().includes(q) ||
      lead.product_looking_for?.toLowerCase().includes(q) ||
      lead.lead_source?.toLowerCase().includes(q) ||
      lead.lead_campaign?.toLowerCase().includes(q) ||
      lead.lead_status?.toLowerCase().includes(q) ||
      lead.manager_comments?.toLowerCase().includes(q)
    );
  });

  const indexOfLast = currentPage * leadsPerPage;
  const indexOfFirst = indexOfLast - leadsPerPage;
  const currentLeads = filteredLeads.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / leadsPerPage));
  const startEntry = filteredLeads.length === 0 ? 0 : indexOfFirst + 1;
  const endEntry = Math.min(indexOfLast, filteredLeads.length);

  return (
    <div className="container mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5 mt-5">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Icon icon="mdi:database" className="text-red-500 w-7 h-7" />
          CRM — Leads
        </h2>
        <div className="flex items-center bg-white border border-gray-200 rounded-md px-3 py-2 w-full max-w-sm">
          <Icon icon="ph:magnifying-glass" className="text-gray-400 w-5 h-5 mr-2" />
          <input
            type="text"
            placeholder="Search name, mobile, source..."
            className="bg-transparent border-none outline-none w-full text-sm text-gray-700"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {alertMessage && (
        <div
          className={`mb-4 p-3 rounded-md text-white ${
            alertType === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {alertMessage}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-5 mb-5 overflow-x-auto border border-gray-200">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-300 text-gray-800 font-semibold">
                <th className="px-3 py-3 whitespace-nowrap">Name</th>
                <th className="px-3 py-3 whitespace-nowrap">Mobile</th>
                <th className="px-3 py-3 whitespace-nowrap">Store</th>
                <th className="px-3 py-3 whitespace-nowrap">Product</th>
                <th className="px-3 py-3 whitespace-nowrap">Source</th>
                <th className="px-3 py-3 whitespace-nowrap">Campaign</th>
                <th className="px-3 py-3 whitespace-nowrap">Status</th>
                <th className="px-3 py-3 whitespace-nowrap">Manager Comment</th>
                <th className="px-3 py-3 whitespace-nowrap">Date</th>
                <th className="px-3 py-3 whitespace-nowrap text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentLeads.length > 0 ? (
                currentLeads.map((lead) => {
                  const { date, time } = formatLeadDate(lead.created_at || lead.createdAt);
                  return (
                    <tr
                      key={lead._id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors align-top"
                    >
                      <td className="px-3 py-3 text-gray-900 font-medium max-w-[160px]">
                        {lead.name || "-"}
                      </td>
                      <td className="px-3 py-3 text-gray-800 whitespace-nowrap">
                        {lead.mobile || "-"}
                      </td>
                      <td
                        className="px-3 py-3 text-gray-700 max-w-[140px] truncate"
                        title={lead.store || ""}
                      >
                        {lead.store || ""}
                      </td>
                      <td
                        className="px-3 py-3 text-gray-700 max-w-[180px] truncate"
                        title={lead.product_looking_for || ""}
                      >
                        {lead.product_looking_for || ""}
                      </td>
                      <td className="px-3 py-3 text-gray-700 max-w-[140px]">
                        <span className="whitespace-pre-line leading-snug">
                          {lead.lead_source || ""}
                        </span>
                      </td>
                      <td
                        className="px-3 py-3 text-gray-700 max-w-[120px] truncate"
                        title={lead.lead_campaign || ""}
                      >
                        {lead.lead_campaign || ""}
                      </td>
                      <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                        {lead.lead_status || ""}
                      </td>
                      <td
                        className="px-3 py-3 text-gray-700 max-w-[180px] truncate"
                        title={lead.manager_comments || ""}
                      >
                        {lead.manager_comments || ""}
                      </td>
                      <td className="px-3 py-3 text-gray-700 whitespace-nowrap">
                        <div className="leading-snug">
                          <div>{date}</div>
                          {time ? <div className="text-gray-500 text-xs">{time}</div> : null}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => router.push(`/admin/leads/edit/${lead._id}`)}
                            className="w-8 h-8 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full inline-flex items-center justify-center"
                            title="Edit"
                          >
                            <Icon icon="mingcute:edit-line" className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setLeadToDelete(lead);
                              setShowDeleteModal(true);
                            }}
                            className="w-8 h-8 bg-red-50 text-red-600 hover:bg-red-100 rounded-full inline-flex items-center justify-center"
                            title="Delete"
                          >
                            <Icon icon="mingcute:delete-2-line" className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-3 py-12 text-center text-gray-500">
                    No leads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {filteredLeads.length > 0 && (
            <div className="flex justify-between items-center mt-4 flex-wrap gap-2">
              <div className="text-sm text-gray-600">
                Showing {startEntry} to {endEntry} of {filteredLeads.length} entries
              </div>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 border rounded-md ${
                    currentPage === 1
                      ? "text-gray-400 cursor-not-allowed bg-gray-100"
                      : "text-black bg-white hover:bg-gray-100"
                  }`}
                >
                  «
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    type="button"
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1.5 border rounded-md ${
                      currentPage === i + 1
                        ? "bg-red-500 text-white"
                        : "text-black bg-white hover:bg-gray-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1.5 border rounded-md ${
                    currentPage === totalPages
                      ? "text-gray-400 cursor-not-allowed bg-gray-100"
                      : "text-black bg-white hover:bg-gray-100"
                  }`}
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Lead</h3>
            <p className="text-sm text-gray-600 mb-5">
              Delete lead{" "}
              <span className="font-semibold">
                {leadToDelete?.name || leadToDelete?.mobile}
              </span>
              ? This will soft-delete the record.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setLeadToDelete(null);
                }}
                disabled={saving}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-60"
              >
                {saving ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
