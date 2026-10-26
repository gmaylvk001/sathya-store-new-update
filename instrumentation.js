export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startLspPriceCron, isEnvOn } = await import("./lib/lspPriceCron");

    // Local and production: cron starts only when cron_lsp_price_run_dev=on (off / missing = do not start).
    if (!isEnvOn("cron_lsp_price_run_dev")) return;

    startLspPriceCron();
  }
}
