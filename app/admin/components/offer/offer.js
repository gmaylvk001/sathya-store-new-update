"use client";

import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
import { Icon } from '@iconify/react';
import { FaPlus, FaMinus, FaEdit } from "react-icons/fa";
import DateRangePicker from '@/components/DateRangePicker';
export default function OfferComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null); // changed: default to null
  const [alertType, setAlertType] = useState("");
  const [selectedOfferType, setSelectedOfferType] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [offers, setOffers] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
    const [dateFilter, setDateFilter] = useState({
      startDate: null,
      endDate: null
    });
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const toggleUser = (userId) => {
    if (userId === "all") {
      if (selectedUsers.includes("all")) {
        setSelectedUsers([]); // Unselect All
      } else {
        setSelectedUsers(["all"]); // Select All
      }
    } else {
      const newSelected = selectedUsers.includes(userId)
        ? selectedUsers.filter((id) => id !== userId)
        : [...selectedUsers, userId];

      setSelectedUsers(newSelected);
    }
  };
  const initialOfferData = {
    offer_code: "",
    fest_offer_status: "",
    // NEW: ensure fest_offer_status2 exists in initial state
    fest_offer_status2: "",
    notes: "",
    from_date: "",
    to_date: "",
    offer_product_category: "",
    offer_product: [],
    offer_category: [],
    offer_type: "",
    percentage: "",
    fixed_price: "",
    limit_enabled: false,
    offer_limit: "",
};
// const [offerData, setOfferData] = useState(initialOfferData);
// const [isModalOpen, setIsModalOpen] = useState(false);
// const [selectedOfferType, setSelectedOfferType] = useState("");
// const [selectedUsers, setSelectedUsers] = useState([]);

const [isMailModalOpen, setIsMailModalOpen] = useState(false);
const [currentOffer, setCurrentOffer] = useState(null);
const [mailContent, setMailContent] = useState({
  subject: "",
  message: "",
});
const handleMailClick = (offer) => {
  setCurrentOffer(offer);
  setIsMailModalOpen(true);
};

const handleMailContentChange = (e) => {
  const { name, value } = e.target;
  setMailContent(prev => ({
    ...prev,
    [name]: value
  }));
};

const handleSendMail = async () => {
  try {
    const response = await fetch("/api/send-mail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        products: currentOffer.offer_product,
        offerId: currentOffer._id,
        subject: mailContent.subject,
        message: mailContent.message,
        // Include any other necessary data
      }),
    });

    if (!response.ok) {
      // throw new Error("Failed to send email");
        const errorData = await response.json().catch(() => ({}));
        setAlertMessage(errorData.message || "Failed to send email");
        return;
    }

    setAlertMessage("Email sent successfully!");
    setAlertType("success");
    setIsMailModalOpen(false);
    setMailContent({ subject: "", message: "" });
    setTimeout(() => setAlertMessage(""), 3000);
  } catch (error) {
    console.error("Error sending email:", error);
    setAlertMessage(error.message || "Failed to send email");
    setAlertType("error");
    setTimeout(() => setAlertMessage(""), 3000);
  }
};
  // REPLACED: selection helper to make "All" reflect when all users are selected individually
  const isAllUsersSelected = users.length > 0 && users.every((u) => selectedUsers.includes(u._id));
  const isSelected = (userId) => {
    if (userId === "all") {
      return selectedUsers.includes("all") || isAllUsersSelected;
    }
    // Also reflect checked for individuals when "all" sentinel is selected
    return selectedUsers.includes("all") || selectedUsers.includes(userId);
  };

  // Filter visible users based on "all" selection
  const visibleUsers = selectedUsers.includes("all")
    ? [{ _id: "all", name: "All" }]
    : [{ _id: "all", name: "All" }, ...users];

