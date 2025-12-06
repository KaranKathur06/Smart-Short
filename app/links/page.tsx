'use client';

import Sidebar from '@/components/Sidebar';
import { Plus, Copy, Trash2, ExternalLink, Loader, Edit } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';

type MovieLink = {
  target_url: string;
};

type LinkItem = {
  id: string;
  slug: string;
  main_title: string;
  clicks: number;
  earnings: number;
  created_at: string;
  movieLinks?: MovieLink[];
};

export default function LinksPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [links, setLinks] = useState<LinkItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [toast, setToast] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createUrl, setCreateUrl] = useState('');
  const [createTitle, setCreateTitle] = useState('');
  const [createAlias, setCreateAlias] = useState('');
  const [create480p, setCreate480p] = useState('');
  const [create720p, setCreate720p] = useState('');
  const [create1080p, setCreate1080p] = useState('');
  const [createCategory, setCreateCategory] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editLoading, setEditLoading] = useState(false);

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

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 2000);
  };

  const fetchLinks = async (pageToLoad: number, token: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/links/list?page=${pageToLoad}&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        router.replace('/auth/login');
        return;
      }
      const data = await res.json();
      const fetched: LinkItem[] = data.links || [];
      setLinks(fetched);
      setPage(data.pagination?.page || pageToLoad);
      setTotalPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || fetched.length);
    } catch {
      setError('Failed to load links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) return;
    fetchLinks(1, accessToken);
  }, [accessToken]);

  const handleCopy = async (slug: string) => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied');
    } catch {
      showToast('Unable to copy link');
    }
  };

  const handleOpen = (slug: string) => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/${slug}`;
    window.open(url, '_blank');
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) return;
    if (!confirm('Delete this link?')) return;
    try {
      const res = await fetch(`/api/links/delete?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error || 'Failed to delete link');
        return;
      }
      setLinks((prev) => prev.filter((l) => l.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      showToast('Link deleted');
    } catch {
      showToast('Failed to delete link');
    }
  };

  const openEdit = (link: LinkItem) => {
    setEditId(link.id);
    setEditTitle(link.main_title);
  };

  const handleEditSave = async () => {
    if (!accessToken || !editId) return;
    setEditLoading(true);
    try {
      const res = await fetch('/api/links/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id: editId, title: editTitle }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error || 'Failed to update link');
        return;
      }
      setLinks((prev) =>
        prev.map((l) => (l.id === editId ? { ...l, main_title: editTitle } : l))
      );
      setEditId(null);
      showToast('Link updated');
    } catch {
      showToast('Failed to update link');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setCreateError('');

    if (!createTitle.trim()) {
      setCreateError('Title is required');
      return;
    }

    const movieLinks: { quality: '480p' | '720p' | '1080p'; targetUrl: string }[] = [];
    if (create480p.trim()) movieLinks.push({ quality: '480p', targetUrl: create480p.trim() });
    if (create720p.trim()) movieLinks.push({ quality: '720p', targetUrl: create720p.trim() });
    if (create1080p.trim()) movieLinks.push({ quality: '1080p', targetUrl: create1080p.trim() });

    if (movieLinks.length === 0 && !createUrl.trim()) {
      setCreateError('At least one quality URL or long URL is required');
      return;
    }

    if (movieLinks.length === 0 && createUrl.trim()) {
      movieLinks.push({ quality: '720p', targetUrl: createUrl.trim() });
    }

    setCreateLoading(true);
    try {
      const res = await fetch('/api/links/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: createTitle.trim(),
          customSlug: createAlias.trim() || undefined,
          movieLinks,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data?.error || 'Failed to create link');
        return;
      }
      setIsCreateOpen(false);
      setCreateUrl('');
      setCreateTitle('');
      setCreateAlias('');
      setCreate480p('');
      setCreate720p('');
      setCreate1080p('');
      setCreateCategory('');
      if (accessToken) {
        fetchLinks(1, accessToken);
      }
      showToast('Link created');
    } catch {
      setCreateError('Failed to create link');
    } finally {
      setCreateLoading(false);
    }
  };

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (!accessToken) return;
    if (direction === 'prev' && page > 1) {
      fetchLinks(page - 1, accessToken);
    } else if (direction === 'next' && page < totalPages) {
      fetchLinks(page + 1, accessToken);
    }
  };

  const hasLinks = useMemo(() => links.length > 0, [links]);

  if (sessionLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="card flex items-center gap-3">
          <Loader className="w-4 h-4 animate-spin text-blue-400" />
          <span className="text-slate-200">Loading links...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />

      <main className="flex-1 md:ml-64 overflow-auto">
        <div className="p-4 md:p-8">
          {toast && (
            <div className="fixed right-4 top-4 z-50 card bg-slate-900/90 border-blue-600/50 shadow-lg">
              <p className="text-sm text-slate-100">{toast}</p>
            </div>
          )}

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">My Links</h1>
              {error && (
                <p className="text-sm text-red-400 mt-1">{error}</p>
              )}
              <p className="text-slate-400">Manage and track your short links</p>
            </div>
            <button
              className="btn-primary flex items-center gap-2"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="w-5 h-5" />
              Create Link
            </button>
          </div>

          {/* Links Table */}
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-3 text-slate-300 font-semibold">Short URL</th>
                  <th className="text-left py-3 px-3 text-slate-300 font-semibold">Title</th>
                  <th className="text-left py-3 px-3 text-slate-300 font-semibold">Clicks</th>
                  <th className="text-left py-3 px-3 text-slate-300 font-semibold">Earnings</th>
                  <th className="text-left py-3 px-3 text-slate-300 font-semibold">Created</th>
                  <th className="text-left py-3 px-3 text-slate-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && !hasLinks && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      Loading...
                    </td>
                  </tr>
                )}
                {!loading && !hasLinks && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      You have no links yet. Create your first short link.
                    </td>
                  </tr>
                )}
                {links.map((link) => {
                  const shortUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${link.slug}`;
                  const created = formatDate(link.created_at);
                  return (
                    <tr
                      key={link.id}
                      className="border-b border-slate-800 hover:bg-slate-800/50"
                    >
                      <td className="py-3 px-3">
                        <code className="text-blue-400 font-mono break-all">{shortUrl}</code>
                      </td>
                      <td className="py-3 px-3 text-white">
                        {link.main_title}
                      </td>
                      <td className="py-3 px-3 text-white">{link.clicks}</td>
                      <td className="py-3 px-3 text-green-400 font-semibold">
                        ${Number(link.earnings || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-slate-400">{created}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopy(link.slug)}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            title="Copy link"
                          >
                            <Copy className="w-4 h-4 text-slate-400" />
                          </button>
                          <button
                            onClick={() => handleOpen(link.slug)}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            title="Open link"
                          >
                            <ExternalLink className="w-4 h-4 text-slate-400" />
                          </button>
                          <button
                            onClick={() => openEdit(link)}
                            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                            title="Edit link"
                          >
                            <Edit className="w-4 h-4 text-slate-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(link.id)}
                            className="p-2 hover:bg-red-900/50 rounded-lg transition-colors"
                            title="Delete link"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
              <span>
                Showing page {page} of {totalPages} • {total} total
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange('prev')}
                  disabled={page <= 1 || loading}
                  className="px-3 py-1 rounded-lg border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-200"
                >
                  Prev
                </button>
                <button
                  onClick={() => handlePageChange('next')}
                  disabled={page >= totalPages || loading}
                  className="px-3 py-1 rounded-lg border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-200"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {isCreateOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
              <div className="card w-full max-w-lg max-h-[90vh] overflow-auto">
                <h2 className="text-xl font-bold text-white mb-4">Create new link</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                  {createError && (
                    <p className="text-sm text-red-400">{createError}</p>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Title
                    </label>
                    <input
                      className="input-field"
                      value={createTitle}
                      onChange={(e) => setCreateTitle(e.target.value)}
                      placeholder="My movie collection"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Long URL (optional if quality URLs provided)
                    </label>
                    <input
                      className="input-field"
                      value={createUrl}
                      onChange={(e) => setCreateUrl(e.target.value)}
                      placeholder="https://example.com/"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        480p URL
                      </label>
                      <input
                        className="input-field text-xs"
                        value={create480p}
                        onChange={(e) => setCreate480p(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        720p URL
                      </label>
                      <input
                        className="input-field text-xs"
                        value={create720p}
                        onChange={(e) => setCreate720p(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        1080p URL
                      </label>
                      <input
                        className="input-field text-xs"
                        value={create1080p}
                        onChange={(e) => setCreate1080p(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Custom alias
                      </label>
                      <input
                        className="input-field"
                        value={createAlias}
                        onChange={(e) => setCreateAlias(e.target.value)}
                        placeholder="my-special-link"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Category
                      </label>
                      <select
                        className="input-field text-sm"
                        value={createCategory}
                        onChange={(e) => setCreateCategory(e.target.value)}
                      >
                        <option value="">Select category</option>
                        <option value="movies">Movies</option>
                        <option value="series">Series</option>
                        <option value="music">Music</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setIsCreateOpen(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createLoading}
                      className="btn-primary flex items-center gap-2"
                    >
                      {createLoading && (
                        <Loader className="w-4 h-4 animate-spin" />
                      )}
                      Create Link
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {editId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
              <div className="card w-full max-w-md">
                <h2 className="text-xl font-bold text-white mb-4">Edit link</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Title
                    </label>
                    <input
                      className="input-field"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditId(null)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={editLoading}
                      onClick={handleEditSave}
                      className="btn-primary flex items-center gap-2"
                    >
                      {editLoading && (
                        <Loader className="w-4 h-4 animate-spin" />
                      )}
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
