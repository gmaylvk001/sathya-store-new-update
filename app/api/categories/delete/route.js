import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Category from "@/models/ecom_category_info"; // Adjust the path based on your structure
import { requireAdmin } from "@/lib/adminRequest";

export async function POST(req) {
    try {
        const auth = await requireAdmin(req, "categories");
        if (!auth.authorized) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        await dbConnect();
        const { categoryId } = await req.json();

        if (!categoryId) {
            return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
        }

        // Find the category to be deleted
        const category = await Category.findById(categoryId);
        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        // Delete all subcategories where parent matches category id or name
        const deleteConditions = [
            { parentid: categoryId },
            { parentid: String(category._id) },
            { parentid: category._id },
            { parentid: category.category_name },
        ];
        if (category.md5_cat_name) {
            deleteConditions.push({ parentid_new: category.md5_cat_name });
        }
        await Category.deleteMany({ $or: deleteConditions });

        // Delete the main category itself
        await Category.findByIdAndDelete(categoryId);

        // Invalidate in-memory categories cache
        if (globalThis.__sathyaCategoriesCache) {
            globalThis.__sathyaCategoriesCache.data = null;
            globalThis.__sathyaCategoriesCache.at = 0;
        }

        return NextResponse.json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error updating category:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
