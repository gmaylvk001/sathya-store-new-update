// app/api/brand/by-category/route.js
import dbConnect from "@/lib/db";
import Brand from "@/models/ecom_brand_info";
import Category from "@/models/ecom_category_info";
import Product from "@/models/product";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return new NextResponse(JSON.stringify({ success: false, error: "slug is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 1: Main category fetch
    const mainCategory = await Category.findOne({
      category_slug: slug,
      status: "Active",
    }).lean();

    if (!mainCategory) {
      return new NextResponse(JSON.stringify({ success: false, error: "Category not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: All md5 hashes collect (BFS)
    const allMd5Hashes = new Set();
    allMd5Hashes.add(mainCategory.md5_cat_name);
    const queue = [mainCategory.md5_cat_name];

    while (queue.length > 0) {
      const currentMd5 = queue.shift();
      const children = await Category.find(
        { parentid_new: currentMd5, status: "Active" },
        { md5_cat_name: 1 }
      ).lean();
      children.forEach((child) => {
        if (!allMd5Hashes.has(child.md5_cat_name)) {
          allMd5Hashes.add(child.md5_cat_name);
          queue.push(child.md5_cat_name);
        }
      });
    }

    const md5Array = Array.from(allMd5Hashes);
    const regexPattern = md5Array.join("|");
    const regex = new RegExp(regexPattern);

    // Step 3: Unique brand IDs from products
    const uniqueBrandIds = await Product.distinct("brand", {
      $or: [
        { sub_category_new: { $regex: regex } },
        { category_new: { $in: md5Array } },
      ],
      status: "Active",
      brand: { $exists: true, $ne: "" },
    });

    if (!uniqueBrandIds.length) {
      return new NextResponse(JSON.stringify({ success: true, brands: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Brand details fetch
    const objectIdBrands = uniqueBrandIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const brands = await Brand.find(
      { _id: { $in: objectIdBrands }, status: "Active" }
    )
      .select("brand_name brand_slug image")
      .lean();

    console.log("brands found:", brands.length);

    return new NextResponse(
      JSON.stringify({
        success: true,
        brands: brands.map((b) => ({
          _id: b._id.toString(),
          brand_name: b.brand_name,
          brand_slug: b.brand_slug,
          image: b.image,
        })),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("by-category error:", error);
    return new NextResponse(
      JSON.stringify({ success: false, error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}