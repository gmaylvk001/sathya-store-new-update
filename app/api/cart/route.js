import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Cart from "@/models/ecom_cart_info";
import Product from "@/models/product";
import OwnerProduct from "@/models/OwnerProduct";
import jwt from "jsonwebtoken";
import { normalizeRegion, isKarnatakaPincode } from "@/lib/regionHelper";
import { resolveProductPrice } from "@/lib/priceResolver";
import { isExtendedWarrantyEligible } from "@/lib/productServiceEligibility";
import { isMovementAllowed } from "@/lib/addCartConfig";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Extract token from Authorization header **/
const extractToken = (req) => {
  const authHeader = req.headers.get("authorization");
  return authHeader?.split(" ")[1] || null;
};

/** Verify token safely without throwing uncaught errors **/
const verifyTokenSafe = (token) => {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded?.userId || null;
  } catch {
    return null;
  }
};

/** Get Cart Owner (userId or guestId) safely **/
const getCartIdentifier = (req, body = {}) => {
  const token = extractToken(req);
  const userId = verifyTokenSafe(token);

  if (userId) {
    return { userId, guestId: null };
  }

  let queryGuestId = null;
  try {
    if (req?.url) {
      const url = new URL(req.url);
      queryGuestId = url.searchParams.get("guestCartId") || url.searchParams.get("guestId");
    }
  } catch {}

  const guestId =
    body.guestCartId ||
    body.guestId ||
    queryGuestId ||
    req.headers.get("guestcartid") ||
    req.headers.get("guestCartId") ||
    req.headers.get("GuestCartId") ||
    req.headers.get("x-guest-cart-id") ||
    req.cookies.get("guestCartId")?.value ||
    null;

  return { userId: null, guestId };
};

const calculateCartTotals = (items = []) => {
  let totalItems = 0;
  let totalPrice = 0;

  for (const item of items) {
    const base = (item.price || 0) * (item.quantity || 1);
    const warranty = Number(item.warranty || 0);
    const extended = Number(
      item.extendedWarranty ||
      item.warrantyData?.amount ||
      item.warrantyData?.price ||
      0
    );
    const upsells = item.upsells?.reduce((uSum, u) => uSum + (u.price || 0), 0) || 0;

    totalItems += item.quantity || 1;
    totalPrice += base + warranty + extended + upsells;
  }

  return { totalItems, totalPrice };
};

async function getQuantity(item_code) {
  if (!item_code) return null;
  const product = await Product.findOne({ item_code }).lean();
  return product?.quantity ?? null;
}

