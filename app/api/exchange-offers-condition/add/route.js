import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ExchangeOfferCondition from "@/models/ExchangeOfferCondition";

export async function POST(req) {
  try {
    await dbConnect();
    const data = await req.json();

    // Find the max ID to auto-increment
    const maxRecord = await ExchangeOfferCondition.findOne().sort({ id: -1 });
    const nextId = maxRecord && maxRecord.id ? maxRecord.id + 1 : 1;

    const newOffer = new ExchangeOfferCondition({
      ...data,
      id: nextId,
    });

    await newOffer.save();

    return NextResponse.json({ success: true, message: "Exchange Offer added successfully" });
  } catch (error) {
    console.error("Error adding Exchange Offer Condition:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
