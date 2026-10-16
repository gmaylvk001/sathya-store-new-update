import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OfferModule from "@/models/OfferModule";

function createSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(baseSlug, excludeId = null) {
  let slug = baseSlug;
  let n = 2;
  while (true) {
    const query = excludeId ? { slug, _id: { $ne: excludeId } } : { slug };
    const existing = await OfferModule.findOne(query);
    if (!existing) return slug;
    slug = `${baseSlug}-${n++}`;
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const data = await req.json();
    const offerName = data.offerName?.trim();

    if (!offerName) {
      return NextResponse.json({ success: false, error: "Offer name is required" }, { status: 400 });
    }

    const baseSlug = createSlug(offerName);
    if (!baseSlug) {
      return NextResponse.json({ success: false, error: "Invalid offer name" }, { status: 400 });
    }

    const slug = await uniqueSlug(baseSlug);

    const newOffer = new OfferModule({
      offerName,
      slug,
    });

    await newOffer.save();
    return NextResponse.json({ success: true, message: "Offer added successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/offer-module/add:", error);
    return NextResponse.json({ success: false, error: "Error adding offer", message: error?.message }, { status: 500 });
  }
}
