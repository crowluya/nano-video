import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const referralParams = ['utm_source', 'ref', 'via', 'aff', 'referral', 'referral_code'];

export async function middleware(request: NextRequest): Promise<NextResponse> {

  let referralValue: string | null = null;

  for (const param of referralParams) {
    const value = request.nextUrl.searchParams.get(param);
    if (value) {
      referralValue = value;
      break;
    }
  }

  const intlResponse = intlMiddleware(request);

  if (referralValue) {
    intlResponse.cookies.set('referral_source', referralValue);
  }

  return intlResponse;
}

export const config = {
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',

    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(en|zh|ja)/:path*',

    // Enable redirects that add missing locales
    // (e.g. `/pathnames` -> `/en/pathnames`)
    '/((?!api|_next|_vercel|auth|privacy-policy|terms-of-service|refund-policy|.*\\.|favicon.ico).*)'
  ]
};