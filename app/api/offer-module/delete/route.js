import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OfferModule from "@/models/OfferModule";
import OfferModuleProduct from "@/models/OfferModuleProduct";

export async function POST(req) {
  try {
    await dbConnect();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: "Offer ID is required" }, { status: 400 });
    }

    // Check if there are products associated with this offer
    const productsCount = await OfferModuleProduct.countDocuments({ offerId: id });
    if (productsCount > 0) {
      return NextResponse.json({ 
        success: false, 
        hasProducts: true, 
        productCount: productsCount,
        error: `Cannot delete offer. There are ${productsCount} products associated with this offer.` 
      }, { status: 400 });
    }

    const deletedOffer = await OfferModule.findByIdAndDelete(id);

    if (!deletedOffer) {
      return NextResponse.json({ success: false, error: "Offer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Offer deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error in POST /api/offer-module/delete:", error);
    return NextResponse.json({ success: false, error: "Error deleting offer", message: error?.message }, { status: 500 });
  }
}
