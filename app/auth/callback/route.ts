import { sendEmail } from '@/actions/resend';
import { isValidRedirectUrl } from '@/app/auth/utils';
import { siteConfig } from '@/config/site';
import { UserWelcomeEmail } from '@/emails/user-welcome';
import { createClient } from '@/lib/supabase/server';
import { User, type SupabaseClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const referral = searchParams.get('referral') || request.cookies.get('referral_source')?.value

  let next = searchParams.get('next') || '/'
  next = next == 'null' ? '/' : next

  if (!isValidRedirectUrl(next)) {
    return NextResponse.redirect(new URL(`/redirect-error?code=invalid_redirect`, origin))
  }

  if (!code) {
    return NextResponse.redirect(new URL(`/redirect-error?code=server_error&message=No_code`, origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL(`/redirect-error?code=server_error&message=${error.message}`, origin))
  }

  if (referral) {
    await handleReferral(supabase, referral)
  }

  const response = NextResponse.redirect(`${origin}${next}`)
  if (request.cookies.get('referral_source')) {
    response.cookies.delete('referral_source');
  }
  return response;
}


const handleReferral = async (supabase: SupabaseClient<any, "public", any>, referral: string) => {
  const { data: { user } } = await supabase.auth.getUser();

  if (user && !user.user_metadata?.referral) {

    await supabase.auth.updateUser({
      data: {
        referral,
      }
    });

    await supabase.rpc(
      'update_my_profile',
      {
        new_full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        new_avatar_url: user.user_metadata?.avatar_url || '',
        new_referral: referral
      }
    );

    // send a welcome email to the user here
    if (process.env.NEXT_PUBLIC_USER_WELCOME === 'true') {
      await sendWelcomeEmail(user)
    }
  }
}

async function sendWelcomeEmail(user: User) {
  const subject = `Welcome to ${siteConfig.name}`
  const email = user.email as string
  const unsubscribeToken = Buffer.from(user.email as string).toString('base64');
  const unsubscribeLinkEN = `${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe/newsletter?token=${unsubscribeToken}`;

  await sendEmail({
    email,
    subject,
    react: await UserWelcomeEmail({
      name: user.user_metadata?.name,
      email,
      unsubscribeLink: unsubscribeLinkEN
    })
  })
}