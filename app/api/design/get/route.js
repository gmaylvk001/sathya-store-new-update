import dbConnect from '@/lib/db';
import DesignBanner from '@/models/ecom_banner_info';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    await dbConnect();

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const bannerType = searchParams.get('bannerType');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const createdAfterParam = searchParams.get('createdAfter'); // Changed from startDate
    const createdBeforeParam = searchParams.get('createdBefore'); // Changed from endDate
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;

    // Build base query
    const query = {};
    
    // Basic filters
    if (bannerType) query.bannerType = bannerType;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Creation Date Filtering - NEW IMPLEMENTATION
    if (createdAfterParam || createdBeforeParam) {
      query.createdAt = {};
      
      if (createdAfterParam) {
        const createdAfter = new Date(createdAfterParam);
        createdAfter.setUTCHours(0, 0, 0, 0); // Start of day
        query.createdAt.$gte = createdAfter;
      }
      
      if (createdBeforeParam) {
        const createdBefore = new Date(createdBeforeParam);
        createdBefore.setUTCHours(23, 59, 59, 999); // End of day
        query.createdAt.$lte = createdBefore;
      }
    }

    // Pagination and results
    const skip = (page - 1) * limit;
    const total = await DesignBanner.countDocuments(query);
    
    const banners = await DesignBanner.find(query)
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit)
      .lean();

    // Add image dimensions based on banner type
    const bannersWithDimensions = banners.map(banner => {
      const dimensions = {
        topbanner: {
          bgSize: { width: 1680, height: 499 },
          bannerSize: { width: 291, height: 147 }
        },
        flashsale: {
          bgSize: { width: 828, height: 250 },
          bannerSize: { width: 285, height: 173 }
        },
        categorybanner: {
          bgSize: { width: 400, height: 400 },
          bannerSize: null
        }
      }[banner.bannerType] || { bgSize: { width: 0, height: 0 }, bannerSize: null };

      return {
        ...banner,
        bgImageDimensions: dimensions.bgSize,
        bannerImageDimensions: dimensions.bannerSize,
        // Formatted dates for display
        formattedCreatedAt: banner.createdAt ? new Date(banner.createdAt).toLocaleDateString() : '',
        formattedStartDate: banner.startDate ? new Date(banner.startDate).toLocaleDateString() : '',
        formattedEndDate: banner.endDate ? new Date(banner.endDate).toLocaleDateString() : ''
      };
    });

    return NextResponse.json({
      success: true,
      data: bannersWithDimensions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching banners:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch banners",
        details: error.message 
      },
      { status: 500 }
    );
  }
}