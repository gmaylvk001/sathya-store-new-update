import React from "react";

const ProductCard = ({ product }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex items-center space-x-4">
      <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded" />
      <div>
        <h3 className="text-sm font-semibold">{product.name}</h3>
        <div className="text-yellow-500 flex items-center text-sm">
          <span>{product.rating}</span>
          <span className="ml-1">⭐ ({product.reviews})</span>
        </div>
        <p className="text-lg font-bold text-gray-800">${product.price}</p>
      </div>
    </div>
  );
};

const ProductSection = ({ title, products }) => {
  return (
    <div className="bg-gray-100 p-6 rounded-lg">
      <h2 className="text-lg font-bold text-[#d72828] mb-4">{title}</h2>
      <div className="space-y-4">
        {products.map((product, index) => (
          <ProductCard key={index} product={product} />
        ))}
      </div>
    </div>
  );
};

const ProductListing = () => {
  const featuredProducts = [
    { name: "Broccoli Florets", image: "/broccoli.jpg", rating: 4.8, reviews: "17k", price: 1500 },
    { name: "Almonds", image: "/almonds.jpg", rating: 4.8, reviews: "17k", price: 1500 },
    { name: "Spinach", image: "/spinach.jpg", rating: 4.8, reviews: "17k", price: 1500 }
  ];

  return (
    <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 p-6">
      <ProductSection title="Featured Products" products={featuredProducts} />
      <ProductSection title="Top Selling Products" products={featuredProducts} />
      <ProductSection title="On-sale Products" products={featuredProducts} />
    </div>
  );
};

export default ProductListing;
