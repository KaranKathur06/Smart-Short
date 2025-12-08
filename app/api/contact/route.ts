import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createErrorResponse, createSuccessResponse, rateLimit } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!rateLimit(`contact:${ip}`)) {
      return createErrorResponse('Too many requests. Please try again later.', 429);
    }

    const body = await req.json().catch(() => null);
    const { name, email, subject, message } = body || {};

    if (!name || !email || !subject || !message) {
      return createErrorResponse('All fields are required.', 400);
    }

    const payload = {
      name: String(name).slice(0, 200),
      email: String(email).slice(0, 200),
      subject: String(subject).slice(0, 200),
      message: String(message).slice(0, 2000),
      status: 'new',
    };

    const { error } = await (supabaseAdmin as any).from('contact_messages').insert(payload);
    if (error) {
      return createErrorResponse('Failed to save message.', 500);
    }

    return createSuccessResponse({ message: 'Message received. Our team will reply soon.' });
  } catch (error) {
    console.error('Contact error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

