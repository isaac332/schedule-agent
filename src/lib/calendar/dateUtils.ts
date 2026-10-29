import { STUDIO_HOURS } from "../studio/config";
import type { DaySchedule } from "../studio/types";

export function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDateString(dateStr);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

export function getDayScheduleForDate(dateStr: string): DaySchedule {
  const d = parseDateString(dateStr);
  const dow = d.getDay();
  return STUDIO_HOURS.find((h) => h.dayOfWeek === dow) || STUDIO_HOURS[0];
}

export function timeToMinutes(time24: string): number {
  const [hh, mm] = time24.split(":").map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

export function minutesToTime(totalMinutes: number): string {
  const hh = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function formatTime12h(time24: string): string {
  const [hhRaw, mmRaw] = time24.split(":").map(Number);
  const hh = hhRaw || 0;
  const mm = mmRaw || 0;
  const period = hh >= 12 ? "PM" : "AM";
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${hour12}:${String(mm).padStart(2, "0")} ${period}`;
}

export function formatPrettyDate(dateStr: string): string {
  const d = parseDateString(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getNextOpenStudioDates(fromDateStr: string, count: number): string[] {
  const dates: string[] = [];
  let cursor = fromDateStr;
  let safety = 0;
  while (dates.length < count && safety < 30) {
    const sched = getDayScheduleForDate(cursor);
    if (sched.isOpen) {
      dates.push(cursor);
    }
    cursor = addDays(cursor, 1);
    safety++;
  }
  return dates;
}

/**
 * Normalizes flexible time inputs from user or LLM like "2pm", "2:30 PM", "14:00" into "HH:mm"
 */
export function normalizeTimeInput(input: string): string {
  const raw = input.trim().toLowerCase();
  const match = raw.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return raw;
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3]?.toLowerCase();

  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
