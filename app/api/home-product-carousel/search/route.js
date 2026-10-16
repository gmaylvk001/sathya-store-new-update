import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/product";

function escapeRegExp(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function scoreProduct(product, q) {
  const query = q.toLowerCase();
  const name = String(product.name || "").toLowerCase();
  const itemCode = String(product.item_code || "").toLowerCase();
  const model = String(product.model_number || "").toLowerCase();
  const keywords = String(product.search_keywords || "").toLowerCase();

  if (name === query) return 100;
  if (name.startsWith(query)) return 90;
  if (itemCode === query || model === query) return 85;
  if (name.includes(` ${query}`) || name.includes(`${query} `)) return 75;
  if (name.includes(query)) return 60;
  if (itemCode.includes(query) || model.includes(query)) return 50;
  if (keywords.includes(query)) return 40;
  return 10;
}

/**
 * GET /api/home-product-carousel/search?q=
 * Search ALL Active products by name / item_code / model (no category filter).
 */
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    if (q.length < 1) {
      return NextResponse.json({ success: true, products: [] });
    }

    const rx = new RegExp(escapeRegExp(q), "i");
    const textMatch = {
      $or: [
        { name: rx },
        { item_code: rx },
        { model_number: rx },
        { search_keywords: rx },
        { sub_category_new_name: rx },
      ],
    };

    const products = await Product.find({
      status: "Active",
      ...textMatch,
    })
      .select(
        "name slug images price special_price model_number item_code stock_status quantity brand search_keywords"
      )
      .limit(120)
      .lean();

    const ranked = products
      .map((p) => ({ ...p, _score: scoreProduct(p, q) }))
      .sort((a, b) => {
        if (b._score !== a._score) return b._score - a._score;
        return String(a.name || "").localeCompare(String(b.name || ""));
      })
      .slice(0, 50)
      .map(({ _score, ...rest }) => rest);

    return NextResponse.json({ success: true, products: ranked });
  } catch (err) {
    console.error("home-product-carousel/search:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
