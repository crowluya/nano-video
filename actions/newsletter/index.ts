'use server';
import { removeUserFromContacts, sendEmail } from '@/actions/resend';
import { siteConfig } from '@/config/site';
import { NewsletterWelcomeEmail } from '@/emails/newsletter-welcome';
import { DEFAULT_LOCALE, type Locale } from '@/i18n/routing';
import { actionResponse, ActionResult } from '@/lib/action-response';
import { normalizeEmail, validateEmail } from '@/lib/email';
import { checkRateLimit, getClientIPFromHeaders } from '@/lib/upstash';
import { getTranslations } from 'next-intl/server';

const NEWSLETTER_RATE_LIMIT = {
  prefix: `${siteConfig.name.trim()}_newsletter_rate_limit`,
  maxRequests: parseInt(process.env.DAY_MAX_SUBMISSIONS || '10'),
  window: '1 d'
};

async function validateRateLimit(locale: string) {
  const t = await getTranslations({ locale, namespace: 'Footer.Newsletter' });

  const clientIP = await getClientIPFromHeaders();

  const success = await checkRateLimit(clientIP, NEWSLETTER_RATE_LIMIT);
  if (!success) {
    throw new Error(t('subscribe.multipleSubmissions'));
  }
}

export async function subscribeToNewsletter(email: string, locale: Locale = DEFAULT_LOCALE): Promise<ActionResult<{ email: string }>> {
  try {
    await validateRateLimit(locale);

    const t = await getTranslations({ locale, namespace: 'Footer.Newsletter' });

    const normalizedEmail = normalizeEmail(email);
    const { isValid, error } = validateEmail(normalizedEmail);

    if (!isValid) {
      return actionResponse.error(error || t('subscribe.invalidEmail'));
    }

    const subject = `Welcome to ${siteConfig.name} Newsletter!`
    const unsubscribeToken = Buffer.from(normalizedEmail).toString('base64');
    const unsubscribeLink = `${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe/newsletter?token=${unsubscribeToken}`;

    await sendEmail({
      email: normalizedEmail,
      subject,
      react: NewsletterWelcomeEmail,
      reactProps: {
        email: normalizedEmail,
        unsubscribeLink: unsubscribeLink
      }
    })

    return actionResponse.success({ email: normalizedEmail });
  } catch (error) {
    console.error('failed to subscribe to newsletter:', error);
    const t = await getTranslations({ locale, namespace: 'Footer.Newsletter' });
    const errorMessage = error instanceof Error ? error.message : t('subscribe.defaultErrorMessage');
    return actionResponse.error(errorMessage);
  }
}

export async function unsubscribeFromNewsletter(token: string, locale: Locale = DEFAULT_LOCALE): Promise<ActionResult<{ email: string }>> {
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
