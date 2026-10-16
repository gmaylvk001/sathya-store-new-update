// app/api/blogs/update/route.js  (your existing edit PUT route)
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Blog from "@/models/ecom_blog_info";
import path from "path";
import { writeFile, unlink, mkdir } from "fs/promises";

async function saveFile(file, prefix) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name);
  const fileName = `${prefix}_${Date.now()}${ext}`;
  const dir = path.join(process.cwd(), "public/uploads/blogs");

  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), buffer);
  return `/uploads/blogs/${fileName}`;
}

async function deleteOldFile(relativePath) {
  if (!relativePath) return;
  try {
    const absPath = path.join(process.cwd(), "public", relativePath);
    await unlink(absPath);
  } catch (err) {
    // File may already be gone — not a fatal error
    console.warn("Could not delete old file:", err.message);
  }
}

export async function PUT(req) {
  try {
    await dbConnect();

    const contentType = req.headers.get("content-type");

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { success: false, error: "Invalid Content-Type" },
        { status: 400 }
      );
    }

    const formData = await req.formData();

    const id            = formData.get("id");
    const name          = formData.get("name");
    const description   = formData.get("description");
    const category      = formData.get("category");
    const status        = formData.get("status");
    const image         = formData.get("image");         // new image file (optional)
    const existingImage = formData.get("existingImage"); // current image path in DB
    const video         = formData.get("video");         // new video file OR URL string (optional)
    const existingVideo = formData.get("existingVideo"); // current video value in DB

    // Validate
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Blog ID is required" },
        { status: 400 }
      );
    }

    const existingBlog = await Blog.findById(id);
    if (!existingBlog) {
      return NextResponse.json(
        { success: false, error: "Blog not found" },
        { status: 404 }
      );
    }

    // ── Image handling ───────────────────────────────────────────────────────
    let imageUrl = existingImage || existingBlog.image || "";

    if (image && image.name) {
      // Delete old locally-stored image (skip if it's a remote URL)
      if (imageUrl && imageUrl.startsWith("/uploads/")) {
        await deleteOldFile(imageUrl);
      }
      imageUrl = await saveFile(image, "blog_img");
    }

    // ── Video handling ───────────────────────────────────────────────────────
    let videoUrl = existingVideo ?? existingBlog.video ?? "";

    if (video) {
      if (typeof video === "object" && video.name) {
        // New video file uploaded — delete old local video if any
        if (videoUrl && videoUrl.startsWith("/uploads/")) {
          await deleteOldFile(videoUrl);
        }
        videoUrl = await saveFile(video, "blog_vid");
      } else if (typeof video === "string" && video.trim() !== "") {
        // Plain URL (YouTube / Vimeo) — no file to delete
        videoUrl = video.trim();
      } else if (typeof video === "string" && video.trim() === "") {
        // User cleared the video field
        if (videoUrl && videoUrl.startsWith("/uploads/")) {
          await deleteOldFile(videoUrl);
        }
        videoUrl = "";
      }
    }

    // ── Save ─────────────────────────────────────────────────────────────────
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        blog_name:  name,
        blog_slug:  name.toLowerCase().replace(/\s+/g, "-"),
        description,
        category,
        status,
        image:  imageUrl,
        video:  videoUrl,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedBlog) {
      return NextResponse.json(
        { success: false, error: "Failed to update blog" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Blog updated successfully", data: updatedBlog },
      { status: 200 }
    );
  } catch (error) {
    console.error("Blog PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
