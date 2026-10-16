import dbConnect from "@/lib/db";
import Category from "@/models/ecom_category_info";
import CategoryBanner from "@/models/main_flash_banner";
import { NextResponse } from "next/server";

export async function GET(request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('categorySlug');
    
    console.log('🔍 Fetching banners for category slug:', categorySlug);
    
    let query = { banner_status: "Active" };
    
    // If categorySlug is provided, filter by exact category slug match
    if (categorySlug && categorySlug !== 'null' && categorySlug !== 'undefined') {
      query.category_slug = categorySlug;
    }

    console.log('📋 Query:', query);

    // Fetch category banners with category info, sorted by display order
    const banners = await CategoryBanner.find(query)
      .populate('category_id', 'category_name category_slug')
      .sort({ display_order: 1, createdAt: -1 });
    
    console.log('🎯 Found banners:', banners.length);
    
    return NextResponse.json({ 
      success: true, 
      banners 
    });
  } catch (err) {
    console.error("Fetch category banners errors:", err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    });
  }
}