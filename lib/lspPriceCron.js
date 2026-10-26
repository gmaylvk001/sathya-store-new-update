import dbConnect from "@/lib/db";
import CronRunLog from "@/models/cron_run_log";
import { runLspProductReport } from "@/lib/lspProductReport";

const JOB = "lsp_price";
const TIME_ENV_KEYS = ["first_time", "second_time", "third_time"];
const CHECK_EVERY_MS = 60 * 1000;

// Accepts "10.00 AM", "10:00 am", "2 PM", "14:00".
export function parseClockTime(value) {
  const raw = String(value || "").trim().replace(/^["']|["']$/g, "");
  const match = raw.match(/^(\d{1,2})(?:[.:](\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3]?.toUpperCase();
  if (minutes > 59) return null;

  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (meridiem === "AM" && hours === 12) hours = 0;
    if (meridiem === "PM" && hours !== 12) hours += 12;
  } else if (hours > 23) {
    return null;
  }
  return hours * 60 + minutes;
}

// Env names are matched case-insensitively (first_time, First_time, FIRST_TIME all work).
export function readEnv(name) {
  const key = Object.keys(process.env).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? process.env[key] : undefined;
}

// on / 1 / true / yes (any case) is on; anything else or missing is off.
export function isEnvOn(name) {
  const value = String(readEnv(name) ?? "").trim().toLowerCase();
  return ["on", "1", "true", "yes"].includes(value);
}

// cron_lsp_price_run_count picks how many of first_time / second_time / third_time are used.
// Missing/invalid count or empty times => no slots => cron does not run.
export function getLspCronSlots() {
  const raw = Number.parseInt(readEnv("cron_lsp_price_run_count") ?? "", 10);
  const count = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), TIME_ENV_KEYS.length) : 0;

  const slots = [];
  for (let i = 0; i < count; i++) {
    const label = String(readEnv(TIME_ENV_KEYS[i]) || "").trim().replace(/^["']|["']$/g, "");
    if (!label) {
      console.warn(`[lsp_cron] ${TIME_ENV_KEYS[i]} is not set in .env, slot ${i + 1} skipped`);
      continue;
    }
    const minutes = parseClockTime(label);
    if (minutes == null) {
      console.warn(`[lsp_cron] Invalid ${TIME_ENV_KEYS[i]}="${label}", slot skipped`);
      continue;
    }
    slots.push({ slot: i + 1, label, minutes });
  }
  return slots;
}

function nowInKolkata() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

// Atomic once-per-day claim. Returns true only on the first insert for this run_key.
async function claimSlot(runKey, slot) {
  try {
    const result = await CronRunLog.updateOne(
      { job: JOB, run_key: runKey },
      {
        $setOnInsert: {
          job: JOB,
          run_key: runKey,
          slot_time: slot.label,
          status: "running",
          started_at: new Date(),
        },
      },
      { upsert: true }
    );
    return result.upsertedCount === 1;
  } catch (err) {
    if (err?.code === 11000 || String(err?.message || "").includes("duplicate key")) {
      return false;
    }
    throw err;
  }
}

function isMailSendOn() {
  return isEnvOn("cron_lsp_price_mail_send");
}

let isRunning = false;

async function tick() {
  if (isRunning) return;

  const slots = getLspCronSlots();
  // Empty schedule => do not run.
  if (!slots.length) return;

  const { date, minutes } = nowInKolkata();
  // Exact-minute only: first_time=11:50 and now=11:52 => skip that slot (no catch-up).
  // Upcoming second_time=12:00 waits until that minute, then runs once.
  const dueSlots = slots.filter((s) => minutes === s.minutes);
  if (!dueSlots.length) return;

  isRunning = true;
  try {
    await dbConnect();
    await CronRunLog.init();

    for (const slot of dueSlots) {
      const runKey = `${date}_${slot.slot}`;
      if (!(await claimSlot(runKey, slot))) continue;

      const sendMail = isMailSendOn();
      console.info(
        `[lsp_cron] Run ${slot.slot} (${slot.label}) started for ${date}, mail ${sendMail ? "on" : "off"}`
      );
      try {
        const result = await runLspProductReport({ sendMail });
        await CronRunLog.updateOne(
          { job: JOB, run_key: runKey },
          { $set: { status: "success", result, finished_at: new Date() } }
        );
        console.info(`[lsp_cron] Run ${slot.slot} finished:`, result);
      } catch (err) {
        await CronRunLog.updateOne(
          { job: JOB, run_key: runKey },
          { $set: { status: "failed", error: err?.message || String(err), finished_at: new Date() } }
        );
        console.error(`[lsp_cron] Run ${slot.slot} failed:`, err?.message || err);
      }
    }
  } catch (err) {
    console.error("[lsp_cron] Scheduler error:", err?.message || err);
  } finally {
    isRunning = false;
  }
}

export function startLspPriceCron() {
  // Replace any previous interval (Next.js / Turbopack HMR can re-register).
  if (globalThis.__lspPriceCronTimer) {
    clearInterval(globalThis.__lspPriceCronTimer);
    globalThis.__lspPriceCronTimer = null;
  }

  const slots = getLspCronSlots();
  console.info(
    slots.length
      ? `[lsp_cron] Exact-time daily at ${slots.map((s) => s.label).join(", ")} (Asia/Kolkata), mail ${isMailSendOn() ? "on" : "off"}`
      : "[lsp_cron] Off (cron_lsp_price_run_count is 0, missing, or no valid times set)"
  );

  const timer = setInterval(tick, CHECK_EVERY_MS);
  timer.unref?.();
  globalThis.__lspPriceCronTimer = timer;
  tick();
}
