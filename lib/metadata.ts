import { siteConfig } from '@/config/site'
import { DEFAULT_LOCALE, LOCALE_NAMES, LOCALE_TO_HREFLANG, Locale } from '@/i18n/routing'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

type MetadataProps = {
  page?: string // legacy
  title?: string
  description?: string
  images?: string[]
  noIndex?: boolean
  locale?: Locale
  path?: string
  canonicalUrl?: string
  availableLocales?: string[]
  useDefaultOgImage?: boolean
}

export async function constructMetadata({
  title,
  description,
  images = [],
  noIndex = false,
  locale,
  path,
  canonicalUrl,
  availableLocales,
  useDefaultOgImage = true,
}: MetadataProps): Promise<Metadata> {
  const t = await getTranslations({ locale: locale || DEFAULT_LOCALE, namespace: 'Home' })

  const pageTitle = title || t(`title`)
  const pageTagLine = t(`tagLine`)
  const pageDescription = description || t(`description`)

  const finalTitle = path === '/'
    ? `${pageTitle} - ${pageTagLine}`
    : `${pageTitle} | ${siteConfig.name}`

  canonicalUrl = canonicalUrl || path

  // Use availableLocales if provided, otherwise use all locales
  const locales = availableLocales || Object.keys(LOCALE_NAMES)

  const alternateLanguages = locales.reduce((acc, lang) => {
    const localePath = canonicalUrl
      ? `${lang === DEFAULT_LOCALE ? '' : `/${lang}`}${canonicalUrl === '/' ? '' : canonicalUrl}`
      : `${lang === DEFAULT_LOCALE ? '' : `/${lang}`}`
    const url = `${siteConfig.url}${localePath}`

    // Use full locale code for hreflang (e.g., en-US, zh-CN, ja-JP)
    const hreflangCode = LOCALE_TO_HREFLANG[lang] || lang
    acc[hreflangCode] = url

    return acc
  }, {} as Record<string, string>)

  // Add x-default pointing to the English version
  const defaultPath = canonicalUrl === '/' ? '' : canonicalUrl || ''
  alternateLanguages['x-default'] = `${siteConfig.url}${defaultPath}`

  // Open Graph
  const imageUrls = images.length > 0
    ? images.map(img => ({
      url: img.startsWith('http') ? img : `${siteConfig.url}/${img}`,
      alt: pageTitle,
    }))
    :
    useDefaultOgImage ? [{
      url: `${siteConfig.url}/og${locale === DEFAULT_LOCALE ? '' : '_' + locale}.png`,
      alt: pageTitle,
    }] : undefined
  const pageURL = `${locale === DEFAULT_LOCALE ? '' : `/${locale}`}${path}`

  return {
    title: finalTitle,
    description: pageDescription,
    keywords: [],
    authors: siteConfig.authors,
    creator: siteConfig.creator,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: canonicalUrl ? `${siteConfig.url}${locale === DEFAULT_LOCALE ? '' : `/${locale}`}${canonicalUrl === '/' ? '' : canonicalUrl}` : undefined,
      languages: alternateLanguages,
    },
    // Create an OG image using https://myogimage.com/
    openGraph: {
      type: 'website',
      title: finalTitle,
      description: pageDescription,
      url: pageURL,
      siteName: t('title'),
      locale: locale,
      ...(imageUrls && { images: imageUrls }),
    },
    twitter: {
      card: 'summary_large_image',
      title: finalTitle,
      description: pageDescription,
      site: `${siteConfig.url}${pageURL === '/' ? '' : pageURL}`,
      ...(imageUrls && { images: imageUrls }),
      creator: siteConfig.creator,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
      },
    },
  }
}