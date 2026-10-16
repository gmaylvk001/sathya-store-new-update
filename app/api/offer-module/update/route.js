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

export async function PUT(req) {
  try {
    await dbConnect();
    const data = await req.json();
    const { id } = data;
    const offerName = data.offerName?.trim();

    if (!id || !offerName) {
      return NextResponse.json({ success: false, error: "ID and offer name are required" }, { status: 400 });
    }

    const baseSlug = createSlug(offerName);
    if (!baseSlug) {
      return NextResponse.json({ success: false, error: "Invalid offer name" }, { status: 400 });
    }

    const slug = await uniqueSlug(baseSlug, id);

    const updatedOffer = await OfferModule.findByIdAndUpdate(
      id,
      { offerName, slug },
      { new: true }
    );

    if (!updatedOffer) {
      return NextResponse.json({ success: false, error: "Offer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Offer updated successfully", data: updatedOffer }, { status: 200 });
  } catch (error) {
    console.error("Error in PUT /api/offer-module/update:", error);
    return NextResponse.json({ success: false, error: "Error updating offer", message: error?.message }, { status: 500 });
  }
}
