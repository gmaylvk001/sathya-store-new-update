// app/api/blogs/add/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Blog from "@/models/ecom_blog_info";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

async function saveFile(file, folder) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = path.extname(file.name);
  const fileName = `${folder}_${Date.now()}${ext}`;
  const dir = path.join(process.cwd(), `public/uploads/blogs`);

  // Make sure the directory exists
  await mkdir(dir, { recursive: true });

  const filePath = path.join(dir, fileName);
  await writeFile(filePath, buffer);
  return `/uploads/blogs/${fileName}`;
}

export async function POST(req) {
  try {
    await dbConnect();

    const contentType = req.headers.get("content-type");

    if (contentType.includes("application/json")) {
      const { name, description, category, status, video } = await req.json();

      const newBlog = new Blog({
        blog_name: name,
        blog_slug: name.toLowerCase().replace(/\s+/g, "-"),
        description,
        category,
        status,
        video: video || "",
      });

      await newBlog.save();
      return NextResponse.json(
        { success: true, message: "Blog added successfully" },
        { status: 201 }
      );
    }

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      const name        = formData.get("name");
      const description = formData.get("description");
      const category    = formData.get("category");
      const status      = formData.get("status");
      const image       = formData.get("image");   // file upload
      const video       = formData.get("video");   // can be a file OR a URL string

      let imageUrl = "";
      let videoUrl = "";

      // Handle image upload
      if (image && image.name) {
        imageUrl = await saveFile(image, "blog_img");
      }

      // Handle video — if it's a File object upload it, if it's a plain string treat it as a URL
      if (video) {
        if (typeof video === "object" && video.name) {
          videoUrl = await saveFile(video, "blog_vid");
        } else if (typeof video === "string" && video.trim() !== "") {
          videoUrl = video.trim(); // YouTube / Vimeo URL
        }
      }

      const newBlog = new Blog({
        blog_name: name,
        blog_slug: name.toLowerCase().replace(/\s+/g, "-"),
        description,
        category,
        status,
        image: imageUrl,
        video: videoUrl,
      });

      await newBlog.save();
      return NextResponse.json(
        { success: true, message: "Blog added successfully" },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Invalid Content-Type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Blog POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
