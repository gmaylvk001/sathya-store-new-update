"use client";

import React, { useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { Icon } from "@iconify/react";

export default function ZonePage() {
  const [zones, setZones] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [newZone, setNewZone] = useState({
    zone_name: "",
    slug: "",
    status: "Active",
  });

  const [editZone, setEditZone] = useState(null);

  const filteredZones = zones.filter((zone) => {
    const matchesSearch =
      zone.zone_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      zone.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "" || zone.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedZones = filteredZones.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const fetchZones = async () => {
    try {
      const res = await fetch("/api/zones"); // Replace with your API route
      const data = await res.json();
      setZones(data);
    } catch (error) {
      console.error("Error fetching zones:", error);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleAddZone = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/zones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newZone),
    });
    if (res.ok) {
      setIsModalOpen(false);
      fetchZones();
      setNewZone({ zone_name: "", slug: "", status: "Active" });
    }
  };

  const handleUpdateZone = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/zones/${editZone._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editZone),
    });
    if (res.ok) {
      setIsUpdateModalOpen(false);
      fetchZones();
    }
  };

  const handleDelete = async (id) => {
    const res = await fetch(`/api/zones/${id}`, { method: "DELETE" });
    if (res.ok) fetchZones();
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Zone List</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#d72828] text-white px-4 py-2 rounded-md hover:bg-[#d72828]"
        >
          + Add Zone
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input
          type="text"
          placeholder="Search Zone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border px-3 py-2 rounded-md w-full"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border px-3 py-2 rounded-md w-full"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg border border-gray-200">
        <table className="w-full border">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Zone Name</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedZones.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-6">
                  No zones found
                </td>
              </tr>
            ) : (
              paginatedZones.map((zone) => (
                <tr key={zone._id} className="border-t text-sm text-gray-700">
                  <td className="p-3">{zone.zone_name}</td>
                  <td className="p-3">{zone.slug}</td>
                  <td className="p-3">
                    {zone.status === "Active" ? (
                      <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-semibold">
                        Active
                      </span>
                    ) : (
                      <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-semibold">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-3 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditZone(zone);
                        setIsUpdateModalOpen(true);
                      }}
                      className="w-7 h-7 bg-red-100 text-[#d72828] rounded-full flex items-center justify-center"
                      title="Edit"
                    >
                      <FaEdit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(zone._id)}
                      className="w-7 h-7 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center"
                      title="Delete"
                    >
                      <Icon icon="mingcute:delete-2-line" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6 flex-wrap gap-3">
        <div className="text-sm text-gray-600">
          Showing {filteredZones.length === 0 ? 0 : currentPage * itemsPerPage + 1} to{" "}
          {Math.min((currentPage + 1) * itemsPerPage, filteredZones.length)} of{" "}
          {filteredZones.length} entries
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
            disabled={currentPage === 0}
            className="px-3 py-1 border rounded disabled:text-gray-400"
          >
            «
          </button>
          {Array.from({ length: Math.ceil(filteredZones.length / itemsPerPage) }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`px-3 py-1 border rounded ${
                currentPage === i ? "bg-[#d72828] text-white" : ""
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() =>
              setCurrentPage((p) =>
                p + 1 < Math.ceil(filteredZones.length / itemsPerPage) ? p + 1 : p
              )
            }
            disabled={currentPage === Math.ceil(filteredZones.length / itemsPerPage) - 1}
            className="px-3 py-1 border rounded disabled:text-gray-400"
          >
            »
          </button>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Add Zone</h2>
            <form onSubmit={handleAddZone} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Zone Name</label>
                <input
                  type="text"
                  value={newZone.zone_name}
                  onChange={(e) =>
                    setNewZone({ ...newZone, zone_name: e.target.value })
                  }
                  required
                  className="w-full border px-3 py-2 rounded-md"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Slug</label>
                <input
                  type="text"
                  value={newZone.slug}
                  onChange={(e) =>
                    setNewZone({ ...newZone, slug: e.target.value })
                  }
                  required
                  className="w-full border px-3 py-2 rounded-md"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Status</label>
                <select
                  value={newZone.status}
                  onChange={(e) =>
                    setNewZone({ ...newZone, status: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded-md"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-300 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#d72828] text-white px-4 py-2 rounded"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isUpdateModalOpen && editZone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-bold mb-4">Edit Zone</h2>
            <form onSubmit={handleUpdateZone} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Zone Name</label>
                <input
                  type="text"
                  value={editZone.zone_name}
                  onChange={(e) =>
                    setEditZone({ ...editZone, zone_name: e.target.value })
                  }
                  required
                  className="w-full border px-3 py-2 rounded-md"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Slug</label>
                <input
                  type="text"
                  value={editZone.slug}
                  onChange={(e) =>
                    setEditZone({ ...editZone, slug: e.target.value })
                  }
                  required
                  className="w-full border px-3 py-2 rounded-md"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Status</label>
                <select
                  value={editZone.status}
                  onChange={(e) =>
                    setEditZone({ ...editZone, status: e.target.value })
                  }
                  className="w-full border px-3 py-2 rounded-md"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="bg-gray-300 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#d72828] text-white px-4 py-2 rounded"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
