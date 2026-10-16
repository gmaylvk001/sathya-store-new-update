import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/models/leads';
import StoreListing from '@/models/store_listings';

export async function POST(req) {
  try {
    await dbConnect();

    const data = await req.json();
    const {
      name, email, mobile, lead_type, product, invoice,
      store: storeId, message, timings,
      lead_title, referrel_url, utm_source, utm_campaign,
      cookie_id
    } = data;

    // 1. Server validation
    if (!name || !name.match(/^[a-zA-Z0-9\s.,/]*$/)) {
      return NextResponse.json({ success: false, message: "Invalid name format" }, { status: 400 });
    }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, message: "Invalid email" }, { status: 400 });
    }
    if (!mobile || !mobile.match(/^[0-9]{10}$/)) {
      return NextResponse.json({ success: false, message: "Invalid mobile number" }, { status: 400 });
    }
    if (!storeId) {
      return NextResponse.json({ success: false, message: "Store is required" }, { status: 400 });
    }

    // 2. Look up store name
    let storeName = "";
    if (storeId) {
      const storeDoc = await StoreListing.findById(storeId).lean();
      if (storeDoc) {
        storeName = storeDoc.title || storeDoc.name || storeDoc.store_name || storeId;
      }
    }

    const ip_address = req.headers.get('x-forwarded-for') || req.headers.get('remote-addr') || '';
    
    let crmId = null;

    // 3. Send to CRM
    try {
      const crmPayload = new URLSearchParams({
        api_token: process.env.ADTARBO_CRM_TOKEN || '',
        last_name: name || '',
        email: email || '',
        title: lead_title || 'Connect to Store',
        mobile: mobile || '',
        store: storeName || '',
        referral_url: referrel_url || '',
        comments: message || '',
        lead_source: utm_source || '',
        lead_campaign: utm_campaign || '',
        cookie_id: cookie_id || '',
        ip_address: ip_address || '',
        product: lead_type === 'Enquiry' ? (product || '') : '',
        product_url: data.product_url || '',
        lead_type: lead_type || 'Enquiry',
        invoice_id: lead_type === 'Complaint' ? (invoice || '') : '',
        preferred_call_time: timings || ''
      });

      const crmResponse = await fetch(process.env.ADTARBO_CRM_URL || 'https://adtarbo.eywamedia.com/api/lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: crmPayload.toString()
      });
      
      const crmResult = await crmResponse.json();
      
      if (crmResult && crmResult.status === 'Success') {
        crmId = crmResult.data;
      }
    } catch (crmErr) {
      console.error("CRM Sync Error:", crmErr.message);
      // We will continue and save locally anyway (Problem 1 Fix)
    }

    // 4. Save locally (Even if CRM fails)
    await Lead.create({
      name,
      email,
      mobile,
      message,
      preferred_time: timings,
      lead_title: lead_title || 'Connect to Store',
      lead_type,
      product_looking_for: lead_type === 'Enquiry' ? product : '',
      invoice_id: lead_type === 'Complaint' ? invoice : '',
      store: storeName,
      store_id: storeId,
      referrel_url,
      lead_source: utm_source,
      lead_campaign: utm_campaign,
      cookie_id,
      ip_address,
      adtarbo_crm_id: crmId
    });

    return NextResponse.json({ success: true, message: "Thank you!. Your message has been sent. We will Contact you shortly." }, { status: 200 });

  } catch (error) {
    console.error("Connect Store Lead Error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
