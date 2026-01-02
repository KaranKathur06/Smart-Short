'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Loader, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayPassword, setDisplayPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for email verification success
  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      toast.success('🎉 Email Verified Successfully! You can now access your dashboard');
      // Clean up URL
      router.replace('/auth/login');
    }
  }, [searchParams, router]);

  // Handle "show while typing" feature
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    // Show last character briefly
    if (newPassword.length > password.length && !showPassword) {
      const lastChar = newPassword[newPassword.length - 1];
      const masked = '•'.repeat(newPassword.length - 1) + lastChar;
      setDisplayPassword(masked);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Hide after 800ms
      typingTimeoutRef.current = setTimeout(() => {
        setDisplayPassword('');
      }, 800);
    } else {
      setDisplayPassword('');
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleGoogleAuth = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const redirectTo = `${window.location.origin}/api/auth/callback?next=/dashboard`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (oauthError) {
        const msg = oauthError.message?.toLowerCase() || '';
        let friendly = 'Google sign-in failed. Please try again.';
        if (msg.includes('popup')) {
          friendly = 'Popup blocked. Please allow popups and try again.';
        } else if (msg.includes('cancel')) {
          friendly = 'Authentication cancelled. Please try again.';
        } else if (msg.includes('network')) {
          friendly = 'Network error. Check your connection and try again.';
        }

        setError(friendly);
        toast.error(friendly);
      }
    } catch {
      const friendly = 'Google sign-in failed. Please try again.';
      setError(friendly);
      toast.error(friendly);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        const msg = signInError.message?.toLowerCase() || '';
        if (msg.includes('invalid login credentials')) {
          setError('Wrong password or email not registered.');
        } else if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
          setError('Email not confirmed. Please verify to continue.');
        } else {
          setError(signInError.message || 'Login failed. Please try again.');
        }
        return;
      }

      if (!data?.session) {
        setError('Login failed. Please try again.');
        return;
      }

      toast.success('Welcome back! Login successful 🎉');
      router.push('/dashboard');
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back to SmartShort</h1>
            <p className="text-slate-400">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={showPassword ? password : (displayPassword || password)}
                  onChange={handlePasswordChange}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowPassword(!showPassword);
                    }
                  }}
                  className="absolute right-3 top-3 w-5 h-5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-800 rounded"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/auth/forgot-password" className="text-blue-400 hover:text-blue-300 text-sm">
              Forgot your password?
            </Link>
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-700/60" />
              <span className="text-xs uppercase tracking-wider text-slate-500">OR</span>
              <div className="h-px flex-1 bg-slate-700/60" />
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={googleLoading || loading}
              className="mt-4 w-full relative flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900/40 px-4 py-3 text-sm font-medium text-slate-100 hover:bg-slate-800/60 hover:border-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label="Continue with Google"
            >
              <span className="absolute left-4 inline-flex h-5 w-5 items-center justify-center" aria-hidden="true">
                <svg viewBox="0 0 48 48" className="h-5 w-5">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.2 3.6l6.9-6.9C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l8.1 6.3C12.6 13.3 17.8 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-2.8-.4-4.1H24v7.8h12.7c-.6 3-2.4 5.6-5.1 7.4l7.9 6.1c4.6-4.2 7-10.3 7-17.2z" />
                  <path fill="#FBBC05" d="M10.7 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5l-8.1-6.3C.9 16.4 0 20.1 0 24c0 3.9.9 7.6 2.6 10.8l8.1-6.3z" />
                  <path fill="#34A853" d="M24 48c6.4 0 11.9-2.1 15.9-5.7l-7.9-6.1c-2.2 1.5-5 2.4-8 2.4-6.2 0-11.4-3.8-13.3-9.1l-8.1 6.3C6.5 42.6 14.6 48 24 48z" />
                </svg>
              </span>

              {googleLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  Redirecting...
                </span>
              ) : (
                'Continue with Google'
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
