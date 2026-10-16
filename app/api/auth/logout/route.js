import { NextResponse } from "next/server";
export async function POST(req) {
    try {
      // Log the logout event (optional for auditing purposes)
      console.log("User logged out. Token invalidated on client-side.");
  
      return NextResponse.json(
        { message: "User logged out successfully. Token invalidated." },
        { status: 200 }
      );
    } catch (error) {
      console.error("Logout Error:", error);
      return NextResponse.json({ error: "Logout failed due to server error." }, { status: 500 });
    }
  }
  