'use client';

import { redirect,useParams  } from 'next/navigation'
import Link from 'next/link';
import { useState } from 'react';

const productData = {
  name: 'Panasonic EU 7 in 1 Convertible 1.5 Ton 5 Star Inverter Split AC',
  price: 500,
  special_price: 450,
  description: 'A great 1.5 Ton Inverter Split AC from Panasonic.',
  images: [
    '/uploads/products/1741773126638-1mWrwdSmKaomOQ2l.jpg',
    '/uploads/products/1741773126837-1oKNkzrMFCJ8G6Pm.jpg',
    '/uploads/products/1741773127060-1pkWK9zzVFBiGnkl.jpg',
  ],
  variants: [
    {
      id: 'variant1',
      name: 'Variant 1',
      price: 450,
      image: '/uploads/products/1741773138191-4iOqUWP7Xk1SNOGt.jpg',
    },
    {
      id: 'variant2',
      name: 'Variant 2',
      price: 470,
      image: '/uploads/products/1741773138395-5l3VrrnfIUHmfRCq.jpg',
    },
  ],
};

export default function ProductPage() {
  const params = useParams(); // Get route parameters
  const slug = params.slug; // Extract slug from URL
  
  const [selectedImage, setSelectedImage] = useState(productData.images[0]);
  const handleVariantClick = (variantId) => {
    redirect(`/product/${slug}/${variantId}/page`);
  };


  // const { slug } = useParams(); // Extract slug from URL
  // const [products, setProducts] = useState(null);
  // const [selectedImage, setSelectedImage] = useState(null);
  // const [isLoading, setIsLoading] = useState(true);

  // // Fetch product data from API
  // const fetchProducts = async () => {
  //   try {
  //     const response = await fetch(`/api/product/${slug}`);
  //     const data = await response.json();
  //     setProducts(data);
  //     setSelectedImage(data?.images?.[0]); // Set default image
  //   } catch (error) {
  //     console.error("Error fetching products:", error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   if (slug) fetchProducts();
  // }, [slug]); // Fetch product when slug changes

  // const handleVariantClick = (variantId) => {
  //   redirect(`/product/${slug}/${variantId}/page`);
  // };

  // if (isLoading) return <p>Loading...</p>;
  // if (!products) return <p>Product not found</p>;



  return (
    <div className="container mx-auto p-4">
      <div className="grid md:grid-cols-2 gap-8 bg-white p-6 rounded-lg shadow-lg">
        {/* Product Images */}
        <div>
          <img src={selectedImage} alt="Main Product" className="w-full h-auto rounded-lg shadow-md" />
          <div className="flex mt-4 space-x-2">
            {productData.images.map((image, index) => (
              <img 
                key={index} 
                src={image} 
                alt={`product-image-${index}`} 
                className="w-20 h-20 object-cover rounded-md border cursor-pointer hover:shadow-lg"
                onClick={() => setSelectedImage(image)}
              />
            ))}
          </div>
        </div>


        {/* Product Details */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{productData.name}</h1>
          <p className="text-gray-600 mt-2">{productData.description}</p>
          <p className="text-lg font-semibold mt-2">Price: <span className="text-red-500">₹{productData.price}</span></p>
          <p className="text-lg font-semibold">Special Price: <span className="text-green-500">₹{productData.special_price}</span></p>

          {/* Variants */}
          <h2 className="text-lg font-bold mt-4">Variants</h2>
          <div className="flex space-x-4 mt-2">
            {productData.variants.map((variant) => (
              <div
                key={variant.id}
                onClick={() => handleVariantClick(variant.id)}
                className="cursor-pointer border rounded-lg p-2 hover:shadow-md transition"
              >
                <img src={variant.image} alt={variant.name} className="w-24 h-24 object-cover rounded-md" />
                <p className="text-center text-sm font-medium mt-1">{variant.name}</p>
              </div>
            ))}
          </div>

          {/* Add to Cart Button */}
          <button className="mt-6 w-full bg-yellow-500 text-white py-2 rounded-lg font-semibold hover:bg-yellow-600 transition">Add to Cart</button>
        </div>
      </div>
    </div>
  );
}
