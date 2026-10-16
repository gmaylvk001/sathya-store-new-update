"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Link from "next/link";

// ✅ Section Modal for Add/Edit
function SectionModal({ initialData = null, onClose, onSubmit }) {
  const [name, setName] = useState(initialData?.name || "");
  const [status, setStatus] = useState(initialData?.status || "active");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({ ...initialData, name, status });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-md w-[90%] max-w-md shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-center">
          {initialData ? "Edit Section" : "Add Section"}
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Section Name
            </label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter section name"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* ✅ On/Off toggle in center */}
          <div className="col-span-2 flex justify-center mt-2">
            <button
              type="button"
              onClick={() =>
                setStatus((prev) => (prev === "active" ? "inactive" : "active"))
              }
              className={`px-5 py-2 text-sm font-semibold rounded-full transition ${
                status === "active"
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {status === "active" ? "ON" : "OFF"}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            className="px-4 py-2 bg-gray-300 text-sm rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-[#d72828] text-white text-sm rounded"
            onClick={handleSubmit}
          >
            {initialData ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ✅ Main Component
export default function HomeSectionOrder() {
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSection, setEditSection] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // ✅ Fetch sections on load
  useEffect(() => {
    const fetchSections = async () => {
      const res = await fetch("/api/sections");
      const data = await res.json();
      setSections(data.sections);
      setIsLoading(false);
    };
    fetchSections();
  }, []);

  // ✅ Reorder drag handler
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const newSections = [...sections];
    const [movedItem] = newSections.splice(result.source.index, 1);
    newSections.splice(result.destination.index, 0, movedItem);

    const updatedSections = newSections.map((section, index) => ({
      ...section,
      position: index,
    }));

    setSections(updatedSections);

    await fetch("/api/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sections: updatedSections }),
    });
  };

  // ✅ Add or Edit
  const addOrUpdateSection = async (data) => {
    const method = data._id ? "PUT" : "POST";

    await fetch("/api/sections/add-edit", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setShowModal(false);
    setEditSection(null);

    const refreshed = await fetch("/api/sections");
    const json = await refreshed.json();
    setSections(json.sections);
  };

  // ✅ Delete section
  const deleteSection = async (section) => {
    if (!window.confirm(`Delete "${section.name}"? This cannot be undone.`)) return;
    setDeletingId(section._id);
    try {
      await fetch("/api/sections/add-edit", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: section._id }),
      });
      const refreshed = await fetch("/api/sections");
      const json = await refreshed.json();
      setSections(json.sections);
    } catch (err) {
      alert("Failed to delete section");
    } finally {
      setDeletingId(null);
    }
  };

  // ✅ Toggle Status (Active/Inactive)
  const toggleSectionStatus = async (section) => {
    const updatedStatus = section.status === "active" ? "inactive" : "active";

    await fetch("/api/sections/add-edit", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...section, status: updatedStatus }),
    });

    const refreshed = await fetch("/api/sections");
    const json = await refreshed.json();
    setSections(json.sections);
  };

  if (isLoading) return <p>Loading sections...</p>;

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-5 mt-5">
        <h2 className="text-2xl font-bold">Manage Section Order</h2>
         <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 text-white px-4 py-1 rounded"
        >
          + Add
        </button> 
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {sections.map((section, index) => (
                <Draggable
                  key={section._id}
                  draggableId={section._id}
                  index={index}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="p-3 mb-2 bg-white border rounded shadow flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">
                          <Link
                            href={`/admin/homesettings/${encodeURIComponent(
                              section.name
                            )}`}
                          >
                            {section.name.charAt(0).toUpperCase() + section.name.slice(1)}
                          </Link>
                        </p>

                        <p
                          className={`text-xs ${
                            section.status === "inactive"
                              ? "text-red-500"
                              : "text-green-600"
                          }`}
                        >
                          {section.status}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-gray-500">
                          Pos: {section.position + 1}
                        </span>

                        {/* ✅ Toggle Button */}
                        <button
                          className={`text-xs px-2 py-1 rounded ${
                            section.status === "active"
                              ? "bg-green-500 text-white"
                              : "bg-red-500 text-white"
                          }`}
                          onClick={() => toggleSectionStatus(section)}
                        >
                          {section.status === "active" ? "On" : "Off"}
                        </button>

                         <button
                          className="text-[#d72828] text-sm"
                          onClick={() => {
                            setEditSection(section);
                            setShowModal(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-500 text-sm disabled:opacity-50"
                          disabled={deletingId === section._id}
                          onClick={() => deleteSection(section)}
                        >
                          {deletingId === section._id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {showModal && (
        <SectionModal
          initialData={editSection}
          onClose={() => {
            setShowModal(false);
            setEditSection(null);
          }}
          onSubmit={addOrUpdateSection}
        />
      )}
    </div>
  );
}
