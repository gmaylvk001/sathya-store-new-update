import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Product from "@/models/product";
import Category from "@/models/ecom_category_info";
import Brand from "@/models/ecom_brand_info";

function escapeRegExp(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function scoreProduct(product, q) {
  const query = String(q || "").toLowerCase();
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

async function collectCategoryTree(rootId) {
  let root = null;

  if (mongoose.Types.ObjectId.isValid(rootId)) {
    root = await Category.findById(rootId)
      .select("_id md5_cat_name category_name category_slug parentid")
      .lean();
  }

  if (!root) {
    const CategoryPage =
      mongoose.models.CategoryPage || mongoose.model("CategoryPage");
    const page = await CategoryPage.findById(rootId).lean();
    if (page) {
      if (page.categoryId && mongoose.Types.ObjectId.isValid(page.categoryId)) {
        root = await Category.findById(page.categoryId)
          .select("_id md5_cat_name category_name category_slug parentid")
          .lean();
      }
      if (!root && page.categorySlug) {
        root = await Category.findOne({ category_slug: page.categorySlug })
          .select("_id md5_cat_name category_name category_slug parentid")
          .lean();
      }
    }
  }

  if (!root) {
    root = await Category.findOne({
      $or: [
        { category_slug: String(rootId) },
        { md5_cat_name: String(rootId) },
        { category_name: new RegExp(`^${escapeRegExp(String(rootId))}$`, "i") },
      ],
    })
      .select("_id md5_cat_name category_name category_slug parentid")
      .lean();
  }

  if (!root) return [];

  const tree = [root];
  const queue = [root];
  const seen = new Set([String(root._id)]);

  while (queue.length) {
    const parent = queue.shift();
    const parentIdStr = String(parent._id);
    const parentConditions = [
      { parentid: parentIdStr },
      ...(parent.md5_cat_name ? [{ parentid: parent.md5_cat_name }] : []),
      ...(parent.category_slug ? [{ parentid: parent.category_slug }] : []),
    ];
    if (mongoose.Types.ObjectId.isValid(parentIdStr)) {
      parentConditions.push({ parentid: new mongoose.Types.ObjectId(parentIdStr) });
    }

    const children = await Category.find({ $or: parentConditions })
      .select("_id md5_cat_name category_name category_slug parentid")
      .lean();

    for (const child of children) {
      const id = String(child._id);
      if (seen.has(id)) continue;
      seen.add(id);
      tree.push(child);
      queue.push(child);
    }
  }

  return tree;
}

/**
 * GET /api/category-product-carousel/search?categoryId=&q=
 * Search Active products within the category tree (with flexible fallback).
 */
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const q = (searchParams.get("q") || "").trim();
    const ownerType = searchParams.get("ownerType") || "category";
    const brandIdParam = searchParams.get("brandId");

    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: "categoryId required" },
        { status: 400 }
      );
    }

    if (q.length < 1) {
      return NextResponse.json({ success: true, products: [] });
    }

    const terms = q.split(/\s+/).filter(Boolean);
    const termConditions = terms.map((term) => {
      const rx = new RegExp(escapeRegExp(term), "i");
      return {
        $or: [
          { name: rx },
          { item_code: rx },
          { model_number: rx },
          { search_keywords: rx },
          { sub_category_new_name: rx },
          { brand: rx },
          { slug: rx },
        ],
      };
    });
    const textMatch =
      termConditions.length === 1
        ? termConditions[0]
        : { $and: termConditions };

    if (ownerType === "brand") {
      let brand = null;
      if (mongoose.Types.ObjectId.isValid(categoryId)) {
        brand = await Brand.findById(categoryId)
          .select("brand_name _id")
          .lean();
      }
      if (!brand) {
        brand = await Brand.findOne({
          $or: [
            { brand_slug: categoryId },
            { brand_name: new RegExp(`^${escapeRegExp(categoryId)}$`, "i") },
          ],
        })
          .select("brand_name _id")
          .lean();
      }
      if (!brand) {
        return NextResponse.json({ success: true, products: [] });
      }
      const brandName = String(brand.brand_name || "").trim();
      const brandMatch = {
        $or: [
          { brand: brandName },
          { brand: new RegExp(`^${escapeRegExp(brandName)}$`, "i") },
          { brand: String(brand._id) },
        ],
      };
      let products = await Product.find({
        status: "Active",
        $and: [brandMatch, textMatch],
      })
        .select(
          "name slug images price special_price model_number item_code stock_status quantity brand search_keywords"
        )
        .limit(120)
        .lean();

      // Fallback: If no products found within strict brand match, search broadly with textMatch
      if (products.length === 0) {
        const fallbackQuery = {
          status: "Active",
          $and: [textMatch],
        };
        products = await Product.find(fallbackQuery)
          .select(
            "name slug images price special_price model_number item_code stock_status quantity brand search_keywords"
          )
          .limit(60)
          .lean();
      }

      const ranked = products
        .map((p) => ({ ...p, _score: scoreProduct(p, q) }))
        .sort((a, b) => {
          if (b._score !== a._score) return b._score - a._score;
          return String(a.name || "").localeCompare(String(b.name || ""));
        })
        .slice(0, 50)
        .map(({ _score, ...rest }) => rest);

      return NextResponse.json({ success: true, products: ranked });
    }

    const tree = await collectCategoryTree(categoryId);
    const catIds = tree.map((c) => String(c._id));
    const catObjectIds = catIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    const catNames = tree
      .map((c) => String(c.category_name || "").trim())
      .filter(Boolean);
    const catSlugs = tree
      .map((c) => String(c.category_slug || "").trim())
      .filter(Boolean);
    const md5List = tree
      .map((c) => String(c.md5_cat_name || "").trim())
      .filter(Boolean);

    const nameRegexes = catNames.map(
      (n) => new RegExp(`^${escapeRegExp(n)}$`, "i")
    );
    const slugRegexes = catSlugs.map(
      (s) => new RegExp(`^${escapeRegExp(s)}$`, "i")
    );
    const md5Regex =
      md5List.length > 0
        ? new RegExp(md5List.map(escapeRegExp).join("|"), "i")
        : null;

    const categoryMatch = {
      $or: [
        { category: { $in: [...catIds, ...catObjectIds, ...catNames, ...catSlugs] } },
        { sub_category: { $in: [...catIds, ...catObjectIds, ...catNames, ...catSlugs] } },
        ...(nameRegexes.length ? [{ category: { $in: nameRegexes } }] : []),
        ...(nameRegexes.length ? [{ sub_category: { $in: nameRegexes } }] : []),
        ...(slugRegexes.length ? [{ category: { $in: slugRegexes } }] : []),
        ...(slugRegexes.length ? [{ sub_category: { $in: slugRegexes } }] : []),
        ...(nameRegexes.length ? [{ sub_category_new_name: { $in: nameRegexes } }] : []),
        ...(md5List.length ? [{ category_new: { $in: md5List } }] : []),
        ...(md5Regex ? [{ sub_category_new: md5Regex }] : []),
      ],
    };

    const filters = tree.length > 0 ? [categoryMatch, textMatch] : [textMatch];

    if (ownerType === "category_brand") {
      if (brandIdParam) {
        let brand = null;
        if (mongoose.Types.ObjectId.isValid(brandIdParam)) {
          brand = await Brand.findById(brandIdParam)
            .select("brand_name _id")
            .lean();
        }
        if (!brand) {
          brand = await Brand.findOne({
            $or: [
              { brand_slug: brandIdParam },
              { brand_name: new RegExp(`^${escapeRegExp(brandIdParam)}$`, "i") },
            ],
          })
            .select("brand_name _id")
            .lean();
        }
        if (brand) {
          const brandName = String(brand.brand_name || "").trim();
          filters.push({
            $or: [
              { brand: brandName },
              { brand: new RegExp(`^${escapeRegExp(brandName)}$`, "i") },
              { brand: String(brand._id) },
            ],
          });
        }
      }
    }

    let products = await Product.find({
      status: "Active",
      $and: filters,
    })
      .select(
        "name slug images price special_price model_number item_code stock_status quantity brand search_keywords category sub_category"
      )
      .limit(120)
      .lean();

    // Fallback: If no products found within strict category match, search broadly with textMatch
    if (products.length === 0) {
      const fallbackQuery = {
        status: "Active",
        $and: [textMatch],
      };
      products = await Product.find(fallbackQuery)
        .select(
          "name slug images price special_price model_number item_code stock_status quantity brand search_keywords category sub_category"
        )
        .limit(60)
        .lean();
    }

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
    console.error("category-product-carousel/search:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
