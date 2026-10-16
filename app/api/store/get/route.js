import store from "@/models/store";
import connectDB from "@/lib/db";

export async function GET() {
  await connectDB();
  try {
    const stores = await store.find({}).lean();
    return new Response(JSON.stringify({ success: true, data: stores }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Failed to fetch stores:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Failed to fetch stores" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}