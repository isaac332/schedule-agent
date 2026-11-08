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

export function formatPrettyDate(dateStr: string, locale: string = "es-MX"): string {
  const d = parseDateString(dateStr);
  const formatted = d.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  // Capitalize first letter (e.g. "sáb, 14 nov 2026" -> "Sáb, 14 nov 2026")
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function getNextOpenStudioDates(fromDateStr: string, count: number): string[] {
  const dates: string[] = [];
  let cursor = fromDateStr;
  let safety = 0;
  while (dates.length < count && safety < 120) {
    const sched = getDayScheduleForDate(cursor);
    if (sched.isOpen) {
      dates.push(cursor);
    }
    cursor = addDays(cursor, 1);
    safety++;
  }
  return dates;
}

export interface CalendarDayCell {
  dateStr: string;
  dayNumber: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  dayOfWeek: number; // 0 = Dom, 1 = Lun, etc.
}

export function formatMonthYear(year: number, monthIndex: number, locale: string = "es-MX"): string {
  const d = new Date(year, monthIndex, 1);
  const formatted = d.toLocaleDateString(locale, { month: "long", year: "numeric" });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function getCalendarGridForMonth(year: number, monthIndex: number): CalendarDayCell[] {
  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Domingo

  const days: CalendarDayCell[] = [];

  // Previous month trailing days
  const prevMonthLastDate = new Date(year, monthIndex, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDate - i;
    const prevMonthIdx = monthIndex === 0 ? 11 : monthIndex - 1;
    const prevYear = monthIndex === 0 ? year - 1 : year;
    const dStr = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    days.push({
      dateStr: dStr,
      dayNumber: dayNum,
      month: prevMonthIdx,
      year: prevYear,
      isCurrentMonth: false,
      dayOfWeek: new Date(prevYear, prevMonthIdx, dayNum).getDay(),
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({
      dateStr: dStr,
      dayNumber: d,
      month: monthIndex,
      year,
      isCurrentMonth: true,
      dayOfWeek: new Date(year, monthIndex, d).getDay(),
    });
  }

  // Next month leading days to complete the full weeks (multiple of 7)
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const nextMonthIdx = monthIndex === 11 ? 0 : monthIndex + 1;
    const nextYear = monthIndex === 11 ? year + 1 : year;
    const dStr = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    days.push({
      dateStr: dStr,
      dayNumber: i,
      month: nextMonthIdx,
      year: nextYear,
      isCurrentMonth: false,
      dayOfWeek: new Date(nextYear, nextMonthIdx, i).getDay(),
    });
  }

  return days;
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
