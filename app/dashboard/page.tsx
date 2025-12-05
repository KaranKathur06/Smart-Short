'use client';

import Sidebar from '@/components/Sidebar';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BarChart3, Link as LinkIcon, Eye, DollarSign, Copy, Loader, ChevronLeft, ChevronRight } from 'lucide-react';

type DashboardLink = {
  id: string;
  slug: string;
  main_title: string;
  clicks: number;
  earnings: number;
  created_at: string;
  movieLinks?: { target_url: string }[];
};

export default function Dashboard() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);

  const [longUrl, setLongUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [shortLoading, setShortLoading] = useState(false);
  const [shortError, setShortError] = useState('');
  const [shortResult, setShortResult] = useState<{ slug: string; shortUrl: string; targetUrl: string } | null>(null);

  const [links, setLinks] = useState<DashboardLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLinks, setTotalLinks] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);

  const [copyToast, setCopyToast] = useState('');
  const resultRef = useRef<HTMLDivElement | null>(null);

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
    fetchLinks(1, accessToken);
  }, [authChecked, accessToken]);

  const fetchLinks = async (pageToLoad: number, token: string) => {
    setLinksLoading(true);
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
      const fetchedLinks: DashboardLink[] = data.links || [];
      setLinks(fetchedLinks);
      setPage(data.pagination?.page || pageToLoad);
      setTotalPages(data.pagination?.pages || 1);
      setTotalLinks(data.pagination?.total || fetchedLinks.length);
      const clicks = fetchedLinks.reduce((sum, l) => sum + (l.clicks || 0), 0);
      const earnings = fetchedLinks.reduce((sum, l) => sum + (Number(l.earnings) || 0), 0);
      setTotalClicks(clicks);
      setTotalEarnings(Math.round(earnings * 100) / 100);
    } catch (error) {
      console.error(error);
    } finally {
      setLinksLoading(false);
    }
  };

  const isValidUrlClient = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      router.replace('/auth/login');
      return;
    }
    setShortError('');
    if (!longUrl.trim()) {
      setShortError('Please enter a URL');
      return;
    }
    if (!isValidUrlClient(longUrl.trim())) {
      setShortError('Please enter a valid URL with protocol (e.g. https:// or tg://)');
      return;
    }
    setShortLoading(true);
    try {
      const res = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          url: longUrl.trim(),
          customSlug: customSlug.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 || data?.error === 'Slug already exists') {
          setShortError('This alias is already in use. Try another one.');
        } else if (res.status === 401) {
          router.replace('/auth/login');
        } else {
          setShortError(data?.error || 'Failed to create short link.');
        }
        return;
      }
      const result = {
        slug: data.slug,
        shortUrl: data.shortUrl,
        targetUrl: data.targetUrl,
      };
      setShortResult(result);
      setLongUrl('');
      setCustomSlug('');
      if (resultRef.current) {
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
      if (links.length > 0) {
        const newLinks: DashboardLink[] = [
          {
            id: data.id,
            slug: data.slug,
            main_title: data.title || 'Short link',
            clicks: 0,
            earnings: 0,
            created_at: new Date().toISOString(),
            movieLinks: [{ target_url: data.targetUrl }],
          },
          ...links,
        ];
        setLinks(newLinks.slice(0, 10));
        setTotalLinks((prev) => prev + 1);
      } else if (accessToken) {
        fetchLinks(1, accessToken);
      }
    } catch (error) {
      console.error(error);
      setShortError('Failed to create short link.');
    } finally {
      setShortLoading(false);
    }
  };

  const showCopyToast = (message: string) => {
    setCopyToast(message);
    setTimeout(() => {
      setCopyToast('');
    }, 2000);
  };

  const handleCopyShortUrl = async (shortUrl: string) => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      showCopyToast('Short link copied');
    } catch {
      showCopyToast('Unable to copy link');
    }
  };

  const handleCopySlug = async (slug: string) => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      showCopyToast('Short link copied');
    } catch {
      showCopyToast('Unable to copy link');
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

  const stats = [
    { label: 'Total Links', value: totalLinks.toString(), icon: LinkIcon, color: 'blue' },
    { label: 'Total Clicks', value: totalClicks.toString(), icon: Eye, color: 'green' },
    { label: 'Total Earnings', value: `$${totalEarnings.toFixed(2)}`, icon: DollarSign, color: 'yellow' },
    { label: 'Avg CTR', value: '4.2%', icon: BarChart3, color: 'purple' },
  ];

  if (loadingSession) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="card flex items-center gap-3">
          <Loader className="w-5 h-5 animate-spin text-blue-400" />
          <span className="text-slate-200">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 md:ml-64 overflow-auto">
        <div className="p-4 md:p-8">
          {copyToast && (
            <div className="fixed right-4 top-4 z-50 card bg-slate-900/90 border-blue-600/50 shadow-lg">
              <p className="text-sm text-slate-100">{copyToast}</p>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-slate-400">Shorten links and track performance.</p>
          </div>

          <div className="card mb-8">
            <form onSubmit={handleShorten} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Enter your long URL here</label>
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    value={longUrl}
                    onChange={(e) => setLongUrl(e.target.value)}
                    className="input-field flex-1 text-base md:text-lg"
                    placeholder="https://t.me/NETFLIX_317_bot?start=BQADA…"
                  />
                  <button
                    type="submit"
                    disabled={shortLoading}
                    className="btn-primary flex items-center justify-center gap-2 px-6 py-3 text-base md:text-lg"
                  >
                    {shortLoading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Shortening...
                      </>
                    ) : (
                      <>Shorten</>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Custom alias (optional)</label>
                  <input
                    type="text"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    className="input-field"
                    placeholder="my-special-link"
                  />
                </div>
              </div>

              {shortError && <p className="text-sm text-red-400">{shortError}</p>}
            </form>
          </div>

          <div
            ref={resultRef}
            className={`transition-all duration-300 ${shortResult ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'} mb-8`}
          >
            {shortResult && (
              <div className="card border-blue-600/60 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950">
                <p className="text-sm text-slate-400 mb-2">Your short link</p>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-lg md:text-xl font-semibold text-white break-all">{shortResult.shortUrl}</p>
                    <p className="text-sm text-slate-400 mt-1 break-all">Destination: {shortResult.targetUrl}</p>
                  </div>
                  <button
                    onClick={() => handleCopyShortUrl(shortResult.shortUrl)}
                    className="btn-secondary inline-flex items-center justify-center gap-2 self-start md:self-auto"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              const colorMap: any = {
                blue: 'bg-blue-500/10 text-blue-400',
                green: 'bg-green-500/10 text-green-400',
                yellow: 'bg-yellow-500/10 text-yellow-400',
                purple: 'bg-purple-500/10 text-purple-400',
              };

              return (
                <div key={i} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold text-white">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${colorMap[stat.color]}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card overflow-x-auto mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Your recent short links</h2>
              <p className="text-sm text-slate-400">
                Page {page} of {totalPages}
              </p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-3 text-slate-300 font-semibold">Short URL</th>
                  <th className="text-left py-3 px-3 text-slate-300 font-semibold">Destination</th>
                  <th className="text-left py-3 px-3 text-slate-300 font-semibold">Clicks</th>
                  <th className="text-left py-3 px-3 text-slate-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.length === 0 && !linksLoading && (
                  <tr>
                    <td colSpan={4} className="py-6 px-3 text-center text-slate-400">
                      You have no links yet. Create your first short link above.
                    </td>
                  </tr>
                )}
                {linksLoading && (
                  <tr>
                    <td colSpan={4} className="py-6 px-3 text-center text-slate-400">Loading links...</td>
                  </tr>
                )}
                {!linksLoading &&
                  links.map((link) => {
                    const destination =
                      (link.movieLinks && link.movieLinks[0]?.target_url) || '';
                    const shortUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${link.slug}`;
                    return (
                      <tr
                        key={link.id}
                        className="border-b border-slate-800 hover:bg-slate-800/50"
                      >
                        <td className="py-3 px-3">
                          <code className="text-blue-400 font-mono break-all">{shortUrl}</code>
                        </td>
                        <td className="py-3 px-3 text-slate-200 break-all">
                          {destination || '—'}
                        </td>
                        <td className="py-3 px-3 text-slate-200">{link.clicks}</td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => handleCopySlug(link.slug)}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium"
                          >
                            <Copy className="w-3 h-3" />
                            Copy
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => handlePageChange('prev')}
                disabled={page <= 1 || linksLoading}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm border border-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <button
                onClick={() => handlePageChange('next')}
                disabled={page >= totalPages || linksLoading}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm border border-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card">
              <h2 className="text-xl font-bold text-white mb-4">Clicks Over Time</h2>
              <div className="h-64 bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-400">
                Chart will be displayed here
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-bold text-white mb-4">Top Links</h2>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-slate-300">short.link/{i}</p>
                    <p className="text-lg font-semibold text-white">{100 * i} clicks</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
