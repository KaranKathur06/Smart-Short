import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const minWithdraw = parseFloat(process.env.MIN_WITHDRAW_AMOUNT || '50');

    const { data: linksData, error: linksError } = await (supabaseAdmin as any)
      .from('links')
      .select('id, earnings, clicks')
      .eq('user_id', user.id);

    if (linksError) {
      return createErrorResponse('Failed to fetch links');
    }

    const linksList: any[] = linksData || [];

    const linkIds = linksList.map((l) => l.id);
    const totalEarningsRaw = linksList.reduce(
      (sum, l) => sum + (Number(l.earnings) || 0),
      0
    );
    const totalClicks = linksList.reduce(
      (sum, l) => sum + (Number(l.clicks) || 0),
      0
    );
    const totalEarnings = Math.round(totalEarningsRaw * 100) / 100;

    const { data: txs, error: txError } = await (supabaseAdmin as any)
      .from('wallet_transactions')
      .select('id, amount, status, method, account_identifier, payment_link_id, razorpay_status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (txError) {
      return createErrorResponse('Failed to fetch withdrawals');
    }

    const withdrawals: any[] = txs || [];

    const withdrawnAmountRaw = withdrawals
      .filter((tx) => tx.status === 'paid')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const withdrawnAmount = Math.round(withdrawnAmountRaw * 100) / 100;

    const pendingAmount = Math.max(0, totalEarningsRaw - withdrawnAmountRaw);
    const availableBalance = pendingAmount;

    let chart: { date: string; earnings: number }[] = [];

    if (linkIds.length > 0) {
      const start = new Date();
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);

      const { data: clicks, error: clicksError } = await (supabaseAdmin as any)
        .from('clicks')
        .select('timestamp, earnings, link_id')
        .in('link_id', linkIds)
        .gte('timestamp', start.toISOString());

      if (clicksError) {
        return createErrorResponse('Failed to fetch earnings data');
      }

      const map = new Map<string, number>();

      const base = new Date(start);
      for (let i = 0; i < 30; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        const key = d.toISOString().split('T')[0];
        map.set(key, 0);
      }

      (clicks || []).forEach((click: any) => {
        const key = new Date(click.timestamp).toISOString().split('T')[0];
        map.set(key, (map.get(key) || 0) + (Number(click.earnings) || 0));
      });

      chart = Array.from(map.entries()).map(([date, value]) => ({
        date,
        earnings: Math.round(value * 100) / 100,
      }));
    }

    return createSuccessResponse({
      summary: {
        totalEarnings,
        pendingAmount,
        withdrawnAmount,
        availableBalance,
        totalClicks,
        totalLinks: linksList.length,
        totalWithdrawals: withdrawals.length,
      },
      chart,
      withdrawals,
      minWithdraw,
    });
  } catch (error) {
    console.error('Earnings error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
