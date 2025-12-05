import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from './supabase';

const RATE_LIMIT_REQUESTS = parseInt(process.env.RATE_LIMIT_REQUESTS || '100');
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000');

// In-memory rate limiting (replace with Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

export async function verifyAuth(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return null;
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }
    return data.user;
  } catch {
    return null;
  }
}

export async function verifyAdmin(req: NextRequest) {
  const user = await verifyAuth(req);

  if (!user) {
    return null;
  }

  const { data } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single();

  if (data?.role === 'admin') {
    return user;
  }

  return null;
}

export function createErrorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function createSuccessResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}
