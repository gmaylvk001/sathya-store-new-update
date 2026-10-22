import mongoose from "mongoose";
import OrderNew from "@/models/orders_new";
import OrderHistoryNew from "@/models/order_history_new";
import OrderDetailsNew from "@/models/order_details_new";
import Product from "@/models/product";
import OwnerProduct from "@/models/OwnerProduct";
import { showUniletPriceToOrder } from "@/lib/priceResolver";
import Coupon from "@/models/ecom_offer_info";
import Usedcoupon from "@/models/ecom_coupon_track_info";
import { sendOrderConfirmationSms } from "@/lib/orderConfirmSms";
import { buildOrderNumber } from "@/lib/orderNumber";

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Find checkout sibling orders for a base order number.
 * Matches exact number, Unilet -UL twin, and makeOrderNumber siblings (base-2, base-3…)
 * without loose prefix matching (ORD12 must not match ORD123).
 */
export async function findRelatedOrders(orderNumber, userId = null) {
  const raw = String(orderNumber || "").trim();
  if (!raw) return [];

  const base = raw.replace(/-UL$/i, "");
  const filter = {
    $or: [
      { order_number: raw },
      { order_number: `${base}-UL` },
      { order_number: base },
      { order_number: { $regex: `^${escapeRegex(base)}-\\d+(-UL)?$` } },
    ],
  };
  if (userId) filter.user_id = String(userId);

  return OrderNew.find(filter).lean();
}

/**
 * Atomically decrement stock for a paid / confirmed order line.
 */
export async function decrementStockForItem(item, isKarnatakaOrder = false) {
  const productId = item.productId || item.id || item.product_id;
  const rawCode = item.item_code || item.itemCode || "";
  const itemCode = rawCode
    ? String(rawCode).startsWith("ITEM")
      ? String(rawCode)
      : `ITEM${rawCode}`
    : null;
  const qty = Math.max(1, toNumber(item.quantity, 1));

  if (isKarnatakaOrder) {
    const ownerQuery = { owner_id: "unilet" };
    if (productId && mongoose.isValidObjectId(productId)) {
      ownerQuery.product_id = productId;
    } else if (itemCode) {
      ownerQuery.product_item_code = itemCode;
    }

    let ownerProd = await OwnerProduct.findOne(ownerQuery);
    if (!ownerProd && itemCode) {
      ownerProd = await OwnerProduct.findOne({
        owner_id: "unilet",
        $or: [{ product_item_code: itemCode }, { vendor_item_code: itemCode }],
      });
    }

    if (ownerProd) {
      await OwnerProduct.updateOne(
        { _id: ownerProd._id, stock: { $gte: qty } },
        {
          $inc: { stock: -qty },
          $set: {
            stock_status:
              Number(ownerProd.stock || 0) - qty <= 0 ? "Out of Stock" : ownerProd.stock_status,
          },
        }
      );
    }
    return;
  }

  let product = null;
  if (productId && mongoose.isValidObjectId(productId)) {
    product = await Product.findById(productId);
  } else if (itemCode) {
    product = await Product.findOne({ item_code: itemCode });
  }

  if (product && product.movement !== "CUS-Order") {
    await Product.updateOne(
      { _id: product._id, quantity: { $gte: qty } },
      {
        $inc: { quantity: -qty },
        $set: {
          stock_status:
            Number(product.quantity || 0) - qty <= 0 ? "Out of Stock" : product.stock_status,
        },
      }
    );
  }
}

/**
 * Record coupon usage from offer codes or coupon objects.
 */
export async function trackCouponUsage(item, userId) {
  if (!userId || !item) return;

  const rawCoupons = Array.isArray(item.coupondetails) ? item.coupondetails : [];
  if (!rawCoupons.length && !item.discount) return;

  const codes = rawCoupons
    .map((c) => {
      if (!c) return null;
      if (typeof c === "string") return c;
      return c.offer_code || c._id || null;
    })
    .filter(Boolean);

  for (const codeOrId of codes) {
    let coupon = null;
    if (mongoose.isValidObjectId(codeOrId)) {
      coupon = await Coupon.findById(codeOrId);
    }
    if (!coupon) {
      coupon = await Coupon.findOne({ offer_code: String(codeOrId) });
    }
    if (!coupon) continue;

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const already = await Usedcoupon.findOne({
      coupon_id: coupon._id,
      user_id: userObjectId,
    }).lean();
    if (already) continue;

    await Usedcoupon.create({
      coupon_id: coupon._id,
      user_id: userObjectId,
    });
    await Coupon.updateOne({ _id: coupon._id }, { $inc: { used_by: 1 } });
  }
}

