import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Category from "@/models/ecom_category_info";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  try {
    await dbConnect();
    const categories = await Category.find({ status: "Active" })
      .select("_id category_name category_slug")
      .sort({ category_name: 1 });
    
    return NextResponse.json({ success: true, categories }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}