"use client";
import { useEffect, useState } from "react";
import Select from "react-select";
import { Icon } from "@iconify/react";
import { FaPlus, FaMinus, FaEdit, FaGripVertical } from "react-icons/fa";

export default function CategoryBannerPage() {
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState(null);
  const [banners, setBanners] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // ADD THIS
  // FOR EDIT
  const [editBannerId, setEditBannerId] = useState(null);

  const [toast, setToast] = useState("");
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000); // hide after 3 sec
  };

  const [formData, setFormData] = useState({
    category: "",
    status: "active",
    banners: [
      {
        bgColor: "#f0f0f0",
        topBanner: {
          name: "",
          image: null,
          imagePreview: "",
          url: "",
          status: "active",
          featured_products: [],
        },
        subBanners: [
          // {
          //   name: "",
          //   image: null,
          //   imagePreview: "",
          //   url: "",
          //   status: "active",
          // },
        ],
      },
    ],
  });

  useEffect(() => {
    fetchCategories();
    fetchBanners();
    fetchAllProducts();
  }, []);

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    console.log("CATEGORY RESPONSE:", data);
    setCategories(data.categories || data);
  };

  // ADD THIS FUNCTION - Updated to use filter endpoint
  const fetchAllProducts = async () => {
    try {
      const res = await fetch(
        "/api/product/filter/main?limit=1000&sort=featured",
      );
      const data = await res.json();
      console.log("ALL PRODUCTS:", data);

      const prodOptions = (data.products || []).map((prod) => ({
        value: prod._id,
        label: prod.name || prod.product_name,
      }));
      setAllProducts(prodOptions);
    } catch (error) {
      console.error("Failed to fetch all products:", error);
    }
  };

  // ADD THIS FUNCTION
  const handleFeaturedChange = (bannerIndex, subIndex, selectedOptions) => {
    const updated = [...formData.banners];

    if (subIndex !== null) {
      // For sub banner featured products
      updated[bannerIndex].subBanners[subIndex].featured_products =
        selectedOptions.map((option) => option.value);
    } else {
      // For top banner featured products
      updated[bannerIndex].topBanner.featured_products = selectedOptions.map(
        (option) => option.value,
      );
    }

    setFormData({ ...formData, banners: updated });
  };

  const fetchBanners = async () => {
    console.log("fetchBanners: starting fetch for /api/category-banner_2");
    try {
      const res = await fetch("/api/category-banner_2");
      console.log("fetchBanners: response status", res.status, res.statusText);
      const data = await res.json();
      console.log("fetchBanners: parsed data:", data);
      setBanners(data);
    } catch (error) {
      console.error("fetchBanners: failed to fetch banners:", error);
    }
  };

  const handleFileUpload = (e, bannerIndex, type, subIndex = null) => {
    const file = e.target.files[0];
    const updated = [...formData.banners];

    if (type === "top") {
      updated[bannerIndex].topBanner.image = file;
      updated[bannerIndex].topBanner.imagePreview = URL.createObjectURL(file);
    } else {
      updated[bannerIndex].subBanners[subIndex].image = file;
      updated[bannerIndex].subBanners[subIndex].imagePreview =
        URL.createObjectURL(file);
    }

    setFormData({ ...formData, banners: updated });
  };

  const addBannerGroup = () => {
    setFormData({
      ...formData,
      banners: [
        ...formData.banners,
        {
          bgColor: "#f0f0f0",
          topBanner: {
            name: "",
            image: null,
            url: "",
            status: "active",
            imagePreview: "",
            featured_products: [], // ADD THIS
          },
          subBanners: [
            // {
            //   name: "",
            //   image: null,
            //   url: "",
            //   status: "active",
            //   imagePreview: "",
            // },
          ],
        },
      ],
    });
  };

  const addSubBanner = (bannerIndex) => {
    const updated = [...formData.banners];
    updated[bannerIndex].subBanners.push({
      name: "",
      image: null,
      url: "",
      status: "active",
      imagePreview: "",
      featured_products: [], // ADD THIS
    });

    setFormData({ ...formData, banners: updated });
  };

  const handleEdit = (banner) => {
    setEditBannerId(banner._id);

    setFormData({
      category: banner.category_id?._id || "",
      status: banner.category_status,
      banners: banner.banners.map((b) => ({
        bgColor: b.bgColor || "#f0f0f0",
        topBanner: {
          name: b.topBanner.name,
          url: b.topBanner.url,
          status: b.topBanner.status,
          image: null, // keeps empty until user uploads new file
          imagePreview: b.topBanner.image ? b.topBanner.image : "",
          featured_products:
            b.topBanner.featured_products?.map((p) => p._id) || [], // ✅ Preserve IDs
        },
        subBanners: b.subBanners.map((sb) => ({
          name: sb.name,
          url: sb.url,
          status: sb.status,
          image: null,
          imagePreview: sb.image ?? "",
        })),
      })),
    });

    setShowModal(true);
  };

  const handleUpdate = async () => {
    const form = new FormData();

    form.append("category_id", formData.category);
    form.append("category_status", formData.status);

    form.append(
  "banners",
  JSON.stringify(
    formData.banners.map((b) => ({
      bgColor: b.bgColor || "#f0f0f0",
      topBanner: {
        name: b.topBanner.name,
        url: b.topBanner.url,
        status: b.topBanner.status,
        featured_products: b.topBanner.featured_products || [],
      },
      subBanners: b.subBanners.map((sb) => ({
        name: sb.name,
        url: sb.url,
        status: sb.status,
      })),
    }))
  )
);
console.log("banners being sent:", JSON.parse(form.get("banners")));
    formData.banners.forEach((b, idx) => {
      if (b.topBanner.image instanceof File) {
        form.append(`topBanner_${idx}`, b.topBanner.image);
      }

      b.subBanners.forEach((sb, sIdx) => {
        if (sb.image instanceof File) {
          form.append(`subBanner_${idx}_${sIdx}`, sb.image);
        }
      });
    });

    const res = await fetch(`/api/category-banner_2/${editBannerId}`, {
      method: "PUT",
      body: form,
    });

    const data = await res.json();

    if (res.ok) {
      showToast("Updated successfully!");
      setShowModal(false);
      setEditBannerId(null);
      resetForm();
      fetchBanners();
    } else {
      alert("Update failed!");
    }
  };

  const handleDelete = async (id) => {
    const res = await fetch(`/api/category-banner_2/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      showToast("Banner deleted successfully");
      setShowConfirmationModal(false); // close modal
      fetchBanners(); // refresh list
    } else {
      alert("Failed to delete");
    }
  };

  const submitForm = async () => {
     

    const form = new FormData();

    form.append("category_id", formData.category);
    form.append("category_status", formData.status);

    form.append(
      "banners",
      JSON.stringify(
        formData.banners.map((b) => ({
          bgColor: b.bgColor || "#f0f0f0",
          topBanner: {
            name: b.topBanner.name,
            url: b.topBanner.url,
            status: b.topBanner.status,
            featured_products: b.topBanner.featured_products || [], // ADD THIS
          },
          subBanners: b.subBanners.map((sb) => ({
            name: sb.name,
            url: sb.url,
            status: sb.status,
          })),
        })),
      ),
    );
console.log("sending bgColor:", formData.banners.map(b => b.bgColor));
    formData.banners.forEach((b, idx) => {
      if (b.topBanner.image) {
        form.append(`topBanner_${idx}`, b.topBanner.image);
      }

      b.subBanners.forEach((sb, sIdx) => {
        if (sb.image) {
          form.append(`subBanner_${idx}_${sIdx}`, sb.image);
        }
      });
    });

    await fetch("/api/category-banner_2", {
      method: "POST",
      body: form,
    });

    showToast("Banner saved successfully!");
    setShowModal(false);
    resetForm();
    fetchBanners();
  };

  const resetForm = () => {
    setFormData({
      category: "",
      status: "active",
      banners: [
        {
          topBanner: {
            name: "",
            image: null,
            imagePreview: "",
            url: "",
            status: "active",
            featured_products: [], // ADD THIS
          },
          subBanners: [
            {
              name: "",
              image: null,
              imagePreview: "",
              url: "",
              status: "active",
            },
          ],
        },
      ],
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditBannerId(null);
    resetForm();
  };

  return (
    <div className="p-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg animate-fade z-[9999]">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Category Banner Manager</h2>
        <button
          className="bg-[#d72828] text-white px-4 py-2 rounded hover:bg-[#d72828] transition-colors"
          onClick={() => setShowModal(true)}
        >
          + Add Banner
        </button>
      </div>

      {/* Table */}
      <table className="w-full border text-left mb-6">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">Category</th>
            <th className="border p-2">Groups</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {banners.map((b, i) => (
            <tr key={i}>
              <td className="border p-2">{b.category_id?.category_name}</td>
              <td className="border p-2">{b.banners?.length}</td>
              <td className="border p-2">{b.category_status}</td>
              <td className="border p-2 flex gap-2">
                {/* Edit Button */}

                <button
                  onClick={() => handleEdit(b)}
                  className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200"
                  title="Edit"
                >
                  <FaEdit className="w-4 h-4" />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => {
                    setSelectedDeleteId(b._id); // store ID correctly
                    setShowConfirmationModal(true);
                  }}
                  className="w-8 h-8 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center hover:bg-pink-200"
                  title="Delete"
                >
                  <Icon icon="mingcute:delete-2-line" className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-start overflow-y-auto p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl my-8">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">
                {editBannerId ? "Edit Banner Group" : "Add Banner Group"}
              </h3>
              <button
                className="text-gray-500 hover:text-gray-700 text-2xl"
                onClick={handleCloseModal}
              >
                ×
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto pr-2">
              {/* Category Select */}
              <div className="mb-4">
                <label className="font-medium block mb-2">
                  Select Category
                </label>
                <select
                  className="border border-gray-300 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.category_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Status */}
              <div className="mb-6">
                <label className="font-medium block mb-2">
                  Category Status
                </label>
                <select
                  className="border border-gray-300 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Banner Groups */}
              {formData.banners.map((group, bIndex) => (
                <div
                  key={bIndex}
                  className="border border-gray-300 rounded-lg p-4 mb-6 bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-lg">
                      Banner Group {bIndex + 1}
                    </h4>
                    {formData.banners.length > 1 && (
                      <button
                        className="text-red-600 hover:text-red-800 text-sm"
                        onClick={() => {
                          const updated = formData.banners.filter(
                            (_, idx) => idx !== bIndex,
                          );
                          setFormData({ ...formData, banners: updated });
                        }}
                      >
                        Remove Group
                      </button>
                    )}
                  </div>
               
                 
                  {/* TOP Banner */}
                  <div className="mb-4 p-4 border border-gray-300 bg-white rounded">
                    <h5 className="font-semibold mb-3 text-[#d72828] text-lg">
                      Top Banner(1900 x 400)
                    </h5>

                    {/* Name */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">
                        Banner Name
                      </label>
                      <input
                        className="border border-gray-300 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Enter banner name"
                        value={group.topBanner.name || ""}
                        onChange={(e) => {
                          const updated = [...formData.banners];
                          updated[bIndex].topBanner.name = e.target.value;
                          setFormData({ ...formData, banners: updated });
                        }}
                      />
                    </div>
                   
                    {/* File Upload */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">
                        Banner Image
                      </label>
                      <input
                        type="file"
                        className="border border-gray-300 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
                        onChange={(e) => handleFileUpload(e, bIndex, "top")}
                      />
                    </div>

                    {/* Image Preview */}
                    {group.topBanner.imagePreview && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium mb-1">
                          Preview
                        </label>
                        <img
                          src={group.topBanner.imagePreview}
                          className="w-60 h-auto rounded border border-gray-300"
                        />
                      </div>
                    )}

                       {/*bg color picker */}
                        <div className="mb-4">
                    <label className="font-medium block mb-2">
                       Give the banner color, so it will be used as background for category cards below
                    </label>
                    <div className="flex items-center justify-center gap-3">
                      <input
                        type="color"
                        value={group.bgColor || "#f0f0f0"}
                        onChange={(e) => {
                          const updated = [...formData.banners];
                          updated[bIndex].bgColor = e.target.value;
                          setFormData({ ...formData, banners: updated });
                        }}
                        className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                      />
                      <span className="text-sm text-gray-500">
                        {group.bgColor || "#f0f0f0"}
                      </span>
                    </div>
                  </div>
                    {/* URL */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-1">
                        Redirect URL
                      </label>
                      <input
                        className="border border-gray-300 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="https://example.com"
                        value={group.topBanner.url || ""}
                        onChange={(e) => {
                          const updated = [...formData.banners];
                          updated[bIndex].topBanner.url = e.target.value;
                          setFormData({ ...formData, banners: updated });
                        }}
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Status
                      </label>
                      <select
                        className="border border-gray-300 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
                        value={group.topBanner.status}
                        onChange={(e) => {
                          const updated = [...formData.banners];
                          updated[bIndex].topBanner.status = e.target.value;
                          setFormData({ ...formData, banners: updated });
                        }}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      Featured Products
                    </label>
                    <Select
                      isMulti
                      options={allProducts}
                      onChange={(selected) =>
                        handleFeaturedChange(bIndex, null, selected)
                      }
                      value={allProducts.filter(
                        (option) =>
                          Array.isArray(group.topBanner.featured_products) &&
                          group.topBanner.featured_products.includes(
                            option.value,
                          ),
                      )}
                      placeholder="Select products for featured..."
                      closeMenuOnSelect={false}
                      classNamePrefix="react-select"
                    />
                  </div>

                  {/* Sub Banners */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-semibold text-green-600 text-lg">
                        Sub Banners(238 x 238)
                      </h5>
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                        onClick={() => addSubBanner(bIndex)}
                      >
                        + Add Sub Banner
                      </button>
                    </div>

                    {group.subBanners.map((sb, sbIndex) => (
                      <div
                        key={sbIndex}
                        className="border border-gray-300 p-4 mb-3 bg-white rounded"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h6 className="font-medium">
                            Sub Banner {sbIndex + 1}
                          </h6>
                          {group.subBanners.length > 1 && (
                            <button
                              className="text-red-600 hover:text-red-800 text-sm"
                              onClick={() => {
                                const updated = [...formData.banners];
                                updated[bIndex].subBanners = updated[
                                  bIndex
                                ].subBanners.filter(
                                  (_, idx) => idx !== sbIndex,
                                );
                                setFormData({ ...formData, banners: updated });
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        {/* Name */}
                        <div className="mb-3">
                          <label className="block text-sm font-medium mb-1">
                            Banner Name
                          </label>
                          <input
                            className="border border-gray-300 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Enter sub banner name"
                            value={sb.name || ""}
                            onChange={(e) => {
                              const updated = [...formData.banners];
                              updated[bIndex].subBanners[sbIndex].name =
                                e.target.value;
                              setFormData({ ...formData, banners: updated });
                            }}
                          />
                        </div>

                        {/* File */}
                        <div className="mb-3">
                          <label className="block text-sm font-medium mb-1">
                            Banner Image
                          </label>
                          <input
                            type="file"
                            className="border border-gray-300 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
                            onChange={(e) =>
                              handleFileUpload(e, bIndex, "sub", sbIndex)
                            }
                          />
                        </div>

                        {/* Image Preview */}
                        {sb.imagePreview && (
                          <div className="mb-3">
                            <label className="block text-sm font-medium mb-1">
                              Preview
                            </label>
                            <img
                              src={sb.imagePreview}
                              className="w-32 h-auto rounded border border-gray-300"
                            />
                          </div>
                        )}

                        {/* URL */}
                        <div className="mb-3">
                          <label className="block text-sm font-medium mb-1">
                            Redirect URL
                          </label>
                          <input
                            className="border border-gray-300 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="https://example.com"
                            value={sb.url || ""}
                            onChange={(e) => {
                              const updated = [...formData.banners];
                              updated[bIndex].subBanners[sbIndex].url =
                                e.target.value;
                              setFormData({ ...formData, banners: updated });
                            }}
                          />
                        </div>

                        {/* Status */}
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Status
                          </label>
                          <select
                            className="border border-gray-300 rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-red-500"
                            value={sb.status}
                            onChange={(e) => {
                              const updated = [...formData.banners];
                              updated[bIndex].subBanners[sbIndex].status =
                                e.target.value;
                              setFormData({ ...formData, banners: updated });
                            }}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Add Banner Group Button - Inside modal */}
              <button
                className="bg-purple-600 text-white px-4 py-2 rounded mb-6 hover:bg-purple-700 transition-colors"
                onClick={addBannerGroup}
              >
                + Add Another Banner Group
              </button>
            </div>

            {/* Modal Footer with action buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-300">
              <button
                className="px-5 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                onClick={handleCloseModal}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2 bg-[#d72828] text-white rounded hover:bg-[#d72828] transition-colors"
                onClick={editBannerId ? handleUpdate : submitForm}
              >
                {editBannerId ? "Update Banner" : "Save Banner"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {/* <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <Icon icon="mdi:alert" className="w-6 h-6 text-red-600" />
          </div> */}
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Filter Group
                </h3>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this banner group?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmationModal(false)}
                  className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={() => handleDelete(selectedDeleteId)}
                  className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
