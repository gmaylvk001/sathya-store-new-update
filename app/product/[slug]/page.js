import ProductClient from "./ProductClient";
import dbConnect from "@/lib/db";
import Product from "@/models/product";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const slug = awaitedParams?.slug;

  try {
    await dbConnect();
    const product = await Product.findOne({ slug, status: "Active" })
      .select("name meta_title meta_description")
      .lean();

    if (product) {
      const rawTitle = product.meta_title || product.name || "Product";
      const title = String(rawTitle)
        .replace(/\s*\|\s*SATHYA Store\s*$/i, "")
        .trim();
      return {
        title,
        description: product.meta_description || "Shop online at SATHYA Store",
        alternates: {
          canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.sathya.store"}/product/${slug}`,
        },
      };
    }
  } catch (e) {
    // fallback
  }

  const cleanTitle = slug
    ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Product";

  return {
    title: cleanTitle,
  };
}

export default async function ProductPage({ params }) {
  const awaitedParams = await params;
  const slug = awaitedParams?.slug;

  if (!slug) {
    notFound();
  }

  await dbConnect();
  const product = await Product.findOne({ slug, status: "Active" })
    .select("_id")
    .lean();

  if (!product) {
    notFound();
  }

  return <ProductClient />;
}
