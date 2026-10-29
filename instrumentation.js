export async function register() {
  // LSP price updates are strictly disabled across all environments (dev & production).
  // Strict isolation mode: No schedule, no imports, no execution.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.info("[lsp_cron] STRICTLY DISABLED & ISOLATED (no in-app schedule, API disabled)");

    // Brand status sync cron — runs daily at cron_brand_sync_time (default 00:00 Asia/Kolkata).
    // Gate: cron_brand_sync_run=on (required to enable; missing/off = disabled).
    // Dev gate: cron_brand_sync_run_dev=on (required to run during `npm run dev`).
    // Manual trigger: GET|POST /api/cron/sync-brand-status?secret=<CRON_SECRET>
    const { startBrandSyncCron, isEnvOn } = await import("./lib/brandSyncCron");
    const isProduction = process.env.NODE_ENV === "production";
    const brandEnabled = isEnvOn("cron_brand_sync_run");
    const devGate = isEnvOn("cron_brand_sync_run_dev");

    if (brandEnabled && (isProduction || devGate)) {
      startBrandSyncCron();
    } else {
      const reason = !brandEnabled
        ? "cron_brand_sync_run not set to on"
        : "dev mode — set cron_brand_sync_run_dev=on to enable locally";
      console.info(`[brand_sync_cron] Skipped — ${reason}`);
    }
  }
}
