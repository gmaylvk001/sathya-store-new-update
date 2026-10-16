"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaEdit } from "react-icons/fa";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { formatOfferStates, formatTimerDateTime } from "@/lib/offerTimer";

export default function OfferTimerList() {
  const router = useRouter();
  const [timers, setTimers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [timerToDelete, setTimerToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchTimers = async () => {
    try {
      const response = await fetch("/api/offer-timer?view=list", { cache: "no-store" });
      const data = await response.json();
      setTimers(data.data || []);
    } catch (error) {
      console.error("Error fetching offer timers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimers();
  }, []);

  const handleDelete = async () => {
    try {
      const response = await fetch("/api/offer-timer/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: timerToDelete }),
      });
      const result = await response.json();
      if (response.ok) {
        setSuccessMessage("Offer timer deleted successfully");
        try {
          localStorage.setItem("sathya_offer_timer_sync", Date.now().toString());
          window.dispatchEvent(new Event("offerTimerUpdated"));
        } catch (e) {}
        fetchTimers();
      } else {
        alert(result.error || "Failed to delete offer timer");
      }
    } catch (error) {
      console.error("Error deleting offer timer:", error);
    } finally {
      setTimerToDelete(null);
      setTimeout(() => setSuccessMessage(""), 2000);
    }
  };

  const filtered = timers.filter((timer) =>
    [timer.offerTitle, timer.offerHeading, formatOfferStates(timer.offerViewStates)]
      .some((value) => value && String(value).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-5 mt-5">
        <h2 className="text-3xl font-light text-gray-700">Offers Timers</h2>
      </div>

      {isLoading ? (
        <p>Loading Offer Timers...</p>
      ) : (
        <div className="bg-white shadow-sm border rounded-lg p-5">
          <div className="flex justify-between items-center mb-5">
            <input
              type="text"
              placeholder="Search ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border px-3 py-1.5 rounded w-64 focus:outline-none focus:border-blue-400"
            />
            <button
              onClick={() => router.push("/admin/offer-timer/create")}
              className="border px-3 py-1.5 rounded bg-white text-gray-600 hover:bg-gray-50 flex items-center gap-1"
            >
              <Icon icon="ic:baseline-add" /> New Offer timer
            </button>
          </div>

          <div className="overflow-x-auto md:overflow-visible">
          <table className="w-full border border-gray-200 text-sm">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-700">
                <th className="p-2 text-left pl-3 font-semibold w-12">Id</th>
                <th className="p-2 text-left font-semibold">Offer Title</th>
                <th className="p-2 font-semibold w-[160px]">Top Banner</th>
                <th className="p-2 font-semibold">Offer Start</th>
                <th className="p-2 font-semibold">Offer End</th>
                <th className="p-2 font-semibold">Timer Status</th>
                <th className="p-2 font-semibold">View States</th>
                <th className="p-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((timer) => (
                  <tr key={timer._id} className="text-center border-b hover:bg-gray-50">
                    <td className="p-2 text-left pl-3">{timer.timerId}</td>
                    <td className="p-2 text-left font-medium">
                      {(() => {
                        const title = timer.offerTitle || timer.offer_title || "";
                        if (!title) return <span className="text-gray-400">-</span>;
                        const states = timer.offerViewStates?.length ? timer.offerViewStates : timer.states || [];
                        const state = states.find((s) => s && String(s).toLowerCase() !== "all") || "tamilnadu";
                        const toSlug = (v) => String(v).toLowerCase().replace(/[^a-z0-9]+/g, "-");
                        const idVal = timer.timerId ?? timer.custom_id ?? timer._id;
                        const href = `/super-offers/${toSlug(state)}/${toSlug(title)}?offer_timer_id=${idVal}`;
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                            title="Open customer offer page"
                          >
                            {title}
                          </a>
                        );
                      })()}
                    </td>
                    <td className="p-2">
                      {timer.topBanner ? (
                        <div className="w-[140px] mx-auto rounded border border-gray-200 bg-gray-50 p-0.5">
                          <Image
                            src={
                              timer.topBanner.startsWith("/")
                                ? timer.topBanner
                                : `/uploads/topbanner/${timer.topBanner}`
                            }
                            alt={timer.offerTitle}
                            width={0}
                            height={0}
                            sizes="140px"
                            className="block w-full h-auto object-contain"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    {[timer.startDate, timer.endDate].map((value, i) => {
                      const [datePart, timePart] = String(formatTimerDateTime(value) || "").split(" ");
                      return (
                        <td key={i} className="p-2 leading-tight">
                          <div className="text-gray-800">{datePart || "-"}</div>
                          {timePart && <div className="text-xs text-gray-500">{timePart}</div>}
                        </td>
                      );
                    })}
                    <td className="p-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          timer.timerDisplayStatus === "Yes"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {timer.timerDisplayStatus === "Yes" ? "active" : "inactive"}
                      </span>
                    </td>
                    <td className="p-2">{formatOfferStates(timer.offerViewStates)}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-1.5 justify-center">
                        <button
                          onClick={() => router.push(`/admin/offer-timer/card-offer/${timer._id}`)}
                          className="px-2 py-1 text-xs border border-blue-500 text-blue-600 hover:bg-blue-50 rounded flex items-center gap-1 font-medium transition-colors whitespace-nowrap"
                          title="View Card Offer"
                        >
                          <Icon icon="mdi:credit-card-outline" className="w-3.5 h-3.5" />
                          Card Offer
                        </button>
                        <button
                          onClick={() => router.push(`/admin/offer-timer/edit/${timer._id}`)}
                          className="px-2 py-1 border rounded text-gray-600 hover:bg-gray-100"
                          title="Edit"
                        >
                          <FaEdit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setTimerToDelete(timer._id)}
                          className="px-2 py-1 border rounded bg-red-500 text-white hover:bg-red-600"
                          title="Delete"
                        >
                          <Icon icon="mingcute:delete-2-line" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center p-4 text-gray-500">No offer timers found</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {timerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this offer timer?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setTimerToDelete(null)} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
            <p className="text-lg font-medium">{successMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
