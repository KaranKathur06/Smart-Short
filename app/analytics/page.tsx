'use client';

import Sidebar from '@/components/Sidebar';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Link as LinkIcon,
  Eye,
  DollarSign,
  Globe2,
  Smartphone,
  Monitor,
  Download,
  Filter,
  Activity,
} from 'lucide-react';

const DEVICE_COLORS = ['#60a5fa', '#34d399', '#a855f7'];
const OS_COLORS = ['#22c55e', '#f97316', '#3b82f6', '#e5e7eb', '#facc15', '#ec4899'];
const SOURCE_COLORS = ['#22c55e', '#3b82f6', '#0ea5e9', '#ec4899', '#64748b', '#a855f7'];

type Summary = {
  totalClicks: number;
  totalEarnings: number;
  todayClicks: number;
  bestLink: TopLink | null;
};

type TrendPoint = {
  time: string;
  clicks: number;
};

type SourcePoint = {
  source: string;
  clicks: number;
};

type Devices = {
  desktop: number;
  mobile: number;
  tablet: number;
};

type OsPoint = {
  os: string;
  clicks: number;
};

type GeoPoint = {
  country: string;
  clicks: number;
  earnings: number;
};

type TopLink = {
  id: string;
  slug: string;
  title: string;
  clicks: number;
  earnings: number;
};

type HourPoint = {
  hour: string;
  clicks: number;
};

type EarningsInsights = {
  epc: number;
  cpm: number;
  topCountry: GeoPoint | null;
  topLink: TopLink | null;
};

type FiltersMeta = {
  availableLinks: { id: string; slug: string; title: string }[];
  availableCountries: string[];
  availableOs: string[];
};

type AnalyticsResponse = {
  summary: Summary;
  trend: TrendPoint[];
  sources: SourcePoint[];
  devices: Devices;
  osBreakdown: OsPoint[];
  geo: GeoPoint[];
  topLinks: TopLink[];
  hourlyActivity: HourPoint[];
  earningsInsights: EarningsInsights;
  filters: FiltersMeta;
  period: string;
};

type PeriodOption = '24h' | '7d' | '30d' | 'lifetime';

function formatNumber(value: number) {
  return value.toLocaleString('en-US');
}

function formatCurrency(value: number) {
  return '$' + value.toFixed(2);
}

function getFlag(country: string) {
  if (!country || country === 'Unknown') return '🌐';
  const name = country.toLowerCase();
  if (name.includes('india')) return '🇮🇳';
  if (name.includes('united states') || name === 'usa' || name === 'us') return '🇺🇸';
  if (name.includes('united kingdom') || name === 'uk') return '🇬🇧';
  if (name.includes('canada')) return '🇨🇦';
  if (name.includes('germany')) return '🇩🇪';
  if (name.includes('france')) return '🇫🇷';
  if (name.includes('brazil')) return '🇧🇷';
  if (name.includes('indonesia')) return '🇮🇩';
  if (name.includes('russia')) return '🇷🇺';
  if (name.includes('australia')) return '🇦🇺';
  return '🌐';
}

function AnimatedNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const from = display;
    const to = value;
    const duration = 600;

    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const current = from + (to - from) * eased;
      const factor = Math.pow(10, decimals);
      setDisplay(Math.round(current * factor) / factor);
      if (t < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, decimals]);

  const formatted = decimals > 0 ? display.toFixed(decimals) : formatNumber(Math.round(display));
  return <span>{formatted}</span>;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [period, setPeriod] = useState<PeriodOption>('7d');
  const [selectedLinkId, setSelectedLinkId] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedOs, setSelectedOs] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState('');

  const hasData = data && data.summary.totalClicks > 0;

  useEffect(() => {
    let active = true;
    const initialLinkId = searchParams.get('linkId');
    if (initialLinkId) {
      setSelectedLinkId(initialLinkId);
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const session = data.session;
      if (!session) {
        router.replace('/auth/login');
        return;
      }
      setAccessToken(session.access_token);
      setSessionLoading(false);
    });
    return () => {
      active = false;
    };
  }, [router, searchParams]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 2000);
  };

  const fetchAnalytics = async (token: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('period', period);
      if (selectedLinkId && selectedLinkId !== 'all') params.set('linkId', selectedLinkId);
      if (selectedRegion && selectedRegion !== 'all') params.set('region', selectedRegion);
      if (selectedOs && selectedOs !== 'all') params.set('os', selectedOs);
      if (startDate && endDate) {
        params.set('startDate', startDate);
        params.set('endDate', endDate);
      }
      const res = await fetch(`/api/analytics?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        router.replace('/auth/login');
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || 'Failed to load analytics');
        return;
      }
      setData(json as AnalyticsResponse);
    } catch (err) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    fetchAnalytics(accessToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, period, selectedLinkId, selectedRegion, selectedOs, startDate, endDate]);

  const totalClicksTrendChange = useMemo(() => {
    if (!data || data.trend.length < 2) return 0;
    const mid = Math.floor(data.trend.length / 2);
    const first = data.trend.slice(0, mid).reduce((s, p) => s + p.clicks, 0);
    const last = data.trend.slice(mid).reduce((s, p) => s + p.clicks, 0);
    if (first === 0) return last > 0 ? 100 : 0;
    return ((last - first) / first) * 100;
  }, [data]);

  const deviceData = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Mobile', value: data.devices.mobile },
      { name: 'Desktop', value: data.devices.desktop },
      { name: 'Tablet', value: data.devices.tablet },
    ];
  }, [data]);

  const osData = useMemo(() => data?.osBreakdown || [], [data]);

  const handleExportCSV = async () => {
    if (!data) return;
    try {
      setExporting(true);
      const rows: string[] = [];
      rows.push('Metric,Value');
      rows.push(`Total Clicks,${data.summary.totalClicks}`);
      rows.push(`Total Earnings,${data.summary.totalEarnings}`);
      rows.push(`Today Clicks,${data.summary.todayClicks}`);
      rows.push('');
      rows.push('Time,Clicks');
      data.trend.forEach((p) => rows.push(`${p.time},${p.clicks}`));
      rows.push('');
      rows.push('Source,Clicks');
      data.sources.forEach((s) => rows.push(`${s.source},${s.clicks}`));
      const blob = new Blob([rows.join('\n')], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'smartshort-analytics.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Exported CSV');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!data) return;
    try {
      setExporting(true);
      const w = window.open('', '_blank');
      if (!w) return;
      w.document.write('<html><head><title>SmartShort Analytics</title></head><body>');
      w.document.write(`<h1>SmartShort Analytics Summary</h1>`);
      w.document.write(`<p>Total Clicks: ${data.summary.totalClicks}</p>`);
      w.document.write(`<p>Total Earnings: ${formatCurrency(data.summary.totalEarnings)}</p>`);
      w.document.write(`<p>Today Clicks: ${data.summary.todayClicks}</p>`);
      w.document.write('</body></html>');
      w.document.close();
      w.focus();
      w.print();
      showToast('Opened print dialog for PDF export');
    } finally {
      setExporting(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="card flex items-center gap-3">
          <span className="w-4 h-4 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-slate-200">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 md:ml-64 overflow-auto">
        <div className="p-4 md:p-8 space-y-6">
          {toast && (
            <div className="fixed right-4 top-4 z-50 card bg-slate-900/90 border-blue-600/50 shadow-lg">
              <p className="text-sm text-slate-100">{toast}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Analytics</h1>
              <p className="text-slate-400">Premium insights into your SmartShort performance.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['24h', '7d', '30d', 'lifetime'] as PeriodOption[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    period === p
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {p === '24h' ? '24H' : p === '7d' ? '7D' : p === '30d' ? '30D' : 'Lifetime'}
                </button>
              ))}
            </div>
          </div>

          <div className="card flex flex-wrap items-end gap-4">
            <div className="flex flex-wrap gap-4 flex-1">
              <div className="w-full sm:w-48">
                <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Link
                </label>
                <select
                  className="input-field text-sm"
                  value={selectedLinkId}
                  onChange={(e) => setSelectedLinkId(e.target.value)}
                >
                  <option value="all">All links</option>
                  {data?.filters.availableLinks.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title || l.slug}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-40">
                <label className="block text-xs font-medium text-slate-400 mb-1">Region</label>
                <select
                  className="input-field text-sm"
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                >
                  <option value="all">All regions</option>
                  {data?.filters.availableCountries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-40">
                <label className="block text-xs font-medium text-slate-400 mb-1">OS</label>
                <select
                  className="input-field text-sm"
                  value={selectedOs}
                  onChange={(e) => setSelectedOs(e.target.value)}
                >
                  <option value="all">All OS</option>
                  {data?.filters.availableOs.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-44">
                <label className="block text-xs font-medium text-slate-400 mb-1">Start date</label>
                <input
                  type="date"
                  className="input-field text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-44">
                <label className="block text-xs font-medium text-slate-400 mb-1">End date</label>
                <input
                  type="date"
                  className="input-field text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                disabled={exporting || !data}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" /> CSV
              </button>
              <button
                onClick={handleExportPDF}
                disabled={exporting || !data}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>

          {error && (
            <div className="card border-red-500/50 bg-red-500/10 text-red-300 text-sm">{error}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-400">Total Clicks</p>
                <Eye className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white">
                {data ? <AnimatedNumber value={data.summary.totalClicks} /> : '--'}
              </div>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {totalClicksTrendChange >= 0 ? '+' : ''}
                {totalClicksTrendChange.toFixed(1)}% vs previous
              </p>
            </div>

            <div className="card flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-400">Total Earnings</p>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white">
                {data ? (
                  <span>{formatCurrency(data.summary.totalEarnings)}</span>
                ) : (
                  '--'
                )}
              </div>
              <p className="text-xs text-slate-400">Monetized clicks across all links.</p>
            </div>

            <div className="card flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-400">Today Clicks</p>
                <BarChart3 className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white">
                {data ? <AnimatedNumber value={data.summary.todayClicks} /> : '--'}
              </div>
              <p className="text-xs text-slate-400">Traffic in the last 24 hours.</p>
            </div>

            <div className="card flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-slate-400">Best Link</p>
                <LinkIcon className="w-4 h-4 text-orange-400" />
              </div>
              {data && data.summary.bestLink ? (
                <>
                  <div className="text-sm font-semibold text-white truncate">
                    {data.summary.bestLink.title || data.summary.bestLink.slug}
                  </div>
                  <p className="text-xs text-slate-400">
                    {formatNumber(data.summary.bestLink.clicks)} clicks
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500">No data yet.</p>
              )}
            </div>
          </div>

          {!loading && !hasData && (
            <div className="card flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">No analytics yet</h2>
                <p className="text-slate-400 text-sm">
                  Share your SmartShort links to start collecting clicks and earnings.
                </p>
              </div>
            </div>
          )}

          {loading && !data && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 card animate-pulse h-64 bg-slate-900/80" />
              <div className="card animate-pulse h-64 bg-slate-900/80" />
            </div>
          )}

          {data && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Clicks over time</h2>
                  <p className="text-xs text-slate-400 capitalize">{data.period} view</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trend} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: '#020617',
                          borderColor: '#1f2937',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="clicks"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold text-white mb-4">Traffic sources</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.sources}
                      layout="vertical"
                      margin={{ left: 60, right: 10, top: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="source"
                        stroke="#64748b"
                        tick={{ fontSize: 11 }}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: '#020617',
                          borderColor: '#1f2937',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="clicks" radius={[4, 4, 4, 4]}>
                        {data.sources.map((_, idx) => (
                          <Cell key={idx} fill={SOURCE_COLORS[idx % SOURCE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {data && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="card">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-400" /> Devices
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={80}
                        innerRadius={40}
                        paddingAngle={4}
                      >
                        {deviceData.map((_, idx) => (
                          <Cell key={idx} fill={DEVICE_COLORS[idx % DEVICE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex justify-around text-xs text-slate-300">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DEVICE_COLORS[0] }} />
                    Mobile
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DEVICE_COLORS[1] }} />
                    Desktop
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DEVICE_COLORS[2] }} />
                    Tablet
                  </span>
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-emerald-400" /> Operating systems
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={osData}
                        dataKey="clicks"
                        nameKey="os"
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {osData.map((_, idx) => (
                          <Cell key={idx} fill={OS_COLORS[idx % OS_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card overflow-auto">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Globe2 className="w-4 h-4 text-sky-400" /> Top countries
                  </h2>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="py-2 text-left text-slate-400 font-medium">Country</th>
                      <th className="py-2 text-right text-slate-400 font-medium">Clicks</th>
                      <th className="py-2 text-right text-slate-400 font-medium">Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.geo.slice(0, 8).map((g) => (
                      <tr key={g.country} className="border-b border-slate-900/80">
                        <td className="py-2 text-slate-200 flex items-center gap-2">
                          <span>{getFlag(g.country)}</span>
                          <span className="truncate max-w-[120px]">{g.country}</span>
                        </td>
                        <td className="py-2 text-right text-slate-200">
                          {formatNumber(g.clicks)}
                        </td>
                        <td className="py-2 text-right text-emerald-400">
                          {formatCurrency(g.earnings)}
                        </td>
                      </tr>
                    ))}
                    {data.geo.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-slate-500">
                          No geographic data yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Top links</h2>
                </div>
                <div className="overflow-auto">
                  <table className="w-full text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="py-2 text-left text-slate-400 font-medium">Link</th>
                        <th className="py-2 text-right text-slate-400 font-medium">Clicks</th>
                        <th className="py-2 text-right text-slate-400 font-medium">Earnings</th>
                        <th className="py-2 text-right text-slate-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topLinks.map((l) => (
                        <tr key={l.id} className="border-b border-slate-900/80">
                          <td className="py-2 text-slate-200">
                            <div className="flex flex-col">
                              <span className="font-medium truncate max-w-[200px]">
                                {l.title || l.slug}
                              </span>
                              <span className="text-[11px] text-slate-500">{l.slug}</span>
                            </div>
                          </td>
                          <td className="py-2 text-right text-slate-200">
                            {formatNumber(l.clicks)}
                          </td>
                          <td className="py-2 text-right text-emerald-400">
                            {formatCurrency(l.earnings)}
                          </td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() => router.push(`/analytics?linkId=${l.id}`)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs"
                            >
                              View details
                            </button>
                          </td>
                        </tr>
                      ))}
                      {data.topLinks.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-500">
                            No links have clicks yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold text-white mb-4">Hourly activity</h2>
                <div className="grid grid-cols-6 gap-1 text-[10px]">
                  {data.hourlyActivity.map((h) => {
                    const max = Math.max(
                      1,
                      ...data.hourlyActivity.map((x) => x.clicks)
                    );
                    const intensity = h.clicks === 0 ? 0.1 : 0.2 + (0.8 * h.clicks) / max;
                    return (
                      <div key={h.hour} className="flex flex-col items-center gap-1">
                        <div
                          className="w-full h-6 rounded-sm bg-blue-500"
                          style={{ opacity: intensity }}
                          title={`${h.hour}: ${h.clicks} clicks`}
                        />
                        <span className="text-[9px] text-slate-500">
                          {h.hour.replace(':00', '')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {data && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card">
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">EPC</p>
                <p className="text-2xl font-bold text-white">
                  <AnimatedNumber value={data.earningsInsights.epc} decimals={4} />
                </p>
                <p className="text-xs text-slate-500">Earnings per click</p>
              </div>
              <div className="card">
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">CPM</p>
                <p className="text-2xl font-bold text-white">
                  <AnimatedNumber value={data.earningsInsights.cpm} decimals={2} />
                </p>
                <p className="text-xs text-slate-500">Earnings per 1K views</p>
              </div>
              <div className="card">
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Top earning country</p>
                {data.earningsInsights.topCountry ? (
                  <>
                    <p className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>{getFlag(data.earningsInsights.topCountry.country)}</span>
                      <span className="truncate max-w-[120px]">
                        {data.earningsInsights.topCountry.country}
                      </span>
                    </p>
                    <p className="text-xs text-emerald-400 mt-1">
                      {formatCurrency(data.earningsInsights.topCountry.earnings)} earned
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">No earnings yet.</p>
                )}
              </div>
              <div className="card">
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Top earning link</p>
                {data.earningsInsights.topLink ? (
                  <>
                    <p className="text-sm font-semibold text-white truncate max-w-[150px]">
                      {data.earningsInsights.topLink.title ||
                        data.earningsInsights.topLink.slug}
                    </p>
                    <p className="text-xs text-emerald-400 mt-1">
                      {formatCurrency(data.earningsInsights.topLink.earnings)} earned
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-slate-500">No earnings yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
