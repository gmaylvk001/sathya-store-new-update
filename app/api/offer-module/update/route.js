import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OfferModule from "@/models/OfferModule";
import { generateSlug } from "@/lib/offersHelper";

export async function PUT(req) {
  try {
    await dbConnect();
    const data = await req.json();
    const { id } = data;
    const offerName = data.offerName?.trim();
    const requestedSlug = data.slug?.trim();
    const description = data.description !== undefined ? String(data.description).trim() : undefined;
    const banner = data.banner !== undefined ? String(data.banner).trim() : undefined;
    const isActive = data.isActive !== undefined ? Boolean(data.isActive) : undefined;
    const products = Array.isArray(data.products) ? data.products : undefined;

    if (!id || !offerName) {
      return NextResponse.json({ success: false, error: "ID and offer name are required" }, { status: 400 });
    }

    const baseSlug = requestedSlug ? generateSlug(requestedSlug) : generateSlug(offerName);
    if (!baseSlug) {
      return NextResponse.json({ success: false, error: "Invalid offer name or slug" }, { status: 400 });
    }

    // Verify slug uniqueness against other offers
    const existing = await OfferModule.findOne({ slug: baseSlug, _id: { $ne: id } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Slug "${baseSlug}" is already in use by another offer.` },
        { status: 400 }
      );
    }

    const updateFields = {
      offerName,
      slug: baseSlug,
    };

    if (description !== undefined) updateFields.description = description;
    if (banner !== undefined) updateFields.banner = banner;
    if (isActive !== undefined) updateFields.isActive = isActive;
    if (products !== undefined) updateFields.products = products;

    const updatedOffer = await OfferModule.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedOffer) {
      return NextResponse.json({ success: false, error: "Offer not found" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: "Offer updated successfully", data: updatedOffer },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in PUT /api/offer-module/update:", error);
    return NextResponse.json(
      { success: false, error: "Error updating offer", message: error?.message },
      { status: 500 }
    );
  }
}