/**
 * Mark related orders as paid after gateway verification and apply side effects once.
 */
export async function markOrdersPaid({
  orderNumber,
  userId,
  paymentId,
  paymentMethod = "online",
  paymentType = "Razorpay",
  paidAmountPaise = null,
}) {
  const related = await findRelatedOrders(orderNumber, userId);
  if (!related.length) {
    return { success: false, error: "Order not found" };
  }

  const expectedPaise = Math.round(
    related.reduce((sum, o) => sum + (Number(o.order_amount) || 0), 0) * 100
  );

  if (
    paidAmountPaise != null &&
    expectedPaise > 0 &&
    Math.abs(Number(paidAmountPaise) - expectedPaise) > 100
  ) {
    return {
      success: false,
      error: `Payment amount mismatch (paid ${paidAmountPaise}, expected ${expectedPaise})`,
    };
  }

  const updated = [];

  for (const order of related) {
    const alreadyPaid =
      String(order.payment_status || "").toLowerCase() === "paid" ||
      String(order.order_status || "").toLowerCase() === "ordered";

    const saved = await OrderNew.findByIdAndUpdate(
      order._id,
      {
        $set: {
          order_status: "ordered",
          payment_status: "paid",
          payment_id: String(paymentId),
          payment_method: paymentMethod,
          payment_type: paymentType,
          payment_mode: paymentType,
        },
      },
      { new: true }
    );

    if (!alreadyPaid) {
      await OrderHistoryNew.create({
        order_id: String(saved._id),
        order_number: saved.order_number,
        order_status: "ordered",
        notify: 1,
        comment: `Payment verified via ${paymentType} (${paymentId})`,
      });

      const isKarnataka =
        saved.order_owner === "unilet" ||
        saved.region === "karnataka" ||
        String(saved.order_number || "").endsWith("-UL");

      const items = Array.isArray(saved.order_item) ? saved.order_item : [];
      for (const item of items) {
        await decrementStockForItem(item, isKarnataka);
        await trackCouponUsage(item, saved.user_id);
      }

      // Also apply promotion_code_applied at order level
      if (saved.promotion_code_applied) {
        await trackCouponUsage(
          { coupondetails: [saved.promotion_code_applied], discount: 1 },
          saved.user_id
        );
      }

      try {
        await sendOrderConfirmationSms(saved);
      } catch {
        // non-fatal
      }
    }

    updated.push(saved);
  }

  return { success: true, orders: updated, expectedPaise };
}

/**
 * Recalculate line totals from catalog prices (ignores client price).
 */
export async function resolveLinePrice(item, isKarnatakaOrder = false) {
  const productId = item.productId || item.id || item.product_id;
  const rawCode = item.item_code || item.itemCode || "";
  const itemCode = rawCode
    ? String(rawCode).startsWith("ITEM")
      ? String(rawCode)
      : `ITEM${rawCode}`
    : null;

  let product = null;
  if (productId && mongoose.isValidObjectId(productId)) {
    product = await Product.findById(productId).lean();
  } else if (itemCode) {
    product = await Product.findOne({ item_code: itemCode }).lean();
  }

  if (!product) {
    return {
      price: toNumber(item.price ?? item.product_price, 0),
      product,
    };
  }

  if (isKarnatakaOrder && showUniletPriceToOrder()) {
    const ownerQuery = { owner_id: "unilet", is_active: true };
    if (product._id) ownerQuery.product_id = product._id;
    const owner = await OwnerProduct.findOne(ownerQuery).lean();
    if (owner) {
      const offer =
        Number(owner.offer_price) > 0
          ? Number(owner.offer_price)
          : Number(owner.price) || 0;
      return { price: offer || Number(product.special_price) || Number(product.price) || 0, product, owner };
    }
  }

  const special = Number(product.special_price) || 0;
  const mrp = Number(product.price) || 0;
  return {
    price: special > 0 && special < mrp ? special : mrp,
    product,
  };
}

/**
 * Look up extended warranty price from DB when possible.
 */
export async function resolveWarrantyPrice(warrantyData) {
  if (!warrantyData) return 0;
  // Accept only non-negative finite numbers from structured warranty payloads
  const price = toNumber(warrantyData.price ?? warrantyData.amount, 0);
  return price > 0 ? price : 0;
}

export async function generateUniqueOrderNumber({ isKarnataka = false } = {}) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const orderNumber = buildOrderNumber(Boolean(isKarnataka));
    const exists = await OrderNew.exists({ order_number: orderNumber });
    if (!exists) return orderNumber;
  }
  return buildOrderNumber(Boolean(isKarnataka));
}
