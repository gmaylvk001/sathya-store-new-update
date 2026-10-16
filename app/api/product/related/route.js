/* // app/api/products/related/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db"; // your DB connection
import Product from "@/models/product";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("category"); // category ID
    const excludeId = searchParams.get("exclude"); // optional product to exclude
    const limit = parseInt(searchParams.get("limit")) || 5; // default 5

    if (!categoryId) {
      return NextResponse.json({ error: "Category ID is requiredd" }, { status: 400 });
    }

    const query = { category: categoryId };
    if (excludeId) query._id = { $ne: excludeId }; // exclude current product

    const relatedProducts = await Product.find(query)
      .limit(limit)
      .sort({ createdAt: -1 }); // latest products first

    return NextResponse.json({
  success: true,
  products: relatedProducts, // ✅ match frontend expectation
});

  } catch (error) {
    console.error("Error fetching related products:", error);
    return NextResponse.json({ error: "Failed to fetch related products" }, { status: 500 });
  }
}
 */


// app/api/products/related/route.js

import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/product";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);

    const ids = searchParams.get("ids");
    const categoryId = searchParams.get("category");
    const brandId = searchParams.get("brand");
    const excludeId = searchParams.get("exclude");
    const limit = parseInt(searchParams.get("limit")) || 10;

    // 1. Fetch by explicit IDs if provided
    if (ids) {
      const productIds = ids
        .split(",")
        .filter(Boolean)
        .map((id) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id));

      const products = await Product.find({
        _id: { $in: productIds },
        status: "Active",
      }).lean();

      return NextResponse.json({
        success: true,
        products,
      });
    }

    // 2. Fallback: Fetch by category / brand
    if (categoryId) {
      const query = { category: categoryId, status: "Active" };
      if (brandId) query.brand = brandId;
      if (excludeId) query._id = { $ne: excludeId };

      let products = await Product.find(query)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean();

      // If brand filter was too narrow (< 4 products), broaden to category items
      if (products.length < 4 && brandId) {
        const existingIds = products.map((p) => p._id);
        const excludeList = excludeId ? [...existingIds, excludeId] : existingIds;
        const moreProducts = await Product.find({
          category: categoryId,
          status: "Active",
          _id: { $nin: excludeList },
        })
          .limit(limit - products.length)
          .sort({ createdAt: -1 })
          .lean();

        products = [...products, ...moreProducts];
      }

      return NextResponse.json({
        success: true,
        products,
      });
    }

    return NextResponse.json(
      {
        success: false,
        products: [],
        error: "Related product IDs or category are required",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Related products fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        products: [],
      },
      { status: 500 }
    );
  }
}