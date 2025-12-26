import type { SupportedLocale } from "./date";

export type SupportedCurrency = "BRL" | "USD" | "EUR" | "GBP" | "ARS" | "MXN";

export interface CurrencyConfig {
    code: SupportedCurrency;
    symbol: string;
    name: string;
    locale: string;
    decimalPlaces: number;
}

export const CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
    BRL: {
        code: "BRL",
        symbol: "R$",
        name: "Real Brasileiro",
        locale: "pt-BR",
        decimalPlaces: 2,
    },
    USD: {
        code: "USD",
        symbol: "$",
        name: "US Dollar",
        locale: "en-US",
        decimalPlaces: 2,
    },
    EUR: {
        code: "EUR",
        symbol: "€",
        name: "Euro",
        locale: "de-DE",
        decimalPlaces: 2,
    },
    GBP: {
        code: "GBP",
        symbol: "£",
        name: "British Pound",
        locale: "en-GB",
        decimalPlaces: 2,
    },
    ARS: {
        code: "ARS",
        symbol: "$",
        name: "Peso Argentino",
        locale: "es-AR",
        decimalPlaces: 2,
    },
    MXN: {
        code: "MXN",
        symbol: "$",
        name: "Peso Mexicano",
        locale: "es-MX",
        decimalPlaces: 2,
    },
};

/**
 * Format a monetary value for display
 */
export function formatCurrency(
    amount: number | string,
    currency: SupportedCurrency = "BRL",
    locale?: SupportedLocale
): string {
    const numericAmount =
        typeof amount === "string" ? parseFloat(amount) : amount;
    const config = CURRENCIES[currency];
    const displayLocale = locale || config.locale;

    return new Intl.NumberFormat(displayLocale, {
        style: "currency",
        currency: currency,
        minimumFractionDigits: config.decimalPlaces,
        maximumFractionDigits: config.decimalPlaces,
    }).format(numericAmount);
}

/**
 * Format a monetary value without currency symbol (just the number)
 */
export function formatNumber(
    amount: number | string,
    currency: SupportedCurrency = "BRL",
    locale?: SupportedLocale
): string {
    const numericAmount =
        typeof amount === "string" ? parseFloat(amount) : amount;
    const config = CURRENCIES[currency];
    const displayLocale = locale || config.locale;

    return new Intl.NumberFormat(displayLocale, {
        minimumFractionDigits: config.decimalPlaces,
        maximumFractionDigits: config.decimalPlaces,
    }).format(numericAmount);
}

/**
 * Parse a formatted currency string to number
 */
export function parseCurrencyInput(value: string): number {
    // Remove currency symbols, spaces, and convert comma to dot
    const cleaned = value
        .replace(/[R$€£\s]/g, "")
        .replace(/\./g, "")
        .replace(",", ".");

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}

/**
 * Convert amount to cents (smallest unit) for storage
 */
export function toCents(amount: number): number {
    return Math.round(amount * 100);
}

/**
 * Convert cents back to decimal amount
 */
export function fromCents(cents: number): number {
    return cents / 100;
}

/**
 * Distribute an amount across N parts, handling rounding correctly
 * (puts remainder in the last part)
 */
export function distributeAmount(
    totalAmount: number,
    parts: number
): number[] {
    const baseAmount = Math.floor((totalAmount * 100) / parts) / 100;
    const result = Array(parts).fill(baseAmount);

    // Calculate total cents so far
    const totalCentsSoFar = Math.round(baseAmount * 100) * parts;
    const totalCentsNeeded = Math.round(totalAmount * 100);
    const remainder = totalCentsNeeded - totalCentsSoFar;

    // Add remainder cents to the last installment
    if (remainder !== 0 && parts > 0) {
        result[parts - 1] =
            Math.round((result[parts - 1] + remainder / 100) * 100) / 100;
    }

    return result;
}

/**
 * Format a percentage for display
 */
export function formatPercent(
    value: number | string,
    locale: SupportedLocale = "pt-BR"
): string {
    const numericValue = typeof value === "string" ? parseFloat(value) : value;

    return new Intl.NumberFormat(locale, {
        style: "percent",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(numericValue / 100);
}

/**
 * Get the currency symbol
 */
export function getCurrencySymbol(currency: SupportedCurrency): string {
    return CURRENCIES[currency].symbol;
}

/**
 * Get all available currencies as options for select
 */
export function getCurrencyOptions(): Array<{
    value: SupportedCurrency;
    label: string;
}> {
    return Object.values(CURRENCIES).map((config) => ({
        value: config.code,
        label: `${config.symbol} - ${config.name}`,
    }));
}
