import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

const MIN_WITHDRAW_AMOUNT = parseFloat(process.env.MIN_WITHDRAW_AMOUNT || '50');

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

    const { amount, upiId } = body;

    const parsedAmount = Number(amount);
    if (!parsedAmount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return createErrorResponse('Invalid amount');
    }

    if (!upiId || typeof upiId !== 'string') {
      return createErrorResponse('UPI ID is required');
    }

    const { data: activeTxs, error: activeError } = await (supabaseAdmin as any)
      .from('wallet_transactions')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('status', 'initiated');

    if (activeError) {
      return createErrorResponse('Failed to check existing payouts');
    }

    if (activeTxs && activeTxs.length > 0) {
      return createErrorResponse('You already have a payout in progress');
    }

    const { data: linksData, error: linksError } = await (supabaseAdmin as any)
      .from('links')
      .select('earnings')
      .eq('user_id', user.id);

    if (linksError) {
      return createErrorResponse('Failed to fetch earnings');
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
      return createErrorResponse('Failed to fetch payouts');
    }

    const withdrawals: any[] = txs || [];

    const paidOutRaw = withdrawals
      .filter((tx) => tx.status === 'paid')
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

    const pendingBalance = Math.max(0, totalEarningsRaw - paidOutRaw);

    if (parsedAmount < MIN_WITHDRAW_AMOUNT) {
      return createErrorResponse(`Minimum withdrawal amount is ${MIN_WITHDRAW_AMOUNT.toFixed(2)}`);
    }

    if (parsedAmount > pendingBalance) {
      return createErrorResponse('Requested amount exceeds pending earnings');
    }

    const { data: inserted, error: insertError } = await (supabaseAdmin as any)
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        amount: parsedAmount,
        status: 'initiated',
        method: 'UPI',
        account_identifier: upiId,
      })
      .select('id, amount, status, method, account_identifier, created_at')
      .single();

    if (insertError || !inserted) {
      return createErrorResponse('Failed to create payout record');
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return createErrorResponse('Razorpay is not configured', 500);
    }

    const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const amountInPaise = Math.round(parsedAmount * 100);

    const customerName = (user.email as string) || 'SmartShort User';
    const customerEmail = (user.email as string) || undefined;

    const payload: any = {
      amount: amountInPaise,
      currency: 'INR',
      accept_partial: false,
      reference_id: inserted.id,
      description: 'SmartShort Payout',
      customer: {
        name: customerName,
        email: customerEmail,
      },
      notify: {
        sms: true,
        email: true,
      },
    };

    const rpRes = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify(payload),
    });

    if (!rpRes.ok) {
      const errJson = await rpRes.json().catch(() => null);

      await (supabaseAdmin as any)
        .from('wallet_transactions')
        .update({ status: 'failed', razorpay_status: 'create_failed' })
        .eq('id', inserted.id);

      const message = errJson?.error?.description || 'Failed to create Razorpay payout link';
      return createErrorResponse(message, 500);
    }

    const rpData: any = await rpRes.json();
    const paymentLinkId: string | undefined = rpData.id;
    const razorpayStatus: string | undefined = rpData.status;

    await (supabaseAdmin as any)
      .from('wallet_transactions')
      .update({
        payment_link_id: paymentLinkId || null,
        razorpay_status: razorpayStatus || null,
      })
      .eq('id', inserted.id);

    return createSuccessResponse({
      message: 'Withdrawal request created',
      payout: {
        ...inserted,
        payment_link_id: paymentLinkId || null,
      },
      paymentLinkId,
    });
  } catch (error) {
    console.error('Payout request error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
