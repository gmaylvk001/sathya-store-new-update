import dbConnect from "@/lib/db";
import Category from "@/models/ecom_category_info";
import MainCategoryBanner from "@/models/main_category_banner";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect();
  try {
    // Fetch all main category banners with category info, sorted by display order
    const mainBanners = await MainCategoryBanner.find()
      .populate('category_id', 'category_name category_slug')
      .sort({ category_id: 1, display_order: 1, createdAt: -1 });
    
    return NextResponse.json({ success: true, banners: mainBanners });
  } catch (err) {
    console.error("Fetch main banners error:", err);
    return NextResponse.json({ success: false, error: err.message });
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
      // Validate file size (max 5MB)
      if (bannerFile.size > 5 * 1024 * 1024) {
        return NextResponse.json({ 
          success: false, 
          error: "File size too large. Maximum size is 5MB." 
        });
      }

      const buffer = Buffer.from(await bannerFile.arrayBuffer());
      const filename = `main-banner-${Date.now()}-${bannerFile.name.replace(/\s+/g, '-')}`;
      const uploadDir = path.join(process.cwd(), "public/uploads/main-banners");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);
      bannerImagePath = "/uploads/main-banners/" + filename;
    }

    let mainBanner;

    if (bannerId) {
      // Edit existing main banner
      mainBanner = await MainCategoryBanner.findById(bannerId);
      if (!mainBanner) {
        return NextResponse.json({ 
          success: false, 
          error: "Main banner not found" 
        });
      }

      // Update fields
      mainBanner.banner_name = banner_name;
      mainBanner.redirect_url = redirect_url;
      mainBanner.banner_status = banner_status;
      mainBanner.display_order = parseInt(display_order);
      mainBanner.updatedAt = new Date();

      // Update category info if provided
      if (categoryInfo) {
        mainBanner.category_id = categoryInfo._id;
        mainBanner.category_name = categoryInfo.category_name;
        mainBanner.category_slug = categoryInfo.category_slug;
      }

      // Update image if new one provided
      if (bannerImagePath) {
        // Delete old image file
        if (mainBanner.banner_image) {
          const oldImagePath = path.join(process.cwd(), "public", mainBanner.banner_image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        mainBanner.banner_image = bannerImagePath;
      }

      await mainBanner.save();
    } else {
      // Create new main banner
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
      const existingBannersCount = await MainCategoryBanner.countDocuments({
        category_id: categoryInfo._id,
        banner_status: "Active"
      });

      // You can set a limit if needed, or remove this check for unlimited banners
      // if (existingBannersCount >= 5) {
      //   return NextResponse.json({ 
      //     success: false, 
      //     error: "Maximum 5 banners allowed per category" 
      //   });
      // }

      mainBanner = new MainCategoryBanner({
        category_id: categoryInfo._id,
        category_name: categoryInfo.category_name,
        category_slug: categoryInfo.category_slug,
        banner_name,
        banner_image: bannerImagePath,
        redirect_url,
        banner_status,
        banner_size: "1920x600",
        display_order: parseInt(display_order)
      });

      await mainBanner.save();
    }

    return NextResponse.json({ 
      success: true, 
      banner: mainBanner,
      message: bannerId ? "Banner updated successfully" : "Banner created successfully"
    });
  } catch (err) {
    console.error("Main banner error:", err);
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

    const mainBanner = await MainCategoryBanner.findByIdAndUpdate(
      bannerId,
      { display_order: parseInt(display_order), updatedAt: new Date() },
      { new: true }
    );

    if (!mainBanner) {
      return NextResponse.json({ 
        success: false, 
        error: "Banner not found" 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Display order updated successfully",
      banner: mainBanner
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

    const mainBanner = await MainCategoryBanner.findById(bannerId);
    if (!mainBanner) {
      return NextResponse.json({ 
        success: false, 
        error: "Main banner not found" 
      });
    }

    // Delete the image file
    if (mainBanner.banner_image) {
      const imagePath = path.join(process.cwd(), "public", mainBanner.banner_image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await MainCategoryBanner.findByIdAndDelete(bannerId);

    return NextResponse.json({ 
      success: true, 
      message: "Banner deleted successfully" 
    });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json({ success: false, error: err.message });
  }
}