import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import CronRunLog from "@/models/cron_run_log";
import { runLspProductReport } from "@/lib/lspProductReport";
import { isLspCronEnabled, isLspCronMailEnabled, LSP_CRON_STRICTLY_DISABLED } from "@/lib/lspPriceCron";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const JOB = "lsp_price";

function isAuthorized(req) {
  const secret = process.env.LSP_REPORT_API_TOKEN;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "");
  const querySecret = req.nextUrl?.searchParams?.get("secret");
  return token === secret || querySecret === secret;
}

function todayInKolkata() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

/**
 * GET/POST /api/cron/lsp-product-report
 *
 * STRICT PRODUCTION ISOLATION:
 * LSP Cron is strictly deactivated and isolated across dev and live/production.
 */
async function handle(req) {
  // 🛑 STRICT ISOLATION GUARD: Immediate early exit before any auth/db/fetch logic
  if (LSP_CRON_STRICTLY_DISABLED || !isLspCronEnabled()) {
    return NextResponse.json(
      {
        success: false,
        disabled: true,
        error: "Forbidden",
        message: "LSP Cron and product reporting is strictly disabled and isolated in this build.",
      },
      { status: 403 }
    );
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const mailParam = req.nextUrl.searchParams.get("mail");
  let sendMail = isLspCronMailEnabled();
  if (mailParam === "0") sendMail = false;
  if (mailParam === "1") sendMail = true;

  const runKey = `api_${todayInKolkata()}_${Date.now()}`;
  await dbConnect();
  await CronRunLog.init();

  try {
    await CronRunLog.create({
      job: JOB,
      run_key: runKey,
      slot_time: "api",
      status: "running",
      started_at: new Date(),
    });
  } catch (err) {
    console.warn("[lsp_report] Could not create cron_run_log:", err?.message || err);
  }

  try {
    const result = await runLspProductReport({ sendMail });
    await CronRunLog.updateOne(
      { job: JOB, run_key: runKey },
      { $set: { status: "success", result, finished_at: new Date() } }
    ).catch(() => {});
    return NextResponse.json({ success: true, run_key: runKey, ...result });
  } catch (error) {
    console.error("[lsp_report] LSP Update Error:", error.message);
    await CronRunLog.updateOne(
      { job: JOB, run_key: runKey },
      { $set: { status: "failed", error: error.message || String(error), finished_at: new Date() } }
    ).catch(() => {});
    return NextResponse.json({ success: false, run_key: runKey, error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  return handle(req);
}

export async function POST(req) {
  return handle(req);
}
