import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const userId = user.id as string;

    const { error: walletError } = await supabaseAdmin
      .from('wallet_transactions')
      .delete()
      .eq('user_id', userId);

    if (walletError) {
      return createErrorResponse('Failed to delete wallet transactions');
    }

    const { error: linksError } = await supabaseAdmin
      .from('links')
      .delete()
      .eq('user_id', userId);

    if (linksError) {
      return createErrorResponse('Failed to delete links');
    }

    const { error: profileError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (profileError) {
      return createErrorResponse('Failed to delete profile');
    }

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      return createErrorResponse('Failed to delete auth user');
    }

    return createSuccessResponse({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
