import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Lead from "@/models/leads";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  try {
    await dbConnect();
    const leads = await Lead.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: leads }, {
      status: 200,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
