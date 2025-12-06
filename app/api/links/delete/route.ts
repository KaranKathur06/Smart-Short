import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(req.url);
    const linkId = searchParams.get('id');

    if (!linkId) {
      return createErrorResponse('Link ID is required');
    }

    // Verify ownership
    const { data: link } = await (supabaseAdmin as any)
      .from('links')
      .select('user_id')
      .eq('id', linkId)
      .single();

    if (!link || link.user_id !== user.id) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Delete movie links first
    await supabaseAdmin.from('movie_links').delete().eq('link_id', linkId);

    // Delete clicks
    await supabaseAdmin.from('clicks').delete().eq('link_id', linkId);

    // Delete link
    const { error } = await supabaseAdmin.from('links').delete().eq('id', linkId);

    if (error) {
      return createErrorResponse('Failed to delete link');
    }

    return createSuccessResponse({ message: 'Link deleted successfully' });
  } catch (error) {
    console.error('Delete link error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
