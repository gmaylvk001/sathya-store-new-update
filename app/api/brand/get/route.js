// app/api/brand/get/route.js
import dbConnect from "@/lib/db";
import Brand from "@/models/ecom_brand_info";
import Product from "@/models/product";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const isHomePage = searchParams.get("homePage") === "true";
    const minProductsParam = searchParams.get("minProducts");

    const letterParam = searchParams.get("letter");

    let query = { status: { $regex: /^active$/i } };
    if (letterParam && letterParam !== "ALL") {
      query.brand_name = { $regex: new RegExp(`^${letterParam.trim()}`, "i") };
    }

    let brands = [];
    try {
      brands = await Brand.find(query)
        .select("brand_name brand_slug image status")
        .sort({ brand_name: 1 })
        .lean();
    } catch (queryErr) {
      console.warn("Status filter query failed in /api/brand/get, falling back to find all:", queryErr);
      brands = await Brand.find()
        .select("brand_name brand_slug image status")
        .sort({ brand_name: 1 })
        .lean();
    }

    if (isHomePage || minProductsParam !== null) {
      // Default to at least 50 products for home page, or custom minProducts threshold
      const minCount = minProductsParam !== null 
        ? Math.max(1, Number(minProductsParam) || 0) 
        : 50;

      // Aggregate active products per brand
      const productCounts = await Product.aggregate([
        {
          $match: {
            $or: [
              { status: { $regex: /^active$/i } },
              { status: { $exists: false } }
            ]
          }
        },
        {
          $group: {
            _id: { $toString: "$brand" },
            count: { $sum: 1 }
          }
        }
      ]);

      const countMap = new Map();
      productCounts.forEach((c) => {
        if (c._id && c._id !== "null") {
          countMap.set(c._id, c.count);
        }
      });

      // Filter out brands with 0 products or below minCount, and sort descending by product count
      const filteredBrands = brands
        .map((brand) => {
          const id = brand?._id ? brand._id.toString() : "";
          const count = countMap.get(id) || 0;
          return {
            id,
            brand_name: brand?.brand_name || "",
            brand_slug: brand?.brand_slug || "",
            image: brand?.image || "",
            productCount: count,
          };
        })
        .filter((brand) => brand.productCount >= minCount && brand.image)
        .sort((a, b) => b.productCount - a.productCount);

      return NextResponse.json({
        success: true,
        brands: filteredBrands,
      }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      brands: (brands || []).map(brand => ({
        id: brand?._id ? brand._id.toString() : "",
        brand_name: brand?.brand_name || "",
        brand_slug: brand?.brand_slug || "",
        image: brand?.image || ""
      }))
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching brands in /api/brand/get:", error);
    return NextResponse.json({
      success: false,
      brands: [],
      error: error?.message || "Internal server error"
    }, { status: 200 });
  }
}