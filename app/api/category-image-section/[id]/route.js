// app/api/category-image-section/[id]/route.js
import fs from "fs";
import path from "path";
import dbConnect from "@/lib/db";
import CategoryImageSection from "@/models/category_image_section";
import Category from "@/models/ecom_category_info";
import "@/models/ecom_category_info";
import { NextResponse } from "next/server";

const UPLOAD_DIR = path.join(process.cwd(), "public/category/image-section");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ── GET by category slug — for frontend ──────────────────────────────────────
export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = params; // could be MongoDB _id or category slug

    let data;

    // If it looks like a slug (not a mongo id)
    if (id.length !== 24) {
      const category = await Category.findOne({ category_slug: id });
      if (!category) {
        return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
      }
      data = await CategoryImageSection.find({
        category_id: category._id,
        status: "active",
      }).populate({ path: "category_id", model: "ecom_category_infos" });
    } else {
      // Fetch by mongo _id
      data = await CategoryImageSection.findById(id).populate({
        path: "category_id",
        model: "ecom_category_infos",
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET by id error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ── PUT — update section ─────────────────────────────────────────────────────
export async function PUT(req, { params }) {
  try {
    await dbConnect();
    ensureDir(UPLOAD_DIR);

    const { id } = params;
    const form = await req.formData();

    const category_id   = form.get("category_id");
    const section_title = form.get("section_title");
    const status        = form.get("status") || "active";
    let images          = JSON.parse(form.get("images") || "[]");

    // Handle image uploads
    for (let i = 0; i < images.length; i++) {
      const file = form.get(`image_${i}`);
      if (file && typeof file === "object") {
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}_${i}_${file.name}`;
        const filePath = path.join(UPLOAD_DIR, fileName);
        fs.writeFileSync(filePath, Buffer.from(await file.arrayBuffer()));
        images[i].image = `/category/image-section/${fileName}`;
      }
    }

    const updated = await CategoryImageSection.findByIdAndUpdate(
      id,
      { category_id, section_title, status, images },
      { new: true, runValidators: true }
    ).populate({ path: "category_id", model: "ecom_category_infos" });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Section not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    const deleted = await CategoryImageSection.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Section not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}