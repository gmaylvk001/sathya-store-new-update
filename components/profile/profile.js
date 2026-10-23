"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiChevronRight } from 'react-icons/fi';
import { RiAccountCircleFill } from "react-icons/ri";
import { FaAddressBook } from "react-icons/fa";
import { HiShoppingBag } from "react-icons/hi2";
import { FaHeart } from "react-icons/fa6";
import { useHeaderdetails } from '@/context/HeaderContext';

function getStoreDisplayName(store) {
  if (!store) return "";
  const rawName =
    store.title ||
    store.organisation_name ||
    store.name ||
    store.store_name ||
    "Store";
  // Clean up long marketing suffixes like " - Electronics Store - Buy Latest Mobiles..."
  const cleanName =
    rawName.split(/\s*-\s*(?:Electronics|Buy|Ref|LED|Mobile|Home|Air)/i)[0].trim() || rawName;
  if (store.city && !cleanName.toLowerCase().includes(store.city.toLowerCase())) {
    return `${cleanName} - ${store.city}`;
  }
  return cleanName;
}

export default function Profile() {
  const pathname = usePathname();
  const { userData, updateHeaderdetails } = useHeaderdetails();
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    store: ''
  });

  useEffect(() => {
    let cancelled = false;
    const fetchStores = async () => {
      try {
        setLoadingStores(true);
        const res = await fetch('/api/stores');
        const data = await res.json();
        let list = [];
        if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
          list = data.data;
        } else {
          // Fallback to store listings API
          const fallbackRes = await fetch('/api/store_listings/get');
          const fallbackData = await fallbackRes.json();
          if (Array.isArray(fallbackData) && fallbackData.length > 0) {
            list = fallbackData;
          }
        }
        if (!cancelled) {
          const activeList = list.filter((s) => !s.status || s.status.toLowerCase() === 'active');
          setStores(activeList.length > 0 ? activeList : list);
        }
      } catch (err) {
        console.error("Failed to fetch stores", err);
      } finally {
        if (!cancelled) setLoadingStores(false);
      }
    };
    fetchStores();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (userData) {
      setProfileData(prev => ({
        ...prev,
        firstName: userData.name || '',
        lastName: userData.last_name || '',
        email: userData.email || '',
        mobile: userData.phone || userData.mobile || '',
        store: userData.store_id || ''
      }));
    }
  }, [userData]);

  useEffect(() => {
    if (userData?.store_id && stores.length > 0) {
      const currentStoreVal = String(userData.store_id).trim();
      if (currentStoreVal) {
        const found = stores.find(
          (s) =>
            String(s._id) === currentStoreVal ||
            String(s.location_id) === currentStoreVal ||
            String(s.branch_code) === currentStoreVal ||
            String(s.exist_id) === currentStoreVal ||
            String(s.slug) === currentStoreVal
        );
        if (found) {
          setProfileData(prev => ({ ...prev, store: String(found._id) }));
        }
      }
    }
  }, [userData, stores]);

  // Profile functions
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (!userData || !userData.userId) {
      setError("You must be logged in to update your profile.");
      setLoading(false);
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/users/edit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: userData.userId,
          name: profileData.firstName,
          last_name: profileData.lastName,
          email: profileData.email,
          mobile: profileData.mobile,
          store_id: profileData.store
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setMessage("Profile updated successfully!");

      // Update global context so header reflects changes instantly
      updateHeaderdetails({
        user: {
          ...userData,
          name: profileData.firstName,
          last_name: profileData.lastName,
          email: profileData.email,
          mobile: profileData.mobile,
          store_id: profileData.store
        }
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const isActive = (path) => pathname === path;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header with Breadcrumb */}
      <div className="bg-red-50 py-6 px-8 flex justify-between items-center border-b border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800">My Profile Page</h2>
        <div className="flex items-center space-x-2 text-sm">
          <Link href="/" className="text-gray-600 hover:text-red-500">🏠 Home</Link>
          <FiChevronRight className="text-gray-400" />
          <Link href="/profile" className="text-gray-600 hover:text-red-500">My Account</Link>
          <FiChevronRight className="text-gray-400" />
          <span className="text-brandRed font-semibold">Profile</span>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-white p-6 rounded-xl border border-gray-200  hover:border-red-500 transition-all duration-300 shadow-sm">
              <h3 className="text-lg font-semibold text-brandRed mb-6 pb-2 border-b border-gray-100">My Account</h3>
              <nav className="space-y-2">
                <Link href="/profile" className={`w-full flex items-center gap-2 px-5 py-3 text-base font-medium rounded-lg transition-all duration-200 ${isActive('/profile') ? 'text-brandRed bg-red-50 pl-6' : 'text-gray-600 hover:text-brandRed hover:bg-red-50 hover:pl-6'}`}>
                  <RiAccountCircleFill className="text-brandRed text-xl" />
                  <span>Profile</span>
                </Link>
                <Link href="/address" className={`w-full flex items-center gap-2 px-5 py-3 text-base font-medium rounded-lg transition-all duration-200 ${isActive('/address') ? 'text-brandRed bg-red-50 pl-6' : 'text-gray-600 hover:text-brandRed hover:bg-red-50 hover:pl-6'}`}>
                  <FaAddressBook className="text-brandRed text-xl" />
                  <span>Addresses</span>
                </Link>
                <Link href="/orders" className={`w-full flex items-center gap-2 px-5 py-3 text-base font-medium rounded-lg transition-all duration-200 ${isActive('/orders') ? 'text-brandRed bg-red-50 pl-6' : 'text-gray-600 hover:text-brandRed hover:bg-red-50 hover:pl-6'}`}>
                  <HiShoppingBag className="text-brandRed text-xl" />
                  <span>Orders</span>
                </Link>
                <Link href="/wishlist" className={`w-full flex items-center gap-2 px-5 py-3 text-base font-medium rounded-lg transition-all duration-200 ${isActive('/wishlist') ? 'text-brandRed bg-red-50 pl-6' : 'text-gray-600 hover:text-brandRed hover:bg-red-50 hover:pl-6'}`}>
                  <FaHeart className="text-brandRed text-xl" />
                  <span>Wishlist</span>
                </Link>
              </nav>
            </div>
          </div>          {/* Main Content - Profile */}
          <div className="flex-1">
            <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-8 pb-3 border-b border-gray-100">
                My Profile Page
              </h2>

              {message && <div className="mb-4 p-4 text-green-700 bg-green-50 rounded-lg">{message}</div>}
              {error && <div className="mb-4 p-4 text-red-700 bg-red-50 rounded-lg">{error}</div>}

              <form onSubmit={handleProfileSave} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="Enter First Name"
                      value={profileData.firstName}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-[#d72828] transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Enter Last Name"
                      value={profileData.lastName}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-[#d72828] transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter Email ID"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-[#d72828] transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">
                      Phone
                    </label>
                    <input
                      id="mobile"
                      name="mobile"
                      type="text"
                      placeholder="Enter Phone Number"
                      value={profileData.mobile}
                      onChange={handleProfileChange}
                      readOnly
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 bg-gray-50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-[#d72828] transition-all duration-200 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="store" className="block text-sm font-medium text-gray-700">
                      Store Near You
                    </label>
                    <select
                      id="store"
                      name="store"
                      value={profileData.store}
                      onChange={handleProfileChange}
                      disabled={loadingStores}
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-[#d72828] transition-all duration-200 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {loadingStores ? "Loading stores..." : "Select Store Near You"}
                      </option>
                      {[...stores]
                        .sort((a, b) => getStoreDisplayName(a).localeCompare(getStoreDisplayName(b)))
                        .map((store) => (
                          <option key={store._id} value={String(store._id)}>
                            {getStoreDisplayName(store)}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="pt-6 flex justify-center md:justify-start">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-2.5 rounded-lg shadow-sm text-sm font-medium text-white bg-[#d72828] hover:bg-[#b91c1c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? 'SAVING...' : 'SAVE CHANGES'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}