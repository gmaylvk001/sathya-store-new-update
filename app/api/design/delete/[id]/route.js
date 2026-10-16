
import { NextResponse } from 'next/server';
import connectDB from '@/lib/db'; // Adjust path based on your project
import DesignBanner from "@/models/ecom_banner_info";// Adjust to your model path

export async function PUT(req, { params }) {
  const { id } = params; // ✅ No need to await anything



  try {
    await connectDB();

    const banner = await DesignBanner.findById(id);
    if (!banner) {
      return NextResponse.json({ message: 'Banner not found' }, { status: 404 });
    }

    banner.status = 'inactive';
    await banner.save();

    return NextResponse.json({ message: 'Banner inactivated successfully' }, { status: 200 });
  } catch (error) {
    console.error('🔥 API ERROR:', error); // Add this
    return NextResponse.json(
      { message: 'Failed to inactivate banner', error: error.message },
      { status: 500 }
    );
  }
}

