import dbConnect from "@/lib/db";
import DesignBanner from "@/models/ecom_banner_info";
import { NextResponse } from "next/server";

export async function PUT(req) {
  try {
    await dbConnect();

    const { id, status } = await req.json();

    // Validate input
    if (!id) {
      return NextResponse.json(
        { error: "Banner ID is required" },
        { status: 400 }
      );
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Update the banner status
    const updatedBanner = await DesignBanner.findByIdAndUpdate(
      id,
      { status },
      { new: true } // Return the updated document
    );

    if (!updatedBanner) {
      return NextResponse.json(
        { error: "Banner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        message: "Banner status updated successfully",
        banner: updatedBanner
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error updating banner status:", error);
    return NextResponse.json(
      { 
        error: "Failed to update banner status",
        details: error.message
      },
      { status: 500 }
    );
  }
}