"use client";

import React, { useEffect, useState } from "react";
import ReactPaginate from "react-paginate";
import { FaPlus, FaMinus, FaEdit } from "react-icons/fa";
import DateRangePicker from '@/components/DateRangePicker';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

export default function ReviewComponent() {
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [Reviews, setReviews] = useState([]);
    const [itemsPerPage] = useState(20);
    const [statusFilter, setStatusFilter] = useState("");
    const [dateFilter, setDateFilter] = useState({
        startDate: null,
        endDate: null
    });

    // Fetch Reviews on component mount
    useEffect(() => {
        fetchReviews();
    }, []);

    const handleDateChange = ({ startDate, endDate }) => {
        setDateFilter({ startDate, endDate });
        setCurrentPage(0);
    };

    const clearDateFilter = () => {
        setDateFilter({ startDate: null, endDate: null });
        setCurrentPage(0);
    };

    const fetchReviews = async () => {
        try {

            const response = await fetch("/api/reviews/get");
            const text = await response.text();
            if (!text) {
                console.error("Empty response from API");
                return;
            }

            const result = JSON.parse(text);
            if (result.success) {
                setReviews(result.data);
            } else {
                console.error("API Error:", result.error);
            }

        } catch (error) {
            console.error("Error fetching Reviews:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const FilteredReviews = Reviews.filter((ReviewData) => {
        const matchesSearch = ReviewData.reviews_title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || ReviewData.review_status === statusFilter;

        let matchesDate = true;
        if (dateFilter.startDate && dateFilter.endDate && ReviewData.created_date) {
            const ReviewDate = new Date(ReviewData.created_date);
            const startDate = new Date(dateFilter.startDate);
            const endDate = new Date(dateFilter.endDate);

            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

            matchesDate = ReviewDate >= startDate && ReviewDate <= endDate;
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    // Pagination variables
    const totalEntries = FilteredReviews.length;
    const startEntry = (currentPage - 1) * itemsPerPage + 1;
    const endEntry = Math.min(currentPage * itemsPerPage, totalEntries);
    const totalPages = Math.ceil(totalEntries / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
                        <li key={number} className={`page-item ${currentPage === number ? 'bg-red-500 text-white' : ''}`}>
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
                <h2 className="text-2xl font-bold">Customer Reviews</h2>
            </div>

            {showAlert && (
                <div className={`fixed top-4 right-4 px-4 py-2 rounded-md shadow-lg z-50 ${alertMessage.includes("Error") || alertMessage.includes("Failed")
                    ? "bg-red-500 text-white"
                    : "bg-green-500 text-white"
                    }`}>
                    {alertMessage}
                </div>
            )}


            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
                </div>
            ) : (
                <div className="bg-white shadow-md rounded-lg p-5 mb-5 overflow-x-auto border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end mb-5">

                        {/* Search Input */}
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Icon icon="ic:baseline-search" className="w-4 h-4 text-gray-500" />
                                </span>
                                <input type="text" placeholder="Search Blog..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }} className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full text-sm focus:outline-none focus:ring-2 focus:ring-red-200" />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(0); }} className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm" >
                                <option value="">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        {/* Date Range Picker */}
                        <div className="w-full col-span-1 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1">
                                    <DateRangePicker onDateChange={handleDateChange} />
                                </div>
                                {(dateFilter.startDate || dateFilter.endDate) && (
                                    <button onClick={clearDateFilter} className="p-2 text-sm text-red-600 hover:text-red-800 bg-red-50 rounded-md" title="Clear date filter">
                                        <Icon icon="mdi:close-circle-outline" className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                    <hr className="border-t border-gray-200 mb-4" />
                    {FilteredReviews.length === 0 ? (
                        <div className="text-center py-8">
                            <p>No Reviews found!</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full border border-gray-300">
                                    <thead>
                                        <tr className="bg-gray-200">
                                            <th className="p-2 text-left">Product Id</th>
                                            <th className="p-2 text-left">Reviewed User</th>
                                            <th className="p-2 text-left">Review Title</th>
                                            <th className="p-2 text-left">Review Rating</th>
                                            <th className="p-2 text-left">Review Comment</th>
                                            <th className="p-2 text-left">Review Date</th>
                                            <th className="p-2 text-left">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {FilteredReviews.slice((currentPage - 1) * itemsPerPage, (currentPage + 1) * itemsPerPage).map((review, index) => (
                                            <tr key={review._id} className="border-b hover:bg-gray-50">
                                                <td className="p-2 font-bold" title={review.product_id.name} >
                                                    <a href={`/product/${review.product_id.slug}#reviews`} target="_blank">{review.product_id.item_code}</a></td>
                                                <td className="p-2 font-bold">{review.user_id && review.user_id.name ? review.user_id.name : "-"}</td>
                                                <td className="p-2" title={review.reviews_title}>
                                                    {review.reviews_title.length > 50 ? `${review.reviews_title.substring(0, 50)}...` : review.reviews_title}
                                                </td>
                                                <td className="p-2"> {review.reviews_rating}</td>
                                                <td className="p-2" title={review.reviews_comments}>
                                                    {review.reviews_comments.length > 100 ? `${review.reviews_comments.substring(0, 100)}...` : review.reviews_comments}
                                                </td>
                                                <td className="p-2"> {review.created_date}</td>
                                                <td className="p-2 font-semibold">
                                                    <button onClick={() => { setSelectedReview(review); setShowModal(true); }} className={review.review_status === "active" ? "py-1.5 px-5 rounded bg-green-500 text-white" : "py-1.5 px-3.5 rounded bg-red-500 text-white"} title="update status">
                                                        {review.review_status}
                                                    </button>
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

            {showModal && selectedReview && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-md shadow-lg w-96">
                        <h2 className="text-lg text-center font-bold mb-4">Update Review Status</h2>

                        <p className="mb-2">Review: <strong>{selectedReview.reviews_title}</strong></p>
                        <p className="mb-4">Current Status:
                            <span className="ml-2 font-semibold">{selectedReview.review_status}</span>
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={async () => {
                                try {
                                    const newStatus = selectedReview.review_status === "active" ? "inactive" : "active";

                                    const res = await fetch("/api/reviews/update", {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ id: selectedReview._id, status: newStatus }),
                                    });

                                    const result = await res.json();

                                    if (result.success) {
                                        setAlertMessage("Review status updated successfully!");
                                        setShowAlert(true);

                                        // update local state so UI reflects immediately
                                        setReviews((prev) =>
                                            prev.map((r) =>
                                                r._id === selectedReview._id ? { ...r, review_status: newStatus } : r
                                            )
                                        );
                                    } else {
                                        setAlertMessage("Error updating review: " + result.error);
                                        setShowAlert(true);
                                    }
                                } catch (err) {
                                    console.error("Update error:", err);
                                    setAlertMessage("Error updating review!");
                                    setShowAlert(true);
                                } finally {
                                    setShowModal(false);
                                    setTimeout(() => setShowAlert(false), 3000);
                                }
                            }}
                                className={
                                    selectedReview.review_status === "active"
                                        ? "px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                        : "px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                }
                            >{selectedReview.review_status === "active" ? "Inactive" : "Active"}
                            </button>

                            <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500" >Cancel</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );

}