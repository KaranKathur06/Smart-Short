import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { validateClickCompletion, getDefaultCPM, getMinAdViewTime } from '@/lib/fraud-protection';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  { params }: { params: { clickId: string } }
) {
  try {
    const clickId = params.clickId;
    const supabaseAdmin = getSupabaseAdmin();

    const minViewTime = await getMinAdViewTime();
    const validation = await validateClickCompletion(clickId, minViewTime);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.reason || 'Invalid click completion' },
        { status: 400 }
      );
    }

    const { data: click, error: clickError } = await supabaseAdmin
      .from('clicks')
      .select('*')
      .eq('id', clickId)
      .single();

    if (clickError || !click) {
      return NextResponse.json(
        { error: 'Click not found' },
        { status: 404 }
      );
    }

    const userId = (click as any).user_id;
    const isValid = (click as any).is_valid;

    await (supabaseAdmin as any)
      .from('clicks')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', clickId);

    if (isValid) {
      const cpmRate = await getDefaultCPM();
      const earningAmount = cpmRate / 1000;

      const { data: earning, error: earningError } = await (supabaseAdmin as any)
        .from('earnings')
        .insert({
          user_id: userId,
          click_id: clickId,
          amount: earningAmount,
          cpm_rate: cpmRate,
        })
        .select()
        .single();

      if (!earningError && earning) {
        const { data: link } = await (supabaseAdmin as any)
          .from('links')
          .select('earnings')
          .eq('id', (click as any).link_id)
          .single();

        if (link) {
          await (supabaseAdmin as any)
            .from('links')
            .update({
              earnings: (link as any).earnings + earningAmount,
            })
            .eq('id', (click as any).link_id);
        }

        return NextResponse.json({
          success: true,
          earned: true,
          amount: earningAmount,
          cpm: cpmRate,
        });
      }
    }

    return NextResponse.json({
      success: true,
      earned: false,
      message: 'Click completed but no earnings (invalid click)',
    });
  } catch (error) {
    console.error('Click completion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
