export async function register() {
  // LSP price updates are no longer scheduled inside Next.js.
  // Trigger them with crontab / curl / browser:
  //   GET|POST /api/cron/lsp-product-report?secret=<LSP_REPORT_API_TOKEN>
  // Gate: cron_lsp_price_run_dev=on  |  Mail: cron_lsp_price_mail_send=on|off
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { isLspCronEnabled, isLspCronMailEnabled } = await import("./lib/lspPriceCron");
    console.info(
      `[lsp_cron] API mode — enabled=${isLspCronEnabled() ? "on" : "off"}, mail=${isLspCronMailEnabled() ? "on" : "off"} (no in-app schedule)`
    );
  }
}
