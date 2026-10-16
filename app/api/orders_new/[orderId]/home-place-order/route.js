import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import OrderNew from "@/models/orders_new";
import { sendOrderData } from "@/lib/sendOrderData";

/**
 * Exist CallApi for Home Delivery PlaceOrder:
 * save pickup_type = branchid → sendOrderData (CreateSalesOrder)
 */
export async function POST(req, { params }) {
  try {
    await dbConnect();
    const { orderId } = await params;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { success: false, message: "Invalid order id" },
        { status: 400 }
      );
    }

    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const branchid = String(body.branchid || body.pickup_type || "").trim();
    const remarks = body.remarks != null ? String(body.remarks) : "";

    if (!branchid) {
      return NextResponse.json(
        { success: false, message: "Please select a store / branch" },
        { status: 400 }
      );
    }

    const order = await OrderNew.findById(orderId).lean();
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    await OrderNew.updateOne(
      { _id: orderId },
      { $set: { pickup_type: branchid, pickup_store: branchid } }
    );

    const result = await sendOrderData(orderId, remarks);

    const ok = result.api_status === "SUCCESS";
    return NextResponse.json({
      success: ok,
      message: ok
        ? result.api_reason || "Order Placed Successfully"
        : result.api_reason || result.api_status || "Place order failed",
      api_status: result.api_status,
      api_reason: result.api_reason,
      pickup_type: branchid,
    });
  } catch (error) {
    console.error("home-place-order error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Place order failed" },
      { status: 500 }
    );
  }
}
