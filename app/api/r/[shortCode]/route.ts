import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getClientIp, hashIp, getDeviceType, getOS } from '@/lib/utils';
import { isBot, checkIPThrottle, detectSuspiciousActivity } from '@/lib/fraud-protection';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { shortCode: string } }
) {
  try {
    const shortCode = params.shortCode;
    const supabaseAdmin = getSupabaseAdmin();

    const { data: link, error: linkError } = await (supabaseAdmin as any)
      .from('links')
      .select('*')
      .eq('slug', shortCode)
      .single();

    if (linkError || !link) {
      return NextResponse.redirect(new URL('/404', req.url));
    }

    if (!(link as any).is_active) {
      return NextResponse.redirect(new URL('/link-inactive', req.url));
    }

    if ((link as any).expires_at && new Date((link as any).expires_at) < new Date()) {
      return NextResponse.redirect(new URL('/link-expired', req.url));
    }

    const userAgent = req.headers.get('user-agent') || '';
    const ip = getClientIp(req);
    const ipHash = hashIp(ip);

    if (isBot(userAgent)) {
      console.log('Bot detected:', { shortCode, userAgent, ip });
      return NextResponse.json(
        { error: 'Automated access detected' },
        { status: 403 }
      );
    }

    const throttleCheck = await checkIPThrottle(ipHash, (link as any).id);
    if (!throttleCheck.allowed) {
      console.log('IP throttled:', { shortCode, ipHash, reason: throttleCheck.reason });
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const suspiciousCheck = detectSuspiciousActivity(req);
    const isValid = !suspiciousCheck.suspicious;

    if (suspiciousCheck.suspicious) {
      console.log('Suspicious activity:', { shortCode, reasons: suspiciousCheck.reasons });
    }

    const device = getDeviceType(userAgent);
    const os = getOS(userAgent);
    const referrer = req.headers.get('referer') || null;

    const { data: click, error: clickError } = await (supabaseAdmin as any)
      .from('clicks')
      .insert({
        link_id: (link as any).id,
        user_id: (link as any).user_id,
        timestamp: new Date().toISOString(),
        country: null,
        city: null,
        device,
        os,
        referrer,
        earnings: 0,
        ip_hash: ipHash,
        user_agent: userAgent,
        is_valid: isValid,
        is_completed: false,
      })
      .select()
      .single();

    if (clickError || !click) {
      console.error('Click creation error:', clickError);
      return NextResponse.json(
        { error: 'Failed to log click' },
        { status: 500 }
      );
    }

    await (supabaseAdmin as any)
      .from('links')
      .update({ clicks: (link as any).clicks + 1 })
      .eq('id', (link as any).id);

    const adPageUrl = new URL(`/ads/${(click as any).id}`, req.url);
    return NextResponse.redirect(adPageUrl);

  } catch (error) {
    console.error('Short link resolver error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
