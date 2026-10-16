"use client";

import { useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { Icon } from "@iconify/react";

export default function CategoryImageSectionAdmin() {
  const [sections, setSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [toast, setToast] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const emptyForm = {
    category_id: "",
    section_title: "",
    status: "active",
    images: [
      { name: "", url: "", status: "active", image: null, imagePreview: "" },
    ],
  };

  const [form, setForm] = useState(emptyForm);

  // ── Toast ────────────────────────────────────────────────────────────────
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCategories();
    fetchSections();
  }, []);

  const fetchCategories = async () => {
    const res = await fetch("/api/categories/get");
    const data = await res.json();
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.categories)
          ? data.categories
          : [];
    setCategories(list);
  };

  //   const fetchCategories = async () => {
  //     try {
  //       setLoading(true);
  //       const response = await fetch('/api/categories/get');

  //       if (!response.ok) {
  //         throw new Error('Failed to fetch categories');
  //       }

  //       const data = await response.json();

  //       // Filter only active main categories (parentid is "none" and status is "Active") and sort by position
  //       const activeMainCategories = data
  //         .filter(cat => cat.parentid === "none" && cat.status === "Active")
  //         .sort((a, b) => (a.position || 0) - (b.position || 0));

  //       setCategories(activeMainCategories);
  //       setOriginalCategories(JSON.parse(JSON.stringify(activeMainCategories))); // Deep copy
  //       setHasChanges(false);
  //     } catch (error) {
  //       console.error("Error fetching categories:", error);
  //       alert("Failed to load categories");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  const fetchSections = async () => {
    const res = await fetch("/api/category-image-section");
    const data = await res.json();
    setSections(data.data || []);
  };

  // ── Image item handlers ──────────────────────────────────────────────────
  const addImageItem = () => {
    setForm((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        { name: "", url: "", status: "active", image: null, imagePreview: "" },
      ],
    }));
  };

  const removeImageItem = (i) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== i),
    }));
  };

  const updateImageItem = (i, field, value) => {
    const updated = [...form.images];
    updated[i][field] = value;
    setForm((prev) => ({ ...prev, images: updated }));
  };

  const handleFileChange = (i, file) => {
  const img = new window.Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width  = 450;
    canvas.height = 450;
    const ctx = canvas.getContext("2d");

    // cover crop — center
    const size = Math.min(img.width, img.height);
    const sx   = (img.width  - size) / 2;
    const sy   = (img.height - size) / 2;
    ctx.drawImage(img, sx, sy, size, size, 0, 0, 450, 450);

    canvas.toBlob((blob) => {
      const croppedFile = new File([blob], file.name, { type: "image/jpeg" });
      const preview     = URL.createObjectURL(blob);
      const updated     = [...form.images];
      updated[i].image        = croppedFile;
      updated[i].imagePreview = preview;
      setForm((prev) => ({ ...prev, images: updated }));
    }, "image/jpeg", 0.92);
  };
  img.src = URL.createObjectURL(file);
};

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const fd = new FormData();
    fd.append("category_id", form.category_id);
    fd.append("section_title", form.section_title);
    fd.append("status", form.status);
    fd.append(
      "images",
      JSON.stringify(
        form.images.map(({ name, url, status, imagePreview, image }) => ({
          name,
          url,
          status,
          image: image instanceof File ? "" : imagePreview,
        })),
      ),
    );
    form.images.forEach((img, i) => {
      if (img.image instanceof File) fd.append(`image_${i}`, img.image);
    });

    const url = editId
      ? `/api/category-image-section/${editId}`
      : "/api/category-image-section";
    const method = editId ? "PUT" : "POST";

    const res = await fetch(url, { method, body: fd });
    if (res.ok) {
      showToast(editId ? "Updated successfully!" : "Saved successfully!");
      setShowModal(false);
      setEditId(null);
      setForm(emptyForm);
      fetchSections();
    } else {
      alert("Something went wrong!");
    }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────
  const handleEdit = (section) => {
    setEditId(section._id);
    setForm({
      category_id: section.category_id?._id || "",
      section_title: section.section_title,
      status: section.status,
      images: section.images.map((img) => ({
        name: img.name || "",
        url: img.url || "",
        status: img.status || "active",
        image: null,
        imagePreview: img.image || "",
      })),
    });
    setShowModal(true);
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    const res = await fetch(`/api/category-image-section/${deleteId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      showToast("Deleted successfully!");
      setShowConfirm(false);
      fetchSections();
    } else {
      alert("Delete failed!");
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-[9999]">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Category Image Section</h2>
        <button
          className="bg-[#d72828] text-white px-4 py-2 rounded hover:bg-[#d72828]"
          onClick={() => {
            setForm(emptyForm);
            setEditId(null);
            setShowModal(true);
          }}
        >
          + Add Section
        </button>
      </div>

      {/* Table */}
      <table className="w-full border text-left mb-6 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Category</th>
            <th className="border p-2">Section Title</th>
            <th className="border p-2">Images</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((s) => (
            <tr key={s._id}>
              <td className="border p-2">{s.category_id?.category_name}</td>
              <td className="border p-2 font-medium">{s.section_title}</td>
              <td className="border p-2">{s.images?.length} images</td>
              <td className="border p-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    s.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {s.status}
                </span>
              </td>
              <td className="border p-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(s)}
                    className="w-8 h-8 bg-red-100 text-[#d72828] rounded-full flex items-center justify-center hover:bg-red-200"
                    title="Edit"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setDeleteId(s._id);
                      setShowConfirm(true);
                    }}
                    className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200"
                    title="Delete"
                  >
                    <Icon icon="mingcute:delete-2-line" className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {sections.length === 0 && (
            <tr>
              <td colSpan={5} className="border p-4 text-center text-gray-400">
                No sections added yet
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ── MODAL ─────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-start overflow-y-auto p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl my-8">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">
                {editId ? "Edit Section" : "Add New Section"}
              </h3>
              <button
                className="text-gray-400 hover:text-gray-700 text-2xl"
                onClick={() => {
                  setShowModal(false);
                  setEditId(null);
                  setForm(emptyForm);
                }}
              >
                ×
              </button>
            </div>

            <div className="max-h-[72vh] overflow-y-auto pr-1 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Select Category
                </label>
                <select
                  className="border border-gray-300 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={form.category_id}
                  onChange={(e) =>
                    setForm({ ...form, category_id: e.target.value })
                  }
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.category_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section Title */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Section Title
                </label>
                <input
                  className="border border-gray-300 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g. New Launches"
                  value={form.section_title}
                  onChange={(e) =>
                    setForm({ ...form, section_title: e.target.value })
                  }
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="border border-gray-300 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Images */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-red-500">
                    Recommended: (450 x 450) and same for all images to look good
                  </label>
                  <button
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    onClick={addImageItem}
                  >
                    + Add Image
                  </button>
                </div>

                <div className="space-y-4">
                  {form.images.map((img, i) => (
                    <div
                      key={i}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-medium text-gray-600">
                          Image {i + 1}
                        </span>
                        {form.images.length > 1 && (
                          <button
                            className="text-red-500 text-sm hover:text-red-700"
                            onClick={() => removeImageItem(i)}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {/* Name */}
                      <div className="mb-3">
                        <label className="block text-xs text-gray-500 mb-1">
                          Name (optional)
                        </label>
                        <input
                          className="border border-gray-300 rounded p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="e.g. iPhone 16"
                          value={img.name}
                          onChange={(e) =>
                            updateImageItem(i, "name", e.target.value)
                          }
                        />
                      </div>

                      {/* Image Upload */}
                      <div className="mb-3">
                        <label className="block text-xs text-gray-500 mb-1">
                          Image
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          className="border border-gray-300 rounded p-2 w-full text-sm"
                          onChange={(e) =>
                            e.target.files[0] &&
                            handleFileChange(i, e.target.files[0])
                          }
                        />
                        {img.imagePreview && (
                          <img
                            src={img.imagePreview}
                            alt="preview"
                            className="mt-2 w-24 h-24 object-cover rounded border border-gray-200"
                          />
                        )}
                      </div>

                      {/* URL */}
                      <div className="mb-3">
                        <label className="block text-xs text-gray-500 mb-1">
                          Redirect URL
                        </label>
                        <input
                          className="border border-gray-300 rounded p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="https://example.com/product"
                          value={img.url}
                          onChange={(e) =>
                            updateImageItem(i, "url", e.target.value)
                          }
                        />
                      </div>

                      {/* Status */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Status
                        </label>
                        <select
                          className="border border-gray-300 rounded p-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          value={img.status}
                          onChange={(e) =>
                            updateImageItem(i, "status", e.target.value)
                          }
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
              <button
                className="px-5 py-2 border border-gray-300 rounded hover:bg-gray-50"
                onClick={() => {
                  setShowModal(false);
                  setEditId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2 bg-[#d72828] text-white rounded hover:bg-[#d72828]"
                onClick={handleSubmit}
              >
                {editId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM DELETE ────────────────────────────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Section
            </h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete this section?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