useEffect(() => {
  const fetchUsers = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch("/api/users/get", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return;
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  fetchUsers();
}, []);
  const [isLoading, setIsLoading] = useState(true);
  const [offerData, setOfferData] = useState({
    offer_code: "",
    fest_offer_status: "",
    // NEW: add fest_offer_status2 to edit/create state
    fest_offer_status2: "",
    notes: "",
    from_date: "",
    to_date: "",
    offer_product_category: "",
    offer_product: [],
    offer_category: [],
    offer_type: "",
    percentage: "",
    fixed_price: "",
  });

  // Search and Pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  // Add: track status updating per offer
  const [statusUpdating, setStatusUpdating] = useState({});

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const CategoryTree = ({ 
    categories, 
    products, 
    handleChange, 
    offerData 
  }) => {
    const [expandedCategories, setExpandedCategories] = useState({});

    const toggleCategory = (categoryId) => {
      setExpandedCategories((prev) => ({
        ...prev,
        [categoryId]: !prev[categoryId],
      }));
    };

    const buildTree = (categories, parentId = "none") => {
      return categories
        .filter((category) => category.parentid === parentId)
        .map((category) => ({
          ...category,
          children: buildTree(categories, category._id),
        }));
    };

    const categoryTree = buildTree(categories);

    const renderCategoryTree = (categories, level = 0) => {
      return categories.map((category) => (
        <div key={category._id} className={`ml-${level * 4} p-1`}>
          <div className="flex items-center cursor-pointer">
            {category.children.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCategory(category._id);
                }}
                className="mr-2 text-red-500"
              >
                {expandedCategories[category._id] ? <FaMinus /> : <FaPlus />}
              </button>
            )}
            <input
              type="checkbox"
              name="offer_category"
              value={category._id}
              checked={offerData.offer_category.includes(category._id)}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="font-semibold">{category.category_name}</span>
          </div>
          {expandedCategories[category._id] && (
            <>
              {renderCategoryTree(category.children, level + 1)}
            </>
          )}
        </div>
      ));
    };

    return <div className="border p-2 rounded-md">{renderCategoryTree(categoryTree)}</div>;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsResponse = await fetch("/api/product/get");
        if (!productsResponse.ok) {
          throw new Error("Failed to fetch products");
        }
        const productsData = await productsResponse.json();
        setProducts(productsData);

        // Fetch categories
        const categoriesResponse = await fetch("/api/categories/get");
        if (!categoriesResponse.ok) {
          throw new Error("Failed to fetch categories");
        }
        const categoriesData = await categoriesResponse.json();
        const categoriesList = Array.isArray(categoriesData)
          ? categoriesData
          : Array.isArray(categoriesData?.data)
            ? categoriesData.data
            : Array.isArray(categoriesData?.categories)
              ? categoriesData.categories
              : [];
        setCategories(categoriesList);

        // Fetch offers
        const offersResponse = await fetch("/api/offers/get");
        if (!offersResponse.ok) {
          throw new Error("Failed to fetch offers");
        }
        const offersData = await offersResponse.json();
        setOffers(offersData.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        setAlertMessage("Failed to fetch data");
        setAlertType("error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // NEW: keep fest_offer_status and fest_offer_status2 in sync on change
    if (name === "fest_offer_status2") {
      setOfferData((prev) => ({
        ...prev,
        fest_offer_status2: value,
        // keep legacy field in sync for compatibility
        fest_offer_status: value,
      }));
      return;
    }

    if (type === "checkbox") {
      if (name === "offer_category") {
        const categoryId = value;
        const allCategories = getAllSubcategories(categoryId);

        setOfferData((prev) => ({
          ...prev,
          offer_category: checked
            ? [...prev.offer_category, ...allCategories]
            : prev.offer_category.filter((item) => !allCategories.includes(item)),
        }));
      }
    } else {
      setOfferData({ ...offerData, [name]: value });
    }
  };

  // New: stable handler for "Apply Offer To" select to avoid double state updates and any re-render side-effects
  const handleOfferProductCategoryChange = (e) => {
    const { value } = e.target;
    setOfferData((prev) => ({
      ...prev,
      offer_product_category: value,
      // Reset dependent selections without affecting interactivity
      offer_product: [],
      offer_category: [],
    }));
  };

  // NEW: numeric input helpers to stabilize typing/increment/decrement
  const handleNumberChange = (field) => (e) => {
    const val = e.target.value;
    // Keep raw string to avoid flicker/reset during typing or arrow usage
    setOfferData((prev) => ({ ...prev, [field]: val }));
  };
  const handleNumberBlur = (field, min, max) => () => {
    const raw = offerData[field];
    if (raw === "" || raw === "-" || raw === ".") {
      // Keep empty if user cleared input
      setOfferData((prev) => ({ ...prev, [field]: "" }));
      return;
    }
    let n = Number(raw);
    if (!Number.isFinite(n)) return; // ignore invalid
    if (typeof min === "number" && n < min) n = min;
    if (typeof max === "number" && n > max) n = max;
    setOfferData((prev) => ({ ...prev, [field]: String(n) }));
  };
  const toNumberOrNull = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const handleDelete = async (offerId) => {
    try {
      const response = await fetch("/api/offers/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: offerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete offer");
      }

      setAlertMessage("Offer deleted successfully!");
      setAlertType("success");
      setTimeout(() => setAlertMessage(""), 3000);

      // Refresh offers list after deletion
      const offersResponse = await fetch("/api/offers/get");
      if (!offersResponse.ok) {
        throw new Error("Failed to refresh offers list");
      }
      const offersData = await offersResponse.json();
      setOffers(offersData.data);
    } catch (error) {
      console.error("Error:", error);
      setAlertMessage(error.message || "Failed to delete offer");
      setAlertType("error");
      setTimeout(() => setAlertMessage(""), 3000);
    }
  };

  const handleEdit = (offer) => {
    setEditingOfferId(offer._id);
    setOfferData({
      offer_code: offer.offer_code,
      fest_offer_status: offer.fest_offer_status,
      // NEW: load fest_offer_status2 (fallback to fest_offer_status)
      fest_offer_status2: offer.fest_offer_status2 || offer.fest_offer_status || "",
      notes: offer.notes,
      from_date: offer.from_date.split("T")[0],
      to_date: offer.to_date.split("T")[0],
      offer_product_category: offer.offer_product_category,
      offer_product: offer.offer_product,
      offer_category: offer.offer_category,
      offer_type: offer.offer_type,
      // Ensure stable controlled rendering by coercing to string
      percentage: offer.percentage != null && offer.percentage !== "" ? String(offer.percentage) : "",
      fixed_price: offer.fixed_price != null && offer.fixed_price !== "" ? String(offer.fixed_price) : "",
      limit_enabled: offer.limit_enabled || false,
      offer_limit: offer.offer_limit != null && offer.offer_limit !== "" ? String(offer.offer_limit) : "",
    });
    setSelectedUsers(offer.selected_users || []);
    setSelectedOfferType(offer.offer_type);
    setIsEditModalOpen(true);
  };

  // New: shared Offer update function to reuse by Edit and Active toggle
  const updateOffer = async (payload) => {
    //console.log(payload);
    const res = await fetch("/api/offers/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(errorText || "Failed to update offer");
    }
    return res.json();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setTimeout(() => setAlertMessage(""), 3000);
      return;
    }

    try {
      const safeFestStatus = (offerData.fest_offer_status2 || offerData.fest_offer_status || "").toLowerCase();
      const fromDate = new Date(offerData.from_date);
      const toDate = new Date(offerData.to_date);
      toDate.setUTCHours(23, 59, 59, 999);
      const formattedData = {
        ...offerData,
        id: editingOfferId,
        // NEW: force numeric types where applicable
        percentage: offerData.offer_type === "percentage" ? toNumberOrNull(offerData.percentage) : null,
        fixed_price: offerData.offer_type === "fixed_price" ? toNumberOrNull(offerData.fixed_price) : null,
        limit_enabled: !!offerData.limit_enabled,
        offer_limit: offerData.limit_enabled ? toNumberOrNull(offerData.offer_limit) : null,
        // NEW: send all status keys for safety
        status: safeFestStatus,
        fest_offer_status2: safeFestStatus,
        fest_offer_status: safeFestStatus,
        from_date: fromDate,
        to_date: toDate,
        selected_users: selectedUsers.includes("all")
          ? users.map(user => user._id)
          : selectedUsers.filter(id => id !== "all"),
        // NEW: include user type for update
        selected_user_type: selectedUsers.includes("all") ? "all" : "custom",
      };

      // Change: reuse shared update function
      await updateOffer(formattedData);
     
      setAlertMessage("Offer updated successfully!");
      setAlertType("success");
      setTimeout(() => setAlertMessage(""), 3000);

      setIsEditModalOpen(false);
      setOfferData({
        offer_code: "",
        fest_offer_status: "",
        // NEW: reset fest_offer_status2
        fest_offer_status2: "",
        notes: "",
        from_date: "",
        to_date: "",
        offer_product_category: "",
        offer_product: [],
        offer_category: [],
        offer_type: "",
        percentage: "",
        fixed_price: "",
      });

      // Refresh offers list
      const offersResponse = await fetch("/api/offers/get");
      if (!offersResponse.ok) {
        throw new Error("Failed to refresh offers list");
      }
      const offersData = await offersResponse.json();
      setOffers(offersData.data);
    } catch (error) {
      console.error("Error:", error);
      setAlertMessage(error.message || "Failed to update offer");
      setAlertType("error");
      setTimeout(() => setAlertMessage(""), 3000);
    }
  };

  const getAllSubcategories = (categoryId) => {
    const category = categories.find((cat) => cat._id === categoryId);
    if (!category) return [categoryId];

    const subcategories = categories
      .filter((cat) => cat.parentid === categoryId)
      .flatMap((cat) => getAllSubcategories(cat._id));

    return [categoryId, ...subcategories];
  };

  const validateForm = () => {
    if (!offerData.offer_product_category) {
      closeAllModals();
      setAlertMessage("Please select whether to apply to products or categories");
      setAlertType("error");
      return false;
    }

    if (offerData.offer_product_category === "product" && offerData.offer_product.length === 0) {
      closeAllModals();
      setAlertMessage("Please select at least one product");
      setAlertType("error");
      return false;
    }

    if (offerData.offer_product_category === "category" && offerData.offer_category.length === 0) {
      closeAllModals();
      setAlertMessage("Please select at least one category");
      setAlertType("error");
      return false;
    }

    if (!offerData.offer_type) {
      closeAllModals();
      setAlertMessage("Please select an offer type");
      setAlertType("error");
      return false;
    }

    if (offerData.offer_type === "percentage" && !offerData.percentage) {
      closeAllModals();
      setAlertMessage("Please enter a percentage value");
      setAlertType("error");
      return false;
    }

    if (offerData.offer_type === "fixed_price" && !offerData.fixed_price) {
      closeAllModals();
      setAlertMessage("Please enter a fixed price");
      setAlertType("error");
      return false;
    }

    if (offerData.limit_enabled) {
      if (!offerData.offer_limit || offerData.offer_limit <= 0) {
        closeAllModals();
        setAlertMessage("Please enter a valid offer limit (greater than 0)");
        setAlertType("error");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setTimeout(() => setAlertMessage(""), 3000);
      return;
    }

    try {
      const fromDate = new Date(offerData.from_date);
      const toDate = new Date(offerData.to_date);
      toDate.setUTCHours(23, 59, 59, 999);
      const formattedData = {
        ...offerData,
       from_date: fromDate,
        to_date: toDate,
        selected_users: selectedUsers.includes("all") 
          ? users.map(user => user._id) 
          : selectedUsers.filter(id => id !== "all"),
        // NEW: include user type for create
        selected_user_type: selectedUsers.includes("all") ? "all" : "custom",
        // ensure numeric payloads
        percentage: offerData.offer_type === "percentage" ? toNumberOrNull(offerData.percentage) : null,
        fixed_price: offerData.offer_type === "fixed_price" ? toNumberOrNull(offerData.fixed_price) : null,
        limit_enabled: !!offerData.limit_enabled,
        offer_limit: offerData.limit_enabled ? toNumberOrNull(offerData.offer_limit) : null,
        // NEW: persist fest_offer_status2 on create as well (keep in sync)
        fest_offer_status2: (offerData.fest_offer_status2 || offerData.fest_offer_status || "").toLowerCase(),
        fest_offer_status: (offerData.fest_offer_status2 || offerData.fest_offer_status || "").toLowerCase(),
      };

      const response = await fetch("/api/offers/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Server error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();
      setAlertMessage("Offer created successfully!");
      setAlertType("success");
      setTimeout(() => setAlertMessage(""), 3000);

      setIsModalOpen(false);
      setOfferData({
        offer_code: "",
        fest_offer_status: "",
        // NEW: reset fest_offer_status2
        fest_offer_status2: "",
        notes: "",
        from_date: "",
        to_date: "",
        offer_product_category: "",
        offer_product: [],
        offer_category: [],
        offer_type: "",
        percentage: "",
        fixed_price: "",
        limit_enabled: false,  // Reset limit enabled checkbox
        offer_limit: "",       // Reset limit input field
        selected_users: [],
        //selected_users: ["userId1", "userId2", "userId3"],
      });

      // Refresh offers list
      const offersResponse = await fetch("/api/offers/get");
      if (!offersResponse.ok) {
        throw new Error("Failed to refresh offers list");
      }
      const offersData = await offersResponse.json();
      setOffers(offersData.data);
    } catch (error) {
      console.error("Error:", error);
      closeAllModals(); // close modal on server error
      setAlertMessage(error.message || "Failed to create offer");
      setAlertType("error");
      setTimeout(() => setAlertMessage(""), 3000);
    }
  };

  // Search functionality
// Search functionality
const filteredOffers = offers.filter((offer) => {
  // Filter by offer code
  const matchesSearch = offer.offer_code
    .toLowerCase()
    .includes(searchTerm.toLowerCase());

  // Filter by status
 // const matchesStatus = statusFilter === "All" || offer.status === statusFilter;

  // Filter by date
  let matchesDate = true;
  if (dateFilter.startDate && dateFilter.endDate && offer.createdAt) {
    const offerDate = new Date(offer.createdAt);
    const startDate = new Date(dateFilter.startDate);
    const endDate = new Date(dateFilter.endDate);

    // Normalize times for accurate comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    matchesDate = offerDate >= startDate && offerDate <= endDate;
  }

  // Return true only if all filters match
  return matchesSearch  && matchesDate;
});

  const handleDateChange = ({ startDate, endDate }) => {
    setDateFilter({ startDate, endDate });
    setCurrentPage(1); // Reset to first page when date changes
  };
  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOffers.slice(indexOfFirstItem, indexOfLastItem);
  const startEntry = (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(currentPage * itemsPerPage, filteredOffers.length);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle Active toggle in the table with optimistic update
  const toggleOfferActive = async (offer) => {
    const offerId = offer._id;
    if (statusUpdating[offerId]) return;

    // Use fest_offer_status2 for Display Coupon toggle
    const prevStatus = (offer.fest_offer_status2 || "inactive").toLowerCase();
    const newStatus = prevStatus === "active" ? "inactive" : "active";

    // Optimistic UI update for fest_offer_status2 only
    setOffers((prev) =>
      prev.map((o) => (o._id === offerId ? { ...o, fest_offer_status2: newStatus } : o))
    );
    setStatusUpdating((prev) => ({ ...prev, [offerId]: true }));

    try {
      // Minimal payload: only update fest_offer_status2
      const payload = { id: offerId, fest_offer_status2: newStatus };
      await updateOffer(payload);

      setAlertMessage("Display Coupon Status Was Updated!..");
      setAlertType("success");
      setTimeout(() => setAlertMessage(""), 3000);
    } catch (err) {
      // Revert UI on failure
      setOffers((prev) =>
        prev.map((o) => (o._id === offerId ? { ...o, fest_offer_status2: prevStatus } : o))
      );
      setAlertMessage(err.message || "Failed to update offer status");
      setAlertType("error");
      setTimeout(() => setAlertMessage(""), 3000);
    } finally {
      setStatusUpdating((prev) => {
        const next = { ...prev };
        delete next[offerId];
        return next;
      });
    }
  };

  // Auto-close alert after a few seconds (with fade-out)
  const ALERT_AUTO_CLOSE_MS = 4000;
  const [showAlert, setShowAlert] = useState(false);
  const alertHideTimerRef = useRef(null);
  const alertClearTimerRef = useRef(null);

  useEffect(() => {
    // cleanup any existing timers when message changes
    if (alertHideTimerRef.current) {
      clearTimeout(alertHideTimerRef.current);
      alertHideTimerRef.current = null;
    }
    if (alertClearTimerRef.current) {
      clearTimeout(alertClearTimerRef.current);
      alertClearTimerRef.current = null;
    }

    if (alertMessage) {
      setShowAlert(true);
      // fade-out slightly before clearing message
      alertHideTimerRef.current = setTimeout(() => setShowAlert(false), Math.max(0, ALERT_AUTO_CLOSE_MS - 300));
      alertClearTimerRef.current = setTimeout(() => setAlertMessage(null), ALERT_AUTO_CLOSE_MS);
    }

    return () => {
      if (alertHideTimerRef.current) clearTimeout(alertHideTimerRef.current);
      if (alertClearTimerRef.current) clearTimeout(alertClearTimerRef.current);
    };
  }, [alertMessage]);

  // Helper: close both create and edit modals
  const closeAllModals = () => {
    setIsModalOpen(false);
    setIsEditModalOpen(false);
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-5 mt-5">
        <h2 className="text-2xl font-bold">Offer List</h2>
      </div>
      {alertMessage && (
        <div
          className={`mb-4 p-3 rounded-md ${
            alertType === "success" ? "bg-green-500" : "bg-red-500"
          } text-white transition-opacity duration-300 ${showAlert ? "opacity-100" : "opacity-0"}`}
        >
          {alertMessage}
        </div>
      )}

      {!isLoading ? (
        <div className="bg-white shadow-md rounded-lg p-5 mb-5 overflow-x-auto border border-gray-200">
          {/* Filters Section */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4">
    {/* Search Filter */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
      <input
        type="text"
        placeholder="Search Offer..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
      />
    </div>

    {/* Status Filter */}
    {/* <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
      <select
        value={statusFilter}
        onChange={(e) => {
          setStatusFilter(e.target.value);
          setCurrentPage(1);
        }}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
      >
        <option value="All">All Statuses</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>
    </div> */}

    {/* Date Range Picker */}
    <div className="w-full col-span-1 md:col-span-1">
      <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <DateRangePicker onDateChange={handleDateChange} />
        </div>
      </div>
    </div>

    {/* Add Offer Button */}
    <div className="flex justify-end">
     <button
  onClick={() => {
    // Reset all states before opening modal
    setOfferData(initialOfferData);
    setSelectedOfferType("");
    setSelectedUsers([]);
    setIsModalOpen(true);
  }}
  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition"
>
  + Add Offer
</button>
    </div>
  </div>

          <hr className="border-t border-gray-200 mb-4" />
          <table className="w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2">Offer Code</th>
                <th className="p-2">From</th>
                <th className="p-2">To</th>
                <th className="p-2">Type</th>
                <th className="p-2">Value</th>
                <th className="p-2">Status</th>
                {/* Add: Active column header */}
                <th className="p-2">Display Coupon</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((offer) => (
                  <tr key={offer._id} className="text-center border-b">
                    <td className="p-2 font-bold">{offer.offer_code}</td>
                    <td className="p-2">{offer.from_date.split("T")[0]}</td>
                    <td className="p-2">{offer.to_date.split("T")[0]}</td>
                    <td className="p-2">{offer.offer_type}</td>
                    <td className="p-2">
                      {offer.offer_type === "percentage"
                        ? `${offer.percentage}%`
                        : `₹${offer.fixed_price}`}
                    </td>
                    <td className="p-2 font-semibold">
                      {offer.fest_offer_status === "active" ? (
                        <span className="bg-green-100 text-green-600 px-6 py-1.5 rounded-full font-medium text-sm">Active</span>
                      ) : (
                        <span className="bg-red-100 text-red-600 px-6 py-1.5 rounded-full font-medium text-sm">Inactive</span>
                      )}
                    </td>
                    {/* Active switch cell - bound to fest_offer_status2 */}
                    <td className="p-2">
                      <label
                        className={`relative inline-flex items-center cursor-pointer ${
                          statusUpdating[offer._id] ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={(offer.fest_offer_status2 || "inactive") === "active"}
                          onChange={() => toggleOfferActive(offer)}
                          disabled={!!statusUpdating[offer._id]}
                          aria-label={`Toggle display for ${offer.offer_code}`}
                        />
                        <div
                          className="w-11 h-6 bg-gray-200 rounded-full transition-colors duration-200 ease-in-out peer-checked:bg-red-600" 
                          style={{ '--tw-bg-opacity': 1, backgroundColor: '#5e8bd4' }}
                        ></div>
                        <span className="absolute top-0.5 left-0.5 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-gray-700 bg-white rounded-full border border-gray-300 pointer-events-none transition-all duration-200 ease-in-out transform peer-checked:translate-x-5 peer-checked:bg-red-100">
                          {(offer.fest_offer_status2 || "inactive") === "active" ? "Yes" : "No"}
                        </span>
                      </label>
                    </td>
                    <td>
  <div className="flex items-center gap-2 justify-center">
    <button
      onClick={() => handleEdit(offer)}
      className="w-7 h-7 bg-red-100 text-red-600 rounded-full inline-flex items-center justify-center"
      title="Edit"
    >
      <FaEdit className="w-3 h-3" />
    </button>
    <button
      onClick={() => handleDelete(offer._id)}
      className="w-7 h-7 bg-pink-100 text-pink-600 rounded-full inline-flex items-center justify-center"
      title="Delete"
    >
      <Icon icon="mingcute:delete-2-line" />
    </button>
    <button
      onClick={() => handleMailClick(offer)}
      className="w-7 h-7 bg-red-100 text-[#d72828] rounded-full inline-flex items-center justify-center"
      title="Send Mail"
    >
      <Icon icon="ic:outline-email" />
    </button>
  </div>
</td>
                    {/* <td>
                      <div className="flex items-center gap-2 justify-center">
                        <button
                          onClick={() => handleEdit(offer)}
                          className="w-7 h-7 bg-red-100 text-red-600 rounded-full inline-flex items-center justify-center"
                          title="Edit"
                        >
                          <FaEdit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(offer._id)}
                          className="w-7 h-7 bg-pink-100 text-pink-600 rounded-full inline-flex items-center justify-center"
                          title="Delete"
                        >
                          <Icon icon="mingcute:delete-2-line" />
                        </button>
                      </div>
                    </td> */}
                  </tr>
                ))
              ) : (
                <tr>
                  {/* Update: colSpan to reflect new column count */}
                  <td colSpan="8" className="p-3 text-center">
                    No offers available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="flex justify-between items-center mt-4">
            {/* Left side: Entry text */}
            <div className="text-sm text-gray-600">
              Showing {startEntry} to {endEntry} of {filteredOffers.length} entries
            </div>

            {/* Right side: Pagination */}
            <div className="pagination flex items-center space-x-1">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 border border-gray-300 rounded-md ${
                  currentPage === 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-black bg-white hover:bg-gray-100"
                }`}
                aria-label="Previous page"
              >
                «
              </button>

              {Array.from(
                { length: Math.ceil(filteredOffers.length / itemsPerPage) },
                (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    className={`px-3 py-1.5 border border-gray-300 rounded-md ${
                      currentPage === i + 1
                        ? "bg-red-500 text-white"
                        : "text-black bg-white hover:bg-gray-100"
                    }`}
                    aria-label={`Page ${i + 1}`}
                    aria-current={currentPage === i + 1 ? "page" : undefined}
                  >
                    {i + 1}
                  </button>
                )
              )}

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === Math.ceil(filteredOffers.length / itemsPerPage)}
                className={`px-3 py-1.5 border border-gray-300 rounded-md ${
                  currentPage === Math.ceil(filteredOffers.length / itemsPerPage)
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-black bg-white hover:bg-gray-100"
                }`}
                aria-label="Next page"
              >
                »
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p>Loading offers...</p>
      )}

      {/* Add Offer Modal */}
    {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-gray-300 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Create Festival Offer</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 focus:outline-none"
                aria-label="Close modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6 overflow-y-auto flex-grow">
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* Offer Code */}
                <div>
                  <label htmlFor="offer_code" className="block mb-1 text-sm font-semibold text-gray-700">
                    Offer Code
                  </label>
                  <input
                    type="text"
                    name="offer_code"
                    id="offer_code"
                    value={offerData.offer_code}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400"
                    required
                  />
                </div>

                {/* Offer Status */}
                <div>
                  <label htmlFor="fest_offer_status" className="block mb-1 text-sm font-semibold text-gray-700">
                    Offer Status
                  </label>
                  <select
                    name="fest_offer_status"
                    id="fest_offer_status"
                    value={offerData.fest_offer_status}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400"
                    required
                  >
                    <option value="">Select Your Offer Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Select User */}
                <div >
                  <label className="block mb-1 text-sm font-semibold text-gray-700">Select User</label>
                  <div className="border border-gray-300 rounded-md max-h-64 overflow-y-auto">
                    {visibleUsers.map((user) => (
                      <div
                        key={user._id}
                        className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                          isSelected(user._id) ? "bg-gray-100" : ""
                        }`}
                        onClick={() => toggleUser(user._id)}
                      >
                        <div className="w-4 h-4 mr-2 border rounded flex items-center justify-center bg-white">
                          {isSelected(user._id) && (
                            <span className="text-xs text-green-600 font-bold">&#10003;</span>
                          )}
                        </div>
                        <span className={user._id === "all" ? "font-semibold text-red-500" : ""}>
                          {user.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <pre className="mt-2 text-xs text-gray-500">Selected: {JSON.stringify(selectedUsers)}</pre>
                </div>
                {/* Note */}
                <div>
                  <label htmlFor="notes" className="block mb-1 text-sm font-semibold text-gray-700">
                    Note
                  </label>
                  <input
                    type="text"
                    name="notes"
                    id="notes"
                    value={offerData.notes}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400"
                    required
                  />
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="from_date" className="block mb-1 text-sm font-semibold text-gray-700">
                      From Date
                    </label>
                    <input
                      type="date"
                      name="from_date"
                      id="from_date"
                      value={offerData.from_date}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="to_date" className="block mb-1 text-sm font-semibold text-gray-700">
                      To Date
                    </label>
                    <input
                      type="date"
                      name="to_date"
                      id="to_date"
                      value={offerData.to_date}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400"
                      required
                    />
                  </div>
                </div>

                {/* Apply Offer To */}
                <div className="overflow-visible">
                  <label htmlFor="offer_product_category" className="block mb-1 text-sm font-semibold text-gray-700">
                    Apply Offer To
                  </label>
                  <select
                    key="create-offer-product-category"          // New: force mount for create modal
                    name="offer_product_category"
                    id="offer_product_category"
                    value={offerData.offer_product_category}
                    onChange={handleOfferProductCategoryChange}   // New: use dedicated handler
                    className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400 relative z-20"
                    style={{ pointerEvents: 'auto' }}             // Ensure pointer events always enabled
                    disabled={false}                              // Explicitly ensure enabled
                    required
                  >
                    <option value="">Select Apply To</option>
                    <option value="product">Specific Products</option>
                    <option value="category">Product Categories</option>
                  </select>
                </div>

                {/* Products Selection */}
                {offerData.offer_product_category === "product" && (
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">
                      Select Products
                    </label>
                    <Select
                      options={products
                        .filter(product => product.status === "Active") // Only active products
                        .map(product => ({
                          value: product._id,
                          label: product.name
                        }))
                      }
                      isMulti
                      placeholder="Search and select products..."
                      value={offerData.offer_product.map(p => ({
                        value: p,
                        label: products.find(prod => prod._id === p)?.name || p
                      }))}
                      onChange={(selectedOptions) => {
                        const selectedValues = selectedOptions.map(option => option.value);
                        setOfferData(prev => ({
                          ...prev,
                          offer_product: selectedValues
                        }));
                      }}
                      className="mt-1"
                      classNamePrefix="select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: '#d1d5db',
                          borderRadius: '0.375rem',
                          minHeight: '42px',
                          '&:hover': {
                            borderColor: '#d1d5db'
                          }
                        })
                      }}
                    />
                  </div>
                )}

                {/* Category Tree */}
                {offerData.offer_product_category === "category" && (
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">
                      Select Categories
                    </label>
                    <div className="border border-gray-300 rounded-md max-h-40 overflow-y-auto p-2">
                      <CategoryTree 
                        categories={categories} 
                        products={products} 
                        handleChange={handleChange} 
                        offerData={offerData}
                      />
                    </div>
                  </div>
                )}

                {/* Offer Type */}
                <div>
                  <label htmlFor="offer_type" className="block mb-1 text-sm font-semibold text-gray-700">
                    Offer Type
                  </label>
                  <select
                    name="offer_type"
                    id="offer_type"
                    value={offerData.offer_type}
                    onChange={(e) => {
                      handleChange(e);
                      setSelectedOfferType(e.target.value);
                    }}
                    className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400"
                    required
                  >
                    <option value="">Select Offer Type</option>
                    <option value="percentage">Percentage</option>
                    <option value="fixed_price">Fixed Price</option>
                  </select>
                </div>

                {/* Percentage Input */}
                {selectedOfferType === "percentage" && (
                  <div>
                    <label htmlFor="percentage" className="block mb-1 text-sm font-semibold text-gray-700">
                      Percentage (%)
                    </label>
                    <input
                      type="number"
                      name="percentage"
                      id="percentage"
                      value={offerData.percentage}
                      onChange={handleNumberChange("percentage")}
                      onBlur={handleNumberBlur("percentage", 1, 100)}
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400"
                      required
                      min="1"
                      max="100"
                      step="1"
                      inputMode="numeric"
                    />
                  </div>
                )}

                {/* Fixed Price Input */}
                {selectedOfferType === "fixed_price" && (
                  <div>
                    <label htmlFor="fixed_price" className="block mb-1 text-sm font-semibold text-gray-700">
                      Fixed Price (₹)
                    </label>
                    <input
                      type="number"
                      name="fixed_price"
                      id="fixed_price"
                      value={offerData.fixed_price}
                      onChange={handleNumberChange("fixed_price")}
                      onBlur={handleNumberBlur("fixed_price", 1)}
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400"
                      required
                      min="1"
                      step="1"
                      inputMode="numeric"
                    />
                  </div>
                )}

                {/* Offer Limit Section */}
                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">
                    Total Number of Count this coupon can be used
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="limit_enabled"
                      name="limit_enabled"
                      checked={offerData.limit_enabled || false}
                      onChange={(e) =>
                        setOfferData((prev) => ({
                          ...prev,
                          limit_enabled: e.target.checked,
                          offer_limit: e.target.checked ? prev.offer_limit || "" : "", // Clear if unchecked
                        }))
                      }
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <label htmlFor="limit_enabled" className="text-sm text-gray-700">
                      Set Offer Limit
                    </label>
                  </div>

                  {/* Limit Input Field - Show only if checkbox is checked */}
                  {offerData.limit_enabled && (
                    <div className="mt-3">
                      <label
                        htmlFor="offer_limit"
                        className="block mb-1 text-sm font-semibold text-gray-700"
                      >
                        Offer Limit
                      </label>
                      <input
                        type="number"
                        id="offer_limit"
                        name="offer_limit"
                        value={offerData.offer_limit}
                        onChange={handleNumberChange("offer_limit")}
                        onBlur={handleNumberBlur("offer_limit", 1)}
                        className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400"
                        min="1"
                        required
                        step="1"
                        inputMode="numeric"
                      />
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    className="inline-block bg-red-600 text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-red-700 transition"
                  >
                    Save Offer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


      {/* Edit Offer Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
            {/* Header with bottom border and close button */}
            <div className="flex justify-between items-center border-b-2 border-gray-300 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Edit Festival Offer</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 focus:outline-none"
                aria-label="Close modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="px-6 py-6 overflow-y-auto flex-grow">
              <form onSubmit={handleUpdate} noValidate className="space-y-5">
                {/* Offer Code */}
                <div>
                  <label htmlFor="offer_code" className="block mb-1 text-sm font-semibold text-gray-700">
                    Offer Code
                  </label>
                  <input
                    type="text"
                    name="offer_code"
                    id="offer_code"
                    value={offerData.offer_code}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400"
                    required
                  />
                </div>

                {/* Offer Status */}
                <div>
                  <label htmlFor="fest_offer_status2" className="block mb-1 text-sm font-semibold text-gray-700">
                    Offer Status
                  </label>
                  <select
                    key={`edit-status-${editingOfferId || 'new'}`}
                    name="fest_offer_status2"
                    id="fest_offer_status2"
                    // NEW: bind to fest_offer_status2 for correct rendering and interactivity
                    value={offerData.fest_offer_status}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400"
                    required
                  >
                    <option value="">Select Your Offer Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                {/* Select User */}
                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">Select User</label>
                  <div className="border border-gray-300 rounded-md max-h-64 overflow-y-auto">
                    {visibleUsers.map((user) => (
                      <div
                        key={user._id}
                        className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                          isSelected(user._id) ? "bg-gray-100" : ""
                        }`}
                        onClick={() => toggleUser(user._id)}
                      >
                        <div className="w-4 h-4 mr-2 border rounded flex items-center justify-center bg-white">
                          {isSelected(user._id) && (
                            <span className="text-xs text-green-600 font-bold">&#10003;</span>
                          )}
                        </div>
                        <span className={user._id === "all" ? "font-semibold text-red-500" : ""}>
                          {user.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Note */}
                <div>
                  <label htmlFor="notes" className="block mb-1 text-sm font-semibold text-gray-700">
                    Note
                  </label>
                  <input
                    type="text"
                    name="notes"
                    id="notes"
                    value={offerData.notes}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400"
                    required
                  />
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="from_date" className="block mb-1 text-sm font-semibold text-gray-700">
                      From Date
                    </label>
                    <input
                      type="date"
                      name="from_date"
                      id="from_date"
                      value={offerData.from_date}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="to_date" className="block mb-1 text-sm font-semibold text-gray-700">
                      To Date
                    </label>
                    <input
                      type="date"
                      name="to_date"
                      id="to_date"
                      value={offerData.to_date}
                      onChange={handleChange}
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400"
                      required
                    />
                  </div>
                </div>

                {/* Apply Offer To */}
                <div className="overflow-visible">
                  <label htmlFor="offer_product_category2" className="block mb-1 text-sm font-semibold text-gray-700">
                    Apply Offer To
                  </label>
                  <select
                    key={`edit-offer-cat-${editingOfferId || 'new'}`} // New: force re-mount per offer to clear any stale disabled state
                    name="offer_product_category2"
                    id="offer_product_category2"
                    value={offerData.offer_product_category}
                    onChange={handleOfferProductCategoryChange}   // New: use dedicated handler
                    className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400 relative z-20"
                    style={{ pointerEvents: 'auto' }}             // Ensure pointer events always enabled
                    disabled={false}                              // Explicitly ensure enabled
                    required
                  >
                    <option value="">Select Apply To</option>
                    <option value="product">Specific Products</option>
                    <option value="category">Product Categories</option>
                  </select>
                </div>

                {/* Products Selection */}
                {offerData.offer_product_category === "product" && (
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">
                      Select Products
                    </label>
                    <Select
                      options={products
                        .filter(product => product.status === "Active") // Only active products
                        .map(product => ({
                          value: product._id,
                          label: product.name
                        }))
                      }
                      isMulti
                      placeholder="Search and select products..."
                      value={offerData.offer_product.map(p => ({
                        value: p,
                        label: products.find(prod => prod._id === p)?.name || p
                      }))}
                      onChange={(selectedOptions) => {
                        const selectedValues = selectedOptions.map(option => option.value);
                        setOfferData(prev => ({
                          ...prev,
                          offer_product: selectedValues
                        }));
                      }}
                      className="mt-1"
                      classNamePrefix="select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: '#d1d5db',
                          borderRadius: '0.375rem',
                          minHeight: '42px',
                          '&:hover': {
                            borderColor: '#d1d5db'
                          }
                        })
                      }}
                    />
                  </div>
                )}

                {/* Category Tree */}
                {offerData.offer_product_category === "category" && (
                  <div>
                    <label className="block mb-1 text-sm font-semibold text-gray-700">
                      Select Categories
                    </label>
                    <div className="border border-gray-300 rounded-md max-h-40 overflow-y-auto p-2">
                      <CategoryTree 
                        categories={categories} 
                        products={products} 
                        handleChange={handleChange} 
                        offerData={offerData}
                      />
                    </div>
                  </div>
                )}

                {/* Offer Type */}
                <div>
                  <label htmlFor="offer_type" className="block mb-1 text-sm font-semibold text-gray-700">
                    Offer Type
                  </label>
                  <select
                    name="offer_type"
                    id="offer_type"
                    value={offerData.offer_type}
                    onChange={(e) => {
                      handleChange(e);
                      setSelectedOfferType(e.target.value);
                    }}
                    className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400"
                    required
                  >
                    <option value="">Select Offer Type</option>
                    <option value="percentage">Percentage</option>
                    <option value="fixed_price">Fixed Price</option>
                  </select>
                </div>

                {/* Percentage Input */}
                {selectedOfferType === "percentage" && (
                  <div>
                    <label htmlFor="percentage" className="block mb-1 text-sm font-semibold text-gray-700">
                      Percentage (%)
                    </label>
                    <input
                      type="number"
                      name="percentage"
                      id="percentage"
                      value={offerData.percentage}
                      onChange={handleNumberChange("percentage")}
                      onBlur={handleNumberBlur("percentage", 1, 100)}
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400"
                      required
                      min="1"
                      max="100"
                      step="1"
                      inputMode="numeric"
                    />
                  </div>
                )}

                {/* Fixed Price Input */}
                {selectedOfferType === "fixed_price" && (
                  <div>
                    <label htmlFor="fixed_price" className="block mb-1 text-sm font-semibold text-gray-700">
                      Fixed Price (₹)
                    </label>
                    <input
                      type="number"
                      name="fixed_price"
                      id="fixed_price"
                      value={offerData.fixed_price}
                      onChange={handleNumberChange("fixed_price")}
                      onBlur={handleNumberBlur("fixed_price", 1)}
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400"
                      required
                      min="1"
                      step="1"
                      inputMode="numeric"
                    />
                  </div>
                )}

                {/* Offer Limit Section */}
               <div>
                <label className="block mb-1 text-sm font-semibold text-gray-700">
                  Total Usage Limit
                </label>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="limit_enabled"
                    name="limit_enabled"
                    checked={offerData.limit_enabled || false}
                    onChange={(e) =>
                      setOfferData((prev) => ({
                        ...prev,
                        limit_enabled: e.target.checked,
                        offer_limit: e.target.checked ? prev.offer_limit || "" : "", // Clear if unchecked
                      }))
                    }
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />

                  <label htmlFor="limit_enabled" className="text-sm text-gray-700">
                    Set Offer Limit
                  </label>
                </div>

                  {/* ✅ Notes line — now in a separate row */}
                  <div className="mt-1">
                    <label
                      htmlFor="notes"
                      className="block text-xs text-gray-500"
                    >
                      Notes: (Total number of times this coupon can be used)
                    </label>
                  </div>

                  {/* Limit Input Field - Show only if checkbox is checked */}
                  {offerData.limit_enabled && (
                    <div className="mt-3">
                      <label
                        htmlFor="offer_limit"
                        className="block mb-1 text-sm font-semibold text-gray-700"
                      >
                        Offer Limit
                      </label>
                      <input
                        type="number"
                        id="offer_limit"
                        name="offer_limit"
                        value={offerData.offer_limit}
                        onChange={handleNumberChange("offer_limit")}
                        onBlur={handleNumberBlur("offer_limit", 1)}
                        className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-400"
                        min="1"
                        required
                        step="1"
                        inputMode="numeric"
                      />
                    </div>
                  )}
                </div>


                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    className="inline-block bg-red-600 text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-red-700 transition"
                  >
                    Save Offer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Mail Modal */}
{isMailModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
    <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
      <div className="flex justify-between items-center border-b-2 border-gray-300 px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-900">Send Offer Notification</h2>
        <button
          onClick={() => {
            setIsMailModalOpen(false);
            setMailContent({ subject: "", message: "" });
          }}
          className="text-gray-400 hover:text-gray-700 focus:outline-none"
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-6 py-6 overflow-y-auto flex-grow">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipients
          </label>
          <div className="border border-gray-200 p-2 rounded-md">
            {currentOffer?.selected_users?.map(userId => {
              const user = users.find(u => u._id === userId);
              return user ? (
                <span key={userId} className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
                  {user.name}
                </span>
              ) : null;
            })}
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <input
            type="text"
            name="subject"
            value={mailContent.subject}
            onChange={handleMailContentChange}
            className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-500"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            name="message"
            value={mailContent.message}
            onChange={handleMailContentChange}
            rows="5"
            className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-red-500"
            required
          ></textarea>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => {
              setIsMailModalOpen(false);
              setMailContent({ subject: "", message: "" });
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSendMail}
            className="px-4 py-2 bg-[#d72828] text-white rounded-md text-sm font-medium hover:bg-[#d72828]"
          >
            Send Mail
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}