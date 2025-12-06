import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth, rateLimit, createErrorResponse, createSuccessResponse } from '@/lib/middleware';
import { generateSlug, generateId, isValidUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    if (!rateLimit(user.id)) {
      return createErrorResponse('Rate limit exceeded', 429);
    }

    const body = await req.json();
    const url = (body.url || '').trim();
    const customSlug = (body.customSlug || '').trim();
    const title = (body.title || '').trim();

    if (!url) {
      return createErrorResponse('URL is required');
    }

    if (!isValidUrl(url)) {
      return createErrorResponse('Invalid URL');
    }

    if (customSlug && !/^[a-zA-Z0-9-]+$/.test(customSlug)) {
      return createErrorResponse('Custom alias can only contain letters, numbers, and hyphens');
    }

    let slug = customSlug || generateSlug();

    const { data: existingSlug } = await supabaseAdmin
      .from('links')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingSlug) {
      return createErrorResponse('Slug already exists', 409);
    }

    const linkId = generateId();

    const { error: linkError } = await (supabaseAdmin as any).from('links').insert({
      id: linkId,
      user_id: user.id,
      slug,
      main_title: title || 'Short link',
      earnings: 0,
      clicks: 0,
      is_active: true,
    });

    if (linkError) {
      return createErrorResponse('Failed to create link');
    }

    const { error: movieError } = await (supabaseAdmin as any).from('movie_links').insert({
      id: generateId(),
      link_id: linkId,
      quality: '720p',
      target_url: url,
    });

    if (movieError) {
      return createErrorResponse('Failed to create link');
    }

    return createSuccessResponse(
      {
        id: linkId,
        slug,
        shortUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${slug}`,
        targetUrl: url,
        title: title || 'Short link',
      },
      201
    );
  } catch (error) {
    console.error('Shorten link error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
