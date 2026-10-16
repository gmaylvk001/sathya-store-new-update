import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Category from "@/models/ecom_category_info";

export async function GET() {
  try {
    await dbConnect();
    try {
      const { syncComboCategoryVisibility } = await import(
        "@/lib/comboOffers/categoryVisibilityService"
      );
      await syncComboCategoryVisibility();
    } catch (_) {
      /* non-blocking */
    }
    const categories = await Category.find({ status: "Active" })
      .select("_id category_name category_slug")
      .sort({ category_name: 1 });
    
    return NextResponse.json({ success: true, categories });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}