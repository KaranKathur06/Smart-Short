import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Total links
    const { count: totalLinks } = await supabaseAdmin
      .from('links')
      .select('*', { count: 'exact', head: true });

    // Total clicks
    const { count: totalClicks } = await supabaseAdmin
      .from('clicks')
      .select('*', { count: 'exact', head: true });

    // Total users
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Total earnings
    const { data: linksData } = await (supabaseAdmin as any)
      .from('links')
      .select('earnings');
    const totalEarnings = (linksData || []).reduce(
      (sum: number, link: any) => sum + (link.earnings || 0),
      0
    );

    // Top earners
    const { data: topEarners } = await supabaseAdmin
      .from('links')
      .select('user_id, earnings')
      .order('earnings', { ascending: false })
      .limit(10);

    // Get user details for top earners
    const topEarnersWithDetails = await Promise.all(
      (topEarners || []).map(async (link: any) => {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('email')
          .eq('id', link.user_id)
          .single();

        return {
          userId: link.user_id,
          email: (user as any)?.email || 'Unknown',
          earnings: link.earnings,
        };
      })
    );

    // Revenue by region
    const { data: clicks } = await supabaseAdmin.from('clicks').select('country, earnings');
    const regionMap = new Map<string, number>();
    (clicks || []).forEach((click: any) => {
      const country = click.country || 'Unknown';
      regionMap.set(country, (regionMap.get(country) || 0) + (click.earnings || 0));
    });

    const revenueByRegion = Array.from(regionMap.entries())
      .map(([region, revenue]) => ({ region, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return createSuccessResponse({
      stats: {
        totalLinks: totalLinks || 0,
        totalClicks: totalClicks || 0,
        totalUsers: totalUsers || 0,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
      },
      topEarners: topEarnersWithDetails,
      revenueByRegion,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
