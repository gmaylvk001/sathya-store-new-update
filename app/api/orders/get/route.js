// import { NextResponse } from "next/server";
// import dbConnect from "@/lib/db";
// import Order from "@/models/ecom_order_info";
// import jwt from "jsonwebtoken";


// export async function GET(req) {
//   await dbConnect();

//   try {
//     const { searchParams } = new URL(req.url);
//     const authHeader = req.headers.get('authorization');
//      const token = authHeader && authHeader.split(' ')[1];
        
//         if (!token) {
//           return NextResponse.json(
//             { error: "Authorization token required" },
//             { status: 401 }
//           );
//         }
    
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         const userId = decoded.userId;
//     const status = searchParams.get("status");
//     let query = {};

//     if (status && status !== "all") {
//       query.order_status = status;
//     }

//     if(userId){
//       query.user_id = userId;
//     }

//     const orders = await Order.find(query);
//     return NextResponse.json({ success: true, orders }, { status: 200 });
//   } catch (error) {
//     return NextResponse.json({ success: false, message: "Server error", error: error.message }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OrderNew from "@/models/orders_new";
import OrderDetailsNew from "@/models/order_details_new";
import PaymentNewLive from "@/models/payment_new_live";
import CancelOrders from "@/models/cancel_orders_live";
import { ensureAppCancelsMoved } from "@/lib/cancelOrdersLive";
import product from "@/models/product";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export async function GET(req) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const status = searchParams.get("status");
    const order_number = searchParams.get("order_number");
    
    let query = {};

    if (status && status !== "all") {
      query.order_status = status;
    }

    if (order_number) {
      query.order_number = order_number;
    }
    if(userId){
      query.user_id = userId;
    }

    // Offline orders are now included in user order history ONLY if they have an invoice 
    // (This ensures we only show simple orders from apis/offlineorders, and hide the detailed ones)
    query.$or = [
      { type: { $ne: "offline" } },
      { type: "offline", invoice: { $exists: true, $ne: null, $ne: "" } }
    ];

    // Unpaid online attempts are not shown to the customer.
    query.$and = [{ order_status: { $not: /^payment[\s_-]*initi(ated|alized)$/i } }];

    const orders = await OrderNew.find(query).sort({ created_at: -1 });

    const paymentObjectIds = [];
    const paymentStringIds = [];
    for (const order of orders) {
      if (!order.payment_id) continue;
      const pid = String(order.payment_id);
      paymentStringIds.push(pid);
      if (mongoose.isValidObjectId(pid)) {
        paymentObjectIds.push(new mongoose.Types.ObjectId(pid));
      }
    }

    const paymentQuery = [];
    if (paymentObjectIds.length) paymentQuery.push({ _id: { $in: paymentObjectIds } });
    if (paymentStringIds.length) {
      paymentQuery.push({ payment_id: { $in: paymentStringIds } });
      paymentQuery.push({ exist_id: { $in: paymentStringIds } });
    }
    if (orders.length) paymentQuery.push({ orderId: { $in: orders.map((order) => order._id) } });
    const orderNumbers = orders.map((order) => order.order_number).filter(Boolean);
    if (orderNumbers.length) paymentQuery.push({ order_number: { $in: orderNumbers } });

    const payments = paymentQuery.length
      ? await PaymentNewLive.find({ $or: paymentQuery }).lean()
      : [];

    // Index payments by each match key, keeping the first position so the
    // earliest matching payment wins (same result as a linear find)
    const firstIndexBy = (keyFn) => {
      const map = new Map();
      payments.forEach((payment, idx) => {
        const key = keyFn(payment);
        if (key !== undefined && !map.has(key)) map.set(key, idx);
      });
      return map;
    };
    const paymentsById = firstIndexBy((p) => String(p._id));
    const paymentsByPaymentId = firstIndexBy((p) => String(p.payment_id));
    const paymentsByExistId = firstIndexBy((p) => String(p.exist_id));
    const paymentsByOrderId = firstIndexBy((p) => String(p.orderId));
    const paymentsByOrderNumber = firstIndexBy((p) => p.order_number);

    const findPaymentForOrder = (order) => {
      const pid = order.payment_id ? String(order.payment_id) : "";
      const candidates = [paymentsByOrderId.get(String(order._id))];
      if (pid) {
        candidates.push(paymentsById.get(pid), paymentsByPaymentId.get(pid), paymentsByExistId.get(pid));
      }
      if (order.order_number) {
        candidates.push(paymentsByOrderNumber.get(order.order_number));
      }
      const found = candidates.filter((idx) => idx !== undefined);
      return found.length ? payments[Math.min(...found)] : null;
    };

    // Exist cancel_exists: any cancel_orders row for this order
    const cancelOrderIds = orders.map((o) => String(o._id));
    const cancelOrderNumbers = orders.map((o) => o.order_number).filter(Boolean);
    const cancelQuery = [];
    if (cancelOrderIds.length) cancelQuery.push({ order_id: { $in: cancelOrderIds } });
    if (cancelOrderNumbers.length) cancelQuery.push({ order_number: { $in: cancelOrderNumbers } });
    if (cancelQuery.length) await ensureAppCancelsMoved();
    const cancelRows = cancelQuery.length
      ? await CancelOrders.find({ $or: cancelQuery }).select("order_id order_number").lean()
      : [];
    const cancelExistsByOrderId = new Set(cancelRows.map((r) => String(r.order_id || "")));
    const cancelExistsByOrderNumber = new Set(
      cancelRows.map((r) => String(r.order_number || "").trim()).filter(Boolean)
    );

    // Line items from order_details_new for all orders in one query
    // (matched by order_id, or orderNumber as the fallback for imported orders)
    const detailOrQuery = [];
    if (orders.length) detailOrQuery.push({ order_id: { $in: orders.map((o) => o._id) } });
    if (orderNumbers.length) detailOrQuery.push({ orderNumber: { $in: orderNumbers } });
    if (orders.some((o) => !o.order_number)) detailOrQuery.push({ orderNumber: null });
    const allDetails = detailOrQuery.length
      ? await OrderDetailsNew.find({ $or: detailOrQuery })
      : [];

    const detailsForOrder = (order) =>
      allDetails.filter(
        (d) =>
          String(d.order_id) === String(order._id) ||
          (order.order_number ? d.orderNumber === order.order_number : d.orderNumber == null)
      );

    const lineItemsByOrder = new Map();
    for (const order of orders) {
      const details = detailsForOrder(order);
      // If the new table doesn't have details, fallback to order.order_item array if it exists
      lineItemsByOrder.set(String(order._id), details.length > 0 ? details : (order.order_item || []));
    }

    // Product slugs for all item codes in one query; first product per code wins
    const itemCodes = [
      ...new Set(
        [...lineItemsByOrder.values()].flat().map((item) => item.item_code).filter(Boolean)
      ),
    ];
    const slugByItemCode = new Map();
    if (itemCodes.length) {
      const productDocs = await product
        .find({ item_code: { $in: itemCodes } }, "slug item_code")
        .sort({ _id: 1 })
        .lean();
      for (const p of productDocs) {
        if (!slugByItemCode.has(p.item_code)) slugByItemCode.set(p.item_code, p.slug);
      }
    }

    const updatedOrders = [];
    for (let order of orders) {
      const itemsWithSlug = [];
      const lineItems = lineItemsByOrder.get(String(order._id)) || [];

      for (let item of lineItems) {
        const itemCode = item.item_code;
        const slug = itemCode ? slugByItemCode.get(itemCode) : null;

        const itemObj = item.toObject ? item.toObject() : item;
        itemsWithSlug.push({
          ...itemObj,
          name: itemObj.product_name || itemObj.name,
          price: itemObj.product_price || itemObj.price,
          slug: slug || null
        });
      }

      const orderObj = order.toObject();
      const payment = findPaymentForOrder(order);
      const cancel_exists =
        cancelExistsByOrderId.has(String(order._id)) ||
        (order.order_number
          ? cancelExistsByOrderNumber.has(String(order.order_number).trim())
          : false);

      updatedOrders.push({
        ...orderObj,
        order_item: itemsWithSlug,
        payment_status: payment?.status || orderObj.payment_status || null,
        payment_type: payment?.PaymentMode || payment?.ModeType || orderObj.payment_type || orderObj.payment_method || null,
        payment_mode: payment?.PaymentMode || orderObj.payment_mode || null,
        createdAt: orderObj.created_at || orderObj.createdAt,
        updatedAt: orderObj.updated_at || orderObj.updatedAt,
        cancel_exists: Boolean(cancel_exists),
      });
    }
    
    if (order_number && updatedOrders.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, orders: updatedOrders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}