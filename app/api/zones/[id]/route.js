import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import StoreZone from "@/models/store_zones";
import { requireAdmin } from "@/lib/adminRequest";
import { slugify } from "@/lib/storeImportHelpers";

function toUiZone(row) {
  if (!row) return null;
  const statusNum = Number(row.status);
  return {
    ...row,
    zone_name: row.zonename || row.zone_name || "",
    status: statusNum === 1 || row.status === "Active" ? "Active" : "Inactive",
  };
}

function toDbStatus(status) {
  if (status === "Active" || status === 1 || status === "1") return 1;
  return 0;
}

export async function PUT(req, { params }) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid zone id" }, { status: 400 });
    }

    await dbConnect();
    const body = await req.json();
    const zonename = String(body.zone_name || body.zonename || "").trim();
    const update = {};
    if (zonename) {
      update.zonename = zonename;
      update.slug = String(body.slug || slugify(zonename)).slice(0, 60);
    }
    if (body.status !== undefined) {
      update.status = toDbStatus(body.status);
    }

    const zone = await StoreZone.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!zone) {
      return NextResponse.json({ error: "Zone not found" }, { status: 404 });
    }
    return NextResponse.json(toUiZone(zone));
  } catch (error) {
    console.error("zones PUT error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid zone id" }, { status: 400 });
    }

    await dbConnect();
    // Soft-inactivate (matches UI message)
    const zone = await StoreZone.findByIdAndUpdate(
      id,
      { $set: { status: 0 } },
      { new: true }
    ).lean();

    if (!zone) {
      return NextResponse.json({ error: "Zone not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Zone status set to Inactive successfully!",
      zone: toUiZone(zone),
    });
  } catch (error) {
    console.error("zones DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
