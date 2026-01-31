import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const LOCALES = ['en', 'zh', 'ja']
export const DEFAULT_LOCALE = 'en'
export const LOCALE_NAMES: Record<string, string> = {
  'en': "English",
  'zh': "中文",
  'ja': "日本語",
};
export const LOCALE_TO_HREFLANG: Record<string, string> = {
  'en': 'en-US',
  'zh': 'zh-CN',
  'ja': 'ja-JP',
};

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localeDetection: process.env.NEXT_PUBLIC_LOCALE_DETECTION && process.env.NEXT_PUBLIC_LOCALE_DETECTION === 'true' || false,

  localePrefix: 'as-needed',
});

export const {
  Link,
  redirect,
  usePathname,
  useRouter,
  getPathname,
} = createNavigation(routing);


export type Locale = (typeof routing.locales)[number];
