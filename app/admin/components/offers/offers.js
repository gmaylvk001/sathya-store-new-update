"use client";

import React, { useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { Icon } from '@iconify/react';
import ReactPaginate from "react-paginate";

export default function OffersComponent() {
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [newOffer, setNewOffer] = useState({
    offerName: "",
    slug: "",
  });

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 20;

  const fetchOffers = async () => {
    try {
      const response = await fetch("/api/offer-module");
      const data = await response.json();
      setOffers(data.data || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching offers:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  const generateSlug = (name = "") =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "offerName") {
      setNewOffer({ offerName: value, slug: generateSlug(value) });
      return;
    }
    setNewOffer({ ...newOffer, [name]: value });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "offerName") {
      setEditingOffer({ ...editingOffer, offerName: value, slug: generateSlug(value) });
      return;
    }
    setEditingOffer({ ...editingOffer, [name]: value });
  };

  const handleAddOffer = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/offer-module/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOffer),
      });

      const result = await response.json();
      if (response.ok) {
        setIsModalOpen(false);
        fetchOffers();
        setNewOffer({ offerName: "", slug: "" });
        setSuccessMessage("Offer Added Successfully");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      } else {
        alert(result.error || "Failed to add offer");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleEditOffer = (offer) => {
    setEditingOffer({ ...offer });
    setIsEditModalOpen(true);
  };

  const handleUpdateOffer = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/offer-module/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingOffer._id,
          offerName: editingOffer.offerName,
          slug: editingOffer.slug
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setIsEditModalOpen(false);
        fetchOffers();
        setEditingOffer(null);
        setSuccessMessage("Offer Updated Successfully");
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 2000);
      } else {
        alert(result.error || "Failed to update offer");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDeleteClick = (offerId) => {
    setOfferToDelete(offerId);
    setShowConfirmationModal(true);
  };

  const handleDeleteOffer = async () => {
    try {
      const response = await fetch("/api/offer-module/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: offerToDelete }),
      });

      const result = await response.json();
      if (response.ok) {
        setSuccessMessage("Offer Deleted Successfully");
        setShowSuccessModal(true);
        fetchOffers();
      } else if (result.hasProducts) {
        setSuccessMessage(result.error);
        setShowSuccessModal(true);
      } else {
        alert(result.error || "Failed to delete offer");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setShowConfirmationModal(false);
      setOfferToDelete(null);
      setTimeout(() => setShowSuccessModal(false), 2000);
    }
  };

  const filteredOffers = offers.filter(
    (offer) =>
      offer.offerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pageCount = Math.ceil(filteredOffers.length / itemsPerPage);
  const totalEntries = filteredOffers.length;
  const startEntry = currentPage * itemsPerPage + 1;
  const endEntry = Math.min((currentPage + 1) * itemsPerPage, totalEntries);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  const renderOfferRows = () => {
    return filteredOffers
      .slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
      .map((offer, index) => (
        <tr key={offer._id} className="text-center border-b hover:bg-gray-50">
          <td className="p-2 text-left pl-4">{totalEntries - (currentPage * itemsPerPage + index)}</td>
          <td className="p-2 text-blue-500 text-left cursor-pointer hover:underline" onClick={() => handleEditOffer(offer)}>
            {offer.offerName}
          </td>
          <td className="p-2 text-left">{offer.slug || "-"}</td>
          <td className="p-2">{formatDate(offer.createdAt)}</td>
          <td className="p-2">{formatDate(offer.updatedAt)}</td>
          <td className="p-2">
            <div className="flex items-center gap-2 justify-center">
              <button
                onClick={() => handleEditOffer(offer)}
                className="px-2 py-1 border rounded text-gray-600 hover:bg-gray-100 flex items-center gap-1"
                title="Edit"
              >
                <FaEdit className="w-3 h-3" /> Edit
              </button>
              <button
                onClick={() => handleDeleteClick(offer._id)}
                className="px-2 py-1 border rounded bg-red-500 text-white hover:bg-red-600 flex items-center gap-1"
                title="Delete"
              >
                <Icon icon="mingcute:delete-2-line" /> Delete
              </button>
            </div>
          </td>
        </tr>
      ));
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-5 mt-5">
        <h2 className="text-3xl font-light text-gray-700">Offers</h2>
      </div>

      {isLoading ? (
        <p>Loading Offers...</p>
      ) : (
        <div className="bg-white shadow-sm border rounded-lg p-5 overflow-x-auto border-gray-200">
          {/* Search and Add Row */}
          <div className="flex justify-between items-center mb-5">
            <div className="relative">
              <input
                type="text"
                placeholder="Search ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border px-3 py-1.5 rounded w-64 focus:outline-none focus:border-blue-400"
              />
              <span className="absolute right-2 top-2 text-gray-400">
                <Icon icon="ic:baseline-search" />
              </span>
            </div>
            <div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="border px-3 py-1.5 rounded bg-white text-gray-600 hover:bg-gray-50 flex items-center gap-1"
              >
                <Icon icon="ic:baseline-add" /> New Offer
              </button>
            </div>
          </div>
          
          <table className="w-full border border-gray-200">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-700">
                <th className="p-2 text-left pl-4 font-semibold w-16">ID</th>
                <th className="p-2 text-left font-semibold">Offer Name</th>
                <th className="p-2 text-left font-semibold">Slug</th>
                <th className="p-2 font-semibold w-32">Created</th>
                <th className="p-2 font-semibold w-32">Edited</th>
                <th className="p-2 font-semibold w-40"></th>
              </tr>
            </thead>
            <tbody>
              {filteredOffers.length > 0 ? (
                renderOfferRows()
              ) : (
                <tr>
                    <td colSpan="6" className="text-center p-4">
                    No offers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing {totalEntries > 0 ? startEntry : 0} to {endEntry} of {totalEntries} entries
            </div>
            <ReactPaginate
              previousLabel={"«"}
              nextLabel={"»"}
              breakLabel={"..."}
              pageCount={pageCount}
              marginPagesDisplayed={2}
              pageRangeDisplayed={5}
              onPageChange={handlePageClick}
              containerClassName={"flex items-center space-x-1"}
              activeClassName={"bg-blue-500 text-white border-blue-500"}
              pageClassName={"page-item"}
              pageLinkClassName={"px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-100"}
              previousClassName={"page-item"}
              previousLinkClassName={"px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-100"}
              nextClassName={"page-item"}
              nextLinkClassName={"px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-100"}
            />
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white shadow-lg w-full max-w-3xl mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-2xl font-light text-gray-800">Add Offer</h2>
            </div>
            <div className="px-6 py-6">
              <form onSubmit={handleAddOffer} className="space-y-4">
                <div className="flex items-center">
                  <label className="w-1/4 text-sm font-semibold text-gray-700">Offer Name</label>
                  <input
                    name="offerName"
                    value={newOffer.offerName}
                    onChange={handleInputChange}
                    className="w-3/4 border rounded p-2 focus:outline-none focus:border-blue-400"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-1/4 text-sm font-semibold text-gray-700">Slug</label>
                  <input
                    name="slug"
                    value={newOffer.slug}
                    readOnly
                    tabIndex={-1}
                    className="w-3/4 border rounded p-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="border px-4 py-2 rounded text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
                  >
                    <Icon icon="mingcute:check-line" /> Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white shadow-lg w-full max-w-3xl mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-2xl font-light text-gray-800">Edit Offer</h2>
            </div>
            <div className="px-6 py-6">
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => handleDeleteClick(editingOffer._id)}
                  className="bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600 flex items-center gap-1 text-sm"
                >
                  <Icon icon="mingcute:delete-2-line" /> Delete
                </button>
              </div>
              <form onSubmit={handleUpdateOffer} className="space-y-4">
                <div className="flex items-center">
                  <label className="w-1/4 text-sm font-semibold text-gray-700">Offer Name</label>
                  <input
                    name="offerName"
                    value={editingOffer.offerName}
                    onChange={handleEditInputChange}
                    className="w-3/4 border rounded p-2 focus:outline-none focus:border-blue-400"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-1/4 text-sm font-semibold text-gray-700">Slug</label>
                  <input
                    name="slug"
                    value={editingOffer.slug || ""}
                    readOnly
                    tabIndex={-1}
                    className="w-3/4 border rounded p-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="border px-4 py-2 rounded text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
                  >
                    <Icon icon="mingcute:check-line" /> Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this offer?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirmationModal(false);
                  setOfferToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOffer}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center shadow-xl">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <Icon icon="mdi:check" className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-lg font-medium text-gray-900">{successMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
