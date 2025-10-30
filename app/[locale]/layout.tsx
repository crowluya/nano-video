import { GoogleOneTap } from "@/components/auth/GoogleOneTap";
import { LanguageDetectionAlert } from "@/components/LanguageDetectionAlert";
import ConsentBanner from "@/components/shared/CookieConsent/ConsentBanner";
import ConsentGate from "@/components/shared/CookieConsent/ConsentGate";
import { TailwindIndicator } from "@/components/TailwindIndicator";
import BaiDuAnalytics from "@/components/tracking/BaiDuAnalytics";
import GoogleAdsense from "@/components/tracking/GoogleAdsense";
import GoogleAnalytics from "@/components/tracking/GoogleAnalytics";
import PlausibleAnalytics from "@/components/tracking/PlausibleAnalytics";
import ToltScript from "@/components/tracking/ToltScript";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/site";
import { DEFAULT_LOCALE, Locale, routing } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";
import "@/styles/globals.css";
import "@/styles/loading.css";
import { Analytics } from "@vercel/analytics/react";
import { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { Inter as FontSans } from "next/font/google";
import { notFound } from "next/navigation";

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

type MetadataProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });

  return constructMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/`,
  });
}

export const viewport: Viewport = {
  themeColor: siteConfig.themeColors,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = await params;
  const COOKIE_CONSENT_ENABLED =
    process.env.NEXT_PUBLIC_COOKIE_CONSENT_ENABLED === "true";

  // Ensure that the incoming `locale` is valid
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale || DEFAULT_LOCALE} suppressHydrationWarning>
      <head>
        <ToltScript />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background flex flex-col",
          fontSans.variable
        )}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme={siteConfig.defaultNextTheme}
            enableSystem
          >
            {messages.LanguageDetection && <LanguageDetectionAlert />}

            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
        <GoogleOneTap />
        <Toaster richColors />
        <TailwindIndicator />
        <>
          {COOKIE_CONSENT_ENABLED ? (
            <>
              {process.env.NODE_ENV === "development" ? null : (
                <>
                  {process.env.VERCEL_ENV ? <Analytics /> : <></>}
                  <PlausibleAnalytics />
                  <ConsentGate>
                    <GoogleAnalytics />
                    <BaiDuAnalytics />
                    <GoogleAdsense />
                  </ConsentGate>
                </>
              )}
              <ConsentBanner />
            </>
          ) : (
            <>
              {process.env.NODE_ENV === "development" ? null : (
                <>
                  {process.env.VERCEL_ENV ? <Analytics /> : <></>}
                  <PlausibleAnalytics />
                  <GoogleAnalytics />
                  <BaiDuAnalytics />
                  <GoogleAdsense />
                </>
              )}
            </>
          )}
        </>
      </body>
    </html>
  );
}