/** POST - Add to Cart **/
export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const {
      productId,
      quantity = 1,
      selectedWarranty = 0,
      selectedExtendedWarranty = 0,
      upsellProducts = [],
      warrantyData = null,
      selectedVariant = null,
      variantValues = null,
      color = null,
      region: reqRegion,
      pincode: reqPincode,
    } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const prodQty = Number(product.quantity ?? product.stock ?? 0);
    const prodStatus = String(product.stock_status || (prodQty > 0 ? "In Stock" : "")).trim();
    if (prodStatus === "Out of Stock" || prodStatus === "outofstock" || prodQty <= 0) {
      return NextResponse.json(
        { error: "This product is currently out of stock." },
        { status: 400 }
      );
    }

    if (prodQty < 10 && !isMovementAllowed(product.movement)) {
      return NextResponse.json(
        { error: "This product is sold out online and only available for in-store purchase." },
        { status: 400 }
      );
    }

    const { userId, guestId: rawGuestId } = getCartIdentifier(req, body);
    const guestId = rawGuestId || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Determine user region
    const cookieLoc = req.cookies.get("sathya_location")?.value;
    let userRegion = "tamilnadu";
    if (cookieLoc) {
      try {
        const parsed = JSON.parse(cookieLoc);
        userRegion = normalizeRegion(parsed.region || parsed.state || parsed.stateName);
      } catch { }
    } else if (reqRegion) {
      userRegion = normalizeRegion(reqRegion);
    } else if (reqPincode && isKarnatakaPincode(reqPincode)) {
      userRegion = "karnataka";
    }

    let ownerProduct = null;
    if (userRegion === "karnataka") {
      ownerProduct = await OwnerProduct.findOne({
        $or: [{ product_id: product._id }, { product_item_code: product.item_code }],
        is_active: true,
      }).lean();

      if (!ownerProduct || ownerProduct.stock <= 0 || ownerProduct.stock_status === "Out of Stock") {
        return NextResponse.json(
          { error: "Not Available for Delivery at Your Location" },
          { status: 400 }
        );
      }
    }

    const priceInfo = resolveProductPrice(product, ownerProduct, userRegion);
    const itemEffectivePrice = priceInfo.effectivePrice;

    const query = userId ? { userId } : { guestId };
    let cart = await Cart.findOne(query);

    if (!cart) {
      cart = new Cart({ ...(userId ? { userId } : { guestId }), items: [] });
    }

    // add/update item
    const existingItemIndex = cart.items.findIndex((item) => {
      const itemProdId = item.productId?._id
        ? item.productId._id.toString()
        : item.productId?.toString();
      return itemProdId === productId.toString();
    });

    const availableStock = priceInfo.stock;

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;

      if (availableStock && availableStock < cart.items[existingItemIndex].quantity) {
        return NextResponse.json(
          { error: "Requested quantity exceeds available stock." },
          { status: 409 }
        );
      }
      cart.items[existingItemIndex].price = itemEffectivePrice;
      cart.items[existingItemIndex].actual_price = priceInfo.price;
      const isWarrantyEligible = Boolean(warrantyData) || Number(selectedExtendedWarranty || 0) > 0 || Number(selectedWarranty || 0) > 0 || isExtendedWarrantyEligible(product);
      const effectiveExtendedWarranty = isWarrantyEligible
        ? Number(selectedExtendedWarranty || warrantyData?.amount || warrantyData?.price || 0)
        : 0;
      const effectiveWarranty = isWarrantyEligible ? Number(selectedWarranty || warrantyData?.year || 0) : 0;
      const effectiveWarrantyData = isWarrantyEligible && (warrantyData || effectiveExtendedWarranty > 0 || effectiveWarranty > 0)
        ? {
            item_no: warrantyData?.item_no || null,
            name: warrantyData?.name || warrantyData?.title || (warrantyData?.year || effectiveWarranty ? `${warrantyData?.year || effectiveWarranty} Year Extended Warranty` : "Extended Warranty"),
            title: warrantyData?.title || warrantyData?.name || (warrantyData?.year || effectiveWarranty ? `${warrantyData?.year || effectiveWarranty} Year Extended Warranty` : "Extended Warranty"),
            year: Number(warrantyData?.year || effectiveWarranty || 0),
            duration: warrantyData?.duration || (warrantyData?.year || effectiveWarranty ? `${warrantyData?.year || effectiveWarranty} Year` : ""),
            price: effectiveExtendedWarranty,
          }
        : null;

      // Resolve variant attributes
      let resolvedVariantValues = variantValues || selectedVariant || cart.items[existingItemIndex].variantValues || null;
      let resolvedColor = color || cart.items[existingItemIndex].color || null;
      if (!resolvedVariantValues && product.variantGroupId) {
        try {
          const VariantGroup = (await import("@/models/variantGroup")).default;
          const vg = await VariantGroup.findById(product.variantGroupId).lean();
          if (vg?.products?.length) {
            const match = vg.products.find(p => String(p.productId) === String(product._id));
            if (match?.values && Object.keys(match.values).length > 0) {
              resolvedVariantValues = match.values;
              if (match.values.Color || match.values.color) {
                resolvedColor = match.values.Color || match.values.color;
              }
            }
          }
        } catch (vgErr) {
          console.warn("Variant resolve error:", vgErr);
        }
      }
      if (!resolvedVariantValues && (product.color || product.size || product.star)) {
        resolvedVariantValues = {};
        if (product.color) resolvedVariantValues.Color = product.color;
        if (product.size) resolvedVariantValues.Size = product.size;
        if (product.star) resolvedVariantValues["Star Rating"] = `${product.star} Star`;
      }
      if (!resolvedColor && (resolvedVariantValues?.Color || resolvedVariantValues?.color)) {
        resolvedColor = resolvedVariantValues.Color || resolvedVariantValues.color;
      }

      cart.items[existingItemIndex].warranty = effectiveWarranty;
      cart.items[existingItemIndex].extendedWarranty = effectiveExtendedWarranty;
      cart.items[existingItemIndex].warrantyData = effectiveWarrantyData;
      cart.items[existingItemIndex].variantValues = resolvedVariantValues;
      cart.items[existingItemIndex].selectedVariant = resolvedVariantValues;
      cart.items[existingItemIndex].color = resolvedColor;
    } else {
      const isWarrantyEligible = Boolean(warrantyData) || Number(selectedExtendedWarranty || 0) > 0 || Number(selectedWarranty || 0) > 0 || isExtendedWarrantyEligible(product);
      const effectiveExtendedWarranty = isWarrantyEligible
        ? Number(selectedExtendedWarranty || warrantyData?.amount || warrantyData?.price || 0)
        : 0;
      const effectiveWarranty = isWarrantyEligible ? Number(selectedWarranty || warrantyData?.year || 0) : 0;
      const effectiveWarrantyData = isWarrantyEligible && (warrantyData || effectiveExtendedWarranty > 0 || effectiveWarranty > 0)
        ? {
            item_no: warrantyData?.item_no || null,
            name: warrantyData?.name || warrantyData?.title || (warrantyData?.year || effectiveWarranty ? `${warrantyData?.year || effectiveWarranty} Year Extended Warranty` : "Extended Warranty"),
            title: warrantyData?.title || warrantyData?.name || (warrantyData?.year || effectiveWarranty ? `${warrantyData?.year || effectiveWarranty} Year Extended Warranty` : "Extended Warranty"),
            year: Number(warrantyData?.year || effectiveWarranty || 0),
            duration: warrantyData?.duration || (warrantyData?.year || effectiveWarranty ? `${warrantyData?.year || effectiveWarranty} Year` : ""),
            price: effectiveExtendedWarranty,
          }
        : null;

      // Resolve variant attributes
      let resolvedVariantValues = variantValues || selectedVariant || null;
      let resolvedColor = color || null;
      if (!resolvedVariantValues && product.variantGroupId) {
        try {
          const VariantGroup = (await import("@/models/variantGroup")).default;
          const vg = await VariantGroup.findById(product.variantGroupId).lean();
          if (vg?.products?.length) {
            const match = vg.products.find(p => String(p.productId) === String(product._id));
            if (match?.values && Object.keys(match.values).length > 0) {
              resolvedVariantValues = match.values;
              if (match.values.Color || match.values.color) {
                resolvedColor = match.values.Color || match.values.color;
              }
            }
          }
        } catch (vgErr) {
          console.warn("Variant resolve error:", vgErr);
        }
      }
      if (!resolvedVariantValues && (product.color || product.size || product.star)) {
        resolvedVariantValues = {};
        if (product.color) resolvedVariantValues.Color = product.color;
        if (product.size) resolvedVariantValues.Size = product.size;
        if (product.star) resolvedVariantValues["Star Rating"] = `${product.star} Star`;
      }
      if (!resolvedColor && (resolvedVariantValues?.Color || resolvedVariantValues?.color)) {
        resolvedColor = resolvedVariantValues.Color || resolvedVariantValues.color;
      }

      const productImage =
        Array.isArray(product.images) && product.images.length > 0
          ? product.images[0]
          : typeof product.images === "string"
            ? product.images
            : "";

      cart.items.push({
        item_code: product.item_code || "",
        productId: product._id,
        quantity,
        price: itemEffectivePrice,
        name: product.name,
        image: productImage,
        warranty: effectiveWarranty,
        extendedWarranty: effectiveExtendedWarranty,
        warrantyData: effectiveWarrantyData,
        variantValues: resolvedVariantValues,
        selectedVariant: resolvedVariantValues,
        color: resolvedColor,
        actual_price: priceInfo.price,
      });
    }

    // totals
    const totals = calculateCartTotals(cart.items);
    cart.totalItems = totals.totalItems;
    cart.totalPrice = totals.totalPrice;

    await cart.save();

    return NextResponse.json(
      {
        message: "Product added",
        guestCartId: userId ? null : guestId,
        cart: { id: cart._id, ...totals, items: cart.items },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST cart error:", error);
    return NextResponse.json({ error: error.message || "Failed to add to cart" }, { status: 500 });
  }
}

