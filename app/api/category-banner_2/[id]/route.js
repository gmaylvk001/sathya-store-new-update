import fs from "fs";
import path from "path";
import dbConnect from "@/lib/db";
import CategoryBanner from "@/models/category_banner_2";
import "@/models/ecom_category_info"; // ensure related models are registered before using populate
import "@/models/product"; // ensure Product model is registered for populate
import { NextResponse } from "next/server";

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Banner ID is required" },
        { status: 400 }
      );
    }

    const form = await req.formData();

    const category_id = form.get("category_id");
    const category_status = form.get("category_status");
    const bannersJson = form.get("banners");

    if (!category_id || !category_status || !bannersJson) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Missing required fields",
          details: {
            hasCategoryId: !!category_id,
            hasCategoryStatus: !!category_status,
            hasBanners: !!bannersJson
          }
        },
        { status: 400 }
      );
    }

    let bannersFromFrontend;
    try {
      bannersFromFrontend = JSON.parse(bannersJson);
      bannersFromFrontend = JSON.parse(JSON.stringify(bannersFromFrontend)); // deep clone
    } catch (parseError) {
      console.error("Failed to parse banners JSON:", parseError);
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid banners JSON format",
          error: parseError.message 
        },
        { status: 400 }
      );
    }

    // Create upload directories
    const uploadDirTop = path.join(process.cwd(), "public/category/third/top_banners");
    const uploadDirSub = path.join(process.cwd(), "public/category/third/sub_banners");

    try {
      if (!fs.existsSync(uploadDirTop)) fs.mkdirSync(uploadDirTop, { recursive: true });
      if (!fs.existsSync(uploadDirSub)) fs.mkdirSync(uploadDirSub, { recursive: true });
    } catch (fsError) {
      console.error("Failed to create upload directories:", fsError);
      return NextResponse.json(
        { 
          success: false, 
          message: "Failed to create upload directories",
          error: fsError.message 
        },
        { status: 500 }
      );
    }

    const existingDoc = await CategoryBanner.findById(id);
    if (!existingDoc) {
      return NextResponse.json(
        { success: false, message: "Category Banner not found" },
        { status: 404 }
      );
    }

    // Process banners
    for (let idx = 0; idx < bannersFromFrontend.length; idx++) {
      const group = bannersFromFrontend[idx];
      const existingGroup = existingDoc.banners[idx] || {};

      // Top Banner
      const topFile = form.get(`topBanner_${idx}`);
      if (topFile && typeof topFile === "object") {
        try {
          const fileName = `${Date.now()}_${topFile.name}`;
          const filePath = path.join(uploadDirTop, fileName);
          const buffer = Buffer.from(await topFile.arrayBuffer());
          fs.writeFileSync(filePath, buffer);
          group.topBanner.image = `/category/third/top_banners/${fileName}`;
        } catch (fileError) {
          console.error(`Failed to save top banner file ${idx}:`, fileError);
          return NextResponse.json(
            { 
              success: false, 
              message: `Failed to save top banner image for group ${idx + 1}`,
              error: fileError.message 
            },
            { status: 500 }
          );
        }
      } else if (!group.topBanner.image) {
        group.topBanner.image = existingGroup.topBanner?.image || null;
      }

      // Preserve featured_products if not provided
      if (!group.topBanner.featured_products || group.topBanner.featured_products.length === 0) {
        group.topBanner.featured_products = existingGroup.topBanner?.featured_products || [];
      }

      // Sub Banners
      for (let sIdx = 0; sIdx < group.subBanners.length; sIdx++) {
        const sub = group.subBanners[sIdx];
        const existingSub = existingGroup.subBanners?.[sIdx] || {};
        const subFile = form.get(`subBanner_${idx}_${sIdx}`);

        if (subFile && typeof subFile === "object") {
          try {
            const fileName = `${Date.now()}_${subFile.name}`;
            const filePath = path.join(uploadDirSub, fileName);
            const buffer = Buffer.from(await subFile.arrayBuffer());
            fs.writeFileSync(filePath, buffer);
            sub.image = `/category/third/sub_banners/${fileName}`;
          } catch (fileError) {
            console.error(`Failed to save sub banner file ${idx}_${sIdx}:`, fileError);
            return NextResponse.json(
              { 
                success: false, 
                message: `Failed to save sub banner image for group ${idx + 1}, banner ${sIdx + 1}`,
                error: fileError.message 
              },
              { status: 500 }
            );
          }
        } else if (!sub.image) {
          sub.image = existingSub.image || null;
        }
      }
    }

    // Update in database
    let updatedDoc;
    try {
      updatedDoc = await CategoryBanner.findByIdAndUpdate(
        id,
        { 
          category_id, 
          category_status, 
          banners: bannersFromFrontend 
        },
        { 
          new: true,
          runValidators: true 
        }
      )
      .populate("category_id")
      .populate("banners.topBanner.featured_products");

      if (!updatedDoc) {
        return NextResponse.json(
          { success: false, message: "Failed to update banner in database" },
          { status: 500 }
        );
      }
    } catch (dbError) {
      console.error("Database update error:", dbError);
      return NextResponse.json(
        { 
          success: false, 
          message: "Database update failed",
          error: dbError.message,
          code: dbError.code 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "Banner updated successfully",
        data: updatedDoc 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Unhandled error in PUT /api/category-banner_2/[id]:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Internal server error",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    const deletedBanner = await CategoryBanner.findByIdAndDelete(id);

    if (!deletedBanner) {
      return NextResponse.json({ message: "Banner not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}