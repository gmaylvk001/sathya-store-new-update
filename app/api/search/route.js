// app/api/search/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/product";
import Category from "@/models/ecom_category_info";
import ProductFilter from "@/models/ecom_productfilter_info";
import Filter from "@/models/ecom_filter_infos";
import FilterGroup from "@/models/ecom_filter_group_infos";
import mongoose from "mongoose";
import { buildSearchOrConditions, scoreProductMatch, getBrandSearchConstraints } from "@/lib/searchMatch";
import { getActiveBrandsForSearch } from "@/lib/brandSearch";
import { humanLabel, looksLikeMongoId } from "@/lib/humanLabel";

export const runtime = "nodejs";

function escapeRegExp(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getCategoryTree(parentId, productCategoryIds = null) {
  const categories = await Category.find({ parentid: parentId })
    .sort({ position: 1, category_name: 1 })
    .lean();
  let filteredCategories = [];
  for (const category of categories) {
    if (productCategoryIds) {
      if (productCategoryIds.includes(category._id.toString())) {
        category.subCategories = await getCategoryTree(
          category._id,
          productCategoryIds,
        );
        filteredCategories.push(category);
      } else {
        const children = await getCategoryTree(
          category._id,
          productCategoryIds,
        );
        if (children.length > 0) {
          category.subCategories = children;
          filteredCategories.push(category);
        }
      }
    } else {
      category.subCategories = await getCategoryTree(category._id);
      filteredCategories.push(category);
    }
  }
  return filteredCategories;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const query = (searchParams.get("query") || "").trim();
  const category = (searchParams.get("category") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.max(1, Number(searchParams.get("limit")) || 12);

  const brands = (searchParams.get("brands") || "")
    .split(",")
    .filter((v) => mongoose.Types.ObjectId.isValid(v));

  const filters = (searchParams.get("filters") || "")
    .split(",")
    .filter((v) => mongoose.Types.ObjectId.isValid(v));

  const minPrice = Number(searchParams.get("minPrice") || 0);
  const maxPrice = Number(searchParams.get("maxPrice") || 1000000);
  const hasPriceFilter =
    searchParams.has("minPrice") || searchParams.has("maxPrice");

  const skip = (page - 1) * limit;

  try {
    await dbConnect();
    const allBrands = await getActiveBrandsForSearch();

    let searchFilter = {
      status: "Active",
    };

    /* ---------------- TEXT SEARCH ---------------- */
    if (query) {
      const brandConstraints = getBrandSearchConstraints(query, allBrands);

      if (brandConstraints?.mode === "brand_product") {
        searchFilter.$and = [
          ...(searchFilter.$and || []),
          { brand: brandConstraints.brandId },
          {
            $or: buildSearchOrConditions(brandConstraints.productQuery, []),
          },
        ];
      } else if (brandConstraints?.mode === "exact") {
        searchFilter.$and = [
          ...(searchFilter.$and || []),
          { brand: brandConstraints.brandId },
        ];
      } else {
        searchFilter.$and = [
          ...(searchFilter.$and || []),
          {
            $or: buildSearchOrConditions(query, allBrands),
          },
        ];
      }
    }

    /* ---------------- CATEGORY MAPPING ---------------- */
    if (category && category !== "All Categories" && category !== "All Category") {
      const categoryDoc = await Category.findOne({
        category_name: category,
        status: "Active",
      }).select("_id md5_cat_name");

      if (!categoryDoc) {
        return NextResponse.json({
          products: [],
          pagination: { total: 0, currentPage: page, totalPages: 0 },
          brandSummary: [],
          filterSummary: [],
          filterDefs: [],
        });
      }

      searchFilter.sub_category_new = {
        $regex: categoryDoc.md5_cat_name,
        $options: "i",
      };
    }

    /* ---------------- BRAND FILTER ---------------- */
    if (brands.length > 0) {
      searchFilter.brand = { $in: brands };
    }

    /* --- CATEGORY IDS FILTER --- */

    const categoryIds = (searchParams.get("categoryIds") || "")
      .split(",")
      .filter((v) => mongoose.Types.ObjectId.isValid(v));
    const subcategoryIds = (searchParams.get("subcategoryIds") || "")
      .split(",")
      .filter((v) => mongoose.Types.ObjectId.isValid(v));

const getAllChildIds = async (parentId) => {
  const children = await Category.find({ parentid: parentId }).lean();
  let ids = [new mongoose.Types.ObjectId(parentId.toString())];
  for (const child of children) {
    const childIds = await getAllChildIds(child._id);
    ids = ids.concat(childIds);
  }
  return ids;
};

if (subcategoryIds.length > 0) {
  const subCatDocs = await Category.find({
    _id: { $in: subcategoryIds.map(id => new mongoose.Types.ObjectId(id)) }
  }).lean();

  let allIds = [];
  for (const doc of subCatDocs) {
    const ids = await getAllChildIds(doc._id);
    allIds = allIds.concat(ids);
  }

  const uniqueIds = [...new Map(allIds.map(id => [id.toString(), id])).values()];

  if (uniqueIds.length > 0) {
    searchFilter.$or = [
      { category: { $in: uniqueIds } },
      { sub_category: { $in: uniqueIds } },
    ];
  }

} else if (categoryIds.length > 0) {
  const parentDocs = await Category.find({
    _id: { $in: categoryIds.map(id => new mongoose.Types.ObjectId(id)) }
  }).lean();

  let allIds = [];
  for (const doc of parentDocs) {
    const ids = await getAllChildIds(doc._id);
    allIds = allIds.concat(ids);
  }

  const uniqueIds = [...new Map(allIds.map(id => [id.toString(), id])).values()];

  if (uniqueIds.length > 0) {
    searchFilter.$or = [
      { category: { $in: uniqueIds } },
      { sub_category: { $in: uniqueIds } },
    ];
  }
}
    /* ---------------- PRICE FILTER ---------------- */
    if (hasPriceFilter) {
searchFilter.$and = [
  ...(searchFilter.$and || []),
  {
    $or: [
      {
        $and: [
          { special_price: { $exists: true } },
          { special_price: { $ne: null } },
          { special_price: { $ne: 0 } },
          { special_price: { $gte: minPrice, $lte: maxPrice } },
        ],
      },
      {
        $and: [
          { $or: [{ special_price: { $exists: false } }, { special_price: null }, { special_price: 0 }] },
          { price: { $gte: minPrice, $lte: maxPrice } },
        ],
      },
    ],
  },
];
    }

    /* ---------------- BASE PRODUCT QUERY ---------------- */
    let productsQuery = Product.find(searchFilter);

    /* ---------------- PRODUCT FILTER ---------------- */
    if (filters.length > 0) {
      const baseProductIds = await productsQuery.distinct("_id");

      if (baseProductIds.length > 0) {
        const productFilters = await ProductFilter.find({
          product_id: { $in: baseProductIds },
          filter_id: { $in: filters },
        });

        const filtersByProduct = productFilters.reduce((acc, pf) => {
          const productId = pf.product_id.toString();
          if (!acc[productId]) acc[productId] = new Set();
          acc[productId].add(pf.filter_id.toString());
          return acc;
        }, {});

        const filteredProductIds = baseProductIds.filter((id) => {
          const productId = id.toString();
          const productFilterIds = filtersByProduct[productId] || new Set();
          return filters.some((fid) => productFilterIds.has(fid));
        });

        searchFilter._id = { $in: filteredProductIds };
        productsQuery = Product.find(searchFilter);
      }
    }

    /* ---------------- PAGINATION ---------------- */
    let total;
    let products;

    if (query) {
      const candidateLimit = query.length <= 3 ? 500 : 250;
      const candidates = await productsQuery
        .sort({ stock_status: 1, createdAt: -1, _id: -1 })
        .limit(candidateLimit)
        .lean();

      const ranked = candidates
        .map((product) => ({
          product,
          score: scoreProductMatch(product, query, { brands: allBrands }),
        }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => {
          const inStockA =
            a.product.stock_status === "In Stock" &&
            Number(a.product.quantity || 0) > 0
              ? 1
              : 0;
          const inStockB =
            b.product.stock_status === "In Stock" &&
            Number(b.product.quantity || 0) > 0
              ? 1
              : 0;
          if (inStockB !== inStockA) return inStockB - inStockA;

          if (b.score !== a.score) return b.score - a.score;
          const timeA = new Date(a.product.createdAt || 0).getTime();
          const timeB = new Date(b.product.createdAt || 0).getTime();
          return timeB - timeA;
        });

      total = ranked.length;
      products = ranked.slice(skip, skip + limit).map(({ product }) => product);
    } else {
      total = await Product.countDocuments(searchFilter);
      products = await productsQuery
        .sort({ stock_status: 1, createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    }

    /* ---------------- GLOBAL BRAND COUNT ---------------- */
    const brandAggMatch = { ...searchFilter };
    delete brandAggMatch.brand;
    delete brandAggMatch._id;

    const brandAgg = await Product.aggregate([
      { $match: brandAggMatch },
      { $group: { _id: "$brand", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const brandById = new Map(
      (allBrands || []).map((b) => [String(b._id), b])
    );
    const brandByName = new Map(
      (allBrands || [])
        .filter((b) => humanLabel(b.brand_name))
        .map((b) => [String(b.brand_name).trim().toLowerCase(), b])
    );

    const brandSummary = [];
    const seenBrandIds = new Set();
    for (const row of brandAgg) {
      if (row?._id == null || row._id === "") continue;
      const raw = String(row._id).trim();
      let brand = brandById.get(raw) || brandByName.get(raw.toLowerCase());
      if (!brand && looksLikeMongoId(raw)) continue;
      const id = brand ? String(brand._id) : raw;
      const name = humanLabel(brand?.brand_name, looksLikeMongoId(raw) ? "" : raw);
      if (!name || seenBrandIds.has(id)) continue;
      seenBrandIds.add(id);
      brandSummary.push({
        _id: id,
        brandId: id,
        brand_name: name,
        brand_slug: brand?.brand_slug || "",
        count: row.count,
      });
    }

    /* ---------------- GLOBAL PRODUCT FILTER COUNT ---------------- */
    const filterAggMatch = { ...searchFilter };
    delete filterAggMatch._id;

    const filterAgg = await ProductFilter.aggregate([
      {
        $match: {
          product_id: { $in: await Product.distinct("_id", filterAggMatch) },
        },
      },
      { $group: { _id: "$filter_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const filterSummary = filterAgg.map((f) => ({
      filterId: f._id,
      count: f.count,
    }));

    /* ---------------- FILTER DEFINITIONS ---------------- */
    const allProductIds = await Product.distinct("_id", filterAggMatch);

    const productFilterDocs = await ProductFilter.find({
      product_id: { $in: allProductIds },
    }).lean();

    const filterDefIds = [
      ...new Set(
        productFilterDocs.map((pf) => pf.filter_id?.toString()).filter(Boolean),
      ),
    ];

    const filterDefs = await Filter.find({
      _id: { $in: filterDefIds },
    })
      .populate({
        path: "filter_group",
        select: "filtergroup_name",
        model: FilterGroup,
      })
      .lean();

    const formattedFilterDefs = filterDefs.map((f) => ({
      ...f,
      filter_group_name: f.filter_group?.filtergroup_name || "Other",
    }));

   

/* ---------------- CATEGORY TREE ---------------- */
const categoryOnlyFilter = { status: "Active" };
if (query) {
  const brandConstraints = getBrandSearchConstraints(query, allBrands);
  if (brandConstraints?.mode === "brand_product") {
    categoryOnlyFilter.brand = brandConstraints.brandId;
    categoryOnlyFilter.$or = buildSearchOrConditions(
      brandConstraints.productQuery,
      []
    );
  } else if (brandConstraints?.mode === "exact") {
    categoryOnlyFilter.brand = brandConstraints.brandId;
  } else {
    categoryOnlyFilter.$or = buildSearchOrConditions(query, allBrands);
  }
}

// Search results products-ல இருக்க category/sub_category IDs 
const productsForCat = await Product.find(
  categoryOnlyFilter,
  { category: 1, sub_category: 1 }
).lean();

const productCategoryIds = new Set();
productsForCat.forEach(p => {
  if (p.category) productCategoryIds.add(p.category.toString());
  if (p.sub_category) productCategoryIds.add(p.sub_category.toString());
});

let categoryTree = [];

if (productCategoryIds.size > 0) {
  const allCategories = await Category.find().lean();
  const byId = new Map(allCategories.map((c) => [String(c._id), c]));
  const childrenByParent = new Map();
  for (const cat of allCategories) {
    const parentKey =
      cat.parentid && cat.parentid !== "none" ? String(cat.parentid) : "none";
    if (!childrenByParent.has(parentKey)) childrenByParent.set(parentKey, []);
    childrenByParent.get(parentKey).push(cat);
  }

  const matchedIds = new Set(
    [...productCategoryIds].filter((id) => byId.has(String(id)))
  );
  const includeIds = new Set(matchedIds);
  for (const id of [...matchedIds]) {
    let current = byId.get(id);
    let guard = 0;
    while (current && guard++ < 12) {
      const parentKey =
        current.parentid && current.parentid !== "none"
          ? String(current.parentid)
          : "";
      if (!parentKey || !byId.has(parentKey)) break;
      includeIds.add(parentKey);
      current = byId.get(parentKey);
    }
  }

  const toNode = (cat) => {
    const name = humanLabel(cat.category_name, cat.name);
    if (!name) return null;
    const kids = (childrenByParent.get(String(cat._id)) || [])
      .filter((child) => includeIds.has(String(child._id)))
      .map(toNode)
      .filter(Boolean);
    return {
      _id: String(cat._id),
      category_name: name,
      category_slug: cat.category_slug || "",
      subCategories: kids,
    };
  };

  categoryTree = (childrenByParent.get("none") || [])
    .filter((cat) => includeIds.has(String(cat._id)))
    .map(toNode)
    .filter(Boolean);

  for (const id of includeIds) {
    const cat = byId.get(id);
    if (!cat) continue;
    const parentKey =
      cat.parentid && cat.parentid !== "none" ? String(cat.parentid) : "none";
    if (parentKey !== "none" && byId.has(parentKey)) continue;
    if (categoryTree.some((node) => node._id === id)) continue;
    const node = toNode(cat);
    if (node) categoryTree.push(node);
  }
}
    /* ---------------- RETURN ---------------- */
    return NextResponse.json({
      products,
      pagination: {
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      brandSummary,
      filterSummary,
      filterDefs: formattedFilterDefs,
      categories: categoryTree,
    });
  } catch (error) {
    console.error("❌ Search API Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
