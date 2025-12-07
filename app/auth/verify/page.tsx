'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader } from 'lucide-react';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Auto-redirect to login with verified=true
    router.replace('/auth/login?verified=true');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Verifying Email</h2>
            <p className="text-slate-400">Redirecting to login...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
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
      <VerifyContent />
    </Suspense>
  );
}

