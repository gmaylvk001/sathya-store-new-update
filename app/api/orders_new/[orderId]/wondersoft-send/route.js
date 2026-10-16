import { NextResponse } from "next/server";
import { sendOrderData } from "@/lib/sendOrderData";

export async function POST(req, { params }) {
  const { orderId } = await params;

  try {
    let remarks = null;
    try {
      const body = await req.json();
      if (body && body.remarks != null) {
        remarks = body.remarks;
      }
    } catch {
      remarks = null;
    }

    const result = await sendOrderData(orderId, remarks);
    return NextResponse.json({
      success: result.api_status === "SUCCESS",
      api_status: result.api_status,
      api_reason: result.api_reason,
      skippedApi: result.skippedApi,
      payload: result.payload,
      response: result.response || null,
      usedAddressFallback: result.usedAddressFallback,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: error.status || 500 }
    );
  }
}
