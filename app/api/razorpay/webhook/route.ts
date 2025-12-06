import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createErrorResponse, createSuccessResponse } from '@/lib/middleware';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return createErrorResponse('Webhook not configured', 500);
    }

    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    const expected = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');

    if (signature !== expected) {
      return createErrorResponse('Invalid signature', 400);
    }

    const event = JSON.parse(body);
    const eventType: string | undefined = event.event;
    const entity = event?.payload?.payment_link?.entity;

    if (!entity) {
      return createSuccessResponse({ received: true });
    }

    const referenceId: string | undefined = entity.reference_id;
    const paymentLinkId: string | undefined = entity.id;
    const razorpayStatus: string | undefined = entity.status;

    if (!referenceId) {
      return createSuccessResponse({ received: true });
    }

    if (eventType === 'payment_link.paid') {
      await (supabaseAdmin as any)
        .from('wallet_transactions')
        .update({
          status: 'paid',
          payment_link_id: paymentLinkId || null,
          razorpay_status: razorpayStatus || 'paid',
        })
        .eq('id', referenceId);
    } else if (eventType === 'payment_link.expired' || eventType === 'payment_link.cancelled') {
      await (supabaseAdmin as any)
        .from('wallet_transactions')
        .update({
          status: 'failed',
          payment_link_id: paymentLinkId || null,
          razorpay_status: razorpayStatus || eventType,
        })
        .eq('id', referenceId);
    }

    return createSuccessResponse({ received: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
