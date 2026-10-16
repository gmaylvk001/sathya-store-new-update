import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { token } = await req.json();

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return NextResponse.json({ valid: false, error: "Invalid token" }, { status: 401 });
      }

      // Token is valid
      return NextResponse.json({ valid: true, user: decoded }, { status: 200 });
    });

  } catch (error) {
    return NextResponse.json({ valid: false, error: "Server error" }, { status: 500 });
  }
}
