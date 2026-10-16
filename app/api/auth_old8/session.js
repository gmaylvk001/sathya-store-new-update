import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretKey = new TextEncoder().encode(process.env.SESSION_SECRET);

async function decryptSession(token) {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function GET() {
  const token = cookies().get("admin_session")?.value;

  if (!token) {
    return NextResponse.json({ isAuthenticated: false });
  }

  const sessionData = await decryptSession(token);
  if (!sessionData) {
    return NextResponse.json({ isAuthenticated: false });
  }

  return NextResponse.json({ isAuthenticated: true, user: sessionData });
}
