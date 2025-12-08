import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

const DEFAULT_CPM = parseFloat(process.env.DEFAULT_CPM || '640');

async function getDefaultCpm() {
  const { data, error } = await (supabaseAdmin as any)
    .from('settings')
    .select('value')
    .eq('key', 'default_cpm')
    .limit(1);

  const row = Array.isArray(data) ? data[0] : null;

  if (row?.value) {
    const parsed = parseFloat(row.value);
    if (!Number.isNaN(parsed)) return parsed;
  }

  if (!error) {
    await (supabaseAdmin as any)
      .from('settings')
      .upsert({ key: 'default_cpm', value: DEFAULT_CPM.toString() });
  }

  return DEFAULT_CPM;
}

function toIsoDate(date: Date) {
  return date.toISOString().split('T')[0];
}

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { data: links, error: linksError } = await (supabaseAdmin as any)
      .from('links')
      .select('id')
      .eq('user_id', user.id);

    if (linksError) {
      return createErrorResponse('Failed to fetch links');
    }

    const linkIds = (links || []).map((l: any) => l.id);
    const cpm = await getDefaultCpm();

    if (linkIds.length === 0) {
      return createSuccessResponse({
        today_earnings: 0,
        total_earnings: 0,
        total_views: 0,
        cpm,
        graph_data: [],
        monthly_earnings: {},
      });
    }

    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    const yearStart = new Date(today.getFullYear(), 0, 1);
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const { count: totalViews } = await (supabaseAdmin as any)
      .from('clicks')
      .select('id', { count: 'exact', head: true })
      .in('link_id', linkIds);

    const { data: recentClicks, error: clicksError } = await (supabaseAdmin as any)
      .from('clicks')
      .select('timestamp')
      .in('link_id', linkIds)
      .gte('timestamp', yearStart.toISOString());

    if (clicksError) {
      return createErrorResponse('Failed to load metrics');
    }

    const clicks = (recentClicks || []).map((c: { timestamp: string }) => new Date(c.timestamp));

    const todayViews = clicks.filter((d: Date) => d >= todayStart).length;

    const monthlyViews = new Array(12).fill(0);
    const dailyMap = new Map<string, number>();

    clicks.forEach((d: Date) => {
      const monthIndex = d.getMonth();
      monthlyViews[monthIndex] += 1;

      if (d >= thirtyDaysAgo) {
        const key = toIsoDate(d);
        dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
      }
    });

    const graph_data: { date: string; views: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const day = new Date(thirtyDaysAgo);
      day.setDate(thirtyDaysAgo.getDate() + i);
      const key = toIsoDate(day);
      graph_data.push({ date: key, views: dailyMap.get(key) || 0 });
    }

    const monthly_earnings: Record<string, number> = {};
    const year = today.getFullYear();
    monthlyViews.forEach((views, idx) => {
      const monthLabel = new Date(year, idx, 1).toLocaleString('default', {
        month: 'long',
        year: 'numeric',
      });
      monthly_earnings[monthLabel] = Math.round(((views / 1000) * cpm) * 100) / 100;
    });

    const totalEarnings = Math.round((((totalViews || 0) / 1000) * cpm) * 100) / 100;
    const todayEarnings = Math.round(((todayViews / 1000) * cpm) * 100) / 100;

    return createSuccessResponse({
      today_earnings: todayEarnings,
      total_earnings: totalEarnings,
      total_views: totalViews || 0,
      cpm,
      graph_data,
      monthly_earnings,
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

