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

  const [isLoading, setIsLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");


  const [zoneToDelete, setZoneToDelete] = useState(null);


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

   // Pagination variables
  const totalEntries =filteredZones .length;
  const startEntry = (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(currentPage * itemsPerPage, totalEntries);
  const totalPages = Math.ceil(totalEntries / itemsPerPage);

  const paginatedZones = filteredZones.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const fetchZones = async () => {
    try {
      const res = await fetch("/api/zones"); // Replace with your API route
      const data = await res.json();
       if (Array.isArray(data))  {
      setZones(data);
       } else {
        setAlertMessage(data.error || "Error fetching stores.");
        setShowAlert(true);
      }
    } catch (error) {
      console.error("Error fetching zones:", error);
      setAlertMessage("Failed to fetch stores: " + error.message);
      setShowAlert(true);
    }finally {
      setIsLoading(false);
      setTimeout(() => setShowAlert(false), 3000);
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
      setAlertMessage("Zone added successfully!");
        setShowAlert(true);
      setIsModalOpen(false);
      fetchZones();
      setNewZone({ zone_name: "", slug: "", status: "Active" });
      
    }else {
        setAlertMessage(res.error || "Error adding store");
        setShowAlert(true);
      }
      setTimeout(() => setShowAlert(false), 3000);
  };

  const handleUpdateZone = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/zones/${editZone._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editZone),
    });
    if (res.ok) {
      setAlertMessage("Store Updated successfully!");
      setShowAlert(true);
      setIsUpdateModalOpen(false);
      fetchZones();
    }else {
          setAlertMessage(res.error || "Error deleting store.");
          setShowAlert(true);
        }
        setTimeout(() => setShowAlert(false), 3000);
  };

 const handleDelete = async (id) => {
  try {
    const res = await fetch(`/api/zones/${id}`, { method: "DELETE" });
    const result = await res.json();

    if (res.ok) {
      setAlertMessage("Zone status set to Inactive successfully!");
      fetchZones();
    } else {
      setAlertMessage(result.error || "Error inactivating zone.");
    }
  }  catch (error) {
  console.error("Error inactivating zone:", error);
  const message = error?.message || "Something went wrong during zone inactivation.";
  setAlertMessage("Error inactivating zone: " + message);
} finally {
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
    setShowConfirmationModal(false);
    setZoneToDelete(null);
  }
};


const renderPagination = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    if (pageNumbers.length <= 1) return null;

    return (
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-600">
          Showing {startEntry} to {endEntry} of {totalEntries} entries
        </div>

        <ul className="pagination flex items-center space-x-1" role="navigation" aria-label="Pagination">
          <li className="page-item">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-black hover:bg-gray-100"
              aria-label="Previous page"
            >
              «
            </button>
          </li>
          
          {pageNumbers.map((number) => (
            <li key={number} className={`page-item ${currentPage === number ? 'bg-[#d72828] text-white' : ''}`}>
              <button
                onClick={() => paginate(number)}
                className="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-black hover:bg-gray-100"
                aria-label={`Page ${number}`}
              >
                {number}
              </button>
            </li>
          ))}
          
          <li className="page-item">
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === pageNumbers.length}
              className="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-black hover:bg-gray-100"
              aria-label="Next page"
            >
              »
            </button>
          </li>
        </ul>
      </div>
    );
  };


  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-5 mt-5">
        <h2 className="text-2xl font-bold">Zone List</h2>
      </div>
      
      {showAlert && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-md shadow-lg z-50 ${
          alertMessage.includes("Error") || alertMessage.includes("Failed") 
            ? "bg-red-500 text-white" 
            : "bg-green-500 text-white"
        }`}>
          {alertMessage}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d72828]"></div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-5 h-[500px] overflow-x-auto border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end mb-5">
            {/* Search Input */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Icon icon="ic:baseline-search" className="w-4 h-4 text-gray-500" />
                </span>
                <input
                  type="text"
          placeholder="Search Zone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-[#d72828] text-sm"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

          

            <div>
              <button
               onClick={() => setIsModalOpen(true)}
                className="bg-[#d72828] hover:bg-[#d72828] text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition duration-150"
              >
                + Add Zone
              </button>
             
            </div>
          </div>
          <hr className="border-t border-gray-200 mb-4" />
          {paginatedZones.length === 0 ? (
            <div className="text-center py-8">
              <p> No zones found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="p-2 text-left">Zone Name</th>
                      <th className="p-2 text-left">Slug</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    { paginatedZones.map((zone) => (
                        <tr key={zone._id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-bold">{zone.zone_name}</td>
                          <td className="p-2 font bold">{zone.slug}</td>
                          <td className="p-2 font-semibold">
                            <span className={zone.status === "Active" ? "text-green-500" : "text-red-500"}>
                              {zone.status}
                            </span>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                               
                               <button
                               onClick={() => {
                        setEditZone(zone);
                        setIsUpdateModalOpen(true);
                      }}
                                className="w-7 h-7 bg-red-100 text-[#d72828] rounded-full inline-flex items-center justify-center hover:bg-red-200 transition"
                                title="Edit"
                              >
                                <FaEdit className="mr-1" />
                              </button>
                              <button
                                onClick={() => {
                            setZoneToDelete(zone._id);
                            setShowConfirmationModal(true);
                          }}

                                className="w-7 h-7 bg-pink-100 text-pink-600 rounded-full inline-flex items-center justify-center hover:bg-pink-200 transition"
                                title="Delete"
                              >
                                <Icon icon="mingcute:delete-2-line" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {renderPagination()}
            </>
          )}
        </div>
      )}


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

    

      {/* Confirmation Modal */}
     {showConfirmationModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
      <p className="mb-6">Are you sure you want to delete this zone?</p>
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => {
            setShowConfirmationModal(false); // Cancel deletion
            setZoneToDelete(null);
          }}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={() => handleDelete(zoneToDelete)} // ✅ Correct usage here
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
