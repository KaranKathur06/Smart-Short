import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAdDisplayDuration } from '@/lib/fraud-protection';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { clickId: string } }
) {
  try {
    const clickId = params.clickId;
    const supabaseAdmin = getSupabaseAdmin();

    const { data: click, error: clickError } = await supabaseAdmin
      .from('clicks')
      .select('*, links!inner(*)')
      .eq('id', clickId)
      .single();

    if (clickError || !click) {
      return NextResponse.json(
        { error: 'Click not found' },
        { status: 404 }
      );
    }

    const link = (click as any).links;

    if (!link) {
      return NextResponse.json(
        { error: 'Associated link not found' },
        { status: 404 }
      );
    }

    const { data: movieLinks } = await supabaseAdmin
      .from('movie_links')
      .select('*')
      .eq('link_id', link.id)
      .order('quality', { ascending: false });

    let redirectUrl = link.main_title;

    if (movieLinks && movieLinks.length > 0) {
      redirectUrl = (movieLinks[0] as any).target_url;
    }

    const adDuration = await getAdDisplayDuration();

    return NextResponse.json({
      success: true,
      redirectUrl,
      title: link.main_title,
      adDuration,
    });
  } catch (error) {
    console.error('Click fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
