'use client';

import Sidebar from '@/components/Sidebar';
import { DollarSign, TrendingUp, Wallet } from 'lucide-react';

export default function EarningsPage() {
  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />

      <main className="flex-1 md:ml-64 overflow-auto">
        <div className="p-4 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Earnings</h1>
            <p className="text-slate-400">Track your revenue and withdrawals</p>
          </div>

          {/* Earnings Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Total Earnings</p>
                  <p className="text-3xl font-bold text-white">$234.56</p>
                  <p className="text-green-400 text-sm mt-2">↑ 12% this month</p>
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
                  <p className="text-3xl font-bold text-white">$45.23</p>
                  <p className="text-slate-400 text-sm mt-2">Minimum: $50</p>
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
                  <p className="text-3xl font-bold text-white">$189.33</p>
                  <p className="text-slate-400 text-sm mt-2">2 withdrawals</p>
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
              Chart will be displayed here
            </div>
          </div>

          {/* Withdrawal Methods */}
          <div className="card">
            <h2 className="text-xl font-bold text-white mb-4">Withdrawal Methods</h2>
            <div className="space-y-3">
              {['UPI', 'PayPal', 'Crypto'].map((method) => (
                <div key={method} className="p-4 border border-slate-700 rounded-lg hover:border-blue-500/50 transition-colors cursor-pointer">
                  <p className="text-white font-semibold">{method}</p>
                  <p className="text-slate-400 text-sm">Add {method} account</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
