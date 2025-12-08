'use client';

import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { Activity, BarChart3, Eye, IndianRupee, Loader2 } from 'lucide-react';

type MetricsResponse = {
  today_earnings: number;
  total_earnings: number;
  total_views: number;
  cpm: number;
  graph_data: { date: string; views: number }[];
  monthly_earnings: Record<string, number>;
};

type Props = {
  token: string | null;
  title?: string;
};

export default function CpmWidget({ token, title = 'CPM Analytics' }: Props) {
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  const monthOptions = useMemo(() => {
    if (!data) return [];
    return Object.keys(data.monthly_earnings);
  }, [data]);

  const selectedMonthEarnings = data && selectedMonth ? data.monthly_earnings[selectedMonth] ?? 0 : 0;

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/dashboard/metrics', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json?.error || 'Unable to load CPM data');
          return;
        }
        setData(json as MetricsResponse);
        const firstMonth = Object.keys(json.monthly_earnings || {})[0];
        if (firstMonth) setSelectedMonth(firstMonth);
      } catch {
        setError('Unable to load CPM data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (!token) return null;

  return (
    <section className="card bg-slate-900/80 border-blue-800/40">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-xs uppercase text-blue-300 tracking-wide">Monetization</p>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="text-slate-400 text-sm">CPM-backed earnings & views overview</p>
        </div>
        {monthOptions.length > 0 && (
          <select
            className="input-field w-48 text-sm"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {monthOptions.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-200">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading CPM metrics...</span>
        </div>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              icon={<IndianRupee className="w-5 h-5" />}
              label="Today's earnings"
              value={`₹${data.today_earnings.toFixed(2)}`}
            />
            <MetricCard
              icon={<BarChart3 className="w-5 h-5" />}
              label="Average CPM"
              value={`₹${data.cpm.toFixed(2)}`}
            />
            <MetricCard
              icon={<Activity className="w-5 h-5" />}
              label="Monthly earnings"
              value={`₹${(selectedMonthEarnings ?? 0).toFixed(2)}`}
              hint={selectedMonth || 'Monthly'}
            />
            <MetricCard
              icon={<Eye className="w-5 h-5" />}
              label="Total views"
              value={data.total_views.toLocaleString()}
            />
          </div>

          <div className="h-64 bg-slate-900/60 rounded-lg border border-slate-800 p-3">
            {data.graph_data.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No view data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.graph_data} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#0b1224',
                      border: '1px solid #1f2937',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: '#e5e7eb' }}
                  />
                  <Bar dataKey="views" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function MetricCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="card bg-slate-900/70 border-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
        </div>
        <div className="p-3 rounded-lg bg-blue-500/10 text-blue-300">{icon}</div>
      </div>
    </div>
  );
}

