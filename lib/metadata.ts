import { siteConfig } from '@/config/site'
import { DEFAULT_LOCALE, LOCALE_NAMES, Locale } from '@/i18n/routing'
import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

type MetadataProps = {
  page?: string
  title?: string
  description?: string
  images?: string[]
  noIndex?: boolean
  locale: Locale
  path?: string
  canonicalUrl?: string
}

export async function constructMetadata({
  page = 'Home',
  title,
  description,
  images = [],
  noIndex = false,
  locale,
  path,
  canonicalUrl,
}: MetadataProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'Home' })

  const pageTitle = title || t(`title`)
  const pageDescription = description || t(`description`)

  const finalTitle = page === 'Home'
    ? `${pageTitle} - ${t('tagLine')}`
    : `${pageTitle} | ${t('title')}`

  const imageUrls = images.length > 0
    ? images.map(img => ({
      url: img.startsWith('http') ? img : `${siteConfig.url}/${img}`,
      alt: pageTitle,
    }))
    : [{
      url: `${siteConfig.url}/og${locale === DEFAULT_LOCALE ? '' : '_' + locale}.png`,
      alt: pageTitle,
    }]

  const pageURL = `${locale === DEFAULT_LOCALE ? '' : locale}${path}` || siteConfig.url

  const alternateLanguages = Object.keys(LOCALE_NAMES).reduce((acc, lang) => {
    const path = canonicalUrl
      ? `/${lang === DEFAULT_LOCALE ? '' : lang}${canonicalUrl}`
      : `/${lang === DEFAULT_LOCALE ? '' : lang}`
    acc[lang] = `${siteConfig.url}${path}`
    return acc
  }, {} as Record<string, string>)

  return {
    title: finalTitle,
    description: pageDescription,
    keywords: [],
    authors: siteConfig.authors,
    creator: siteConfig.creator,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: canonicalUrl ? `${siteConfig.url}/${canonicalUrl}` : undefined,
      languages: alternateLanguages,
    },
    // Create an OG image using https://ogimage.click
    openGraph: {
      type: 'website',
      title: finalTitle,
      description: pageDescription,
      url: pageURL,
      siteName: t('title'),
      locale: locale,
      images: imageUrls,
    },
    twitter: {
      card: 'summary_large_image',
      title: finalTitle,
      description: pageDescription,
      site: `${siteConfig.url}/${pageURL}`,
      images: imageUrls,
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