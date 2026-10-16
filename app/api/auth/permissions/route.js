import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import { getUserAccess, hasPermission } from "@/lib/permissions";

export async function GET(req) {
  const token = req.headers.get("Authorization")?.split(" ")[1];

  if (!token) {
    return NextResponse.json({ error: "Authorization token required" }, { status: 401 });
  }

  try {
    const decoded = verifyToken(token);
    const userId = decoded.userId;
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    const access = await getUserAccess(userId);

    if (slug) {
      const allowed = await hasPermission(userId, slug);
      return NextResponse.json({
        allowed,
        slug,
        ...access,
      });
    }

    return NextResponse.json(access);
  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
