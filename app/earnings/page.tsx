'use client';

import Sidebar from '@/components/Sidebar';
import { DollarSign, TrendingUp, Wallet, Loader } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

type EarningsSummary = {
  totalEarnings: number;
  pendingAmount: number;
  withdrawnAmount: number;
  availableBalance: number;
  totalClicks: number;
  totalLinks: number;
  totalWithdrawals: number;
};

type ChartPoint = {
  date: string;
  earnings: number;
};

type Withdrawal = {
  id: string;
  amount: number;
  status: string;
  method: string;
  account_identifier: string;
  payment_link_id?: string | null;
  razorpay_status?: string | null;
  created_at: string;
};

export default function EarningsPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [minWithdraw, setMinWithdraw] = useState<number>(50);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      setSessionLoading(false);
    });
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (!accessToken) return;

    const fetchEarnings = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/earnings', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (res.status === 401) {
          router.replace('/auth/login');
          return;
        }

        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || 'Failed to load earnings');
          return;
        }

        setSummary(data.summary as EarningsSummary);
        setChart((data.chart || []) as ChartPoint[]);
        setWithdrawals((data.withdrawals || []) as Withdrawal[]);

        if (typeof data.minWithdraw === 'number') {
          setMinWithdraw(data.minWithdraw);
        } else if (typeof data.minWithdraw === 'string') {
          const parsed = parseFloat(data.minWithdraw);
          if (!Number.isNaN(parsed)) {
            setMinWithdraw(parsed);
          }
        }
      } catch {
        setError('Failed to load earnings');
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [accessToken, router]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setWithdrawError('');
    setWithdrawSuccess('');

    if (!withdrawAmount.trim() || !withdrawAccount.trim()) {
      setWithdrawError('Amount and payout account are required');
      return;
    }

    const amountNumber = Number(withdrawAmount);
    if (!amountNumber || Number.isNaN(amountNumber) || amountNumber <= 0) {
      setWithdrawError('Enter a valid withdrawal amount');
      return;
    }

    setWithdrawLoading(true);
    try {
      const res = await fetch('/api/payout/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          amount: amountNumber,
          upiId: withdrawAccount.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setWithdrawError(data?.error || 'Failed to create withdrawal');
        return;
      }

      setWithdrawSuccess('Withdrawal request submitted');
      setWithdrawAmount('');
      setWithdrawAccount('');

      if (data.payout) {
        setWithdrawals((prev) => [data.payout as Withdrawal, ...prev]);
      }

      setIsModalOpen(false);

      // Refresh earnings summary after creating a withdrawal
      try {
        const refreshRes = await fetch('/api/earnings', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const refreshData = await refreshRes.json();
        if (refreshRes.ok) {
          setSummary(refreshData.summary as EarningsSummary);
        }
      } catch {
        // Ignore refresh errors
      }
    } catch {
      setWithdrawError('Failed to create withdrawal');
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="card flex items-center gap-3">
          <Loader className="w-4 h-4 animate-spin text-blue-400" />
          <span className="text-slate-200">Loading earnings...</span>
        </div>
      </div>
    );
  }

  const totalEarnings = summary?.totalEarnings ?? 0;
  const pendingAmount = summary?.pendingAmount ?? 0;
  const withdrawnAmount = summary?.withdrawnAmount ?? 0;
  const availableBalance = summary?.availableBalance ?? 0;
  const totalWithdrawals = summary?.totalWithdrawals ?? 0;

  const hasProcessing = withdrawals.some((tx) => tx.status === 'initiated');

  const disableWithdrawButton =
    withdrawLoading || !summary || availableBalance <= 0 || hasProcessing;

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />

      <main className="flex-1 md:ml-64 overflow-auto">
        <div className="p-4 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Earnings</h1>
            <p className="text-slate-400">Track your revenue and withdrawals</p>
            {error && (
              <p className="text-sm text-red-400 mt-2">{error}</p>
            )}
          </div>

          {/* Earnings Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Total Earnings</p>
                  <p className="text-3xl font-bold text-white">
                    ₹{totalEarnings.toFixed(2)}
                  </p>
                  <p className="text-slate-400 text-xs mt-2">
                    {summary
                      ? `${summary.totalClicks.toLocaleString()} clicks • ${summary.totalLinks.toLocaleString()} links`
                      : '—'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 text-green-400">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Pending</p>
                  <p className="text-3xl font-bold text-white">
                    ₹{pendingAmount.toFixed(2)}
                  </p>
                  <p className="text-slate-400 text-sm mt-2">
                    Minimum: ₹{minWithdraw.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-400">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Withdrawn</p>
                  <p className="text-3xl font-bold text-white">
                    ₹{withdrawnAmount.toFixed(2)}
                  </p>
                  <p className="text-slate-400 text-sm mt-2">
                    {totalWithdrawals} withdrawals
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Earnings Chart */}
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Earnings Over Time</h2>
            <div className="h-64 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-400">
              {loading ? (
                <div className="flex items-center gap-2 text-slate-200">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Loading chart...</span>
                </div>
              ) : chart.length === 0 ? (
                <span>No earnings data yet</span>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                    <YAxis
                      stroke="#9ca3af"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => `₹${v}`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#020617',
                        border: '1px solid #1f2937',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: '#e5e7eb' }}
                      formatter={(value: any) => [`₹${Number(value).toFixed(3)}`, 'Earnings']}
                    />
                    <Line
                      type="monotone"
                      dataKey="earnings"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Withdrawal Methods */}
          <div className="card">
            <h2 className="text-xl font-bold text-white mb-4">Withdrawal Methods</h2>
            <p className="text-slate-300 text-sm mb-4">
              Available balance:{' '}
              <span className="font-semibold text-green-400">
                ₹{availableBalance.toFixed(2)}
              </span>
            </p>
            {hasProcessing && (
              <p className="text-xs text-yellow-400 mb-2">
                You already have a payout in progress.
              </p>
            )}
            <div className="flex items-center justify-end mb-6">
              <button
                type="button"
                disabled={disableWithdrawButton}
                onClick={() => setIsModalOpen(true)}
                className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Request Withdrawal
              </button>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                Recent withdrawals
              </h3>
              {withdrawals.length === 0 ? (
                <p className="text-slate-400 text-sm">
                  You have no withdrawal requests yet.
                </p>
              ) : (
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-300">
                        <th className="py-2 px-2 text-left">Amount</th>
                        <th className="py-2 px-2 text-left">Date</th>
                        <th className="py-2 px-2 text-left">Status</th>
                        <th className="py-2 px-2 text-left">Payment Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.map((tx) => {
                        const created = new Date(tx.created_at).toLocaleString();
                        let badgeClass = 'bg-slate-800 text-slate-200';
                        let label = tx.status;
                        if (tx.status === 'initiated') {
                          badgeClass = 'bg-yellow-500/10 text-yellow-300';
                          label = 'Processing';
                        } else if (tx.status === 'paid') {
                          badgeClass = 'bg-green-500/10 text-green-300';
                          label = 'Paid';
                        } else if (tx.status === 'failed' || tx.status === 'rejected') {
                          badgeClass = 'bg-red-500/10 text-red-300';
                          label = 'Failed';
                        }
                        const amountStr = `₹${Number(tx.amount || 0).toFixed(2)}`;
                        return (
                          <tr key={tx.id} className="border-b border-slate-900">
                            <td className="py-2 px-2 text-white">{amountStr}</td>
                            <td className="py-2 px-2 text-slate-400">{created}</td>
                            <td className="py-2 px-2">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}
                              >
                                {label}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-slate-300 font-mono text-xs break-all">
                              {tx.payment_link_id || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
              <div className="card w-full max-w-md">
                <h2 className="text-xl font-bold text-white mb-4">Request withdrawal</h2>
                <form onSubmit={handleWithdraw} className="space-y-4">
                  {withdrawError && (
                    <p className="text-sm text-red-400">{withdrawError}</p>
                  )}
                  {withdrawSuccess && (
                    <p className="text-sm text-green-400">{withdrawSuccess}</p>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Amount (INR)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      className="input-field"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder={minWithdraw.toFixed(2)}
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Minimum withdrawal: ₹{minWithdraw.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      UPI ID
                    </label>
                    <input
                      className="input-field"
                      value={withdrawAccount}
                      onChange={(e) => setWithdrawAccount(e.target.value)}
                      placeholder="you@upi"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setIsModalOpen(false);
                        setWithdrawError('');
                        setWithdrawSuccess('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={disableWithdrawButton}
                      className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {withdrawLoading && (
                        <Loader className="w-4 h-4 animate-spin" />
                      )}
                      Confirm
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
