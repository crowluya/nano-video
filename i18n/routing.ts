import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const LOCALES = ["en", "zh", "ja", "es", "fr", "ko", "pt", "de", "it", "nl", "ru", "pl"] as const
export const DEFAULT_LOCALE = "en" as const
export const LOCALE_NAMES: Record<string, string> = {
  "en": "English",
  "zh": "中文",
  "ja": "日本語",
  "es": "Español",
  "fr": "Français",
  "ko": "한국어",
  "pt": "Português",
  "de": "Deutsch",
  "it": "Italiano",
  "nl": "Nederlands",
  "ru": "Русский",
  "pl": "Polski",
};
export const LOCALE_TO_HREFLANG: Record<string, string> = {
  "en": "en-US",
  "zh": "zh-CN",
  "ja": "ja-JP",
  "es": "es-ES",
  "fr": "fr-FR",
  "ko": "ko-KR",
  "pt": "pt-BR",
  "de": "de-DE",
  "it": "it-IT",
  "nl": "nl-NL",
  "ru": "ru-RU",
  "pl": "pl-PL",
};

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localeDetection: process.env.NEXT_PUBLIC_LOCALE_DETECTION && process.env.NEXT_PUBLIC_LOCALE_DETECTION === "true" || false,

  localePrefix: "as-needed",
});

export const {
  Link,
  redirect,
  usePathname,
  useRouter,
  getPathname,
} = createNavigation(routing);


export type Locale = (typeof routing.locales)[number];
