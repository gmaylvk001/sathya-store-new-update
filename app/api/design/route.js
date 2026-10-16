import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Banner from "@/models/ecom_banner_info"; // Adjust to your model name
import { writeFile, unlink } from "fs/promises";
import path from "path";

export async function PUT(req) {
  try {
    await dbConnect();
    const formData = await req.formData();

    const id = formData.get("id");
    const title = formData.get("title");
    const bannerType = formData.get("bannerType");
    const redirectUrl = formData.get("redirectUrl");
    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate");
    const status = formData.get("status");
    const bgImage = formData.get("bgImage");
    const bannerImage = formData.get("bannerImage");
    const existingBgImage = formData.get("existingBgImage");
    const existingBannerImage = formData.get("existingBannerImage");

    // Find the existing banner
    const existingBanner = await Banner.findById(id);
    if (!existingBanner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    // Handle image uploads
    let bgImageUrl = existingBgImage;
    let bannerImageUrl = existingBannerImage;

    if (bgImage) {
      // Delete old image if it exists
      if (existingBgImage) {
        try {
          const oldImagePath = path.join(process.cwd(), "public", existingBgImage.replace("http://localhost:3000", ""));
          await unlink(oldImagePath);
        } catch (err) {
          console.error("Error deleting old background image:", err);
        }
      }

      // Save new image
      const buffer = Buffer.from(await bgImage.arrayBuffer());
      const fileName = `banner_bg_${Date.now()}${path.extname(bgImage.name)}`;
      const filePath = path.join(process.cwd(), "public/uploads/designs", fileName);
      console.log('file path fetched');
      
      await writeFile(filePath, buffer);
      bgImageUrl = `http://localhost:3000/uploads/designs/${fileName}`;
    }

    if (bannerImage) {
      // Delete old image if it exists
      if (existingBannerImage) {
        try {
          const oldImagePath = path.join(process.cwd(), "public", existingBannerImage.replace("http://localhost:3000", ""));
          await unlink(oldImagePath);
        } catch (err) {
          console.error("Error deleting old banner image:", err);
        }
      }

      // Save new image
      const buffer = Buffer.from(await bannerImage.arrayBuffer());
      const fileName = `banner_${Date.now()}${path.extname(bannerImage.name)}`;
      const filePath = path.join(process.cwd(), "public/uploads/designs", fileName);
      
      await writeFile(filePath, buffer);
      bannerImageUrl = `http://localhost:3000/uploads/designs/${fileName}`;
    }

    // Update the banner
    const updatedBanner = await Banner.findByIdAndUpdate(
      id,
      {
        title,
        bannerType,
        redirectUrl,
        startDate,
        endDate,
        status,
        bgImage: bgImageUrl,
        bannerImage: bannerImageUrl,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedBanner) {
      return NextResponse.json({ error: "Failed to update banner" }, { status: 400 });
    }

    return NextResponse.json(
      { 
        success: true,
        message: "Banner updated successfully",
        data: updatedBanner 
      }, 
      { status: 200 }
    );

  } catch (error) {
    console.error("Error updating banner:", error);
    return NextResponse.json(
      { error: "Failed to update banner", details: error.message }, 
      { status: 500 }
    );
  }
}