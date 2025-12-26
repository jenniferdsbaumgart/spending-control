import {
    format,
    startOfMonth,
    endOfMonth,
    parseISO,
    addMonths,
    isSameMonth,
    isAfter,
    isBefore,
    isToday,
    type Locale,
} from "date-fns";
import { ptBR, es, enUS, enGB } from "date-fns/locale";

export type SupportedLocale = "pt-BR" | "es" | "en-US" | "en-GB";

const localeMap: Record<SupportedLocale, Locale> = {
    "pt-BR": ptBR,
    es: es,
    "en-US": enUS,
    "en-GB": enGB,
};

/**
 * Get month key in format "YYYY-MM" for a given date
 */
export function getMonthKey(date: Date): string {
    return format(date, "yyyy-MM");
}

/**
 * Get current month key
 */
export function getCurrentMonthKey(): string {
    return getMonthKey(new Date());
}

/**
 * Parse a month key string to Date object (first day of month)
 */
export function parseMonthKey(monthKey: string): Date {
    return parseISO(`${monthKey}-01`);
}

/**
 * Get start and end dates for a month
 */
export function getMonthDateRange(monthKey: string): {
    start: Date;
    end: Date;
} {
    const date = parseMonthKey(monthKey);
    return {
        start: startOfMonth(date),
        end: endOfMonth(date),
    };
}

/**
 * Format month for display based on locale
 */
export function formatMonth(
    monthKey: string,
    locale: SupportedLocale = "pt-BR"
): string {
    const date = parseMonthKey(monthKey);
    return format(date, "MMMM yyyy", { locale: localeMap[locale] });
}

/**
 * Format date based on locale
 */
export function formatDate(
    date: Date | string,
    formatStr: string = "PP",
    locale: SupportedLocale = "pt-BR"
): string {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: localeMap[locale] });
}

/**
 * Get next month key
 */
export function getNextMonthKey(monthKey: string): string {
    const date = parseMonthKey(monthKey);
    return getMonthKey(addMonths(date, 1));
}

/**
 * Get previous month key
 */
export function getPreviousMonthKey(monthKey: string): string {
    const date = parseMonthKey(monthKey);
    return getMonthKey(addMonths(date, -1));
}

/**
 * Check if a date is in a specific month
 */
export function isInMonth(date: Date, monthKey: string): boolean {
    const monthDate = parseMonthKey(monthKey);
    return isSameMonth(date, monthDate);
}

/**
 * Check if a month is in the past
 */
export function isPastMonth(monthKey: string): boolean {
    const { end } = getMonthDateRange(monthKey);
    return isBefore(end, new Date());
}

/**
 * Check if a month is in the future
 */
export function isFutureMonth(monthKey: string): boolean {
    const { start } = getMonthDateRange(monthKey);
    return isAfter(start, new Date());
}

/**
 * Check if a month is the current month
 */
export function isCurrentMonth(monthKey: string): boolean {
    return monthKey === getCurrentMonthKey();
}

/**
 * Generate array of month keys for a given range
 */
export function generateMonthRange(
    startMonthKey: string,
    endMonthKey: string
): string[] {
    const months: string[] = [];
    let current = startMonthKey;

    while (current <= endMonthKey) {
        months.push(current);
        current = getNextMonthKey(current);
    }

    return months;
}

export { isToday, isBefore, isAfter };
