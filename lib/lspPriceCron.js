// LSP cron helpers.
// STRICT ISOLATION ACTIVE: LSP cron is completely disabled for development & production.

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

/** Master kill-switch: Strictly disabled */
export const LSP_CRON_STRICTLY_DISABLED = true;

/** Master switch (local + production): Strictly returns false */
export function isLspCronEnabled() {
  if (LSP_CRON_STRICTLY_DISABLED) return false;
  return isEnvOn("cron_lsp_price_run_dev");
}

/** Report mail after a run: Strictly returns false */
export function isLspCronMailEnabled() {
  if (LSP_CRON_STRICTLY_DISABLED) return false;
  return isEnvOn("cron_lsp_price_mail_send");
}
