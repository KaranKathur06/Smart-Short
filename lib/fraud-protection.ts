import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from './supabase';

const BOT_USER_AGENTS = [
  'bot', 'crawler', 'spider', 'scraper', 'curl', 'wget', 'python',
  'java', 'http', 'headless', 'phantom', 'selenium', 'puppeteer'
];

const SUSPICIOUS_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /scrape/i, /curl/i, /wget/i,
  /python/i, /java/i, /http/i, /headless/i, /phantom/i, /selenium/i
];

export function isBot(userAgent: string): boolean {
  if (!userAgent || userAgent.length < 10) {
    return true;
  }

  const lowerUA = userAgent.toLowerCase();
  
  for (const botPattern of BOT_USER_AGENTS) {
    if (lowerUA.includes(botPattern)) {
      return true;
    }
  }

  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(userAgent)) {
      return true;
    }
  }

  return false;
}

export async function checkIPThrottle(
  ipHash: string,
  linkId: string,
  timeWindowMinutes: number = 60
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const timeThreshold = new Date(Date.now() - timeWindowMinutes * 60 * 1000).toISOString();

    const { data: recentClicks, error } = await (supabaseAdmin as any)
      .from('clicks')
      .select('id, timestamp')
      .eq('link_id', linkId)
      .eq('ip_hash', ipHash)
      .gte('timestamp', timeThreshold)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('IP throttle check error:', error);
      return { allowed: true };
    }

    if (!recentClicks || recentClicks.length === 0) {
      return { allowed: true };
    }

    if (recentClicks.length >= 3) {
      return { 
        allowed: false, 
        reason: 'Too many clicks from same IP in short time' 
      };
    }

    const lastClick = recentClicks[0];
    const timeSinceLastClick = Date.now() - new Date((lastClick as any).timestamp).getTime();
    const minTimeBetweenClicks = 30 * 1000;

    if (timeSinceLastClick < minTimeBetweenClicks) {
      return { 
        allowed: false, 
        reason: 'Click too soon after previous click' 
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('IP throttle check error:', error);
    return { allowed: true };
  }
}

export async function validateClickCompletion(
  clickId: string,
  minViewTimeSeconds: number = 10
): Promise<{ valid: boolean; reason?: string }> {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: click, error } = await (supabaseAdmin as any)
      .from('clicks')
      .select('*')
      .eq('id', clickId)
      .single();

    if (error || !click) {
      return { valid: false, reason: 'Click not found' };
    }

    if ((click as any).is_completed) {
      return { valid: false, reason: 'Click already completed' };
    }

    const clickTime = new Date((click as any).timestamp).getTime();
    const currentTime = Date.now();
    const timeSpent = (currentTime - clickTime) / 1000;

    if (timeSpent < minViewTimeSeconds) {
      return { 
        valid: false, 
        reason: `Minimum view time not met (${timeSpent.toFixed(1)}s < ${minViewTimeSeconds}s)` 
      };
    }

    if (timeSpent > 300) {
      return { 
        valid: false, 
        reason: 'View time too long (possible tab abandonment)' 
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('Click validation error:', error);
    return { valid: false, reason: 'Validation error' };
  }
}

export function detectSuspiciousActivity(req: NextRequest): {
  suspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  const userAgent = req.headers.get('user-agent') || '';
  const referer = req.headers.get('referer');

  if (isBot(userAgent)) {
    reasons.push('Bot user agent detected');
  }

  if (!userAgent || userAgent.length < 10) {
    reasons.push('Missing or invalid user agent');
  }

  if (!referer) {
    reasons.push('No referer header (direct access)');
  }

  const acceptLanguage = req.headers.get('accept-language');
  if (!acceptLanguage) {
    reasons.push('Missing accept-language header');
  }

  const accept = req.headers.get('accept');
  if (!accept || !accept.includes('text/html')) {
    reasons.push('Suspicious accept header');
  }

  return {
    suspicious: reasons.length >= 2,
    reasons
  };
}

export async function getDefaultCPM(): Promise<number> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    const { data: setting } = await (supabaseAdmin as any)
      .from('settings')
      .select('value')
      .eq('key', 'default_cpm')
      .single();

    if (setting) {
      return parseFloat((setting as any).value);
    }

    return 10.00;
  } catch (error) {
    console.error('Error fetching CPM:', error);
    return 10.00;
  }
}

export async function getAdDisplayDuration(): Promise<number> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    const { data: setting } = await (supabaseAdmin as any)
      .from('settings')
      .select('value')
      .eq('key', 'ad_display_duration')
      .single();

    if (setting) {
      return parseInt((setting as any).value);
    }

    return 15;
  } catch (error) {
    console.error('Error fetching ad duration:', error);
    return 15;
  }
}

export async function getMinAdViewTime(): Promise<number> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    const { data: setting } = await (supabaseAdmin as any)
      .from('settings')
      .select('value')
      .eq('key', 'min_ad_view_time')
      .single();

    if (setting) {
      return parseInt((setting as any).value);
    }

    return 10;
  } catch (error) {
    console.error('Error fetching min view time:', error);
    return 10;
  }
}
