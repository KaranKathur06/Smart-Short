import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth, rateLimit, createErrorResponse, createSuccessResponse } from '@/lib/middleware';
import { generateSlug, generateId, isValidUrl } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Rate limiting
    if (!rateLimit(user.id)) {
      return createErrorResponse('Rate limit exceeded', 429);
    }

    const body = await req.json();
    const { title, customSlug, expiresAt, movieLinks } = body;

    // Validation
    if (!title || !movieLinks || movieLinks.length === 0) {
      return createErrorResponse('Missing required fields');
    }

    if (!Array.isArray(movieLinks)) {
      return createErrorResponse('movieLinks must be an array');
    }

    // Validate all movie links
    for (const link of movieLinks) {
      if (!link.quality || !link.targetUrl) {
        return createErrorResponse('Each movie link must have quality and targetUrl');
      }
      if (!isValidUrl(link.targetUrl)) {
        return createErrorResponse('Invalid URL: ' + link.targetUrl);
      }
      if (!['480p', '720p', '1080p'].includes(link.quality)) {
        return createErrorResponse('Invalid quality. Must be 480p, 720p, or 1080p');
      }
    }

    // Generate or validate slug
    let slug = customSlug || generateSlug();

    // Check if slug exists
    const { data: existingSlug } = await supabaseAdmin
      .from('links')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingSlug) {
      return createErrorResponse('Slug already exists');
    }

    const linkId = generateId();

    // Create link
    const { error: linkError } = await (supabaseAdmin as any).from('links').insert({
      id: linkId,
      user_id: user.id,
      slug,
      main_title: title,
      expires_at: expiresAt || null,
      earnings: 0,
      clicks: 0,
      is_active: true,
    });

    if (linkError) {
      return createErrorResponse('Failed to create link');
    }

    // Create movie links
    const movieLinkRecords = movieLinks.map((link: any) => ({
      id: generateId(),
      link_id: linkId,
      quality: link.quality,
      target_url: link.targetUrl,
    }));

    const { error: movieError } = await (supabaseAdmin as any)
      .from('movie_links')
      .insert(movieLinkRecords);

    if (movieError) {
      return createErrorResponse('Failed to create movie links');
    }

    return createSuccessResponse(
      {
        id: linkId,
        slug,
        shortUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${slug}`,
        title,
        movieLinks,
      },
      201
    );
  } catch (error) {
    console.error('Create link error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
