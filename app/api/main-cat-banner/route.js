import dbConnect from "@/lib/db";
import MainCategoryBanner from "@/models/main_category_banner";
import { NextResponse } from "next/server";

export async function GET(request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('categorySlug');
    
    let query = { banner_status: "Active" };
    
    // If categorySlug is provided, filter by category slug
    if (categorySlug) {
      query.category_slug = categorySlug;
    }

    // Fetch banners with category info, sorted by display order
    const banners = await MainCategoryBanner.find(query)
      .populate('category_id', 'category_name category_slug')
      .sort({ display_order: 1, createdAt: -1 });
    
    return NextResponse.json({ 
      success: true, 
      banners 
    });
  } catch (err) {
    console.error("Fetch banners error:", err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    });
  }
}