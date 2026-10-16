import dbConnect from "@/lib/db";
import DesignBanner from "@/models/ecom_banner_info"; // Ensure this path is correct
import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import fs from "fs";

export async function POST(req) {
  try {
    console.log("--- Starting POST request for add banner ---");
    await dbConnect();
    console.log("Database connected successfully.");

    const validBannerTypes = ["topbanner", "flashsale", "categorybanner"];
    console.log("Getting formData...");
    const formData = await req.formData();
    console.log("Got formData.");

    // Extract all fields
    const title = formData.get("title");
    const bannerType = formData.get("bannerType");
    const redirectUrl = formData.get("redirectUrl");
    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate");
    const status = formData.get("status");
    const bgImage = formData.get("bgImage");
    console.log("bgImage (from form):", bgImage ? "exists" : "does not exist");
    console.log("bgImage instanceof File:", bgImage instanceof File);
    console.log("bgImage.name:", bgImage?.name);

    const bannerImage = formData.get("bannerImage") ?? null;
    console.log("bannerImage (from form):", bannerImage ? "exists" : "does not exist");
    console.log("bannerImage instanceof File:", bannerImage instanceof File);
    console.log("bannerImage.name:", bannerImage?.name);

    // Validate required fields
    const errors = {};
    
    if (!validBannerTypes.includes(bannerType)) {
      errors.bannerType = "Invalid banner type selected";
    }

    if (!startDate) errors.startDate = "Start date is required";
    if (!endDate) errors.endDate = "End date is required";
    if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
      errors.endDate = "End date must be after the start date";
    }

    console.log("Checking upload directory...");
    const uploadDir = path.join(process.cwd(), "public", "uploads", "designs");
    if (!fs.existsSync(uploadDir)) {
      console.log(`Upload directory '${uploadDir}' does not exist. Creating it...`);
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log("Upload directory created.");
    } else {
      console.log(`Upload directory '${uploadDir}' already exists.`);
    }

    let bgImageUrl = '';
    let bannerImageUrl = '';
    let categoryImages = [];

    if (bannerType === 'categorybanner') {
      console.log("Handling category banner type.");
      for (let i = 1; i <= 4; i++) {
        const image = formData.get(`image${i}`);
        const redirectUrl_cat = formData.get(`redirectUrl${i}`);

        if (!image || !redirectUrl_cat) {
          errors[`image${i}`] = `Image ${i} and redirect URL are required for category banner`;
          console.warn(`Validation Error: Image ${i} or redirect URL missing for category banner.`);
          continue;
        }

        try {
          console.log(`Processing category image ${i}: ${image.name}...`);
          const buffer = Buffer.from(await image.arrayBuffer());
          console.log(`Converted category image ${i} to buffer.`);
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const ext = path.extname(image.name);
          const filename = `category-${i}-${uniqueSuffix}${ext}`;
          const filePath = path.join(uploadDir, filename);
          await writeFile(filePath, buffer);
          console.log(`Successfully wrote category image ${i} to ${filePath}`);

          categoryImages.push({
            imageUrl: `/uploads/designs/${filename}`,
            redirectUrl: redirectUrl_cat
          });
        } catch (fileError) {
          errors[`image${i}`] = `Failed to process image ${i}: ${fileError.message}`;
          console.error(`Error processing category image ${i}:`, fileError);
        }
      }

      if (categoryImages.length !== 4) {
        errors.categoryImages = "Exactly 4 images with redirect URLs are required for category banner";
        console.warn("Validation Error: Not exactly 4 category images processed.");
      }
    } else {
      console.log(`Handling regular banner type: ${bannerType}`);
      if (!bgImage) errors.bgImage = "Background image is required";
      if (!redirectUrl) errors.redirectUrl = "Redirect URL is required";

      if (bgImage) {
        try {
          console.log(`Processing background image: ${bgImage.name}...`);
          const bgBuffer = Buffer.from(await bgImage.arrayBuffer());
          console.log("Converted background image to buffer.");
          const bgUniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const bgExt = path.extname(bgImage.name);
          const bgFilename = `${bannerType}-bg-${bgUniqueSuffix}${bgExt}`;
          const bgFilePath = path.join(uploadDir, bgFilename);
          await writeFile(bgFilePath, bgBuffer);
          console.log(`Successfully wrote background image to ${bgFilePath}`);
          bgImageUrl = `/uploads/designs/${bgFilename}`;
        } catch (fileError) {
          errors.bgImage = `Failed to process background image: ${fileError.message}`;
          console.error("Error processing background image:", fileError);
        }
      }

      if (bannerImage && bannerImage !== "null" && bannerImage instanceof File) {
        try {
          console.log(`Processing banner image: ${bannerImage.name}...`);
          const bannerBuffer = Buffer.from(await bannerImage.arrayBuffer());
          console.log("Converted banner image to buffer.");
          const bannerUniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const bannerExt = path.extname(bannerImage.name);
          const bannerFilename = `${bannerType}-banner-${bannerUniqueSuffix}${bannerExt}`;
          const bannerFilePath = path.join(uploadDir, bannerFilename);
          await writeFile(bannerFilePath, bannerBuffer);
          console.log(`Successfully wrote banner image to ${bannerFilePath}`);
          bannerImageUrl = `/uploads/designs/${bannerFilename}`;
        } catch (fileError) {
          errors.bannerImage = `Failed to process banner image: ${fileError.message}`;
          console.error("Error processing banner image:", fileError);
        }
      } else {
        console.log("No optional bannerImage provided or it was 'null' string.");
      }
    }

    if (Object.keys(errors).length > 0) {
      console.error("Validation errors found:", errors);
      return NextResponse.json({ errors }, { status: 400 });
    }

    console.log("All validations passed. Preparing to save banner to DB.");
    // Create new banner
    const newBanner = new DesignBanner({
      title,
      bannerType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status,
      createdAt: new Date(),
      ...(bannerType === 'categorybanner' ? 
        { categoryImages } : 
        { bgImageUrl, bannerImageUrl, redirectUrl })
    });

    console.log("New banner object created:", JSON.stringify(newBanner.toObject(), null, 2));
    console.log("Attempting to save new banner to DB (with a 10-second timeout)...");

    // Add a timeout for the save operation
    const savePromise = newBanner.save();
    const timeoutPromise = new Promise((resolve, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id);
        reject(new Error('Database save operation timed out after 10 seconds.'));
      }, 10000); // 10 seconds timeout
    });

    await Promise.race([savePromise, timeoutPromise]);
    console.log("New banner saved successfully to DB!");

    return NextResponse.json(
      { message: "Banner created successfully", banner: newBanner }, 
      { status: 201 }
    );

  } catch (error) {
    console.error("--- Error adding banner (caught in try-catch) ---");
    console.error("Full error object:", error);
    if (error.name === 'ValidationError') {
      console.error("Mongoose Validation Error details:", error.errors);
    }
    return NextResponse.json(
      { 
        error: "Failed to add banner", 
        details: error.message,
        // Detailed Mongoose validation errors
        ...(error.errors && { errors: Object.fromEntries(
          Object.entries(error.errors).map(([key, val]) => [key, val.message])
        ) }) 
      },
      { status: 500 }
    );
  } finally {
    console.log("--- Finished POST request for add banner ---");
  }
}
