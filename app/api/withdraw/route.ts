import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return createErrorResponse('Invalid request body');
    }

    const { amount, method, accountIdentifier } = body;

    const parsedAmount = Number(amount);
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return createErrorResponse('Invalid amount');
    }

    if (!method || typeof method !== 'string' || !accountIdentifier || typeof accountIdentifier !== 'string') {
      return createErrorResponse('Missing withdrawal method or account');
    }

    const minWithdraw = parseFloat(process.env.MIN_WITHDRAW_AMOUNT || '50');

    const { data: linksData, error: linksError } = await (supabaseAdmin as any)
      .from('links')
      .select('id, earnings')
      .eq('user_id', user.id);

    if (linksError) {
      return createErrorResponse('Failed to fetch balance');
    }

    const linksList: any[] = linksData || [];
    const totalEarningsRaw = linksList.reduce(
      (sum, l) => sum + (Number(l.earnings) || 0),
      0
    );

    const { data: txs, error: txError } = await (supabaseAdmin as any)
      .from('wallet_transactions')
      .select('amount, status')
      .eq('user_id', user.id);

    if (txError) {
      return createErrorResponse('Failed to fetch existing withdrawals');
    }

    const withdrawals: any[] = txs || [];

    const withdrawnAmountRaw = withdrawals
      .filter((tx) => tx.status === 'approved')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const onHoldRaw = withdrawals
      .filter((tx) => tx.status === 'pending')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const availableBalance = Math.max(0, totalEarningsRaw - withdrawnAmountRaw - onHoldRaw);

    if (parsedAmount < minWithdraw) {
      return createErrorResponse(`Minimum withdrawal amount is ${minWithdraw.toFixed(2)}`);
    }

    if (parsedAmount > availableBalance) {
      return createErrorResponse('Requested amount exceeds available balance');
    }

    const { data, error: insertError } = await (supabaseAdmin as any)
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        amount: parsedAmount,
        status: 'pending',
        method,
        account_identifier: accountIdentifier,
      })
      .select('id, amount, status, method, account_identifier, created_at')
      .single();

    if (insertError) {
      return createErrorResponse('Failed to create withdrawal request');
    }

    return createSuccessResponse({
      message: 'Withdrawal request created',
      withdrawal: data,
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
