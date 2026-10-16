import dbConnect from "@/lib/db";
import Contact from "@/models/ecom_contact_info";
import { NextResponse } from "next/server";
export  async function PUT(req) {  // Fix: Added 'res' parameter
  await dbConnect(); // Fix: Ensure database connection


    try {
      const { id, name, email_address, mobile_number } = req.body;

      if (!id || !name || !email_address || !mobile_number) {
        return NextResponse.json({ success: false, message: "Missing fields" });
      }

      const updatedContact = await Contact.findByIdAndUpdate(  // Fix: Used correct model
        id,
        { name, email_address, mobile_number },
        { new: true }
      );

      if (!updatedContact) {
        return NextResponse.json({ success: false, message: "Contact not found" });
      }

      return NextResponse.json({ success: true, data: updatedContact });
    } catch (error) {
      console.error("Update error:", error);
      return NextResponse.json({ success: false, message: "Server error" });
    }
  
}
