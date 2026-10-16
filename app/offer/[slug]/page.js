import React from "react";
import Link from "next/link";
import OfferClient from "./OfferClient";
import { getSiteUrl } from "@/lib/siteUrl";

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const slug = awaitedParams.slug;
  const baseUrl = getSiteUrl();

  try {
    const res = await fetch(`${baseUrl}/api/offer-module/${slug}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return { title: "Offer Not Found", description: "This offer does not exist" };
    }

    const data = await res.json();
    return {
      title: data.offer.offerName,
      description: `Check out our ${data.offer.offerName} offers`,
    };
  } catch {
    return { title: "Offer", description: "Browse our offers" };
  }
}

export default async function OfferPage({ params }) {
  const awaitedParams = await params;
  const slug = awaitedParams.slug;
  const baseUrl = getSiteUrl();

  let offer = null;
  let products = [];

  try {
    const res = await fetch(`${baseUrl}/api/offer-module/${slug}`, {
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      offer = data.offer;
      products = data.products;
    }
  } catch (error) {
    console.error("Error fetching offer data:", error);
  }

  if (!offer) {
    return (
      <div className="container mx-auto px-4 py-8 text-center min-h-[50vh]">
        <h1 className="text-3xl font-bold mb-4">Offer Not Found</h1>
        <p>We couldn't find the offer you're looking for.</p>
        <Link href="/" className="text-blue-500 mt-4 inline-block underline">Return to Home</Link>
      </div>
    );
  }

  return <OfferClient offer={offer} products={products} />;
}
