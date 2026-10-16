"use client";

import { useState, useEffect } from "react";
import { FaEdit, FaTimes } from "react-icons/fa";
import { Icon } from "@iconify/react";
import ReactPaginate from "react-paginate";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function JobPositionComponent() {
  const [positions, setPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  const filteredPositions = positions.filter((pos) =>
    pos.position_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pageCount = Math.ceil(filteredPositions.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const currentItems = filteredPositions.slice(startIndex, startIndex + itemsPerPage);

  // Delete Confirmation Modal
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Success Modal Message
  const [successMessage, setSuccessMessage] = useState("");

  const fetchPositions = async () => {
    const res = await fetch("/api/job-position");
    const data = await res.json();
    setPositions(data.data || []);
    setIsLoading(false);
  };

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  const [newPosition, setNewPosition] = useState({
    position_name: "",
    status: "Active",
    _id: null,
  });

  useEffect(() => {
    fetchPositions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = newPosition._id ? "/api/job-position/update" : "/api/job-position/add";

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        newPosition._id
          ? {
              positionId: newPosition._id,
              position_name: newPosition.position_name,
              status: newPosition.status,
            }
          : newPosition
      ),
    });

    setSuccessMessage(newPosition._id ? "Position Updated Successfully" : "Position Added Successfully");
    toast.success(successMessage || "Success!");

    setIsModalOpen(false);
    fetchPositions();
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
    setShowConfirmationModal(true);
  };

  const deletePosition = async () => {
    await fetch("/api/job-position/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ positionId: deleteId }),
    });

    setShowConfirmationModal(false);
    setSuccessMessage("Position Deleted Successfully");
    toast.success("Position Deleted Successfully!");

    fetchPositions();
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-5 mt-5">
        <h2 className="text-2xl font-bold">Career List</h2>
      </div>

      {isLoading ? (
        <p>Loading careers...</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-5 overflow-x-auto border border-gray-200">
          {/* Search + Add */}
          <div className="flex justify-between mb-5">
            <input
              type="text"
              placeholder="Search job position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border px-3 py-2 rounded-md w-64"
            />

            <button
              onClick={() => {
                setNewPosition({ position_name: "", status: "Active", _id: null });
                setIsModalOpen(true);
              }}
              className="bg-red-500 text-white px-4 py-2 rounded-md"
            >
              + Add Job Position
            </button>
          </div>

          <table className="w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2">Position Name</th>
                <th className="p-2">Slug</th>
                <th className="p-2">Status</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>

            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((pos) => (
                  <tr key={pos._id} className="border text-center">
                    <td className="p-2">{pos.position_name}</td>
                    <td className="p-2">{pos.position_slug}</td>
                    <td className="p-2">{pos.status}</td>
                    <td className="p-2 flex justify-center gap-2">
                      <button
                        className="bg-yellow-300 p-2 rounded-full"
                        onClick={() => {
                          setNewPosition(pos);
                          setIsModalOpen(true);
                        }}
                      >
                        <FaEdit />
                      </button>

                      <button
                        className="bg-red-200 p-2 rounded-full"
                        onClick={() => confirmDelete(pos._id)}
                      >
                        <Icon icon="mingcute:delete-2-line" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center p-4 text-gray-500">
                    No positions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-end items-center mt-4">
            <ReactPaginate
              previousLabel={"«"}
              nextLabel={"»"}
              breakLabel={"..."}
              pageCount={pageCount}
              onPageChange={handlePageClick}
              forcePage={currentPage}
              containerClassName={"flex items-center space-x-1"}
              pageClassName="border border-gray-300 px-3 py-1.5 rounded-md"
              activeClassName="bg-red-500 text-white"
              previousLinkClassName="border border-gray-300 px-3 py-1.5 rounded-md"
              nextLinkClassName="border border-gray-300 px-3 py-1.5 rounded-md"
            />
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 w-96 rounded-lg relative">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <FaTimes size={20} />
            </button>

            <h2 className="text-xl font-semibold mb-4">
              {newPosition._id ? "Edit Position" : "Add Position"}
            </h2>

            <form onSubmit={handleSubmit}>
              <input
                className="border p-2 w-full mb-3"
                placeholder="Position Name"
                value={newPosition.position_name}
                onChange={(e) => setNewPosition({ ...newPosition, position_name: e.target.value })}
                required
              />

              <select
                className="border p-2 w-full mb-3"
                value={newPosition.status}
                onChange={(e) => setNewPosition({ ...newPosition, status: e.target.value })}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>

              <button className="bg-red-500 w-full text-white p-2 rounded-md">
                {newPosition._id ? "Update" : "Add"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowConfirmationModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <FaTimes size={20} />
            </button>

            <h2 className="text-lg font-semibold mb-3">Delete Position?</h2>
            <p className="mb-4 text-gray-600">Are you sure you want to delete?</p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmationModal(false)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>

              <button 
                onClick={deletePosition} 
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}