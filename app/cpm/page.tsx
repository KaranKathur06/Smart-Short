'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { 
  DollarSign, 
  TrendingUp, 
  Eye, 
  CheckCircle, 
  Info, 
  Loader2,
  BarChart3,
  Zap,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  IndianRupee
} from 'lucide-react';
import { formatUSD, formatINR, CPM_USD } from '@/lib/currency';

interface CPMStats {
  totalEarnings: number;
  totalClicks: number;
  validClicks: number;
  completedClicks: number;
  avgCPM: number;
  todayEarnings: number;
  todayClicks: number;
}

interface EarningsByDate {
  date: string;
  total_amount: number;
  click_count: number;
}

export default function CPMCenter() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [stats, setStats] = useState<CPMStats | null>(null);
  const [earningsByDate, setEarningsByDate] = useState<EarningsByDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const session = data.session;
      if (!session) {
        router.replace('/auth/login');
        return;
      }
      setAccessToken(session.access_token);
      setAuthChecked(true);
      setLoadingSession(false);
    });
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!authChecked || !accessToken) return;

    const fetchCPMData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/stats', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch CPM stats');
        }

        const data = await response.json();
        setStats(data.stats);
        setEarningsByDate(data.earningsByDate || []);
      } catch (err) {
        console.error('Error fetching CPM data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCPMData();
    const interval = setInterval(fetchCPMData, 60000);

    return () => clearInterval(interval);
  }, [authChecked, accessToken]);

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  if (loadingSession) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="card flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          <span className="text-slate-200">Loading CPM Center...</span>
        </div>
      </div>
    );
  }

  const cpmRate = CPM_USD;
  const estimatedEarnings = stats ? (stats.validClicks / 1000) * cpmRate : 0;

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />

      <main className="flex-1 md:ml-64 overflow-auto">
        <div className="p-4 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">CPM Monetization</h1>
            </div>
            <p className="text-slate-400">Earn per 1,000 views with SmartShort Ads</p>
          </div>

          {loading ? (
            <div className="card">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                <span className="ml-3 text-slate-400">Loading CPM data...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* CPM Overview Card */}
              <div className="card border-blue-600/30 bg-gradient-to-br from-blue-950/40 via-purple-950/30 to-slate-900">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-slate-400 text-sm font-medium mb-2">Average CPM Rate</p>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-5xl font-bold text-white">{formatUSD(cpmRate)}</span>
                    </div>
                    <p className="text-slate-500 text-sm mt-2">Fixed CPM rate per 1,000 valid views</p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-xs font-medium">Active</span>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <Zap className="w-8 h-8 text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-green-500/10 rounded-lg">
                      <IndianRupee className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Today's Earnings</p>
                      <p className="text-xl font-bold text-white">{stats ? formatINR(stats.todayEarnings) : formatINR(0)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-blue-500/10 rounded-lg">
                      <Eye className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Valid Views</p>
                      <p className="text-xl font-bold text-white">{stats?.validClicks.toLocaleString() || '0'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-purple-500/10 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Total Earnings</p>
                      <p className="text-xl font-bold text-white">{stats ? formatINR(stats.totalEarnings) : formatINR(0)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CPM Rate Card */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">CPM Rate Details</h2>
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 font-medium">Base CPM Rate</span>
                      <span className="text-2xl font-bold text-white">{formatUSD(cpmRate)}</span>
                    </div>
                    <p className="text-sm text-slate-500">Per 1,000 valid ad views (USD)</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                      <p className="text-slate-400 text-sm mb-1">Earnings Formula</p>
                      <code className="text-blue-400 text-sm font-mono">
                        (Views / 1,000) × $10 × 83
                      </code>
                    </div>
                    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                      <p className="text-slate-400 text-sm mb-1">Estimated Total (INR)</p>
                      <p className="text-xl font-bold text-white">{formatINR(estimatedEarnings * 83)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Chart */}
              <div className="card">
                <h2 className="text-xl font-bold text-white mb-4">Earnings Performance</h2>
                
                {earningsByDate.length > 0 ? (
                  <div className="space-y-3">
                    {earningsByDate.slice(0, 10).map((item, index) => {
                      const date = new Date(item.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      });
                      const maxAmount = Math.max(...earningsByDate.map(e => parseFloat(e.total_amount.toString())));
                      const percentage = maxAmount > 0 ? (parseFloat(item.total_amount.toString()) / maxAmount) * 100 : 0;

                      return (
                        <div key={index} className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-300 text-sm font-medium">{date}</span>
                            <div className="flex items-center space-x-4">
                              <span className="text-slate-400 text-xs">{item.click_count} views</span>
                              <span className="text-white font-bold">{formatINR(parseFloat(item.total_amount.toString()))}</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <BarChart3 className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400">No earnings data yet</p>
                    <p className="text-slate-500 text-sm mt-1">Start sharing your links to see performance</p>
                  </div>
                )}
              </div>

              {/* How CPM Works */}
              <div className="card">
                <h2 className="text-xl font-bold text-white mb-6">How CPM Works</h2>
                
                <div className="space-y-4">
                  {[
                    {
                      icon: Info,
                      title: 'CPM means Cost Per 1,000 Views',
                      description: 'CPM (Cost Per Mille) is the standard advertising metric in USD. Our CPM is $10, which converts to ₹830 per 1,000 valid ad views.',
                      color: 'blue'
                    },
                    {
                      icon: Eye,
                      title: 'Every 1,000 valid visits earns ₹830',
                      description: 'When visitors click your short links and view the ads, you accumulate earnings. 1,000 valid views = $10 USD = ₹830 INR.',
                      color: 'green'
                    },
                    {
                      icon: Clock,
                      title: 'Ads are shown before redirect',
                      description: 'Visitors see a brief ad interstitial page (15 seconds) before being redirected to the destination URL.',
                      color: 'purple'
                    },
                    {
                      icon: Shield,
                      title: 'Invalid / bot traffic is filtered',
                      description: 'Our fraud detection system automatically filters out bots, suspicious activity, and invalid clicks to ensure fair earnings.',
                      color: 'yellow'
                    },
                    {
                      icon: Zap,
                      title: 'Earnings update in real time',
                      description: 'Your dashboard updates automatically as visitors complete ad views. Track your earnings live with no delays.',
                      color: 'pink'
                    }
                  ].map((item, index) => {
                    const Icon = item.icon;
                    const isExpanded = expandedFAQ === index;
                    const colorMap: Record<string, string> = {
                      blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                      green: 'bg-green-500/10 text-green-400 border-green-500/30',
                      purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                      yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
                      pink: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
                    };

                    return (
                      <div 
                        key={index}
                        className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
                        onClick={() => toggleFAQ(index)}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`p-2.5 rounded-lg ${colorMap[item.color]}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-white font-semibold">{item.title}</h3>
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            {isExpanded && (
                              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Stats Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card">
                  <div className="flex items-center space-x-3 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <p className="text-slate-400 text-sm">Valid Rate</p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {stats && stats.totalClicks > 0 
                      ? ((stats.validClicks / stats.totalClicks) * 100).toFixed(1)
                      : '0.0'}%
                  </p>
                </div>
                <div className="card">
                  <div className="flex items-center space-x-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    <p className="text-slate-400 text-sm">Completion Rate</p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {stats && stats.validClicks > 0 
                      ? ((stats.completedClicks / stats.validClicks) * 100).toFixed(1)
                      : '0.0'}%
                  </p>
                </div>
                <div className="card">
                  <div className="flex items-center space-x-3 mb-2">
                    <Eye className="w-5 h-5 text-blue-400" />
                    <p className="text-slate-400 text-sm">Total Views</p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {stats?.totalClicks.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="card">
                  <div className="flex items-center space-x-3 mb-2">
                    <IndianRupee className="w-5 h-5 text-green-400" />
                    <p className="text-slate-400 text-sm">Per View (INR)</p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    ₹{((cpmRate * 83) / 1000).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
