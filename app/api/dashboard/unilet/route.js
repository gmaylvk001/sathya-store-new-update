import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import { requireAdmin } from "@/lib/adminRequest";
import OrderNew from "@/models/orders_new";
import OwnerProduct from "@/models/OwnerProduct";
import Product from "@/models/product";
import Category from "@/models/ecom_category_info";
import StoreListing from "@/models/store_listings";

export const dynamic = "force-dynamic";

const STATUS_COLORS = {
  pending: "#fbbf24",
  cancelled: "#ef4444",
  canceled: "#ef4444",
  shipped: "#22c55e",
  ordered: "#d72828",
  "order placed": "#d72828",
  "order accepted": "#d72828",
  complete: "#16a34a",
  billed: "#0ea5e9",
  failure: "#9ca3af",
  "payment initiated": "#a78bfa",
};

const EXTRA_COLORS = ["#6366f1", "#f59e0b", "#14b8a6", "#64748b", "#ec4899"];

function money(value) {
  const number = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function orderDate(order) {
  const value = order.created_at || order.createdAt;
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function dayKey(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function labelStatus(status) {
  const text = String(status || "unknown").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export async function GET(req) {
  const auth = await requireAdmin(req);
  if (!auth.authorized) return auth.response;

  try {
    await dbConnect();

    const uniletStores = await StoreListing.find({
      store_owner: { $regex: /^unilet$/i },
    })
      .select("_id branch_code")
      .lean();

    const storeKeys = [
      ...new Set(
        uniletStores
          .flatMap((store) => [String(store._id), String(store.branch_code || "").trim()])
          .filter((value) => value && value.toLowerCase() !== "null")
      ),
    ];

    const orderMatch = [{ order_owner: { $regex: /^unilet$/i } }];
    if (storeKeys.length) {
      orderMatch.push({ store_id: { $in: storeKeys } });
      orderMatch.push({ pickup_store: { $in: storeKeys } });
    }

    const [orders, ownerRows, mainCategories] = await Promise.all([
      OrderNew.find({ $or: orderMatch })
        .select("order_number order_username order_amount order_status created_at user_id")
        .sort({ created_at: -1 })
        .lean(),
      OwnerProduct.find({
        owner_id: { $regex: /^unilet$/i },
        is_active: true,
      })
        .select("product_id")
        .lean(),
      Category.find({ status: "Active", parentid: "none" })
        .select("category_name")
        .lean(),
    ]);

    const productIds = [
      ...new Set(
        ownerRows
          .map((row) => String(row.product_id || ""))
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
      ),
    ];
    const products = productIds.length
      ? await Product.find({ _id: { $in: productIds } }).select("category").lean()
      : [];

    const categoryName = new Map(
      mainCategories.map((category) => [String(category._id), category.category_name])
    );
    const categoryCounts = new Map();
    for (const product of products) {
      const name = categoryName.get(String(product.category || ""));
      if (!name) continue;
      categoryCounts.set(name, (categoryCounts.get(name) || 0) + 1);
    }

    const since = new Date();
    since.setDate(since.getDate() - 30);

    let revenue = 0;
    let last30Orders = 0;
    let last30Revenue = 0;
    let pending = 0;
    const customers = new Set();
    const ordersByDay = new Map();
    const statusCounts = new Map();

    for (const order of orders) {
      const amount = money(order.order_amount);
      revenue += amount;

      const status = String(order.order_status || "unknown").trim().toLowerCase() || "unknown";
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
      if (status === "pending") pending += 1;

      const userId = String(order.user_id || "").trim();
      if (userId && userId.toLowerCase() !== "null") customers.add(userId);

      const created = orderDate(order);
      if (!created) continue;
      const key = dayKey(created);
      ordersByDay.set(key, (ordersByDay.get(key) || 0) + 1);
      if (created >= since) {
        last30Orders += 1;
        last30Revenue += amount;
      }
    }

    const dayLabels = [...ordersByDay.keys()].sort();
    const statusLabels = [...statusCounts.keys()];

    return NextResponse.json({
      success: true,
      totalOrders: orders.length,
      revenue: Math.round(revenue * 100) / 100,
      last30Orders,
      last30Revenue: Math.round(last30Revenue * 100) / 100,
      pending,
      productCount: productIds.length,
      customerCount: customers.size,
      line: {
        labels: dayLabels,
        data: dayLabels.map((label) => ordersByDay.get(label) || 0),
      },
      categories: [...categoryCounts.entries()].map(([category, count]) => ({
        category,
        count,
      })),
      statuses: statusLabels.map((status, index) => ({
        label: labelStatus(status),
        count: statusCounts.get(status) || 0,
        color: STATUS_COLORS[status] || EXTRA_COLORS[index % EXTRA_COLORS.length],
      })),
      recentOrders: orders.slice(0, 5).map((order) => ({
        _id: String(order._id),
        order_number: order.order_number || "",
        order_username: order.order_username || "",
        order_amount: order.order_amount || 0,
        order_status: order.order_status || "",
      })),
    });
  } catch (error) {
    console.error("Unilet dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load Unilet dashboard" },
      { status: 500 }
    );
  }
}
