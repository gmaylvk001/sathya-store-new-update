import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Correct way to get cookies asynchronously in Next.js
    const cookieStore = await cookies(); // Await the cookies store
    const token = cookieStore.get("admin_session")?.value;

    if (!token) {
      return NextResponse.json({ isAuthenticated: false }, { status: 401 });
    }

    return NextResponse.json({ isAuthenticated: true, token });
  } catch (error) {
    console.error("Session Check Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
