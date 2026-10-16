import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Store from "@/models/store";
import { attachFeaturedProductsToStores } from "@/lib/storesWithFeaturedProducts";

export async function GET(req) {
  await connectDB();

  try {
    const storeType = req.nextUrl?.searchParams?.get("storeType")?.trim().toLowerCase();
    let stores = await Store.find({}).lean();
    stores = await attachFeaturedProductsToStores(stores);

    if (storeType === "multi-brand" || storeType === "multi brand store") {
      stores = stores.filter((s) => s.multibrandstore === true);
    } else if (storeType === "executive" || storeType === "executive store") {
      stores = stores.filter((s) => s.multibrandstore !== true);
    }

    return NextResponse.json({ success: true, data: stores }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch stores:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch stores" },
      { status: 500 }
    );
  }
}
