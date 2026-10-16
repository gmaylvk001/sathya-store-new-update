export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startLspPriceCron, isEnvOn } = await import("./lib/lspPriceCron");

    // In local next dev the cron runs only when cron_lsp_price_run_dev=on; the live server ignores it.
    const isDev = process.env.NODE_ENV !== "production";
    if (isDev && !isEnvOn("cron_lsp_price_run_dev")) return;

    startLspPriceCron();
  }
}
