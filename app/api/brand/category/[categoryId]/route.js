import dbConnect from "@/lib/db";
import ecom_brand_info from "@/models/ecom_brand_info";
import Product from "@/models/product";

export async function GET(req, { params }) {
  try {
    await dbConnect();
    
    // Find distinct brands that have products in this category
    const brands = await Product.aggregate([
      { $match: { category: params.categoryId } },
      { $group: { _id: "$brand" } },
      { $lookup: {
          from: "ecom_brand_infos",
          localField: "_id",
          foreignField: "_id",
          as: "brand"
        }
      },
      { $unwind: "$brand" },
      { $replaceRoot: { newRoot: "$brand" } }
    ]);

    return Response.json({ data: brands }, { status: 200 });
  } catch (error) {
    return Response.json({ error: "Error fetching brands" }, { status: 500 });
  }
}