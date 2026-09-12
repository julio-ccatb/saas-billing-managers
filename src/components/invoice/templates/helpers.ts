export const DEFAULT_LOCALE = "en-US";

export const RTL_LOCALES = new Set(["ar", "he"]);

export const dirForLocale = (locale: string): "rtl" | "ltr" =>
  RTL_LOCALES.has(locale) ? "rtl" : "ltr";

export const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

export const formatNumberWithCommas = (number: number) => {
  return Number(number || 0).toLocaleString("en-US", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatDate = (
  value: string | Date | undefined | null,
  locale = "en-US",
  fallback = "—"
): string => {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  try {
    return date.toLocaleDateString(locale, DATE_OPTIONS);
  } catch {
    return date.toLocaleDateString("en-US", DATE_OPTIONS);
  }
};

export const isDataUrl = (str: string) => typeof str === "string" && str.startsWith("data:");