/** GET - Fetch Cart **/
export async function GET(req) {
  try {
    await connectDB();
    const { userId, guestId } = getCartIdentifier(req);

    if (!userId && !guestId) {
      return NextResponse.json(
        { message: "Cart is empty", cart: { items: [], totalItems: 0, totalPrice: 0 } },
        { status: 200 }
      );
    }

    const query = userId ? { userId } : { guestId };
    const cart = await Cart.findOne(query).populate(
      "items.productId",
      "name price special_price images item_code quantity key_specifications stock_status movement slug"
    );

    if (!cart || !cart.items || cart.items.length === 0) {
      return NextResponse.json(
        { message: "Cart is empty", cart: { items: [], totalItems: 0, totalPrice: 0 } },
        { status: 200 }
      );
    }

    // Determine user region for region-specific pricing (e.g., Unilet / Karnataka)
    const cookieLoc = req.cookies.get("sathya_location")?.value;
    let userRegion = "tamilnadu";
    if (cookieLoc) {
      try {
        const parsed = JSON.parse(cookieLoc);
        userRegion = normalizeRegion(parsed.region || parsed.state || parsed.stateName);
      } catch {}
    }

    let cartModified = false;
    const priceChanges = [];

    const items = await Promise.all(
      cart.items.map(async (item) => {
        let prodDoc =
          item.productId && typeof item.productId === "object" && item.productId._id
            ? item.productId
            : null;

        if (!prodDoc) {
          if (item.productId) {
            prodDoc = await Product.findById(item.productId).lean();
          }
          if (!prodDoc && (item.item_code || item.itemCode)) {
            prodDoc = await Product.findOne({ item_code: item.item_code || item.itemCode }).lean();
          }
        }

        const prodId = prodDoc ? prodDoc._id.toString() : item.productId?.toString();
        const itemCode = prodDoc?.item_code || item.item_code || "";
        const original_quantity = await getQuantity(itemCode);

        const prodImg = Array.isArray(prodDoc?.images) && prodDoc.images.length > 0
          ? prodDoc.images[0]
          : item.image || "";

        let liveSellingPrice = Number(item.price) || 0;
        let liveActualPrice = Number(item.actual_price) || Number(prodDoc?.price) || liveSellingPrice;

        if (prodDoc) {
          let ownerProduct = null;
          if (userRegion === "karnataka") {
            ownerProduct = await OwnerProduct.findOne({
              $or: [{ product_id: prodDoc._id }, { product_item_code: prodDoc.item_code }],
              is_active: true,
            }).lean();
          }

          const priceInfo = resolveProductPrice(prodDoc, ownerProduct, userRegion);
          const resolvedSellingPrice = priceInfo.effectivePrice;
          const resolvedActualPrice = priceInfo.price;

          if (resolvedSellingPrice > 0) {
            const oldPrice = Number(item.price) || 0;
            if (oldPrice > 0 && oldPrice !== resolvedSellingPrice) {
              priceChanges.push({
                productId: prodId,
                name: prodDoc.name || item.name,
                oldPrice,
                newPrice: resolvedSellingPrice,
              });
              item.price = resolvedSellingPrice;
              cartModified = true;
            } else if (item.price !== resolvedSellingPrice) {
              item.price = resolvedSellingPrice;
              cartModified = true;
            }
            liveSellingPrice = resolvedSellingPrice;
          }

          if (resolvedActualPrice > 0) {
            if (Number(item.actual_price) !== resolvedActualPrice) {
              item.actual_price = resolvedActualPrice;
              cartModified = true;
            }
            liveActualPrice = resolvedActualPrice;
          }
        }

        // Resolve variant attributes if not stored on item
        let itemVariantValues = item.variantValues || item.selectedVariant || null;
        let itemColor = item.color || null;

        if (!itemVariantValues && prodDoc?.variantGroupId) {
          try {
            const VariantGroup = (await import("@/models/variantGroup")).default;
            const vg = await VariantGroup.findById(prodDoc.variantGroupId).lean();
            if (vg?.products?.length) {
              const match = vg.products.find(p => String(p.productId) === String(prodDoc._id));
              if (match?.values && Object.keys(match.values).length > 0) {
                itemVariantValues = match.values;
                if (match.values.Color || match.values.color) {
                  itemColor = match.values.Color || match.values.color;
                }
              }
            }
          } catch (vgErr) {
            console.warn("Error resolving variant values in GET cart:", vgErr);
          }
        }

        if (!itemVariantValues && (prodDoc?.color || prodDoc?.size || prodDoc?.star)) {
          itemVariantValues = {};
          if (prodDoc.color) itemVariantValues.Color = prodDoc.color;
          if (prodDoc.size) itemVariantValues.Size = prodDoc.size;
          if (prodDoc.star) itemVariantValues["Star Rating"] = `${prodDoc.star} Star`;
        }
        if (!itemColor && (itemVariantValues?.Color || itemVariantValues?.color)) {
          itemColor = itemVariantValues.Color || itemVariantValues.color;
        }

        let normalizedWarrantyData = item.warrantyData || null;
        const hasWarranty =
          Boolean(Number(item.extendedWarranty || 0) > 0) ||
          Boolean(Number(item.warranty || 0) > 0) ||
          Boolean(Number(normalizedWarrantyData?.price || 0) > 0) ||
          Boolean(Number(normalizedWarrantyData?.year || 0) > 0);

        if (!hasWarranty) {
          normalizedWarrantyData = null;
        } else if (!normalizedWarrantyData && (item.extendedWarranty > 0 || item.warranty > 0)) {
          normalizedWarrantyData = {
            item_no: null,
            name: item.warranty > 0 ? `${item.warranty} Year Extended Warranty` : "Extended Warranty",
            title: item.warranty > 0 ? `${item.warranty} Year Extended Warranty` : "Extended Warranty",
            year: Number(item.warranty || 0),
            price: Number(item.extendedWarranty || 0),
            duration: item.warranty > 0 ? `${item.warranty} Year` : "",
          };
        } else if (normalizedWarrantyData && !normalizedWarrantyData.name && !normalizedWarrantyData.title) {
          normalizedWarrantyData = {
            ...normalizedWarrantyData,
            name: normalizedWarrantyData.year ? `${normalizedWarrantyData.year} Year Extended Warranty` : "Extended Warranty",
            title: normalizedWarrantyData.year ? `${normalizedWarrantyData.year} Year Extended Warranty` : "Extended Warranty",
          };
        }

        return {
          original_quantity,
          item_code: itemCode,
          productId: prodId,
          name: prodDoc?.name || item.name,
          price: liveSellingPrice,
          image: prodImg,
          quantity: item.quantity,
          warranty: item.warranty || 0,
          extendedWarranty: item.extendedWarranty || 0,
          warrantyData: normalizedWarrantyData,
          variantValues: itemVariantValues,
          selectedVariant: itemVariantValues,
          color: itemColor || prodDoc?.color || null,
          actual_price: liveActualPrice,
          specs: prodDoc?.key_specifications?.slice(0, 3) || [],
          slug: prodDoc?.slug || "",
        };
      })
    );

    const totals = calculateCartTotals(cart.items);

    if (cartModified) {
      cart.totalItems = totals.totalItems;
      cart.totalPrice = totals.totalPrice;
      cart.markModified("items");
      cart.markModified("totalPrice");
      cart.markModified("totalItems");
      await cart.save();
    }

    const response = NextResponse.json(
      {
        cart: {
          id: cart._id,
          totalItems: totals.totalItems,
          totalPrice: totals.totalPrice,
          items,
          priceChanges,
          hasPriceChanges: priceChanges.length > 0,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );

    if (!userId && guestId) {
      response.cookies.set("guestCartId", guestId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
      });
    }

    return response;
  } catch (error) {
    console.error("GET cart error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch cart" }, { status: 500 });
  }
}

