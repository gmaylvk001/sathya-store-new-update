import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import CancelOrders from "@/models/cancel_orders";

export async function DELETE(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { id, orderId, orderIds, deleteAll, existId } = body;

    if (deleteAll) {
      const result = await CancelOrders.deleteMany({});
      return NextResponse.json({
        success: true,
        message: `Deleted ${result.deletedCount} cancel orders`,
      });
    }

    if (Array.isArray(orderIds) && orderIds.length > 0) {
      const result = await CancelOrders.deleteMany({ _id: { $in: orderIds } });
      return NextResponse.json({
        success: true,
        message: `Deleted ${result.deletedCount} cancel orders`,
      });
    }

    if (id || orderId) {
      const targetId = id || orderId;
      await CancelOrders.findByIdAndDelete(targetId);
      return NextResponse.json({
        success: true,
        message: "Cancel order deleted successfully",
      });
    }

    if (existId) {
      await CancelOrders.deleteOne({ exist_id: String(existId) });
      return NextResponse.json({
        success: true,
        message: "Cancel order deleted successfully",
      });
    }

    return NextResponse.json(
      { success: false, error: "No target ID provided" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Delete cancel order error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete" },
      { status: 500 }
    );
  }
}
