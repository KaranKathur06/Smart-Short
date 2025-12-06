import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const token = searchParams.get('token');
  const next = searchParams.get('next') || '/dashboard';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smartshort.in';

  // Handle password reset (recovery)
  if (type === 'recovery' && token) {
    const redirectUrl = new URL('/auth/reset-password', baseUrl);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('type', type);
    return NextResponse.redirect(redirectUrl);
  }

  // Handle email verification (signup/email confirmation)
  if ((type === 'signup' || type === 'email') && code) {
    const { error } = await supabaseAdmin.auth.exchangeCodeForSession(code);
    if (!error) {
      // Redirect to login with success message
      const loginUrl = new URL('/auth/login', baseUrl);
      loginUrl.searchParams.set('verified', 'true');
      return NextResponse.redirect(loginUrl);
    }
  }

  // Handle magic link (token-based)
  if (token && type !== 'recovery') {
    const redirectUrl = new URL('/auth/login', baseUrl);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('type', type || 'magiclink');
    return NextResponse.redirect(redirectUrl);
  }

  // Handle OAuth callbacks
  if (code) {
    const { error } = await supabaseAdmin.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, req.url));
    }
  }

  return NextResponse.redirect(new URL('/auth/login?error=verification_failed', req.url));
}
