export async function register() {
  // LSP price updates are strictly disabled across all environments (dev & production).
  // Strict isolation mode: No schedule, no imports, no execution.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.info("[lsp_cron] STRICTLY DISABLED & ISOLATED (no in-app schedule, API disabled)");
  }
}
