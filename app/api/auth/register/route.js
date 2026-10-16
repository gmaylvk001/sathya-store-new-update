import connectDB from "@/lib/db";
import User from "@/models/User";
import Offer from "@/models/ecom_offer_info";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, mobile, email, password } = body;

    // Validate required fields
    if (!name || !email || !mobile || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return NextResponse.json(
        { message: "Email already exists" },
        { status: 400 }
      );
    }

    // Check if mobile already exists
    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      return NextResponse.json(
        { message: "Mobile number already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save new user
    const newUser = new User({
      name,
      mobile,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    await Offer.updateMany(
      { selected_user_type: "all" },
      {
        $addToSet: { selected_users: newUser._id }, // avoids duplicates
        $set: { updated_at: new Date() }
      }
    );

    return NextResponse.json(
      { data: newUser, message: "User registered successfully and offers updated" },
      { status: 201 }
    );

  } catch (error) {
    console.error("Registration API Error:", error.message);
    const errmsg = error.message || "Server Error";
    return NextResponse.json(
      { message: errmsg.replace("ecom_users_info", "") || "Server Error" },
      { status: 500 }
    );
  }
}
