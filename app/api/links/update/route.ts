import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

export async function PUT(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const body = await req.json();
    const { id, title } = body;

    if (!id || !title) {
      return createErrorResponse('Missing required fields');
    }

    const { data: link } = await (supabaseAdmin as any)
      .from('links')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (!link || link.user_id !== user.id) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { error } = await (supabaseAdmin as any)
      .from('links')
      .update({ main_title: title })
      .eq('id', id);

    if (error) {
      return createErrorResponse('Failed to update link');
    }

    return createSuccessResponse({ message: 'Link updated' });
  } catch (error) {
    console.error('Update link error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
