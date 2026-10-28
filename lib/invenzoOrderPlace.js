import dbConnect from "@/lib/db";
import OrderNew from "@/models/orders_new";
import OrderDetailsNew from "@/models/order_details_new";
import StoreListing from "@/models/store_listings";
import Product from "@/models/product";
import UserAddress from "@/models/ecom_user_address_info";
import User from "@/models/User";
import ShipmentsInvenzo from "@/models/shipments_invenzo";
import {
  invenzoAuthTokenGenerate,
  invenzoClientId,
  invenzoPlaceOrder,
  invenzoStoreCreate,
  isInvenzoServiceEnabled,
} from "@/lib/invenzo";
import { saveInvensoResponseResult } from "@/lib/invensoResponseLog";

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatDt(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function addDays(d, days) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

/**
 * Exist InvensoServices::OrderPlacedToStoreInvenzo
 * Gate: invenso_service_on=on
 *
 * @param {{ orderId?: string, orderNumber?: string, storeCode?: string }} opts
 */
export async function orderPlacedToStoreInvenzo(opts = {}) {
  if (!isInvenzoServiceEnabled()) {
    return {
      skipped: true,
      reason: "invenso_service_on is off",
    };
  }

  await dbConnect();

  const orderId = opts.orderId != null ? String(opts.orderId).trim() : "";
  const orderNumberOpt = opts.orderNumber != null ? String(opts.orderNumber).trim() : "";

  let order = null;
  if (orderId) {
    order = await OrderNew.findById(orderId).lean();
  }
  if (!order && orderNumberOpt) {
    order = await OrderNew.findOne({ order_number: orderNumberOpt }).lean();
  }
  if (!order) {
    return { skipped: false, ok: false, error: "Order not found" };
  }

  const orderNumber = String(order.order_number || "").trim();
  const storeCode = String(
    opts.storeCode || order.pickup_type || order.pickup_store || ""
  ).trim();

  if (!storeCode) {
    return { skipped: false, ok: false, error: "storeCode / pickup_type missing" };
  }

  // 1) Ensure shipments_invenzo row (Exist)
  let shipment = await ShipmentsInvenzo.findOne({ order_number: orderNumber }).lean();
  if (!shipment) {
    shipment = await ShipmentsInvenzo.create({
      user_id: order.user_id != null ? String(order.user_id) : null,
      order_id: orderNumber,
      order_number: orderNumber,
      shipment_no: `SHIP_NO_${Date.now()}`,
      status: "pending",
      tracking_number: null,
    });
    shipment = shipment.toObject ? shipment.toObject() : shipment;
  }

  // 2) Load details / address / user / store
  const details = await OrderDetailsNew.find({
    $or: [{ order_id: String(order._id) }, { orderNumber: orderNumber }],
  }).lean();

  const deliveryId = order.user_adddeliveryid;
  let useradd = null;
  if (deliveryId) {
    if (/^[a-f\d]{24}$/i.test(String(deliveryId))) {
      useradd = await UserAddress.findById(deliveryId).lean();
    }
  }

  let userDoc = null;
  if (order.user_id && /^[a-f\d]{24}$/i.test(String(order.user_id))) {
    userDoc = await User.findById(order.user_id).select("name last_name email mobile").lean();
  }

  const store = await StoreListing.findOne({
    branch_code: { $regex: new RegExp(`^${storeCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    approved: 1,
    verified: 1,
  }).lean();

  const itemCodes = details
    .map((d) => String(d.item_code || "").replace(/^ITEM/, "").trim())
    .filter(Boolean);
  const products = itemCodes.length
    ? await Product.find({ item_code: { $in: itemCodes } })
        .select("item_code title name price brand brand_code")
        .lean()
    : [];
  const productByCode = new Map(
    products.map((p) => [String(p.item_code || "").trim().toLowerCase(), p])
  );

  const userName =
    [userDoc?.name, userDoc?.last_name].filter(Boolean).join(" ").trim() ||
    order.order_username ||
    "";

  const items = (details.length ? details : []).map((d) => {
    const code = String(d.item_code || "").replace(/^ITEM/, "").trim();
    const product = productByCode.get(code.toLowerCase()) || {};
    const salePrice = toNum(d.product_price ?? d.price ?? product.price);
    const qty = toNum(d.quantity) || 1;
    return {
      brandName: product.brand || product.brand_code || "",
      salePrice,
      subtotal: salePrice * qty,
      weightBased: 0,
      itemCode: code || product.item_code || "",
      qty,
      name: d.product_name || product.title || product.name || "",
      gst: 0,
      discount: 0,
      isPromoProduct: 0,
      mrp: toNum(product.price) || salePrice,
    };
  });

  const now = new Date();
  const orderData = {
    clientId: invenzoClientId(),
    loadDateTime: formatDt(now),
    placedOrderTimestamp: formatDt(order.created_at ? new Date(order.created_at) : now),
    deliveryDate: formatDt(addDays(now, 7)),
    storeCode,
    orderId: orderNumber,
    userName,
    userPhone: order.order_phonenumber || userDoc?.mobile || "",
    userEmail: order.email_address || userDoc?.email || "",
    jobType: "Delivery",
    paymentMode: String(order.payment_method || order.payment_mode || "cod").toLowerCase() || "cod",
    deliveryType: "Hyperlocal",
    readForPickUp: true,
    deliverySlotTimes: "",
    deliveryPromise: "SURFACE",
    payableAmount: 0.0,
    totalGstAmount: 0.0,
    grandTotal: items.reduce((s, i) => s + toNum(i.salePrice) * toNum(i.qty), 0),
    subtotal: toNum(order.order_amount),
    totalDiscount: 0.0,
    isExchange: 0,
    paidAmount: 0.0,
    weightInGrams: 0.0,
    lengthInCm: 0.0,
    heightInCm: 0.0,
    valumaticWeight: 0.0,
    distanceInKm: 0.0,
    widthInCm: 0.0,
    alternateContact: "",
    additionalInfo: "",
    promoCode: "",
    eligibleToUploadTaxInvoice: 0,
    shippingAddress: {
      addressLine1: order.order_deliveryaddress || useradd?.address || "",
      addressLine2: "",
      city: useradd?.city || "",
      state: useradd?.state || "",
      country: "India",
      latitude: toNum(useradd?.latitude) || 12.9768722,
      longitude: toNum(useradd?.longitude) || 80.2181865,
      pincode: String(useradd?.postCode || useradd?.pincode || "").trim(),
    },
    items,
    exchangeItems: [],
  };

  const logMeta = {
    user_id: order.user_id != null ? String(order.user_id) : null,
    order_number: orderNumber,
  };

  // 3) Auth
  const tokenResult = await invenzoAuthTokenGenerate();
  await saveInvensoResponseResult({
    ...logMeta,
    call_type: "auth",
    response: tokenResult.raw ?? {
      ok: tokenResult.ok,
      error: tokenResult.error,
      httpStatus: tokenResult.httpStatus ?? null,
    },
  });
  if (!tokenResult.ok || !tokenResult.token) {
    return {
      skipped: false,
      ok: false,
      error: tokenResult.error || "Failed to invenzo token Create",
      shipment_no: shipment.shipment_no,
      auth: tokenResult,
    };
  }

  // 4) Store create (Exist: success OR "Store Code already exists")
  const nowTime = formatDt(now).split(" ")[1] || "09:30:00";
  const storePayload = {
    clientId: invenzoClientId(),
    storeCode: store?.branch_code || storeCode,
    storeName: store?.slug || store?.title || storeCode,
    contactNumber: store?.phone_afterhours || store?.phone || "",
    email: store?.email || "",
    hyperLocalServingRadiusInKm: 10,
    address: store?.address || "",
    storeLocation: "",
    pincode: store?.zipcode != null ? String(store.zipcode) : "",
    city: "",
    state: "",
    country: "India",
    latitude: store?.latitude != null ? Number(store.latitude) : null,
    longitude: store?.longitude != null ? Number(store.longitude) : null,
    serviceStartTime: nowTime,
    serviceEndTime: null,
  };

  const storeResult = await invenzoStoreCreate(storePayload, tokenResult.token);
  await saveInvensoResponseResult({
    ...logMeta,
    call_type: "store_create",
    response: storeResult.raw ?? {
      ok: storeResult.ok,
      status: storeResult.status,
      message: storeResult.message,
      httpStatus: storeResult.httpStatus ?? null,
    },
  });
  if (!storeResult.ok) {
    return {
      skipped: false,
      ok: false,
      error: "Failed Invenzo Store Create",
      store: storeResult,
      shipment_no: shipment.shipment_no,
    };
  }

  // 5) Job create
  const jobResult = await invenzoPlaceOrder(orderData, tokenResult.token);
  await saveInvensoResponseResult({
    ...logMeta,
    call_type: "job_create",
    response: jobResult.raw ?? {
      ok: jobResult.ok,
      message: jobResult.message,
      httpStatus: jobResult.httpStatus ?? null,
    },
  });
  return {
    skipped: false,
    ok: jobResult.ok,
    error: jobResult.ok ? null : jobResult.message || "Invenzo job create failed",
    shipment_no: shipment.shipment_no,
    store: storeResult,
    job: jobResult,
    order_number: orderNumber,
    storeCode,
  };
}
