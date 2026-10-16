"use client";
import { useEffect, useState, Fragment } from "react";

export default function MainCategoryBannerManager() {
  const [categories, setCategories] = useState([]);
  const [mainBanners, setMainBanners] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [formData, setFormData] = useState({
    bannerName: "",
    bannerImage: null,
    redirectUrl: "",
    bannerStatus: "Active",
    displayOrder: 0,
  });
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageModal, setMessageModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  // Fetch categories for dropdown
  const fetchCategories = async () => {
    const res = await fetch("/api/categories/banner");
    const data = await res.json();
    if (data.success) setCategories(data.categories);
  };

  // Fetch main banners
  const fetchMainBanners = async () => {
    const res = await fetch("/api/categories/main-banner");
    const data = await res.json();
    if (data.success) setMainBanners(data.banners);
  };

  useEffect(() => {
    fetchCategories();
    fetchMainBanners();
  }, []);

  const handleInputChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const openModal = (category = null, banner = null) => {
    setSelectedCategory(category);
    setSelectedBanner(banner);
    setFormData({
      bannerName: banner ? banner.banner_name : "",
      bannerImage: null,
      redirectUrl: banner ? banner.redirect_url : "",
      bannerStatus: banner ? banner.banner_status : "Active",
      displayOrder: banner ? banner.display_order : 0,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData();
    fd.append("banner_name", formData.bannerName);
    fd.append("redirect_url", formData.redirectUrl);
    fd.append("banner_status", formData.bannerStatus);
    fd.append("display_order", formData.displayOrder);

    if (formData.bannerImage) {
      fd.append("bannerImage", formData.bannerImage);
    }

    if (selectedCategory) {
      fd.append("categoryId", selectedCategory._id);
    }

    if (selectedBanner) {
      fd.append("bannerId", selectedBanner._id);
    }

    const res = await fetch("/api/categories/main-banner", {
      method: "POST",
      body: fd,
    });
    
    const data = await res.json();
    setLoading(false);

    if (data.success) {
      setMessageModal(data.message || "Saved successfully!");
      closeModal();
      fetchMainBanners();
    } else {
      setMessageModal(data.error || "Error saving data");
    }
  };

  const handleDelete = (bannerId) => {
    setDeleteModal(bannerId);
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;

    const res = await fetch("/api/categories/main-banner", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bannerId: deleteModal }),
    });
    
    const data = await res.json();
    setDeleteModal(null);

    if (data.success) {
      setMessageModal(data.message || "Deleted successfully!");
      fetchMainBanners();
    } else {
      setMessageModal(data.error || "Error deleting data");
    }
  };

  const updateDisplayOrder = async (bannerId, newOrder) => {
    const res = await fetch("/api/categories/main-banner", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bannerId, display_order: newOrder }),
    });
    
    const data = await res.json();
    if (data.success) {
      fetchMainBanners();
    } else {
      setMessageModal(data.error || "Error updating order");
    }
  };

  const closeModal = () => {
    setSelectedCategory(null);
    setSelectedBanner(null);
    setFormData({
      bannerName: "",
      bannerImage: null,
      redirectUrl: "",
      bannerStatus: "Active",
      displayOrder: 0,
    });
    setIsModalOpen(false);
  };

  // Group banners by category
  const groupedBanners = mainBanners.reduce((acc, banner) => {
    const categoryId = banner.category_id?._id || banner.category_id;
    if (!acc[categoryId]) {
      acc[categoryId] = {
        category: banner.category_id || { 
          category_name: banner.category_name, 
          category_slug: banner.category_slug 
        },
        banners: []
      };
    }
    acc[categoryId].banners.push(banner);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Manage Main Category Banners (1920×600)</h2>
        <button
          onClick={() => openModal()}
          className="bg-[#d72828] text-white px-4 py-2 rounded hover:bg-[#d72828]"
        >
          + Add Main Banner
        </button>
      </div>

      {/* Grouped Banners Table */}
      {Object.keys(groupedBanners).length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No main category banners found
        </div>
      ) : (
        Object.entries(groupedBanners).map(([categoryId, { category, banners }]) => (
          <div key={categoryId} className="border border-gray-300 rounded-lg bg-white shadow">
            {/* Category Header */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-300">
              <h3 className="font-bold text-lg">{category.category_name}</h3>
              <p className="text-sm text-gray-600">{category.category_slug}</p>
              <p className="text-xs text-gray-500 mt-1">
                {banners.length} banner{banners.length !== 1 ? 's' : ''} for this category
              </p>
            </div>

            {/* Banners Table */}
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2 w-20">Order</th>
                  <th className="border px-3 py-2">Banner</th>
                  <th className="border px-3 py-2">Redirect URL</th>
                  <th className="border px-3 py-2 w-20">Status</th>
                  <th className="border px-3 py-2 w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {banners
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((banner, index) => (
                  <tr key={banner._id} className="hover:bg-gray-50">
                    <td className="border px-3 py-2 text-center">
                      <select
                        value={banner.display_order}
                        onChange={(e) => updateDisplayOrder(banner._id, parseInt(e.target.value))}
                        className="w-full text-center border rounded py-1"
                      >
                        {[...Array(banners.length).keys()].map((num) => (
                          <option key={num} value={num}>
                            {num + 1}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border px-3 py-2">
                      <div className="flex items-center space-x-3">
                        <img
                          src={banner.banner_image}
                          alt={banner.banner_name}
                          className="h-16 w-32 object-contain border rounded"
                        />
                        <div>
                          <p className="font-medium">{banner.banner_name}</p>
                          <p className="text-xs text-gray-500">
                            Added: {new Date(banner.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="border px-3 py-2">
                      <p className="truncate max-w-xs" title={banner.redirect_url}>
                        {banner.redirect_url || '-'}
                      </p>
                    </td>
                    <td className="border px-3 py-2 text-center">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          banner.banner_status === "Active"
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {banner.banner_status}
                      </span>
                    </td>
                    <td className="border px-3 py-2 text-center">
                      <div className="space-x-2">
                        <button
                          onClick={() => openModal(null, banner)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(banner._id)}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-[500px] max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              ✖
            </button>
            <h3 className="text-lg font-semibold mb-4">
              {selectedBanner ? "Edit Main Banner" : "Add Main Banner"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              {!selectedBanner && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Select Category *
                  </label>
                  <select
                    value={selectedCategory?._id || ""}
                    onChange={(e) => {
                      const category = categories.find(cat => cat._id === e.target.value);
                      setSelectedCategory(category || null);
                    }}
                    className="w-full border px-2 py-2 rounded"
                    required
                  >
                    <option value="">Choose a category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.category_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    You can add multiple banners for the same category
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Banner Name *
                </label>
                <input
                  type="text"
                  placeholder="Banner Name"
                  value={formData.bannerName}
                  onChange={(e) => handleInputChange("bannerName", e.target.value)}
                  className="w-full border px-2 py-1 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Display order"
                  value={formData.displayOrder}
                  onChange={(e) => handleInputChange("displayOrder", parseInt(e.target.value) || 0)}
                  className="w-full border px-2 py-1 rounded"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lower numbers appear first
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Banner Image {!selectedBanner && "*"}
                </label>
                <p className="text-gray-500 text-sm mb-2">
                  Recommended Size: <span className="font-semibold">1920 × 600 px</span>
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleInputChange("bannerImage", e.target.files[0])
                  }
                  className="w-full border px-2 py-1 rounded"
                  required={!selectedBanner}
                />
                {selectedBanner?.banner_image && !formData.bannerImage && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">Current Image:</p>
                    <img 
                      src={selectedBanner.banner_image} 
                      alt="Current banner" 
                      className="h-20 object-contain mt-1 border rounded"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Redirect URL
                </label>
                <input
                  type="text"
                  placeholder="Redirect URL"
                  value={formData.redirectUrl}
                  onChange={(e) => handleInputChange("redirectUrl", e.target.value)}
                  className="w-full border px-2 py-1 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Status
                </label>
                <select
                  value={formData.bannerStatus}
                  onChange={(e) =>
                    handleInputChange("bannerStatus", e.target.value)
                  }
                  className="w-full border px-2 py-1 rounded"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#d72828] text-white px-4 py-2 rounded hover:bg-[#d72828] disabled:bg-[#d72828]"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-[400px] text-center shadow-lg">
            <h3 className="text-lg font-semibold mb-4">
              Are you sure you want to delete this banner?
            </h3>
            <p className="text-gray-600 mb-4">This action cannot be undone.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setDeleteModal(null)}
                className="bg-gray-400 px-4 py-2 rounded text-white hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-600 px-4 py-2 rounded text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {messageModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white p-4 rounded-lg w-[300px] text-center shadow-lg">
            <p className="text-lg font-medium">{messageModal}</p>
            <button
              onClick={() => setMessageModal(null)}
              className="mt-4 bg-[#d72828] text-white px-4 py-2 rounded hover:bg-[#d72828]"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}