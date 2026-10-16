import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ExchangeOfferCondition from "@/models/ExchangeOfferCondition";

export async function PUT(req) {
  try {
    await dbConnect();
    const data = await req.json();
    const { _id, ...updateData } = data;

    if (!_id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    const updatedOffer = await ExchangeOfferCondition.findByIdAndUpdate(_id, updateData, { new: true });

    if (!updatedOffer) {
      return NextResponse.json({ success: false, error: "Offer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Exchange Offer updated successfully" });
  } catch (error) {
    console.error("Error updating Exchange Offer Condition:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
