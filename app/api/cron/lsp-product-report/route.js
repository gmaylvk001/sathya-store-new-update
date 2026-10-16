import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { runLspProductReport } from "@/lib/lspProductReport";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(req) {
  const secret = process.env.LSP_REPORT_API_TOKEN;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "");
  const querySecret = req.nextUrl?.searchParams?.get("secret");
  return token === secret || querySecret === secret;
}

/**
 * GET/POST /api/cron/lsp-product-report
 * Exist artisan command LspProductReport (ProductReportForLSP).
 * Auth: Authorization: Bearer <LSP_REPORT_API_TOKEN> or ?secret=<token>
 * ?mail=0 updates products without sending the report email.
 */
export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const sendMail = req.nextUrl.searchParams.get("mail") !== "0";
    const result = await runLspProductReport({ sendMail });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[lsp_report] LSP Update Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  return GET(req);
}
