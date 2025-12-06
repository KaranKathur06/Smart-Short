import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getClientIp, hashIp, getDeviceType, getOS, getReferrer, isExpired } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slug = params.slug;

    // Get link
    const { data: link } = await (supabaseAdmin as any)
      .from('links')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    // Check expiry
    if (isExpired(link.expires_at)) {
      return NextResponse.json({ error: 'Link expired' }, { status: 410 });
    }

    // Get movie links
    const { data: movieLinks } = await (supabaseAdmin as any)
      .from('movie_links')
      .select('*')
      .eq('link_id', (link as any).id);

    if (!movieLinks || movieLinks.length === 0) {
      return NextResponse.json({ error: 'No movie links found' }, { status: 404 });
    }

    // Collect analytics data
    const userAgent = req.headers.get('user-agent') || '';
    const referrer = req.headers.get('referer');
    const ip = getClientIp(req);
    const ipHash = hashIp(ip);
    const device = getDeviceType(userAgent);
    const os = getOS(userAgent);
    const referrerSource = getReferrer(referrer);

    // Get geolocation (basic - can be enhanced with GeoIP service)
    let country = 'Unknown';
    let city = 'Unknown';

    // Log click
    const { error: clickError } = await (supabaseAdmin as any).from('clicks').insert({
      link_id: (link as any).id,
      timestamp: new Date().toISOString(),
      country,
      city,
      device,
      os,
      referrer: referrerSource,
      earnings: parseFloat(process.env.NEXT_PUBLIC_AD_REVENUE_PER_CLICK || '0.001'),
      ip_hash: ipHash,
    });

    if (!clickError) {
      // Update link clicks and earnings
      await (supabaseAdmin as any)
        .from('links')
        .update({
          clicks: (link as any).clicks + 1,
          earnings: (link as any).earnings + parseFloat(process.env.NEXT_PUBLIC_AD_REVENUE_PER_CLICK || '0.001'),
        })
        .eq('id', (link as any).id);
    }

    // Select best quality link based on device
    let selectedLink = (movieLinks as any[]).find((ml: any) => ml.quality === '720p');
    if (!selectedLink && device === 'mobile') {
      selectedLink = movieLinks.find((ml: any) => ml.quality === '480p');
    }
    if (!selectedLink) {
      selectedLink = movieLinks[0];
    }

    // Return redirect page with ad
    return NextResponse.json(
      {
        success: true,
        redirectUrl: selectedLink.target_url,
        adDuration: parseInt(process.env.NEXT_PUBLIC_AD_DISPLAY_DURATION || '3000'),
        title: link.main_title,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Redirect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
