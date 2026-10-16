"use client";
import { useState } from "react";

export default function CategoryComponent() {
  const [categories, setCategories] = useState([
    { id: 1, name: "Electronics" },
    { id: 2, name: "Clothing" },
    { id: 3, name: "Books" },
  ]);

  return (
    <div className="container mx-auto mt-10 p-5">
    {JSON.stringify("ji")}
      <h2 className="text-2xl font-bold text-center mb-5">Category</h2>
      <div className="bg-white shadow-md rounded-lg p-5 border border-gray-200">
        <ul className="space-y-2 ">
          {categories.map((category) => (

            <li key={category.id} className="p-3 border rounded-md bg-gray-100">
              {category.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
