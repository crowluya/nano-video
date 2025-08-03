'use server';
import { removeUserFromContacts, sendEmail } from '@/actions/resend';
import { NewsletterWelcomeEmail } from '@/emails/newsletter-welcome';
import { actionResponse, ActionResult } from '@/lib/action-response';
import { normalizeEmail, validateEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/upstash';
import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';

const NEWSLETTER_RATE_LIMIT = {
  prefix: process.env.UPSTASH_REDIS_NEWSLETTER_RATE_LIMIT_KEY || 'newsletter_rate_limit',
  maxRequests: parseInt(process.env.DAY_MAX_SUBMISSIONS || '10'),
  window: '1 d'
};

async function validateRateLimit(locale: string) {
  const t = await getTranslations({ locale, namespace: 'Footer.Newsletter' });

  const headersList = await headers();
  const ip = headersList.get('x-real-ip') ||
    headersList.get('x-forwarded-for') ||
    'unknown';

  const success = await checkRateLimit(ip, NEWSLETTER_RATE_LIMIT);
  if (!success) {
    throw new Error(t('subscribe.multipleSubmissions'));
  }
}

export async function subscribeToNewsletter(email: string, locale = 'en'): Promise<ActionResult<{ email: string }>> {
  try {
    await validateRateLimit(locale);

    const t = await getTranslations({ locale, namespace: 'Footer.Newsletter' });

    const normalizedEmail = normalizeEmail(email);
    const { isValid, error } = validateEmail(normalizedEmail);

    if (!isValid) {
      return actionResponse.error(error || t('subscribe.invalidEmail'));
    }

    const subject = 'Welcome to Nexty Newsletter!'
    const unsubscribeToken = Buffer.from(normalizedEmail).toString('base64');
    const unsubscribeLinkEN = `${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe/newsletter?token=${unsubscribeToken}`;

    await sendEmail({
      email: normalizedEmail,
      subject,
      react: await NewsletterWelcomeEmail({
        email: normalizedEmail,
        unsubscribeLink: unsubscribeLinkEN
      })
    })

    return actionResponse.success({ email: normalizedEmail });
  } catch (error) {
    console.error('failed to subscribe to newsletter:', error);
    const t = await getTranslations({ locale, namespace: 'Footer.Newsletter' });
    const errorMessage = error instanceof Error ? error.message : t('subscribe.defaultErrorMessage');
    return actionResponse.error(errorMessage);
  }
}

export async function unsubscribeFromNewsletter(token: string, locale = 'en'): Promise<ActionResult<{ email: string }>> {
  try {
    await validateRateLimit(locale);
    const t = await getTranslations({ locale, namespace: 'Footer.Newsletter' });

    const email = Buffer.from(token, 'base64').toString();
    const normalizedEmail = normalizeEmail(email);
    const { isValid, error } = validateEmail(normalizedEmail);

    if (!isValid) {
      return actionResponse.error(error || t('unsubscribe.invalidEmail'));
    }

    // Remove user from contacts asynchronously (fire and forget)
    removeUserFromContacts(normalizedEmail);

    return actionResponse.success({ email: normalizedEmail });
  } catch (error) {
    console.error('failed to unsubscribe from newsletter:', error);
    const t = await getTranslations({ locale, namespace: 'Footer.Newsletter' });
    const errorMessage = error instanceof Error ? error.message : t('unsubscribe.defaultErrorMessage');
    return actionResponse.error(errorMessage);
  }
}
