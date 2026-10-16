import dbConnect from "@/lib/db";
import CategoryBanner from "@/models/main_cat_products"; // Your banner model
import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get('categorySlug');
    const bannerType = searchParams.get('bannerType');
    
    console.log('🔍 Fetching main category products with params:', { categorySlug, bannerType });
    
    let query = { banner_status: "Active" };
    
    if (categorySlug && categorySlug !== 'null' && categorySlug !== 'undefined') {
      query.category_slug = categorySlug;
    }
    
    if (bannerType && bannerType !== 'null' && bannerType !== 'undefined') {
      query.banner_type = bannerType;
    }

    console.log('📋 Final Query:', JSON.stringify(query, null, 2));

    // First, let's check the total count
    const totalCount = await CategoryBanner.countDocuments();
    console.log('📊 Total documents in collection:', totalCount);

    const activeCount = await CategoryBanner.countDocuments({ banner_status: "Active" });
    console.log('📊 Active documents:', activeCount);

    // Get all documents to see what's actually in the database
    const allDocuments = await CategoryBanner.find({});
    console.log('📄 All documents in collection:', allDocuments.length);
    allDocuments.forEach(doc => {
      console.log('📝 Document:', {
        _id: doc._id,
        banner_name: doc.banner_name,
        banner_status: doc.banner_status,
        banner_type: doc.banner_type,
        category_slug: doc.category_slug
      });
    });

    // Now try the actual query
    const banners = await CategoryBanner.find(query)
      .sort({ display_order: 1, createdAt: -1 });
    
    console.log('🎯 Found banners with query:', banners.length);
    console.log('✅ Banners data:', JSON.stringify(banners, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      banners,
      debug: {
        totalCount,
        activeCount,
        queryUsed: query,
        allDocumentsCount: allDocuments.length
      }
    });
    
  } catch (err) {
    console.error("❌ Fetch main category products error:", err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  await dbConnect();
  try {
    const formData = await request.formData();
    
    const banner_name = formData.get('banner_name');
    const redirect_url = formData.get('redirect_url');
    const banner_status = formData.get('banner_status') || "Active";
    const display_order = parseInt(formData.get('display_order')) || 0;
    const categoryId = formData.get('categoryId');
    const bannerId = formData.get('bannerId');
    const bannerImage = formData.get('bannerImage');
    const banner_type = formData.get('banner_type') || "top";
    
    // Category fields - may come from form or need to be fetched
    let category_slug = formData.get('category_slug');
    let category_name = formData.get('category_name');

    console.log('💾 Saving banner data:', {
      banner_name,
      banner_type,
      categoryId,
      bannerId,
      category_slug: category_slug || 'NOT PROVIDED',
      category_name: category_name || 'NOT PROVIDED'
    });

    // Validate required fields
    if (!banner_name) {
      return NextResponse.json({ 
        success: false, 
        error: "Banner name is required" 
      });
    }

    let bannerData = {
      banner_name,
      redirect_url: redirect_url || "",
      banner_status,
      display_order,
      banner_type,
      category_slug: category_slug || "",
      category_name: category_name || ""
    };

    // If bannerId exists (editing mode), get existing data first
    if (bannerId) {
      const existingBanner = await CategoryBanner.findById(bannerId);
      if (existingBanner) {
        // Preserve existing category data if not provided
        if (!category_slug) bannerData.category_slug = existingBanner.category_slug;
        if (!category_name) bannerData.category_name = existingBanner.category_name;
        
        // Handle image
        if (!bannerImage || bannerImage.size === 0) {
          bannerData.banner_image = existingBanner.banner_image;
        }
      }
    }

    // For NEW banners without category details but with categoryId
    if (!bannerId && categoryId && (!category_slug || !category_name)) {
      // Fetch category details from your categories collection
      // IMPORTANT: Update 'Category' with your actual category model name
      try {
        const Category = require('@/models/ecom_category_info'); // Adjust path as needed
        
        const category = await Category.findById(categoryId);
        if (category) {
          bannerData.category_slug = category.slug || category.slug_field_name; // Adjust field name
          bannerData.category_name = category.name || category.title; // Adjust field name
          console.log('📋 Fetched category details:', {
            slug: bannerData.category_slug,
            name: bannerData.category_name
          });
        } else {
          return NextResponse.json({ 
            success: false, 
            error: "Category not found. Please provide category slug and name." 
          });
        }
      } catch (categoryErr) {
        console.error("❌ Error fetching category:", categoryErr);
        return NextResponse.json({ 
          success: false, 
          error: "Could not fetch category details. Please provide category slug and name in the form." 
        });
      }
    }

    // Final validation - ensure required fields are present
    if (!bannerData.category_slug || !bannerData.category_name) {
      return NextResponse.json({ 
        success: false, 
        error: "Category slug and name are required. Please provide them in the form." 
      });
    }

    // Handle image upload if new image is provided
    if (bannerImage && bannerImage.size > 0) {
      const imageUrl = await uploadImageToServer(bannerImage, banner_type);
      bannerData.banner_image = imageUrl;
    }

    let result;
    if (bannerId) {
      // Update existing banner
      result = await CategoryBanner.findByIdAndUpdate(
        bannerId,
        bannerData,
        { new: true }
      );
      console.log('✅ Banner updated:', result._id);
    } else {
      // Create new banner
      bannerData.category_id = categoryId;
      result = await CategoryBanner.create(bannerData);
      console.log('✅ Banner created:', result._id);
    }

    return NextResponse.json({ 
      success: true, 
      message: bannerId ? "Banner updated successfully" : "Banner created successfully",
      banner: result 
    });

  } catch (err) {
    console.error("❌ Save banner error:", err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  await dbConnect();
  try {
    const { bannerId } = await request.json();
    
    console.log('🗑️ Deleting banner:', bannerId);
    
    if (!bannerId) {
      return NextResponse.json({ 
        success: false, 
        error: "Banner ID is required" 
      });
    }

    await CategoryBanner.findByIdAndDelete(bannerId);
    
    return NextResponse.json({ 
      success: true, 
      message: "Banner deleted successfully" 
    });
    
  } catch (err) {
    console.error("❌ Delete banner error:", err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}

export async function PUT(request) {
  await dbConnect();
  try {
    // Fix existing documents missing required fields
    const banners = await CategoryBanner.find({
      $or: [
        { category_slug: { $exists: false } },
        { category_slug: "" },
        { category_name: { $exists: false } },
        { category_name: "" }
      ]
    });
    
    console.log(`🛠️ Found ${banners.length} banners to fix`);
    
    for (const banner of banners) {
      // Set default values or fetch from related category
      await CategoryBanner.findByIdAndUpdate(banner._id, {
        $set: {
          category_slug: banner.category_slug || `category-${banner._id}`,
          category_name: banner.category_name || "Uncategorized"
        }
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Fixed ${banners.length} banners`,
      fixedCount: banners.length 
    });
    
  } catch (err) {
    console.error("❌ Fix banners error:", err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}

export async function PATCH(request) {
  await dbConnect();
  try {
    const { action } = await request.json();
    
    if (action === "fix-missing-fields") {
      // Find all documents
      const banners = await CategoryBanner.find({});
      let fixedCount = 0;
      
      for (const banner of banners) {
        const updates = {};
        let needsUpdate = false;
        
        // Check and fix category_slug
        if (!banner.category_slug || banner.category_slug === "") {
          updates.category_slug = `category-${banner._id.toString().slice(-6)}`;
          needsUpdate = true;
        }
        
        // Check and fix category_name
        if (!banner.category_name || banner.category_name === "") {
          updates.category_name = "Uncategorized";
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          await CategoryBanner.findByIdAndUpdate(banner._id, { $set: updates });
          fixedCount++;
          console.log(`Fixed banner ${banner._id}:`, updates);
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `Fixed ${fixedCount} banners with missing required fields` 
      });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: "Invalid action" 
    });
    
  } catch (err) {
    console.error("❌ Fix fields error:", err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}

// Simple image upload simulation
// Create uploads directory if it doesn't exist
function ensureUploadsDirectory(bannerType) {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', `${bannerType}-banners`);
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`📁 Created directory: ${uploadDir}`);
  }
  
  return uploadDir;
}

// Actual file upload function
async function uploadImageToServer(imageFile, bannerType) {
  try {
    console.log('📤 Uploading image:', imageFile.name, 'for', bannerType);
    
    // Ensure upload directory exists
    const uploadDir = ensureUploadsDirectory(bannerType);
    
    // Convert the file to a buffer
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate a unique filename
    const timestamp = Date.now();
    const sanitizedFileName = imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const uniqueFileName = `${timestamp}-${sanitizedFileName}`;
    const filePath = path.join(uploadDir, uniqueFileName);
    
    // Save the file
    fs.writeFileSync(filePath, buffer);
    console.log('✅ Image saved to:', filePath);
    
    // Return the public URL path (relative to public folder)
    return `/uploads/${bannerType}-banners/${uniqueFileName}`;
    
  } catch (error) {
    console.error('❌ Error saving image:', error);
    throw new Error('Failed to upload image');
  }
}