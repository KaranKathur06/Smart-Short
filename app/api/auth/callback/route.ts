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
    const { data, error } = await supabaseAdmin.auth.exchangeCodeForSession(code);
    if (!error && data?.session) {
      // Auto-login successful, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', baseUrl));
    } else if (!error) {
      // Session created but redirect to callback page for client-side handling
      return NextResponse.redirect(new URL('/auth/callback?code=' + code, baseUrl));
    }
  }
  
  // Handle general code exchange (OAuth, etc.)
  if (code && !type) {
    const { data, error } = await supabaseAdmin.auth.exchangeCodeForSession(code);
    if (!error && data?.session) {
      // Redirect to dashboard if session created
      return NextResponse.redirect(new URL('/dashboard', baseUrl));
    } else if (!error) {
      // Redirect to callback page for client-side handling
      return NextResponse.redirect(new URL('/auth/callback?code=' + code, baseUrl));
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
