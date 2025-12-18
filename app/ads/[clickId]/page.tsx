'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdInterstitialPage() {
  const params = useParams();
  const router = useRouter();
  const clickId = params.clickId as string;

  const [countdown, setCountdown] = useState(15);
  const [canContinue, setCanContinue] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [linkTitle, setLinkTitle] = useState<string>('');

  useEffect(() => {
    const fetchClickData = async () => {
      try {
        const response = await fetch(`/api/clicks/${clickId}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to load click data');
          setLoading(false);
          return;
        }

        setRedirectUrl(data.redirectUrl);
        setLinkTitle(data.title || 'Your destination');
        setCountdown(data.adDuration || 15);
        setLoading(false);
      } catch (err) {
        setError('Failed to load page');
        setLoading(false);
      }
    };

    fetchClickData();
  }, [clickId]);

  useEffect(() => {
    if (loading || error || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanContinue(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, error, countdown]);

  const handleContinue = async () => {
    if (!canContinue || !redirectUrl) return;

    try {
      const response = await fetch(`/api/clicks/${clickId}/complete`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to complete click:', data.error);
      }

      window.location.href = redirectUrl;
    } catch (err) {
      console.error('Error completing click:', err);
      window.location.href = redirectUrl;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Redirecting to: {linkTitle}
                </h1>
                <p className="text-gray-600 mt-1">
                  Please wait while we prepare your content
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-6 h-6 text-blue-600" />
                <span className="text-3xl font-bold text-blue-600">
                  {countdown}s
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${((15 - countdown) / 15) * 100}%`,
                }}
              />
            </div>

            {/* Status */}
            <div className="mt-4 flex items-center justify-center space-x-2">
              {canContinue ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-green-600 font-medium">
                    Ready to continue!
                  </span>
                </>
              ) : (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="text-gray-600">
                    Please wait {countdown} seconds...
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Ad Container 1 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-500 uppercase tracking-wide">
                Advertisement
              </p>
            </div>
            <div className="min-h-[250px] bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
              <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-5626394852414662"
                data-ad-slot="1234567890"
                data-ad-format="auto"
                data-full-width-responsive="true"
              />
              <p className="text-gray-400">Ad Space</p>
            </div>
          </div>

          {/* Ad Container 2 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-500 uppercase tracking-wide">
                Advertisement
              </p>
            </div>
            <div className="min-h-[250px] bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
              <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client="ca-pub-5626394852414662"
                data-ad-slot="0987654321"
                data-ad-format="auto"
                data-full-width-responsive="true"
              />
              <p className="text-gray-400">Ad Space</p>
            </div>
          </div>

          {/* Continue Button */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                canContinue
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {canContinue ? (
                <span className="flex items-center justify-center space-x-2">
                  <span>Continue to Destination</span>
                  <CheckCircle2 className="w-6 h-6" />
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Please wait {countdown} seconds...</span>
                </span>
              )}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              By continuing, you support the content creator through ad revenue
            </p>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Why am I seeing this?</p>
                <p className="text-blue-700">
                  This brief ad display helps content creators earn revenue and
                  keep their services free. Thank you for your patience!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
