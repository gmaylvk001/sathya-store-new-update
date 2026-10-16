import dbConnect from "@/lib/db";
import Category from "@/models/ecom_category_info";
import CategoryBanner from "@/models/main_flash_banner";
import fs from "fs";
import path from "path";
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

    // Fetch category banners with category info, sorted by display order
    const banners = await CategoryBanner.find(query)
      .populate('category_id', 'category_name category_slug')
      .sort({ display_order: 1, createdAt: -1 });
    
    return NextResponse.json({ 
      success: true, 
      banners 
    });
  } catch (err) {
    console.error("Fetch category banners error:", err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    });
  }
}

export async function POST(req) {
  await dbConnect();
  try {
    const formData = await req.formData();

    const bannerId = formData.get("bannerId");
    const category_id = formData.get("categoryId");
    const banner_name = formData.get("banner_name");
    const redirect_url = formData.get("redirect_url");
    const banner_status = formData.get("banner_status");
    const display_order = formData.get("display_order") || 0;
    const bannerFile = formData.get("bannerImage");

    // Validate required fields
    if (!category_id && !bannerId) {
      return NextResponse.json({ 
        success: false, 
        error: "Category ID is required" 
      });
    }

    if (!banner_name) {
      return NextResponse.json({ 
        success: false, 
        error: "Banner name is required" 
      });
    }

    let bannerImagePath = null;
    let categoryInfo = null;

    // Get category info if we have category_id
    if (category_id) {
      categoryInfo = await Category.findById(category_id);
      if (!categoryInfo) {
        return NextResponse.json({ 
          success: false, 
          error: "Category not found" 
        });
      }
    }

    // Handle file upload
    if (bannerFile && bannerFile.size > 0) {
      // Validate file size (max 2MB for smaller banners)
      if (bannerFile.size > 2 * 1024 * 1024) {
        return NextResponse.json({ 
          success: false, 
          error: "File size too large. Maximum size is 2MB." 
        });
      }

      const buffer = Buffer.from(await bannerFile.arrayBuffer());
      const filename = `category-banner-${Date.now()}-${bannerFile.name.replace(/\s+/g, '-')}`;
      const uploadDir = path.join(process.cwd(), "public/uploads/category-banners");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);
      bannerImagePath = "/uploads/category-banners/" + filename;
    }

    let categoryBanner;

    if (bannerId) {
      // Edit existing category banner
      categoryBanner = await CategoryBanner.findById(bannerId);
      if (!categoryBanner) {
        return NextResponse.json({ 
          success: false, 
          error: "Category banner not found" 
        });
      }

      // Update fields
      categoryBanner.banner_name = banner_name;
      categoryBanner.redirect_url = redirect_url;
      categoryBanner.banner_status = banner_status;
      categoryBanner.display_order = parseInt(display_order);
      categoryBanner.updatedAt = new Date();

      // Update category info if provided
      if (categoryInfo) {
        categoryBanner.category_id = categoryInfo._id;
        categoryBanner.category_name = categoryInfo.category_name;
        categoryBanner.category_slug = categoryInfo.category_slug;
      }

      // Update image if new one provided
      if (bannerImagePath) {
        // Delete old image file
        if (categoryBanner.banner_image) {
          const oldImagePath = path.join(process.cwd(), "public", categoryBanner.banner_image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        categoryBanner.banner_image = bannerImagePath;
      }

      await categoryBanner.save();
    } else {
      // Create new category banner
      if (!bannerImagePath) {
        return NextResponse.json({ 
          success: false, 
          error: "Banner image is required for new banner" 
        });
      }

      if (!categoryInfo) {
        return NextResponse.json({ 
          success: false, 
          error: "Category information is required for new banner" 
        });
      }

      // Check how many active banners already exist for this category
      const existingBannersCount = await CategoryBanner.countDocuments({
        category_id: categoryInfo._id,
        banner_status: "Active"
      });

      categoryBanner = new CategoryBanner({
        category_id: categoryInfo._id,
        category_name: categoryInfo.category_name,
        category_slug: categoryInfo.category_slug,
        banner_name,
        banner_image: bannerImagePath,
        redirect_url,
        banner_status,
        banner_size: "410x410",
        display_order: parseInt(display_order)
      });

      await categoryBanner.save();
    }

    return NextResponse.json({ 
      success: true, 
      banner: categoryBanner,
      message: bannerId ? "Banner updated successfully" : "Banner created successfully"
    });
  } catch (err) {
    console.error("Category banner error:", err);
    return NextResponse.json({ success: false, error: err.message });
  }
}

// New endpoint to update display order
export async function PATCH(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const { bannerId, display_order } = body;

    if (!bannerId) {
      return NextResponse.json({ 
        success: false, 
        error: "Banner ID is required" 
      });
    }

    const categoryBanner = await CategoryBanner.findByIdAndUpdate(
      bannerId,
      { display_order: parseInt(display_order), updatedAt: new Date() },
      { new: true }
    );

    if (!categoryBanner) {
      return NextResponse.json({ 
        success: false, 
        error: "Banner not found" 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Display order updated successfully",
      banner: categoryBanner
    });
  } catch (err) {
    console.error("Update order error:", err);
    return NextResponse.json({ success: false, error: err.message });
  }
}

export async function DELETE(req) {
  await dbConnect();
  try {
    const body = await req.json();
    const { bannerId } = body;

    if (!bannerId) {
      return NextResponse.json({ 
        success: false, 
        error: "Banner ID is required" 
      });
    }

    const categoryBanner = await CategoryBanner.findById(bannerId);
    if (!categoryBanner) {
      return NextResponse.json({ 
        success: false, 
        error: "Category banner not found" 
      });
    }

    // Delete the image file
    if (categoryBanner.banner_image) {
      const imagePath = path.join(process.cwd(), "public", categoryBanner.banner_image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await CategoryBanner.findByIdAndDelete(bannerId);

    return NextResponse.json({ 
      success: true, 
      message: "Banner deleted successfully" 
    });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json({ success: false, error: err.message });
  }
}