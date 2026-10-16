"use client";

import React, { useEffect, useState } from "react";
import ReactPaginate from "react-paginate";
import Link from 'next/link';
export default function CategoryComponent() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5; // 5 records per page

  // Fetch categories from API
  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/product/get");
      const data = await response.json();
      setProducts(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle page change
  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  // Handle category deletion 
  const handleDeleteProduct = async (categoryId) => {
    try {
      const response = await fetch("/api/categories/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId }),
      });

      const result = await response.json();
      if (response.ok) {
        setSuccessMessage("Category and subcategories set to inactive.");
        setShowSuccessModal(true); // Show success modal
        fetchProducts(); // Refresh the list
      } else {
        console.error("Error:", result.error);
        alert("Failed to delete category.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred.");
    } finally {
      setShowConfirmationModal(false);
      setProductToDelete(null);
    }
  };


  // Flatten category tree for pagination
  const flattenProducts = (products, level = 0, result = []) => {
    products
      .filter((product) => product.item_code != 'none')
      .forEach((product) => {
        result.push({ ...product, level });
      });
    return result;
  };

  // Render category rows with pagination
  const renderfilteredProductRows = () => {
    const flattenedProducts = flattenProducts(products);
    const filteredProducts = flattenedProducts.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filteredProducts
      .slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
      .map((product, index) => (
        <tr key={product._id} className="text-center border-b">
          <td className="p-2 font-bold flex items-center">
          <a href={`/admin/product/${product.slug}`} className="">{product.name}</a>
          </td>
          <td className="p-2">{product.price}</td>
          <td className="p-2">{product.special_price}</td>
          <td className="p-2">{product.quantity}</td>
          <td className="p-2">
        {product.hasVariants ? (
          product.variants && product.variants[0]?.attributes?.length ? (
            <span className="text-green-500">{product.variants[0].attributes.length}</span>
          ) : (
            <span className="text-red-500">No attributes</span>
          )
        ) : (
          <span className="text-red-500">0 variants</span>
        )}
      </td>
          <td className="p-2 font-semibold">
            {product.status === "Active" ? (
              <span className="text-green-500">Active</span>
            ) : (
              <span className="text-red-500">Inactive</span>
            )}
          </td>
          <td className="p-2 font-semibold">
            <button
              onClick={() => {
                setProductToDelete(product._id);
                setShowConfirmationModal(true);
              }}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Delete
            </button>
          </td>
        </tr>
      ));
  };

  const flattenedProducts = flattenProducts(products);
  const filteredProducts = flattenedProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const pageCount = Math.ceil(filteredProducts.length / itemsPerPage);

  return (
    <div className="container mx-auto mt-10 p-5">

{/* <div className="flex justify-between items-center mb-5">
  <h2 className="text-2xl font-bold">Products List</h2>
  <Link href="/admin/product/create" className="bg-[#d72828] text-white px-4 py-2 rounded-md">
    + Add Product
  </Link>
</div> */}

      {/* Search Box */}
      <div className="flex justify-between items-center mb-5">
        <input
          type="text"
          placeholder="Search Product..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border px-3 py-2 rounded-md w-64"
        />
        <div className="flex gap-4">
         <Link href="/admin/product/create" className="bg-[#d72828] text-white px-4 py-2 rounded-md">+ Add Product</Link>
          <Link href="/admin/product/bulk_upload" className="bg-[#d72828] text-white px-4 py-2 rounded-md">Bulk upload</Link>
        </div>
        
      </div>

      {isLoading ? (
        <p>Loading Products...</p>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-5 overflow-x-auto border border-gray-200">
          <table className="w-full border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2">Name</th>
                <th className="p-2">Price</th>
                <th className="p-2">Spl Price</th>
                <th className="p-2">Quantity</th>
                <th className="p-2">inventory</th>
                <th className="p-2">Status</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                renderfilteredProductRows()
              ) : (
                <tr>
                  <td colSpan="6" className="text-center p-4">
                    No Products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <ReactPaginate
            previousLabel={"Previous"}
            nextLabel={"Next"}
            breakLabel={"..."}
            pageCount={pageCount}
            marginPagesDisplayed={2}
            pageRangeDisplayed={5}
            onPageChange={handlePageClick}
            containerClassName={"pagination flex justify-center mt-4"}
            activeClassName={"active"}
            pageClassName={"page-item"}
            pageLinkClassName={"page-link px-3 py-2 border rounded mx-1"}
            previousClassName={"page-item"}
            nextClassName={"page-item"}
            previousLinkClassName={"page-link px-3 py-2 border rounded mx-1"}
            nextLinkClassName={"page-link px-3 py-2 border rounded mx-1"}
            breakClassName={"page-item"}
            breakLinkClassName={"page-link px-3 py-2 border rounded mx-1"}
          />
        </div>
      )}


      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Delete Product</h2>
            <p className="mb-4">Are you sure you want to delete this Product?</p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmationModal(false)}
                className="bg-gray-300 px-4 py-2 rounded-md"
              >
                No, Close
              </button>
              <button
                onClick={() => handleDeleteProduct(productToDelete)}
                className="bg-red-500 px-4 py-2 rounded-md text-white"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Success</h2>
            <p className="mb-4">{successMessage}</p>

            <div className="flex justify-end">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="bg-[#d72828] px-4 py-2 rounded-md text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}