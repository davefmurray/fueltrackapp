import { format, startOfWeek, endOfWeek, eachDayOfInterval, isMonday, isSunday } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

const TIMEZONE = "America/New_York";

/** Get current date/time in Eastern Time */
export function nowET(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

/** Get today's date string in Eastern Time (YYYY-MM-DD) */
export function todayET(): string {
  return format(nowET(), "yyyy-MM-dd");
}

/** Get start of week (Monday) for a given date */
export function getWeekStart(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date + "T12:00:00") : date;
  return startOfWeek(d, { weekStartsOn: 1 }); // Monday
}

/** Get end of week (Sunday) for a given date */
export function getWeekEnd(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date + "T12:00:00") : date;
  return endOfWeek(d, { weekStartsOn: 1 }); // Sunday
}

/** Get all days in a week (Mon-Sun) for a given date */
export function getWeekDays(date: Date | string): Date[] {
  const start = getWeekStart(date);
  const end = getWeekEnd(date);
  return eachDayOfInterval({ start, end });
}

/** Format a date as YYYY-MM-DD */
export function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Format a date for display (e.g., "Mon, Mar 3") */
export function formatDateDisplay(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date + "T12:00:00") : date;
  return format(d, "EEE, MMM d");
}

/** Format a date for report headers (e.g., "March 3, 2026") */
export function formatDateLong(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date + "T12:00:00") : date;
  return format(d, "MMMM d, yyyy");
}

/** Get day of week name */
export function getDayName(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date + "T12:00:00") : date;
  return format(d, "EEEE");
}

/** Check if a date string falls on a given set of work days (0=Sun, 1=Mon, ..., 6=Sat) */
export function isWorkDay(date: string, workDays: number[]): boolean {
  const d = new Date(date + "T12:00:00");
  return workDays.includes(d.getDay());
}

/** Default work days: Monday (1) through Friday (5) */
export const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5];

/** Convert a UTC timestamp to Eastern Time display string */
export function formatTimestampET(timestamp: string): string {
  const date = toZonedTime(new Date(timestamp), TIMEZONE);
  return format(date, "h:mm a");
}
