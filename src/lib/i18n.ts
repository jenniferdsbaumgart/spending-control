import { getRequestConfig } from "next-intl/server";

export type Locale = "pt-BR" | "es" | "en-US" | "en-GB";

export const locales: Locale[] = ["pt-BR", "es", "en-US", "en-GB"];
export const defaultLocale: Locale = "pt-BR";

export const localeNames: Record<Locale, string> = {
    "pt-BR": "Português (Brasil)",
    es: "Español",
    "en-US": "English (US)",
    "en-GB": "English (UK)",
};

export default getRequestConfig(async ({ requestLocale }) => {
    let locale = await requestLocale;

    // Validate that the incoming locale is valid
    if (!locale || !locales.includes(locale as Locale)) {
        locale = defaultLocale;
    }

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default,
    };
});
