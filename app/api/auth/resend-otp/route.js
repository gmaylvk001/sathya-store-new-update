// app/api/auth/resend-otp/route.js

import connectDB from "@/lib/db";
import Otp from "@/models/Otp";
import { sendRobeetaOtp } from "@/lib/sms";
import { checkOtpSendLimits } from "@/lib/rateLimit";
import { randomInt } from "crypto";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, mobile } = body;

    if (!email && !mobile) {
      return NextResponse.json(
        { success: false, error: "Email or mobile is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // 4-digit OTP matching Robeeta DLT template
    const otp = randomInt(1000, 10000).toString();

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const cleanedMobile = mobile ? String(mobile).replace(/\D/g, "").slice(-10) : null;
    if (mobile && !/^[6-9][0-9]{9}$/.test(cleanedMobile)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 10-digit mobile number" },
        { status: 400 }
      );
    }

    const limited = await checkOtpSendLimits(
      request,
      cleanedMobile || `email:${String(email).toLowerCase()}`
    );
    if (limited) return limited;

    if (mobile) {
      await Otp.findOneAndUpdate(
        { mobile: cleanedMobile },
        { otp, expiresAt, attempts: 0 },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const smsResult = await sendRobeetaOtp(cleanedMobile, otp);
      if (!smsResult.success) {
        console.warn("[Resend OTP] Robeeta dispatch error:", smsResult.error || smsResult.response);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to resend SMS to your mobile number. Please try again.",
          },
          { status: 502 }
        );
      }
    }

    if (email) {
      await Otp.findOneAndUpdate(
        { email },
        { otp, expiresAt, attempts: 0 },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`[Resend OTP] OTP generated for email ${email}`);
    }

    return NextResponse.json({
      success: true,
      message: "New OTP resent successfully",
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to resend OTP" },
      { status: 500 }
    );
  }
}
