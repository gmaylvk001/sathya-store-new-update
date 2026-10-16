import { NextResponse } from "next/server";
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

export async function GET(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    await dbConnect();
    const rows = await StoreZone.find().sort({ created_at: -1, exist_id: -1 }).lean();
    return NextResponse.json(rows.map(toUiZone));
  } catch (error) {
    console.error("zones GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    await dbConnect();
    const body = await req.json();
    const zonename = String(body.zone_name || body.zonename || "").trim();
    if (!zonename) {
      return NextResponse.json({ error: "Zone name is required" }, { status: 400 });
    }

    let slug = String(body.slug || "").trim() || slugify(zonename);
    const zone = await StoreZone.create({
      zonename,
      slug: slug.slice(0, 60),
      status: toDbStatus(body.status),
    });

    return NextResponse.json(toUiZone(zone.toObject()), { status: 201 });
  } catch (error) {
    console.error("zones POST error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
