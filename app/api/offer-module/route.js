import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OfferModule from "@/models/OfferModule";
import { ensureDefaultOffersExist } from "@/lib/offersHelper";

export async function GET(req) {
  try {
    await dbConnect();
    await ensureDefaultOffersExist();

    const { searchParams } = new URL(req.url);
    const onlyActive = searchParams.get("active") === "true";

    const query = onlyActive ? { isActive: { $ne: false } } : {};

    const offers = await OfferModule.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Map each offer with productsCount
    const formatted = (offers || []).map((o) => ({
      ...o,
      productsCount: Array.isArray(o.products) ? o.products.length : 0,
      isActive: o.isActive !== false,
    }));

    return NextResponse.json({ success: true, data: formatted }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/offer-module:", error);
    return NextResponse.json(
      { success: false, error: "Error fetching offers", message: error?.message },
      { status: 500 }
    );
  }
}
