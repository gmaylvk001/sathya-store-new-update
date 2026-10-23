import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OfferModule from "@/models/OfferModule";
import { ensureDefaultOffersExist, DEFAULT_OFFERS } from "@/lib/offersHelper";

export async function GET() {
  try {
    await dbConnect();
    await ensureDefaultOffersExist();

    const activeOffers = await OfferModule.find({ isActive: { $ne: false } })
      .select("offerName slug description banner")
      .sort({ createdAt: 1 })
      .lean();

    // If for any reason DB returned nothing, return default offers
    const data = activeOffers && activeOffers.length > 0 ? activeOffers : DEFAULT_OFFERS;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/offer-module/active:", error);
    return NextResponse.json({ success: true, data: DEFAULT_OFFERS }, { status: 200 });
  }
}
