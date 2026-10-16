import dbConnect from "@/lib/db";
import CronRunLog from "@/models/cron_run_log";
import { runLspProductReport } from "@/lib/lspProductReport";

const JOB = "lsp_price";
const TIME_ENV_KEYS = ["first_time", "second_time", "third_time"];
const CHECK_EVERY_MS = 60 * 1000;
// A slot still runs if the server was down at the exact minute but comes back within this window.
const RUN_WINDOW_MINUTES = 30;

// Accepts "10.00 AM", "10:00 am", "2 PM", "14:00".
export function parseClockTime(value) {
  const match = String(value || "").trim().match(/^(\d{1,2})(?:[.:](\d{2}))?\s*(AM|PM)?$/i);
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

// cron_lsp_price_run_count picks how many of first_time / second_time / third_time run.
// Missing or invalid count means 0 (off); a missing time means that slot does not run.
export function getLspCronSlots() {
  const raw = Number.parseInt(readEnv("cron_lsp_price_run_count") ?? "", 10);
  const count = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), TIME_ENV_KEYS.length) : 0;

  const slots = [];
  for (let i = 0; i < count; i++) {
    const label = String(readEnv(TIME_ENV_KEYS[i]) || "").trim();
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

async function claimSlot(runKey, slot) {
  try {
    await CronRunLog.create({
      job: JOB,
      run_key: runKey,
      slot_time: slot.label,
      status: "running",
      started_at: new Date(),
    });
    return true;
  } catch (err) {
    if (err?.code === 11000) return false;
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
  if (!slots.length) return;

  const { date, minutes } = nowInKolkata();
  const dueSlots = slots.filter(
    (s) => minutes >= s.minutes && minutes < s.minutes + RUN_WINDOW_MINUTES
  );
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
  if (globalThis.__lspPriceCronStarted) return;
  globalThis.__lspPriceCronStarted = true;

  const slots = getLspCronSlots();
  console.info(
    slots.length
      ? `[lsp_cron] Scheduled daily at ${slots.map((s) => s.label).join(", ")} (Asia/Kolkata), mail ${isMailSendOn() ? "on" : "off"}`
      : "[lsp_cron] Off (cron_lsp_price_run_count is 0, missing, or no valid times set)"
  );

  const timer = setInterval(tick, CHECK_EVERY_MS);
  timer.unref?.();
  tick();
}
