import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

function getTimeRange(period: string, startDateParam: string | null, endDateParam: string | null) {
  if (startDateParam && endDateParam) {
    const start = new Date(startDateParam);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDateParam);
    end.setHours(23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  let start: Date | null = new Date();

  if (period === '24h') {
    start.setHours(start.getHours() - 24);
  } else if (period === '7d') {
    start.setDate(start.getDate() - 7);
  } else if (period === '30d') {
    start.setDate(start.getDate() - 30);
  } else if (period === 'lifetime') {
    start = null;
  }

  return { start: start ? start.toISOString() : null, end: null as string | null };
}

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(req.url);
    const linkId = searchParams.get('linkId');
    const period = searchParams.get('period') || '7d';
    const region = searchParams.get('region');
    const os = searchParams.get('os');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const { start, end } = getTimeRange(period, startDateParam, endDateParam);

    const { data: linksData, error: linksError } = await (supabaseAdmin as any)
      .from('links')
      .select('id, slug, main_title, clicks, earnings')
      .eq('user_id', user.id);

    if (linksError) {
      return createErrorResponse('Failed to fetch links');
    }

    if (!linksData || linksData.length === 0) {
      return createSuccessResponse({
        summary: {
          totalClicks: 0,
          totalEarnings: 0,
          todayClicks: 0,
          bestLink: null,
        },
        trend: [],
        sources: [],
        devices: { desktop: 0, mobile: 0, tablet: 0 },
        osBreakdown: [],
        geo: [],
        topLinks: [],
        hourlyActivity: [],
        earningsInsights: {
          epc: 0,
          cpm: 0,
          topCountry: null,
          topLink: null,
        },
        filters: {
          availableLinks: [],
          availableCountries: [],
          availableOs: [],
        },
        period,
      });
    }

    const filteredLinks = linkId
      ? linksData.filter((l: any) => l.id === linkId)
      : linksData;

    if (linkId && filteredLinks.length === 0) {
      return createErrorResponse('Link not found', 404);
    }

    const linkIds = filteredLinks.map((l: any) => l.id);

    let clicksQuery = (supabaseAdmin as any)
      .from('clicks')
      .select('*')
      .in('link_id', linkIds);

    if (start) {
      clicksQuery = clicksQuery.gte('timestamp', start);
    }
    if (end) {
      clicksQuery = clicksQuery.lte('timestamp', end);
    }
    if (region) {
      clicksQuery = clicksQuery.eq('country', region);
    }
    if (os) {
      clicksQuery = clicksQuery.eq('os', os);
    }

    const { data: clicks, error: clicksError } = await clicksQuery;

    if (clicksError) {
      return createErrorResponse('Failed to fetch analytics data');
    }

    const clicksList: any[] = clicks || [];

    const totalClicks = clicksList.length;
    const totalEarningsRaw = clicksList.reduce(
      (sum, click) => sum + (click.earnings || 0),
      0
    );
    const totalEarnings = Math.round(totalEarningsRaw * 100) / 100;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayClicks = clicksList.filter(
      (click) => new Date(click.timestamp) >= todayStart
    ).length;

    const linkMap = new Map<string, { clicks: number; earnings: number }>();
    clicksList.forEach((click) => {
      const key = click.link_id as string;
      const entry = linkMap.get(key) || { clicks: 0, earnings: 0 };
      entry.clicks += 1;
      entry.earnings += click.earnings || 0;
      linkMap.set(key, entry);
    });

    const topLinks = Array.from(linkMap.entries())
      .map(([id, stats]) => {
        const meta = filteredLinks.find((l: any) => l.id === id) ||
          linksData.find((l: any) => l.id === id);
        return {
          id,
          slug: meta?.slug || '',
          title: meta?.main_title || '',
          clicks: stats.clicks,
          earnings: Math.round(stats.earnings * 100) / 100,
        };
      })
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 20);

    const bestLink = topLinks.length > 0 ? topLinks[0] : null;

    const timeMap = new Map<string, number>();
    clicksList.forEach((click) => {
      const date = new Date(click.timestamp);
      let key: string;
      if (period === '24h') {
        key = date.getHours().toString().padStart(2, '0') + ':00';
      } else {
        key = date.toISOString().split('T')[0];
      }
      timeMap.set(key, (timeMap.get(key) || 0) + 1);
    });

    const trend = Array.from(timeMap.entries())
      .map(([time, count]) => ({ time, clicks: count }))
      .sort((a, b) => {
        if (period === '24h') {
          return a.time.localeCompare(b.time);
        }
        return new Date(a.time).getTime() - new Date(b.time).getTime();
      });

    const sourceKeys = ['WhatsApp', 'YouTube', 'Telegram', 'Instagram', 'Direct', 'Other'];
    const sourceMap = new Map<string, number>();
    clicksList.forEach((click) => {
      const raw = (click.referrer as string) || 'Direct';
      const normalized = sourceKeys.includes(raw) ? raw : 'Other';
      sourceMap.set(normalized, (sourceMap.get(normalized) || 0) + 1);
    });

    const sources = sourceKeys.map((source) => ({
      source,
      clicks: sourceMap.get(source) || 0,
    }));

    const devices = { desktop: 0, mobile: 0, tablet: 0 };
    clicksList.forEach((click) => {
      if (click.device === 'desktop') {
        devices.desktop += 1;
      } else if (click.device === 'mobile') {
        devices.mobile += 1;
      } else if (click.device === 'tablet') {
        devices.tablet += 1;
      }
    });

    const osMap = new Map<string, number>();
    clicksList.forEach((click) => {
      const osName = (click.os as string) || 'Unknown';
      osMap.set(osName, (osMap.get(osName) || 0) + 1);
    });
    const osBreakdown = Array.from(osMap.entries()).map(([osName, count]) => ({
      os: osName,
      clicks: count,
    }));

    const geoMap = new Map<string, { clicks: number; earnings: number }>();
    clicksList.forEach((click) => {
      const country = (click.country as string) || 'Unknown';
      const entry = geoMap.get(country) || { clicks: 0, earnings: 0 };
      entry.clicks += 1;
      entry.earnings += click.earnings || 0;
      geoMap.set(country, entry);
    });

    const geo = Array.from(geoMap.entries())
      .map(([country, stats]) => ({
        country,
        clicks: stats.clicks,
        earnings: Math.round(stats.earnings * 100) / 100,
      }))
      .sort((a, b) => b.clicks - a.clicks);

    const hourMap = new Map<number, number>();
    for (let i = 0; i < 24; i++) {
      hourMap.set(i, 0);
    }
    clicksList.forEach((click) => {
      const hour = new Date(click.timestamp).getHours();
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });
    const hourlyActivity = Array.from(hourMap.entries()).map(([hour, count]) => ({
      hour: hour.toString().padStart(2, '0') + ':00',
      clicks: count,
    }));

    const epc = totalClicks > 0 ? totalEarningsRaw / totalClicks : 0;
    const cpm = totalClicks > 0 ? (totalEarningsRaw / totalClicks) * 1000 : 0;

    const topCountry = geo.length > 0
      ? geo.reduce((best, current) =>
          current.earnings > best.earnings ? current : best,
        geo[0])
      : null;

    const topLinkByEarnings = topLinks.length > 0
      ? topLinks.reduce((best, current) =>
          current.earnings > best.earnings ? current : best,
        topLinks[0])
      : null;

    const availableLinks = linksData.map((l: any) => ({
      id: l.id,
      slug: l.slug,
      title: l.main_title,
    }));

    const availableCountries = Array.from(
      new Set(geo.map((g) => g.country))
    );
    const availableOs = Array.from(new Set(osBreakdown.map((o) => o.os)));

    return createSuccessResponse({
      summary: {
        totalClicks,
        totalEarnings,
        todayClicks,
        bestLink,
      },
      trend,
      sources,
      devices,
      osBreakdown,
      geo,
      topLinks,
      hourlyActivity,
      earningsInsights: {
        epc: Math.round(epc * 10000) / 10000,
        cpm: Math.round(cpm * 100) / 100,
        topCountry,
        topLink: topLinkByEarnings,
      },
      filters: {
        availableLinks,
        availableCountries,
        availableOs,
      },
      period,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
