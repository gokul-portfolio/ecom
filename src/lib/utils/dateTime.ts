/**
 * Date and Time Utilities powered by `date-fns`
 */
import {
  format,
  parse,
  isValid,
  isToday,
  isPast,
  isFuture,
  isSameDay,
  addDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  formatDistanceToNow,
} from "date-fns";

export interface CalendarDay {
  date: Date;
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isPast: boolean;
  isFuture: boolean;
}

/**
 * Safely parses any date string or Date object
 */
export function safeParseDate(input?: string | Date | null): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isValid(input) ? input : null;

  try {
    const d = new Date(input);
    if (isValid(d)) return d;
  } catch {
    // try pattern
  }

  try {
    const parsed = parse(input, "yyyy-MM-dd", new Date());
    if (isValid(parsed)) return parsed;
  } catch {
    // fallback
  }

  return null;
}

/**
 * Format date to standard or custom string pattern
 * Default: "yyyy-MM-dd"
 */
export function formatDate(
  date?: string | Date | null,
  pattern: string = "yyyy-MM-dd"
): string {
  const d = safeParseDate(date);
  if (!d) return "";
  try {
    return format(d, pattern);
  } catch {
    return "";
  }
}

/**
 * Format date for human friendly display (e.g. "Oct 15, 2026")
 */
export function formatDisplayDate(
  date?: string | Date | null,
  pattern: string = "MMM dd, yyyy"
): string {
  return formatDate(date, pattern);
}

/**
 * Relative time from now (e.g. "2 hours ago", "in 3 days")
 */
export function getRelativeTime(date?: string | Date | null): string {
  const d = safeParseDate(date);
  if (!d) return "";
  try {
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "";
  }
}

/**
 * Check if a date is today
 */
export function isDateToday(date?: string | Date | null): boolean {
  const d = safeParseDate(date);
  return d ? isToday(d) : false;
}

/**
 * Generate 42 calendar grid cells (weeks covering start and end of month)
 */
export function getCalendarGrid(
  year: number,
  month: number, // 0-indexed (0 = Jan, 11 = Dec)
  selectedDateStr?: string
): CalendarDay[] {
  const targetDate = new Date(year, month, 1);
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const selectedDate = safeParseDate(selectedDateStr);

  return days.map((day) => {
    return {
      date: day,
      dateString: format(day, "yyyy-MM-dd"),
      dayNumber: day.getDate(),
      isCurrentMonth: day.getMonth() === month,
      isToday: isToday(day),
      isSelected: selectedDate ? isSameDay(day, selectedDate) : false,
      isPast: isPast(day) && !isToday(day),
      isFuture: isFuture(day) && !isToday(day),
    };
  });
}

/**
 * Common date presets: today, tomorrow, next week
 */
export function getDatePreset(type: "today" | "tomorrow" | "next-week" | "in-30-days"): string {
  const now = new Date();
  switch (type) {
    case "today":
      return format(now, "yyyy-MM-dd");
    case "tomorrow":
      return format(addDays(now, 1), "yyyy-MM-dd");
    case "next-week":
      return format(addDays(now, 7), "yyyy-MM-dd");
    case "in-30-days":
      return format(addDays(now, 30), "yyyy-MM-dd");
  }
}

/**
 * Format 12-hour time string
 */
export function formatTime12H(hour: number, minute: number, period: "AM" | "PM"): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${pad(h)}:${pad(minute)} ${period}`;
}

/**
 * Parse time string into { hour, minute, period }
 */
export function parseTimeString(timeStr?: string): {
  hour: number; // 1-12
  minute: number; // 0-59
  period: "AM" | "PM";
  formatted24H: string;
} {
  if (!timeStr || !timeStr.trim()) {
    return { hour: 9, minute: 0, period: "AM", formatted24H: "09:00" };
  }

  const str = timeStr.trim();
  const isPM = str.toUpperCase().includes("PM");
  const isAM = str.toUpperCase().includes("AM");

  const clean = str.replace(/[^\d:]/g, "");
  const [hStr, mStr] = clean.split(":");
  const rawHour = parseInt(hStr || "9", 10);
  const minute = parseInt(mStr || "0", 10);

  let period: "AM" | "PM" = isPM ? "PM" : isAM ? "AM" : rawHour >= 12 ? "PM" : "AM";
  let hour12 = rawHour;

  if (rawHour > 12) {
    hour12 = rawHour - 12;
    period = "PM";
  } else if (rawHour === 0) {
    hour12 = 12;
  }

  const hour24 = period === "PM" ? (hour12 === 12 ? 12 : hour12 + 12) : (hour12 === 12 ? 0 : hour12);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  return {
    hour: hour12,
    minute: isNaN(minute) ? 0 : minute,
    period,
    formatted24H: `${pad(hour24)}:${pad(minute)}`,
  };
}

export const COMMON_TIME_PRESETS = [
  "09:00 AM",
  "10:30 AM",
  "12:00 PM",
  "02:30 PM",
  "05:00 PM",
  "08:00 PM",
];

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
