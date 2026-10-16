import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OfferTimer from "@/models/Offertimer";

export async function POST(req) {
  try {
    await dbConnect();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    const deleted = await OfferTimer.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Offer timer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Offer timer deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting offer timer:", error);
    return NextResponse.json({ success: false, error: "Error deleting offer timer" }, { status: 500 });
  }
}
