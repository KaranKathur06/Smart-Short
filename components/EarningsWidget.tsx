'use client';

import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Eye, CheckCircle, Info, Loader2 } from 'lucide-react';

interface EarningsStats {
  totalEarnings: number;
  totalClicks: number;
  validClicks: number;
  completedClicks: number;
  avgCPM: number;
  todayEarnings: number;
  todayClicks: number;
}

interface EarningsWidgetProps {
  token: string | null;
}

export default function EarningsWidget({ token }: EarningsWidgetProps) {
  const [stats, setStats] = useState<EarningsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/stats', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch earnings stats');
        }

        const data = await response.json();
        setStats(data.stats);
        setError(null);
      } catch (err) {
        console.error('Error fetching earnings stats:', err);
        setError('Failed to load earnings data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000);

    return () => clearInterval(interval);
  }, [token]);

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          <span className="ml-2 text-slate-400">Loading earnings data...</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="card border-red-600/30 bg-red-950/20">
        <p className="text-red-400 text-sm">{error || 'No earnings data available'}</p>
      </div>
    );
  }

  const earningsData = [
    {
      label: "Today's Earnings",
      value: `$${stats.todayEarnings.toFixed(4)}`,
      subtext: `${stats.todayClicks} clicks today`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-400',
    },
    {
      label: 'Total Earnings',
      value: `$${stats.totalEarnings.toFixed(2)}`,
      subtext: `${stats.totalClicks} total clicks`,
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-400',
    },
    {
      label: 'Valid Clicks',
      value: stats.validClicks.toString(),
      subtext: `${stats.completedClicks} completed`,
      icon: CheckCircle,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-400',
    },
    {
      label: 'Average CPM',
      value: `$${stats.avgCPM.toFixed(2)}`,
      subtext: 'Per 1000 views',
      icon: Eye,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-500/10',
      textColor: 'text-yellow-400',
      tooltip: true,
    },
  ];

  const validRate = stats.totalClicks > 0 
    ? ((stats.validClicks / stats.totalClicks) * 100).toFixed(1) 
    : '0.0';

  const completionRate = stats.validClicks > 0 
    ? ((stats.completedClicks / stats.validClicks) * 100).toFixed(1) 
    : '0.0';

  return (
    <div className="space-y-6">
      <div className="card border-blue-600/30 bg-gradient-to-br from-blue-950/30 to-purple-950/30">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Earnings Overview</h2>
            <p className="text-slate-400 text-sm">Track your monetization performance</p>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-xs font-medium">Live</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {earningsData.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="relative p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:shadow-lg group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-lg ${item.bgColor}`}>
                    <Icon className={`w-5 h-5 ${item.textColor}`} />
                  </div>
                  {item.tooltip && (
                    <div className="relative group/tooltip">
                      <Info className="w-4 h-4 text-slate-500 hover:text-slate-400 cursor-help" />
                      <div className="absolute right-0 top-6 w-64 p-3 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-10">
                        <p className="text-xs text-slate-300">
                          <strong>CPM (Cost Per Mille)</strong> is the amount you earn per 1000 valid ad views. Higher CPM means better earnings per click.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-medium mb-1">{item.label}</p>
                  <p className="text-2xl font-bold text-white mb-1">{item.value}</p>
                  <p className="text-slate-500 text-xs">{item.subtext}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300">Valid Click Rate</p>
                  <p className="text-xs text-slate-500">Fraud-free clicks</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white">{validRate}%</p>
                <p className="text-xs text-slate-500">{stats.validClicks}/{stats.totalClicks}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300">Completion Rate</p>
                  <p className="text-xs text-slate-500">Ads fully viewed</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-white">{completionRate}%</p>
                <p className="text-xs text-slate-500">{stats.completedClicks}/{stats.validClicks}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-950/30 border border-blue-800/30 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-300">
              <p className="font-medium mb-1">How Earnings Work</p>
              <p className="text-blue-400/80">
                You earn money when visitors view ads on your short links. Each completed ad view earns you a portion of the CPM rate. 
                Only valid, non-bot clicks are counted to ensure fair earnings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
