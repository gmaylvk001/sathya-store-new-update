import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ExchangeOfferCondition from "@/models/ExchangeOfferCondition";

export async function POST(req) {
  try {
    await dbConnect();
    const data = await req.json();
    const { categoryName, type, brand, condition, zone } = data;

    if (!categoryName || !type || !brand || !condition) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (categoryName, type, brand, condition)" },
        { status: 400 }
      );
    }

    const categories = categoryName.split(",").map(c => c.trim()).filter(Boolean);

    // First try to find an exact match including the zone (or pincode)
    let query = {
      categoryName: { $in: categories },
      type,
      brand,
      condition,
      status: "Active"
    };

    let offer = null;

    if (zone) {
      offer = await ExchangeOfferCondition.findOne({ ...query, zone });
    }

    // If no exact zone match, try to find one where zone is "Any" or empty
    if (!offer) {
      offer = await ExchangeOfferCondition.findOne({
        ...query,
        $or: [{ zone: "Any" }, { zone: "" }, { zone: { $exists: false } }]
      });
    }
    
    // If still no match, just try to find any matching the 4 primary criteria
    if (!offer) {
      offer = await ExchangeOfferCondition.findOne(query);
    }

    if (!offer) {
      return NextResponse.json(
        { success: false, error: "No matching exchange offer found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: offer,
    });
  } catch (error) {
    console.error("Error checking Exchange Offer:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
