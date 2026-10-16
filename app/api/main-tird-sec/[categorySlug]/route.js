import dbConnect from "@/lib/db";
import Category from "@/models/ecom_category_info";
import CategoryBanner from "@/models/category_banner_2";
import { NextResponse } from "next/server";

export async function GET(request, context) {
  try {
    await dbConnect();

    const params = await context.params;
    const slug = params.categorySlug;

    console.log("=== BANNER API DEBUG ===");
    console.log("Requested slug:", slug);

    if (!slug) {
      return NextResponse.json({
        success: false,
        message: "Invalid slug"
      }, { status: 400 });
    }

    // Find category by slug - try different variations
    const category = await Category.findOne({
      $or: [
        { category_slug: slug },
        { category_slug: slug.toLowerCase() },
        { category_slug: slug.replace(/-/g, ' ') },
        { category_slug: { $regex: new RegExp(slug, 'i') } }
      ]
    });

    console.log("Category found:", category);

    if (!category) {
      // Log all categories to debug
      const allCategories = await Category.find({}, 'category_name category_slug');
      console.log("All available categories:", allCategories.map(c => ({
        name: c.category_name,
        slug: c.category_slug
      })));

      return NextResponse.json({
        success: false,
        message: "Category not found",
        debug: {
          requestedSlug: slug,
          availableCategories: allCategories.map(c => c.category_slug)
        }
      }, { status: 404 });
    }

    console.log("Looking for banner with category_id:", category._id);

    // Find ALL banner docs for this category
    const bannerDocs = await CategoryBanner.find({
      category_id: category._id
    });

    console.log("Found banner documents:", bannerDocs.length);
    console.log("Banner docs details:", JSON.stringify(bannerDocs, null, 2));

    // Filter active banners
    const activeBannerDocs = bannerDocs.filter(doc => 
      doc.category_status === "active"
    );

    console.log("Active banner documents:", activeBannerDocs.length);

    if (activeBannerDocs.length === 0) {
      // Check if there are inactive banners
      const inactiveBannerDocs = bannerDocs.filter(doc => 
        doc.category_status !== "active"
      );

      return NextResponse.json({
        success: false,
        message: "No active banners found for this category",
        debug: {
          categoryId: category._id,
          categoryName: category.category_name,
          totalBanners: bannerDocs.length,
          inactiveBanners: inactiveBannerDocs.length,
          bannerStatuses: bannerDocs.map(d => d.category_status)
        }
      }, { status: 404 });
    }

    // Combine all banners from all active documents
    const allBanners = activeBannerDocs.flatMap(doc => 
      doc.banners.map(b => ({
        top: b.topBanner,
        sub: b.subBanners,
        bgColor: b.bgColor || "#f0f0f0",
      }))
    );

    console.log("Returning banners count:", allBanners.length);

    return NextResponse.json({
      success: true,
      data: allBanners,
      meta: {
        category: category.category_name,
        totalBannerGroups: allBanners.length
      }
    });

  } catch (error) {
    console.error("Error in banner API:", error);
    return NextResponse.json({
      success: false,
      message: "Internal server error",
      error: error.message
    }, { status: 500 });
  }
}