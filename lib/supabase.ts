import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
}

const isServer = typeof window === 'undefined';

// Client-side Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const getSupabaseAdminClient = (): SupabaseClient<Database> => {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required on the server for admin operations.');
  }
  return createClient<Database>(supabaseUrl, supabaseServiceKey);
};

// Server-side Supabase client with service role (never instantiated in the browser)
// This is only used in API routes (server-side), so it's safe to assert the type
export const supabaseAdmin: SupabaseClient<Database> = isServer
  ? getSupabaseAdminClient()
  : (null as unknown as SupabaseClient<Database>);

// Helper function for server-side usage that ensures proper typing
export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!isServer) {
    throw new Error('supabaseAdmin can only be used on the server side');
  }
  return getSupabaseAdminClient();
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: 'user' | 'admin';
          created_at: string;
          updated_at: string;
          verified: boolean;
          full_name: string | null;
          username: string | null;
          avatar_url: string | null;
          upi_id: string | null;
          paypal_email: string | null;
          bank_details: string | null;
          notify_email: boolean | null;
          notify_withdrawal: boolean | null;
          notify_analytics: boolean | null;
        };
        Insert: {
          id: string;
          email: string;
          role?: 'user' | 'admin';
          created_at?: string;
          updated_at?: string;
          verified?: boolean;
          full_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          upi_id?: string | null;
          paypal_email?: string | null;
          bank_details?: string | null;
          notify_email?: boolean | null;
          notify_withdrawal?: boolean | null;
          notify_analytics?: boolean | null;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'user' | 'admin';
          created_at?: string;
          updated_at?: string;
          verified?: boolean;
          full_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          upi_id?: string | null;
          paypal_email?: string | null;
          bank_details?: string | null;
          notify_email?: boolean | null;
          notify_withdrawal?: boolean | null;
          notify_analytics?: boolean | null;
        };  
      };
      links: {
        Row: {
          id: string;
          user_id: string;
          slug: string;
          main_title: string;
          created_at: string;
          expires_at: string | null;
          earnings: number;
          clicks: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          slug: string;
          main_title: string;
          created_at?: string;
          expires_at?: string | null;
          earnings?: number;
          clicks?: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          slug?: string;
          main_title?: string;
          created_at?: string;
          expires_at?: string | null;
          earnings?: number;
          clicks?: number;
          is_active?: boolean;
        };
      };
      movie_links: {
        Row: {
          id: string;
          link_id: string;
          quality: '480p' | '720p' | '1080p';
          target_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          link_id: string;
          quality: '480p' | '720p' | '1080p';
          target_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          link_id?: string;
          quality?: '480p' | '720p' | '1080p';
          target_url?: string;
          created_at?: string;
        };
      };
      clicks: {
        Row: {
          id: string;
          link_id: string;
          timestamp: string;
          country: string | null;
          city: string | null;
          device: string;
          os: string;
          referrer: string | null;
          earnings: number;
          ip_hash: string;
        };
        Insert: {
          id?: string;
          link_id: string;
          timestamp?: string;
          country?: string | null;
          city?: string | null;
          device: string;
          os: string;
          referrer?: string | null;
          earnings?: number;
          ip_hash: string;
        };
        Update: {
          id?: string;
          link_id?: string;
          timestamp?: string;
          country?: string | null;
          city?: string | null;
          device?: string;
          os?: string;
          referrer?: string | null;
          earnings?: number;
          ip_hash?: string;
        };
      };
    };
  };
};
