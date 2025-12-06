import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import type { NextRequest } from 'next/server';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(length: number = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let slug = '';
  for (let i = 0; i < length; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

export function generateId(): string {
  return uuidv4();
}

export function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex');
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : null;
  return ip || 'unknown';
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateEarnings(clicks: number, ratePerClick: number = 0.001): number {
  return Math.round(clicks * ratePerClick * 100) / 100;
}

export function truncateUrl(url: string, length: number = 50): string {
  if (url.length <= length) return url;
  return url.substring(0, length) + '...';
}

export function getDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

export function getOS(userAgent: string): string {
  if (/windows/i.test(userAgent)) return 'Windows';
  if (/macintosh|mac os x/i.test(userAgent)) return 'macOS';
  if (/linux/i.test(userAgent)) return 'Linux';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
  if (/android/i.test(userAgent)) return 'Android';
  return 'Unknown';
}

export function getReferrer(referrer: string | null | undefined): string {
  if (!referrer) return 'Direct';
  if (referrer.includes('whatsapp')) return 'WhatsApp';
  if (referrer.includes('instagram')) return 'Instagram';
  if (referrer.includes('facebook')) return 'Facebook';
  if (referrer.includes('twitter')) return 'Twitter';
  if (referrer.includes('telegram')) return 'Telegram';
  if (referrer.includes('reddit')) return 'Reddit';
  return 'Other';
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}
