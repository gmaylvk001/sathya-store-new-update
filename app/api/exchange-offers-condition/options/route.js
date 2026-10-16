import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ExchangeOfferCondition from "@/models/ExchangeOfferCondition";

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const categoryName = searchParams.get("categoryName");

    if (!categoryName) {
      return NextResponse.json(
        { success: false, error: "categoryName is required" },
        { status: 400 }
      );
    }

    const categories = categoryName.split(",").map(c => c.trim()).filter(Boolean);

    // Find all active records for this category (or any of the parent categories)
    const records = await ExchangeOfferCondition.find({
      categoryName: { $in: categories },
      status: "Active"
    });

    // Extract unique values
    const types = [...new Set(records.map((r) => r.type))].filter(Boolean);
    const brands = [...new Set(records.map((r) => r.brand))].filter(Boolean);
    const conditions = [...new Set(records.map((r) => r.condition))].filter(Boolean);

    return NextResponse.json({
      success: true,
      data: {
        types,
        brands,
        conditions,
      },
    });
  } catch (error) {
    console.error("Error fetching Exchange Offer Options:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
