import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import User, { ADMIN_STORE_VIEWS } from "@/models/User";
import Role from "@/models/Role";
import { requireAdmin } from "@/lib/adminRequest";

export async function PUT(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    await dbConnect();

    const { userId, name, mobile, email, status, role, admin_store_view } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (admin_store_view !== undefined && !ADMIN_STORE_VIEWS.includes(admin_store_view)) {
      return NextResponse.json({ error: "Invalid admin store view" }, { status: 400 });
    }

    if (!/^\d{10}$/.test(mobile)) {
      return NextResponse.json({ error: "Mobile number must be exactly 10 digits" }, { status: 400 });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const systemUser = await User.findById(userId);
    if (!systemUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (systemUser.user_type !== "admin") {
      return NextResponse.json({ error: "Only admin users can be updated here" }, { status: 403 });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }],
      _id: { $ne: userId }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email or mobile already exists" },
        { status: 400 }
      );
    }

    let roleId = null;
    if (role) {
      if (!mongoose.Types.ObjectId.isValid(role)) {
        return NextResponse.json({ error: "Invalid role selected" }, { status: 400 });
      }
      const existingRole = await Role.findById(role);
      if (!existingRole) {
        return NextResponse.json({ error: "Selected role not found" }, { status: 400 });
      }
      roleId = role;
    }

    const update = { name, mobile, email, status, role: roleId };
    if (admin_store_view !== undefined) update.admin_store_view = admin_store_view;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      update,
      { new: true , runValidators: true}
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
