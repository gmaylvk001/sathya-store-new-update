import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/models/leads';

export async function POST(req) {
  try {
    await dbConnect();

    const data = await req.json();
    const { name, email, mobile, store_id, product_name } = data;

    // Basic validation
    if (!name || !email || !mobile) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const ip_address = req.headers.get('x-forwarded-for') || req.headers.get('remote-addr') || '';

    // Lookup store name
    let storeName = 'Online';
    if (store_id && store_id !== 'Online') {
      try {
        const StoreListing = (await import('@/models/store_listings')).default;
        const storeDoc = await StoreListing.findById(store_id).lean();
        if (storeDoc) {
          storeName = storeDoc.title || storeDoc.branch_name || storeDoc.name || store_id;
        } else {
          storeName = store_id;
        }
      } catch (err) {
        console.error("Store lookup error:", err);
        storeName = store_id;
      }
    }

    // Create lead
    await Lead.create({
      name,
      email,
      mobile,
      lead_title: 'Pre-Book Enquiry',
      lead_type: 'Pre-Book',
      product_looking_for: product_name,
      store_id: store_id || '',
      store: storeName,
      ip_address
    });

    return NextResponse.json({ success: true, message: "Thank you! Your pre-booking enquiry has been submitted." }, { status: 200 });

  } catch (error) {
    console.error("Pre-Book Lead Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
