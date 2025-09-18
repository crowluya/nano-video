import { sendEmail } from "@/actions/resend";
import { siteConfig } from "@/config/site";
import MagicLinkEmail from '@/emails/magic-link-email';
import { UserWelcomeEmail } from "@/emails/user-welcome";
import { db } from "@/lib/db";
import { account, session, user, verification } from "@/lib/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, anonymous, captcha, lastLoginMethod, magicLink, oneTap } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export const auth = betterAuth({
  appName: siteConfig.name,
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 10 * 60, // Cache duration in seconds
    },
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    freshAge: 0
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google', 'github'],
    },
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: user,
      session: session,
      account: account,
      verification: verification,
    },
  }),
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    }
  },
  socialProviders: {
    github: {
      clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          try {
            // Update user with referral code from cookie
            const cookieStore = await cookies();
            const referralCookie = cookieStore.get('referral_source');

            if (referralCookie?.value && createdUser.id) {
              await db.update(user)
                .set({ referral: referralCookie.value })
                .where(eq(user.id, createdUser.id));

              cookieStore.delete('referral_source');
              console.log(`User ${createdUser.id} updated with referral: ${referralCookie.value}`);
            }
          } catch (error) {
            console.error('Failed to update user with referral code:', error);
          }

          // Send welcome email
          if (createdUser.email) {
            try {
              const unsubscribeToken = Buffer.from(createdUser.email).toString('base64');
              const unsubscribeLink = `${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe/newsletter?token=${unsubscribeToken}`;

              await sendEmail({
                email: createdUser.email,
                subject: `Welcome to ${siteConfig.name}!`,
                react: UserWelcomeEmail,
                reactProps: {
                  name: createdUser.name,
                  email: createdUser.email,
                  unsubscribeLink: unsubscribeLink,
                },
              });
              console.log(`Welcome email sent to ${createdUser.email}`);
            } catch (error) {
              console.error('Failed to send welcome email:', error);
            }
          }
        },
      },
    },
  },
  trustedOrigins: process.env.NODE_ENV === 'development' ? [process.env.NEXT_PUBLIC_SITE_URL!, 'http://localhost:3000'] : [process.env.NEXT_PUBLIC_SITE_URL!],
  plugins: [
    oneTap(),
    captcha({
      provider: "cloudflare-turnstile",
      secretKey: process.env.TURNSTILE_SECRET_KEY!,
    }),
    magicLink({
      sendMagicLink: async ({ email, url, token }) => {
        await sendEmail({
          email,
          subject: `Sign in to ${siteConfig.name}`,
          react: MagicLinkEmail,
          reactProps: {
            url
          }
        })
      },
      expiresIn: 60 * 5,
    }),
    lastLoginMethod(),
    admin(),
    anonymous(),
    nextCookies() // make sure this is the last plugin in the array
  ]
});