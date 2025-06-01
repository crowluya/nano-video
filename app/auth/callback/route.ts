import { isValidRedirectUrl } from '@/app/auth/confirm/route';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')

  let next = searchParams.get('next') ?? '/'
  next = next == 'null' ? '/' : next


  if (!isValidRedirectUrl(next)) {
    console.error('Invalid redirect URL')
    return NextResponse.redirect(new URL(`/redirect-error?code=invalid_redirect`, origin))
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(new URL(`/redirect-error?code=server_error`, origin))
}