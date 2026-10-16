import dbConnect from "@/lib/db";
import Review from "@/models/Review";
import product from "@/models/product";
import OrderNew from "@/models/orders_new";
import OrderDetailsNew from "@/models/order_details_new";
import ecom_order_info from "@/models/ecom_order_info";
import { getAuthUserId } from "@/lib/authRequest";

const ELIGIBLE_STATUSES = [
  "Complete",
  "Billed",
  "ordered",
  "Order Accepted",
  "Order Placed",
  "shipped",
  "delivered",
];

export async function GET(request, { params }) {
  await dbConnect();
  const { productId } = await params;

  try {
    const reviews = await Review.find({
      product_id: productId,
      review_status: "active",
    })
      .populate("user_id", "name email")
      .sort({ created_date: -1 });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.reviews_rating, 0) / reviews.length
        : 0;

    return new Response(
      JSON.stringify({
        success: true,
        reviews,
        avgRating,
        count: reviews.length,
      }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
    });
  }
}

export async function POST(request, { params }) {
  await dbConnect();
  const { productId } = await params;

  try {
    const authUserId = await getAuthUserId(request);
    if (!authUserId) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reviews_title, reviews_rating, reviews_comments } = body;
    // Always use JWT user — ignore client-supplied userId
    const userId = authUserId;

    if (!reviews_title || !reviews_rating) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const products = await product.findOne({ _id: productId });
    if (!products) {
      return new Response(
        JSON.stringify({ success: false, error: "Product not found" }),
        { status: 404 }
      );
    }

    const item_code = products.item_code;
    const productIdStr = String(productId);

    // New orders: delivered / billed / completed in orders_new
    const userOrders = await OrderNew.find({
      user_id: String(userId),
      order_status: { $in: ELIGIBLE_STATUSES },
    })
      .select("_id order_number order_item")
      .lean();

    let purchased = false;

    for (const order of userOrders) {
      const inItems = (order.order_item || []).some((item) => {
        const pid = String(item.productId || item.product_id || item.id || "");
        const code = String(item.item_code || item.itemCode || "").replace(/^ITEM/i, "");
        return (
          pid === productIdStr ||
          (item_code && code === String(item_code).replace(/^ITEM/i, ""))
        );
      });
      if (inItems) {
        purchased = true;
        break;
      }

      const detailMatch = await OrderDetailsNew.exists({
        $or: [{ order_id: order._id }, { orderNumber: order.order_number }],
        $and: [
          {
            $or: [
              { product_id: productIdStr },
              ...(item_code
                ? [
                    { item_code: item_code },
                    { item_code: `ITEM${item_code}` },
                  ]
                : []),
            ],
          },
        ],
      });
      if (detailMatch) {
        purchased = true;
        break;
      }
    }

    // Legacy fallback for migrated customers
    if (!purchased && item_code) {
      const legacyCount = await ecom_order_info.countDocuments({
        "order_item.item_code": item_code,
        order_status: { $in: ["shipped", "delivered", "Complete", "Billed"] },
        user_id: userId,
      });
      purchased = legacyCount >= 1;
    }

    if (!purchased) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "You are not buying this product yet, So you cannot Review this product",
        }),
        { status: 403 }
      );
    }

    const review_check = await Review.countDocuments({
      user_id: userId,
      product_id: productId,
    });

    if (review_check >= 1) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "You have already reviewed this product!..",
        }),
        { status: 409 }
      );
    }

    const newReview = await Review.create({
      user_id: userId,
      product_id: productId,
      reviews_title,
      reviews_rating,
      reviews_comments,
    });

    return new Response(
      JSON.stringify({ success: true, review: newReview }),
      { status: 201 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}
