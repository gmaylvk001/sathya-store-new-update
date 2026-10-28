import { isEnvOn, readEnv } from "@/lib/lspPriceCron";

/**
 * Invenzo / Izoleap API client (Exist InvensoServices).
 * Master switch: invenso_service_on=on|off (missing = off)
 */

export function isInvenzoServiceEnabled() {
  return isEnvOn("invenso_service_on");
}

function getClientId() {
  return String(readEnv("INVENZO_CLIENT_ID") || "sathyastore").trim();
}

function getAuthKey() {
  return String(readEnv("INVENZO_AUTH_KEY") || "").trim();
}

function getBaseUrl() {
  return String(
    readEnv("INVENZO_API_BASE_URL") || "https://izowhizv2-s-api.izoleap.com"
  )
    .trim()
    .replace(/\/+$/, "");
}

export async function invenzoAuthTokenGenerate() {
  const authKey = getAuthKey();
  if (!authKey) {
    return { ok: false, token: null, error: "INVENZO_AUTH_KEY is missing", raw: null };
  }

  const url = `${getBaseUrl()}/v2/generate/auth/`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: getClientId(),
        authKey,
      }),
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    const token = json?.token || null;
    return {
      ok: Boolean(token),
      token,
      error: token ? null : "Failed to generate Invenzo token",
      raw: json,
      httpStatus: res.status,
    };
  } catch (err) {
    return {
      ok: false,
      token: null,
      error: err.message || "Invenzo auth request failed",
      raw: null,
    };
  }
}

/**
 * Exist storeCreate — Listing by branch_code, approved=1, verified=1
 */
export async function invenzoStoreCreate(storePayload, token) {
  const url = `${getBaseUrl()}/v2/store/create`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(storePayload),
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    const message = json?.message != null ? String(json.message) : "";
    const status = json?.status != null ? String(json.status) : "";
    const ok =
      status.toLowerCase() === "success" ||
      message.toLowerCase() === "store code already exists";
    return { ok, status, message, raw: json, httpStatus: res.status };
  } catch (err) {
    return {
      ok: false,
      status: "failure",
      message: err.message || "Invenzo store create failed",
      raw: null,
    };
  }
}

/** Exist placeOrder → POST /v2/job/create */
export async function invenzoPlaceOrder(orderData, token) {
  const url = `${getBaseUrl()}/v2/job/create`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    return {
      ok: res.ok,
      httpStatus: res.status,
      raw: json,
      message: json?.message || null,
    };
  } catch (err) {
    return {
      ok: false,
      httpStatus: null,
      raw: null,
      message: err.message || "Invenzo job create failed",
    };
  }
}

export function invenzoClientId() {
  return getClientId();
}
