import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth, createErrorResponse, createSuccessResponse } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Get total count
    const { count } = await supabaseAdmin
      .from('links')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get paginated links
    const { data: links, error } = await supabaseAdmin
      .from('links')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return createErrorResponse('Failed to fetch links');
    }

    // Get movie links for each link
    const linksWithMovies = await Promise.all(
      (links || []).map(async (link) => {
        const { data: movieLinks } = await supabaseAdmin
          .from('movie_links')
          .select('*')
          .eq('link_id', link.id);

        return {
          ...link,
          movieLinks: movieLinks || [],
        };
      })
    );

    return createSuccessResponse({
      links: linksWithMovies,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('List links error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
