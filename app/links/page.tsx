'use client';

import Sidebar from '@/components/Sidebar';
import { Plus, Copy, Trash2, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export default function LinksPage() {
  const [links, setLinks] = useState([
    {
      id: '1',
      slug: 'movie123',
      title: 'Amazing Movie',
      clicks: 234,
      earnings: 2.34,
      created: '2024-01-15',
    },
  ]);

  const handleCopy = (slug: string) => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/${slug}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />

      <main className="flex-1 md:ml-64 overflow-auto">
        <div className="p-4 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">My Links</h1>
              <p className="text-slate-400">Manage and track your short links</p>
            </div>
            <button className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Link
            </button>
          </div>

          {/* Links Table */}
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-4 px-4 text-slate-300 font-semibold">Short URL</th>
                  <th className="text-left py-4 px-4 text-slate-300 font-semibold">Title</th>
                  <th className="text-left py-4 px-4 text-slate-300 font-semibold">Clicks</th>
                  <th className="text-left py-4 px-4 text-slate-300 font-semibold">Earnings</th>
                  <th className="text-left py-4 px-4 text-slate-300 font-semibold">Created</th>
                  <th className="text-left py-4 px-4 text-slate-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-4 px-4">
                      <code className="text-blue-400 font-mono">{link.slug}</code>
                    </td>
                    <td className="py-4 px-4 text-white">{link.title}</td>
                    <td className="py-4 px-4 text-white">{link.clicks}</td>
                    <td className="py-4 px-4 text-green-400 font-semibold">${link.earnings.toFixed(2)}</td>
                    <td className="py-4 px-4 text-slate-400">{link.created}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(link.slug)}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Copy link"
                        >
                          <Copy className="w-4 h-4 text-slate-400" />
                        </button>
                        <button
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Open link"
                        >
                          <ExternalLink className="w-4 h-4 text-slate-400" />
                        </button>
                        <button
                          className="p-2 hover:bg-red-900/50 rounded-lg transition-colors"
                          title="Delete link"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
