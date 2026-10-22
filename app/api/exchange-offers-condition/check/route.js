import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ExchangeOfferCondition from "@/models/ExchangeOfferCondition";
import {
  categoryMatches,
  fieldMatches,
  isAnyValue,
  specificityScore,
} from "@/lib/exchangeOfferMatch";
import { isValidPincode, lookupPincode } from "@/lib/regionHelper";

export async function POST(req) {
  try {
    await dbConnect();
    const data = await req.json();
    const { categoryName, type, brand, condition, zone } = data;

    if (!categoryName) {
      return NextResponse.json(
        { success: false, error: "Missing required field (categoryName)" },
        { status: 400 }
      );
    }

    const records = await ExchangeOfferCondition.find({ status: "Active" }).lean();
    const zoneAliases = [];

    if (zone && isValidPincode(zone)) {
      try {
        const geo = await lookupPincode(zone);
        zoneAliases.push(geo?.city, geo?.region, geo?.stateName);
      } catch (err) {
        console.warn("[Exchange Offer] Pincode lookup skipped:", err.message);
      }
    }

    const matches = records.filter((offer) => {
      const zoneOk =
        isAnyValue(offer.zone) ||
        fieldMatches(offer.zone, zone) ||
        zoneAliases.some((alias) => fieldMatches(offer.zone, alias));

      return (
        categoryMatches(offer.categoryName, categoryName) &&
        fieldMatches(offer.type, type) &&
        fieldMatches(offer.brand, brand) &&
        fieldMatches(offer.condition, condition) &&
        zoneOk
      );
    });

    if (!matches.length) {
      return NextResponse.json(
        { success: false, error: "No matching exchange offer found." },
        { status: 404 }
      );
    }

    matches.sort((a, b) => {
      const scoreDiff = specificityScore(b, { zone, zoneAliases }) - specificityScore(a, { zone, zoneAliases });
      if (scoreDiff !== 0) return scoreDiff;
      return (Number(b.price) || 0) - (Number(a.price) || 0);
    });

    return NextResponse.json({
      success: true,
      data: matches[0],
    });
  } catch (error) {
    console.error("Error checking Exchange Offer:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
