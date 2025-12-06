'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Validating your account… redirecting');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Handle errors
        if (error) {
          setStatus('error');
          setMessage(errorDescription || 'Verification failed. Please try again.');
          toast.error('Verification failed. Please try again.');
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
          return;
        }

        // Handle email verification with code
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            setStatus('error');
            setMessage(exchangeError.message || 'Failed to verify email');
            toast.error('Failed to verify email. Please try again.');
            setTimeout(() => {
              router.push('/auth/login');
            }, 3000);
            return;
          }

          if (data?.session) {
            setStatus('success');
            setMessage('Email verified successfully! Redirecting to dashboard...');
            toast.success('🎉 Email Verified Successfully! Welcome to SmartShort');
            
            // Redirect to dashboard after short delay
            setTimeout(() => {
              router.push('/dashboard');
            }, 1500);
            return;
          }
        }

        // Check if user is already logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStatus('success');
          setMessage('Already logged in! Redirecting to dashboard...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
          return;
        }

        // If no code and no session, redirect to login
        setStatus('error');
        setMessage('No verification code found. Redirecting to login...');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } catch (err) {
        setStatus('error');
        setMessage('An error occurred. Please try again.');
        toast.error('An error occurred during verification');
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <Loader className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Verifying Account</h2>
                <p className="text-slate-400">{message}</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Success!</h2>
                <p className="text-slate-400">{message}</p>
              </>
            )}
            
            {status === 'error' && (
              <>
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Verification Failed</h2>
                <p className="text-slate-400">{message}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card">
            <div className="text-center">
              <Loader className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Loading...</h2>
            </div>
          </div>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}

