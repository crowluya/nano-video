'use server';

import { actionResponse } from '@/lib/action-response';
import resend from '@/lib/resend';

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID!;

interface SendEmailProps {
  email: string;
  subject: string;
  react: React.ReactNode;
}

export async function sendEmail({
  email,
  subject,
  react,
}: SendEmailProps) {
  try {
    if (!email) {
      return actionResponse.error('Email is required.');
    }

    if (!resend) {
      return actionResponse.error('Resend env is not set');
    }

    // add user to contacts
    await resend.contacts.create({
      audienceId: AUDIENCE_ID,
      email,
    });

    // send email
    const from = `${process.env.ADMIN_NAME} <${process.env.ADMIN_EMAIL}>`
    const to = email
    const unsubscribeToken = Buffer.from(email).toString('base64');
    const unsubscribeLinkEN = `${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe/newsletter?token=${unsubscribeToken}`;

    await resend.emails.send({
      from,
      to,
      subject,
      react,
      headers: {
        "List-Unsubscribe": `<${unsubscribeLinkEN}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
      }
    });
  } catch (error) {
    console.error('Failed to add user to Resend contacts:', error);
  }
}

export async function removeUserFromContacts(email: string) {
  try {
    if (!email || !resend) {
      return;
    }

    const list = await resend.contacts.list({ audienceId: AUDIENCE_ID });
    const user = list.data?.data.find((item: any) => item.email === email);

    if (!user) {
      return;
    }

    await resend.contacts.remove({
      audienceId: AUDIENCE_ID,
      email: email,
    });
  } catch (error) {
    console.error('Failed to remove user from Resend contacts:', error);
    // Silently fail - we don't care about the result
  }
}