/** PUT - Update Quantity **/
export async function PUT(req) {
  try {
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const { productId, quantity } = body;
    if (!productId || quantity < 1) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { userId, guestId } = getCartIdentifier(req, body);
    if (!userId && !guestId) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    const query = userId ? { userId } : { guestId };
    const cart = await Cart.findOne(query).populate(
      "items.productId",
      "name price special_price images item_code quantity key_specifications stock_status movement"
    );

    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    const itemIndex = cart.items.findIndex((item) => {
      const itemProdId = item.productId?._id
        ? item.productId._id.toString()
        : item.productId?.toString();
      const itemId = item._id ? item._id.toString() : null;
      return (
        itemProdId === productId.toString() ||
        itemId === productId.toString() ||
        item.item_code === productId
      );
    });

    if (itemIndex === -1) {
      return NextResponse.json({ error: "Product not in cart" }, { status: 404 });
    }

    // Determine user region
    const cookieLoc = req.cookies.get("sathya_location")?.value;
    let userRegion = "tamilnadu";
    if (cookieLoc) {
      try {
        const parsed = JSON.parse(cookieLoc);
        userRegion = normalizeRegion(parsed.region || parsed.state || parsed.stateName);
      } catch {}
    } else if (body.region) {
      userRegion = normalizeRegion(body.region);
    }

    // Re-sync latest catalog prices for items in the cart
    await Promise.all(
      cart.items.map(async (item) => {
        let prodDoc =
          item.productId && typeof item.productId === "object" && item.productId._id
            ? item.productId
            : null;
        if (!prodDoc) {
          if (item.productId) {
            prodDoc = await Product.findById(item.productId).lean();
          }
          if (!prodDoc && (item.item_code || item.itemCode)) {
            prodDoc = await Product.findOne({ item_code: item.item_code || item.itemCode }).lean();
          }
        }
        if (prodDoc) {
          let ownerProduct = null;
          if (userRegion === "karnataka") {
            ownerProduct = await OwnerProduct.findOne({
              $or: [{ product_id: prodDoc._id }, { product_item_code: prodDoc.item_code }],
              is_active: true,
            }).lean();
          }
          const priceInfo = resolveProductPrice(prodDoc, ownerProduct, userRegion);
          if (priceInfo.effectivePrice > 0) {
            item.price = priceInfo.effectivePrice;
          }
          if (priceInfo.price > 0) {
            item.actual_price = priceInfo.price;
          }
        }
      })
    );

    cart.items[itemIndex].quantity = quantity;
    const item_code = cart.items[itemIndex].item_code || cart.items[itemIndex].productId?.item_code;
    const original_quantity = await getQuantity(item_code);
    const totals = calculateCartTotals(cart.items);
    cart.totalItems = totals.totalItems;
    cart.totalPrice = totals.totalPrice;
    cart.items[itemIndex].original_quantity = original_quantity;

    cart.markModified("items");
    cart.markModified("totalPrice");
    cart.markModified("totalItems");
    await cart.save();

    const items = cart.items.map((item) => {
      const prodIdStr = item.productId?._id
        ? item.productId._id.toString()
        : item.productId?.toString();
      const img = Array.isArray(item.productId?.images)
        ? item.productId.images[0]
        : item.image || "";
      const code = item.productId?.item_code || item.item_code;
      return {
        productId: prodIdStr,
        name: item.name,
        price: item.price,
        actual_price: item.actual_price || item.price,
        image: img,
        quantity: item.quantity,
        item_code: code,
        warranty: item.warranty || 0,
        extendedWarranty: item.extendedWarranty || 0,
        warrantyData: item.warrantyData || null,
        variantValues: item.variantValues || null,
        selectedVariant: item.selectedVariant || null,
        color: item.color || null,
        slug: item.slug || item.productId?.slug || "",
        original_quantity: item.original_quantity ?? null,
      };
    });

    return NextResponse.json(
      {
        message: "Cart updated",
        cart: {
          id: cart._id,
          ...totals,
          items,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("PUT cart error:", error);
    return NextResponse.json({ error: error.message || "Failed to update cart" }, { status: 500 });
  }
}

/** DELETE - Remove Item / Clear Cart **/
export async function DELETE(req) {
  try {
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const { productId, clearAll } = body;
    const { userId, guestId } = getCartIdentifier(req, body);

    if (!userId && !guestId) {
      return NextResponse.json(
        {
          message: "Cart is empty",
          cart: { id: null, totalItems: 0, totalPrice: 0, items: [] },
        },
        { status: 200 }
      );
    }

    const query = userId ? { userId } : { guestId };
    let cart = await Cart.findOne(query);

    if (!cart) {
      return NextResponse.json(
        {
          message: "Cart is empty",
          cart: { id: null, totalItems: 0, totalPrice: 0, items: [] },
        },
        { status: 200 }
      );
    }

    if (clearAll) {
      cart.items = [];
      cart.totalItems = 0;
      cart.totalPrice = 0;
    } else if (productId) {
      const existingItemIndex = cart.items.findIndex((item) => {
        const itemProdId = item.productId?._id
          ? item.productId._id.toString()
          : item.productId?.toString();
        const itemId = item._id ? item._id.toString() : null;
        return (
          itemProdId === productId.toString() ||
          itemId === productId.toString() ||
          item.item_code === productId
        );
      });

      if (existingItemIndex !== -1) {
        cart.items.splice(existingItemIndex, 1);
      }

      const totals = calculateCartTotals(cart.items);
      cart.totalItems = totals.totalItems;
      cart.totalPrice = totals.totalPrice;
    }

    await cart.save();

    return NextResponse.json(
      {
        message: clearAll ? "Cart cleared" : "Item removed from cart",
        cart: {
          id: cart._id,
          totalItems: cart.totalItems,
          totalPrice: cart.totalPrice,
          items: cart.items,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Remove from cart error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update cart" },
      { status: 500 }
    );
  }
}
