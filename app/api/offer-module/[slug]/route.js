import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OfferModule from "@/models/OfferModule";
import OfferModuleProduct from "@/models/OfferModuleProduct";

export async function GET(req, { params }) {
  try {
    const awaitedParams = await params;
    const { slug } = awaitedParams;
    await dbConnect();
    
    const offer = await OfferModule.findOne({ slug }).lean();
    if (!offer) {
      return NextResponse.json({ success: false, error: "Offer not found" }, { status: 404 });
    }

    const products = await OfferModuleProduct.find({ offerId: offer._id }).lean();
    
    return NextResponse.json({ success: true, offer, products }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/offer-module/[slug]:", error);
    return NextResponse.json({ success: false, error: "Error fetching offer", message: error?.message }, { status: 500 });
  }
}
