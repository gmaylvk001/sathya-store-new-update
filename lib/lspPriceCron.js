// LSP cron helpers. Schedule times are NOT in-app anymore —
// Background LSP cron is COMPLETELY DISABLED to prevent server load.
// On-demand PDP comparison works separately via /api/price-tracker and lib/priceTrackerService.

// Env names are matched case-insensitively.
export function readEnv(name) {
  const key = Object.keys(process.env).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? process.env[key] : undefined;
}

// on / 1 / true / yes (any case) is on; anything else or missing is off.
export function isEnvOn(name) {
  const value = String(readEnv(name) ?? "").trim().toLowerCase();
  return ["on", "1", "true", "yes"].includes(value);
}

/** Master switch: Always false to strictly prevent background execution */
export function isLspCronEnabled() {
  return false;
}

/** Report mail after a run: cron_lsp_price_mail_send */
export function isLspCronMailEnabled() {
  return isEnvOn("cron_lsp_price_mail_send");
}

/**
 * Product details page only — Live Market Comparison /api/price-tracker.
 * Pure on-demand fetch with strict matching. Defaults to enabled unless explicitly set to off.
 */
export function isLspPdpEnabled() {
  const envVal = readEnv("lsp_pdp_live_comparison");
  if (envVal === undefined || envVal === null || envVal === "") {
    return true; // Active on-demand PDP comparison enabled
  }
  return !["off", "0", "false", "no"].includes(String(envVal).trim().toLowerCase());
}
