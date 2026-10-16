import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import StoreListing from "@/models/store_listings";
import { isUniletView, ownerFieldFilter } from "@/lib/storeView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Only the admin Store Listings page sends scope=admin; checkout and order pages need every store.
export async function GET(req) {
  try {
    await dbConnect();
    const adminScope = new URL(req.url).searchParams.get("scope") === "admin";
    const filter = adminScope ? ownerFieldFilter("store_owner", await isUniletView(req)) : {};
    const rows = await StoreListing.find(filter).sort({ created_at: -1, exist_id: -1 }).lean();
    return NextResponse.json(rows, {
      status: 200,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
    });
  } catch (error) {
    console.error("Error fetching store listings:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
