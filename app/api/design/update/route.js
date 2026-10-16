import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Banner from "@/models/ecom_banner_info";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import fs from "fs";

// Helper function to process image upload
async function processImageUpload(newImage, currentDbImagePath, imageType, uploadSubDir = "designs") {
  if (!newImage || typeof newImage.name !== 'string' || newImage.size === 0) {
    return currentDbImagePath;
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", uploadSubDir);
  
  try {
    await mkdir(uploadDir, { recursive: true });
  } catch (err) {
    console.error(`Error creating upload directory ${uploadDir}:`, err);
  }

  // Delete old image if exists
  if (currentDbImagePath) {
    const oldImagePath = path.join(
      process.cwd(),
      "public",
      currentDbImagePath.startsWith('/') ? currentDbImagePath.substring(1) : currentDbImagePath
    );
    try {
      if (fs.existsSync(oldImagePath)) {
        await unlink(oldImagePath);
      }
    } catch (err) {
      console.error(`Error deleting old image:`, err);
    }
  }

  // Save new image
  const timestamp = Date.now();
  const ext = path.extname(newImage.name).toLowerCase();
  const fileName = `${imageType}_${timestamp}${ext}`;
  const relativePath = `/uploads/${uploadSubDir}/${fileName}`;
  const absolutePath = path.join(uploadDir, fileName);

  try {
    const buffer = Buffer.from(await newImage.arrayBuffer());
    await writeFile(absolutePath, buffer);
    return relativePath;
  } catch (err) {
    console.error(`Error saving new image:`, err);
    return currentDbImagePath;
  }
}

export async function PUT(req) {
  try {
    await dbConnect();
    const formData = await req.formData();

    const id = formData.get("id");
    const bannerType = formData.get("bannerType");
    const existingBanner = await Banner.findById(id);
    
    if (!existingBanner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    // Common fields
    const updateData = {
      title: formData.get("title"),
      bannerType,
      status: formData.get("status"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      updatedAt: new Date()
    };

    // Handle different banner types
    if (bannerType === "categorybanner") {
      // Process category images
      const categoryImages = [];
      for (let i = 0; i < 4; i++) {
        const image = formData.get(`categoryImage_${i}`);
        const redirectUrl = formData.get(`categoryRedirect_${i}`);
        
        let imageUrl = existingBanner.categoryImages[i]?.imageUrl || "";
        if (image && typeof image.name === 'string' && image.size > 0) {
          imageUrl = await processImageUpload(image, imageUrl, `category_${i}`, "designs");
        }
        
        categoryImages.push({
          imageUrl,
          redirectUrl: redirectUrl || existingBanner.categoryImages[i]?.redirectUrl || ""
        });
      }
      updateData.categoryImages = categoryImages;
    } else {
      // Handle topbanner and flashsale
      updateData.redirectUrl = formData.get("redirectUrl");
      
      // Process background image
      const bgImage = formData.get("bgImage");
      updateData.bgImageUrl = await processImageUpload(
        bgImage, 
        existingBanner.bgImageUrl, 
        "bg"
      );

      // Process banner image
      const bannerImage = formData.get("bannerImage");
      updateData.bannerImageUrl = await processImageUpload(
        bannerImage, 
        existingBanner.bannerImageUrl, 
        "banner"
      );
    }

    const updatedBanner = await Banner.findByIdAndUpdate(id, updateData, { new: true });

    return NextResponse.json({
      success: true,
      message: "Banner updated successfully",
      data: updatedBanner
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating banner:", error);
    return NextResponse.json(
      { error: "Failed to update banner", details: error.message },
      { status: 500 }
    );
  }
}