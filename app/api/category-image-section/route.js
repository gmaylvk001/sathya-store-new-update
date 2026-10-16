// app/api/category-image-section/route.js
import fs from "fs";
import path from "path";
import dbConnect from "@/lib/db";
import CategoryImageSection from "@/models/category_image_section";
import "@/models/ecom_category_info";
import { NextResponse } from "next/server";

const UPLOAD_DIR = path.join(process.cwd(), "public/category/image-section");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ── GET — fetch all sections ─────────────────────────────────────────────────
export async function GET() {
  try {
    await dbConnect();
    const data = await CategoryImageSection.find()
      .populate({ path: "category_id", model: "ecom_category_infos" })
      .sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ── POST — create new section ────────────────────────────────────────────────
export async function POST(req) {
  try {
    await dbConnect();
    ensureDir(UPLOAD_DIR);

    const form = await req.formData();
    const category_id   = form.get("category_id");
    const section_title = form.get("section_title");
    const status        = form.get("status") || "active";
    const imagesJson    = form.get("images"); // JSON string of [{name, url, status}]

    let images = JSON.parse(imagesJson || "[]");
    console.log("Total images received:", images.length);
    // Save uploaded image files
    for (let i = 0; i < images.length; i++) {
      const file = form.get(`image_${i}`);
        console.log(`image_${i}:`, file ? "found" : "not found");
      if (file && typeof file === "object") {
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}_${i}_${file.name}`;
        const filePath = path.join(UPLOAD_DIR, fileName);
        fs.writeFileSync(filePath, Buffer.from(await file.arrayBuffer()));
        images[i].image = `/category/image-section/${fileName}`;
      }
    }

    const doc = await CategoryImageSection.create({
      category_id,
      section_title,
      status,
      images,
    });

    const populated = await CategoryImageSection.findById(doc._id).populate({
      path: "category_id",
      model: "ecom_category_infos",
    });

    return NextResponse.json({ success: true, data: populated });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}