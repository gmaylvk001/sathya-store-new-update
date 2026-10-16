// app/api/blogs/delete/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Blog from "@/models/ecom_blog_info";

export async function PUT(req) {
    await dbConnect();

    try {
        const { searchParams } = new URL(req.url);
        const blogId = searchParams.get('id');

        if (!blogId) {
            return NextResponse.json({ error: "Blog ID is required" }, { status: 400 });
        }

        const blog = await Blog.findById(blogId);
        if (!blog) {
            return NextResponse.json({ error: "Blog not found" }, { status: 404 });
        }

        // Soft delete - set status to Inactive
        await Blog.findByIdAndUpdate(blogId, { status: "Inactive" });

        return NextResponse.json(
            { success: true, message: "Blog status updated to Inactive" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating blog status:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}