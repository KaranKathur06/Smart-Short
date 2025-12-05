import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get users with their stats
    const { data: users, count } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    // Get stats for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (user: any) => {
        const { count: linkCount } = await supabaseAdmin
          .from('links')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const { count: clickCount } = await supabaseAdmin
          .from('clicks')
          .select('*', { count: 'exact', head: true })
          .eq('link_id', (await supabaseAdmin.from('links').select('id').eq('user_id', user.id)).data?.[0]?.id);

        const { data: linksData } = await supabaseAdmin
          .from('links')
          .select('earnings')
          .eq('user_id', user.id);

        const earnings = (linksData || []).reduce((sum: number, link: any) => sum + (link.earnings || 0), 0);

        return {
          ...user,
          linkCount: linkCount || 0,
          clickCount: clickCount || 0,
          earnings: Math.round(earnings * 100) / 100,
        };
      })
    );

    return createSuccessResponse({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return createErrorResponse('Unauthorized', 401);
    }

    const body = await req.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return createErrorResponse('Missing required fields');
    }

    if (action === 'ban') {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ role: 'banned' })
        .eq('id', userId);

      if (error) {
        return createErrorResponse('Failed to ban user');
      }

      // Deactivate all user links
      await supabaseAdmin.from('links').update({ is_active: false }).eq('user_id', userId);

      return createSuccessResponse({ message: 'User banned successfully' });
    }

    return createErrorResponse('Invalid action');
  } catch (error) {
    console.error('Admin user update error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
