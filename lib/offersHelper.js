import dbConnect from "@/lib/db";
import OfferModule from "@/models/OfferModule";
import Product from "@/models/product";
import OfferModuleProduct from "@/models/OfferModuleProduct";
import BrandInfo from "@/models/ecom_brand_info";

export const DEFAULT_OFFERS = [
  {
    offerName: "Weekend Offers",
    slug: "weekend-offers",
    description: "Exclusive weekend deals and limited-time savings on top-rated electronics and home appliances.",
    banner: "",
    isActive: true,
  },
  {
    offerName: "Big Discounts",
    slug: "big-discounts",
    description: "Unbeatable price drops and mega discount deals across all categories at Sathya Store.",
    banner: "",
    isActive: true,
  },
  {
    offerName: "Bundle Offer",
    slug: "bundle-offer",
    description: "Special value bundles and combo offers. Buy more, save more with exclusive package savings.",
    banner: "",
    isActive: true,
  },
];

export function generateSlug(text = "") {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Ensures the 3 default offers exist in the database.
 */
export async function ensureDefaultOffersExist() {
  await dbConnect();
  for (const def of DEFAULT_OFFERS) {
    const existing = await OfferModule.findOne({ slug: def.slug });
    if (!existing) {
      try {
        await OfferModule.create(def);
        console.log(`[OffersHelper] Seeded default offer: ${def.offerName} (${def.slug})`);
      } catch (err) {
        console.error(`[OffersHelper] Error creating default offer ${def.slug}:`, err.message);
      }
    }
  }
}

/**
 * Fetches an offer by its slug along with its mapped or fallback products.
 */
export async function getOfferBySlug(slug) {
  if (!slug) return null;
  await dbConnect();

  const cleanSlug = slug.toLowerCase().trim();
  let offer = await OfferModule.findOne({ slug: cleanSlug }).lean();

  // If not in DB, check if it is one of the default offers and seed it
  if (!offer) {
    const defaultDef = DEFAULT_OFFERS.find((d) => d.slug === cleanSlug);
    if (defaultDef) {
      try {
        const created = await OfferModule.create(defaultDef);
        offer = created.toObject ? created.toObject() : created;
      } catch {
        offer = { ...defaultDef, _id: "default_" + cleanSlug, products: [] };
      }
    }
  }

  if (!offer) return null;

  let products = [];

  // 1. If offer has explicitly assigned products, load them
  if (Array.isArray(offer.products) && offer.products.length > 0) {
    const rawProducts = await Product.find({
      _id: { $in: offer.products },
      status: "Active",
    }).lean();

    const map = new Map(rawProducts.map((p) => [String(p._id), p]));
    products = offer.products.map((id) => map.get(String(id))).filter(Boolean);
  }

  // 2. If no products mapped yet, check legacy OfferModuleProduct
  if (products.length === 0 && offer._id && !String(offer._id).startsWith("default_")) {
    try {
      const legacyOfferProducts = await OfferModuleProduct.find({ offerId: offer._id }).lean();
      if (legacyOfferProducts.length > 0) {
        // Find matching store products by name
        const names = legacyOfferProducts.map((p) => p.productName).filter(Boolean);
        if (names.length > 0) {
          products = await Product.find({
            name: { $in: names },
            status: "Active",
          }).lean();
        }
      }
    } catch (err) {
      console.warn("[OffersHelper] Error querying legacy offer products:", err.message);
    }
  }

  // 3. Fallback for the 3 default offers so storefront shows rich products out of the box
  if (products.length === 0) {
    try {
      if (cleanSlug === "big-discounts") {
        // Products with heavy discount
        products = await Product.find({
          status: "Active",
          stock_status: "In Stock",
          special_price: { $gt: 0 },
          $expr: { $gt: ["$price", "$special_price"] },
        })
          .sort({ createdAt: -1 })
          .limit(32)
          .lean();
      } else if (cleanSlug === "weekend-offers") {
        // High-demand active in-stock products
        products = await Product.find({
          status: "Active",
          stock_status: "In Stock",
        })
          .sort({ createdAt: -1 })
          .limit(32)
          .lean();
      } else if (cleanSlug === "bundle-offer") {
        // Bundle / combo / discounted products
        products = await Product.find({
          status: "Active",
          $or: [
            { category: /combo/i },
            { sub_category: /combo/i },
            { name: /combo/i },
            { name: /bundle/i },
            { is_common_type: 1 },
          ],
        })
          .limit(32)
          .lean();

        // If not enough combos found, fallback to active top products
        if (products.length < 8) {
          const extra = await Product.find({
            status: "Active",
            stock_status: "In Stock",
          })
            .sort({ createdAt: -1 })
            .limit(24)
            .lean();
          products = [...products, ...extra].slice(0, 32);
        }
      }
    } catch (err) {
      console.warn("[OffersHelper] Error loading fallback products:", err.message);
    }
  }

  // Build brandMap for correct brand label display in ProductCard
  let brandMap = {};
  try {
    const brands = await BrandInfo.find({}, "_id brand_name brand_slug").lean();
    brandMap = brands.reduce((acc, b) => {
      acc[String(b._id)] = b.brand_name || b.name || "";
      return acc;
    }, {});
  } catch (err) {
    console.warn("[OffersHelper] Error fetching brand map:", err.message);
  }

  // Convert all Mongoose documents, ObjectIds, and Dates to pure plain objects
  return JSON.parse(
    JSON.stringify({
      offer,
      products,
      brandMap,
    })
  );
}
