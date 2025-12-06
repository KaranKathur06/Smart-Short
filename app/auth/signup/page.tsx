'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Loader, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { calculatePasswordStrength, getPasswordStrengthWidth } from '@/lib/password-utils';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [displayPassword, setDisplayPassword] = useState('');
  const [displayConfirmPassword, setDisplayConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const confirmTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const passwordStrength = calculatePasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  // Handle "show while typing" feature for password
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

  // Handle "show while typing" feature for confirm password
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setConfirmPassword(newPassword);

    // Show last character briefly
    if (newPassword.length > confirmPassword.length && !showConfirmPassword) {
      const lastChar = newPassword[newPassword.length - 1];
      const masked = '•'.repeat(newPassword.length - 1) + lastChar;
      setDisplayConfirmPassword(masked);

      // Clear previous timeout
      if (confirmTypingTimeoutRef.current) {
        clearTimeout(confirmTypingTimeoutRef.current);
      }

      // Hide after 800ms
      confirmTypingTimeoutRef.current = setTimeout(() => {
        setDisplayConfirmPassword('');
      }, 800);
    } else {
      setDisplayConfirmPassword('');
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (confirmTypingTimeoutRef.current) {
        clearTimeout(confirmTypingTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength.strength === 'weak') {
      setError('Please choose a stronger password');
      return;
    }

    setLoading(true);

    try {
      // Get the base URL for redirect
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_APP_URL || 'https://smartshort.in';
      const redirectUrl = `${baseUrl}/auth/callback`;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: name,
          },
        },
      });

      if (signUpError) {
        const msg = signUpError.message?.toLowerCase() || '';
        if (msg.includes('user already registered') || msg.includes('already registered')) {
          setError('Email already registered. Please sign in instead.');
          toast.error('Email already registered. Please sign in instead.');
        } else {
          setError(signUpError.message || 'Signup failed. Please try again.');
          toast.error(signUpError.message || 'Signup failed. Please try again.');
        }
        return;
      }

      if (data.user) {
        try {
          await (supabase as any)
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email as string,
              role: 'user',
              verified: true,
              created_at: new Date().toISOString(),
            });
        } catch {
        }
      }

      setSuccess('Account created successfully. Check your email to verify your account.');
      toast.success('Signup successful! Check your email to verify your account 📧');
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err) {
      setError('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-slate-400">Join SmartShort and start earning</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/50 rounded-lg text-emerald-400 text-sm">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-10"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

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
              
              {/* Password Strength Meter */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Password Strength:</span>
                    <span 
                      className="font-medium transition-colors duration-300"
                      style={{ color: passwordStrength.color }}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: getPasswordStrengthWidth(passwordStrength.strength),
                        backgroundColor: passwordStrength.color,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={showConfirmPassword ? confirmPassword : (displayConfirmPassword || confirmPassword)}
                  onChange={handleConfirmPasswordChange}
                  className={`input-field pl-10 pr-10 ${
                    passwordsMatch ? 'border-emerald-500/50 focus:border-emerald-500' : 
                    passwordsMismatch ? 'border-red-500/50 focus:border-red-500' : ''
                  }`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowConfirmPassword(!showConfirmPassword);
                    }
                  }}
                  className="absolute right-3 top-3 w-5 h-5 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-800 rounded"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                  tabIndex={0}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {passwordsMatch && (
                  <div className="absolute right-10 top-3 flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                )}
              </div>
              
              {/* Confirm Password Validation Indicator */}
              {confirmPassword.length > 0 && (
                <div className="mt-2 flex items-center gap-2 text-xs transition-opacity duration-300">
                  {passwordsMatch ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-400">Passwords match</span>
                    </>
                  ) : passwordsMismatch ? (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-400">Passwords do not match</span>
                    </>
                  ) : null}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || passwordStrength.strength === 'weak' || !passwordsMatch}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-blue-400 hover:text-blue-300">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
