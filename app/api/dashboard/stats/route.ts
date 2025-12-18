import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    const { data: statsData, error: statsError } = await (supabaseAdmin as any)
      .rpc('get_user_stats', { p_user_id: userId });

    if (statsError) {
      console.error('Stats fetch error:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: 500 }
      );
    }

    const stats = statsData?.[0] || {
      total_earnings: 0,
      total_clicks: 0,
      valid_clicks: 0,
      completed_clicks: 0,
      avg_cpm: 0,
      today_earnings: 0,
      today_clicks: 0,
    };

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();

    const { data: earningsByDate, error: earningsError } = await (supabaseAdmin as any)
      .rpc('get_user_earnings_by_date', {
        p_user_id: userId,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      });

    if (earningsError) {
      console.error('Earnings by date error:', earningsError);
    }

    const { data: recentEarnings, error: recentError } = await supabaseAdmin
      .from('earnings')
      .select('*, clicks!inner(*, links!inner(*))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) {
      console.error('Recent earnings error:', recentError);
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalEarnings: parseFloat(stats.total_earnings || 0),
        totalClicks: parseInt(stats.total_clicks || 0),
        validClicks: parseInt(stats.valid_clicks || 0),
        completedClicks: parseInt(stats.completed_clicks || 0),
        avgCPM: parseFloat(stats.avg_cpm || 0),
        todayEarnings: parseFloat(stats.today_earnings || 0),
        todayClicks: parseInt(stats.today_clicks || 0),
      },
      earningsByDate: earningsByDate || [],
      recentEarnings: recentEarnings || [],
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
