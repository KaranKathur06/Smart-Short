'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  Link as LinkIcon,
  LogOut,
  Menu,
  Settings,
  X,
  Zap,
  DollarSign,
  LifeBuoy,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const mainLinks = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Ads Dashboard / Pricing' },
  { href: '/analytics', label: 'Resources' },
  { href: '/contact', label: 'Support' },
];

const moreLinks = [
  { href: '/about', label: 'About' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy-policy', label: 'Privacy' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopMoreOpen, setDesktopMoreOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        const session = data.session;
        setLoggedIn(!!session);
        setUserEmail(session?.user?.email ?? null);
      })
      .catch(() => {
        if (!active) return;
        setLoggedIn(false);
        setUserEmail(null);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      setProfileOpen(false);
      setMobileOpen(false);
      router.replace('/auth/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const userInitial = (userEmail || 'U').charAt(0).toUpperCase();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-40 border-b border-white/10 backdrop-blur-lg bg-[rgba(12,18,38,0.85)] transition-shadow duration-200 ${
        isScrolled
          ? 'shadow-[0_10px_40px_rgba(0,0,0,0.45)]'
          : 'shadow-[0_4px_20px_rgba(0,0,0,0.15)]'
      }`}
    >
      <div className="container-custom flex items-center justify-between h-[70px]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/40 transition-transform duration-150 group-hover:scale-105 group-hover:shadow-blue-500/60">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold tracking-tight text-white">SmartShort</span>
            <span className="mt-0.5 inline-flex items-center rounded-full border border-blue-400/40 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-200">
              Earn With Traffic
            </span>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-6 text-sm text-white/80">
          {mainLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative inline-flex items-center px-1 py-1 transition-colors duration-150 ${
                isActive(item.href)
                  ? 'text-white'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`absolute left-0 right-0 -bottom-1 h-[2px] origin-center rounded-full bg-blue-400/90 transition-transform duration-150 ${
                  isActive(item.href) ? 'scale-100' : 'scale-0 group-hover:scale-100'
                }`}
              />
            </Link>
          ))}

          <div
            className="relative"
            onMouseEnter={() => setDesktopMoreOpen(true)}
            onMouseLeave={() => setDesktopMoreOpen(false)}
          >
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white transition-colors"
            >
              <span>More</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            <div
              className={`absolute right-0 top-full mt-2 w-44 rounded-xl bg-[#1a2238] shadow-lg shadow-black/40 border border-white/10 divide-y divide-white/10 origin-top-right transform transition-all duration-100 ease-out ${
                desktopMoreOpen
                  ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 scale-95 translate-y-1 pointer-events-none'
              }`}
            >
              <div className="py-1">
                {moreLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {loggedIn ? (
            <>
              <button
                type="button"
                className="relative inline-flex items-center justify-center rounded-full bg-white/5 p-2.5 text-white/80 hover:bg-white/10 hover:text-white transition-all duration-150"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-none text-white shadow-md">
                  3
                </span>
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-2.5 py-1.5 text-sm text-white/90 hover:bg-white/10 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-semibold uppercase text-white">
                    {userInitial}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </button>
                <div
                  className={`absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#1a2238] shadow-lg shadow-black/40 border border-white/10 divide-y divide-white/10 origin-top-right transform transition-all duration-100 ease-out ${
                    profileOpen
                      ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                      : 'opacity-0 scale-95 translate-y-1 pointer-events-none'
                  }`}
                >
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        router.push('/dashboard');
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/90 hover:bg-white/5"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        router.push('/links');
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/90 hover:bg-white/5"
                    >
                      <LinkIcon className="h-4 w-4" />
                      <span>My Links</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        router.push('/earnings');
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/90 hover:bg-white/5"
                    >
                      <DollarSign className="h-4 w-4" />
                      <span>Ads Earnings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        router.push('/settings');
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-white/90 hover:bg-white/5"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </button>
                  </div>
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-200 hover:bg-rose-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-transparent px-4 py-2 text-sm font-medium text-white/90 hover:border-white hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/50 transition-transform duration-150 hover:scale-[1.03] hover:shadow-blue-500/70"
              >
                <span className="absolute inset-0 rounded-full border border-blue-300/40 blur-[1px]" />
                <span className="relative">Get Started</span>
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-2 text-white md:hidden"
          onClick={() => {
            const next = !mobileOpen;
            setMobileOpen(next);
            if (!next) {
              setMobileMoreOpen(false);
              setProfileOpen(false);
            }
          }}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={`fixed inset-x-0 top-[70px] bottom-0 z-30 border-t border-white/10 bg-[#020617]/95 backdrop-blur-xl transition-transform duration-200 md:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="container-custom flex h-full flex-col gap-6 py-6">
          <div className="space-y-3">
            {loggedIn ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    router.push('/dashboard');
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/40"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Go to Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-transparent px-4 py-3 text-sm font-medium text-white/90"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/40"
                >
                  Get Started
                </Link>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center justify-center rounded-xl border border-white/20 bg-transparent px-4 py-3 text-sm font-medium text-white/90"
                >
                  Login
                </Link>
              </>
            )}
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pb-6">
            <nav className="space-y-1 text-sm">
              {mainLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
                    isActive(item.href)
                      ? 'bg-white/10 text-white'
                      : 'text-white/80 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
              ))}

              <div className="mt-2 rounded-lg border border-white/10 bg-white/[0.02]">
                <button
                  type="button"
                  onClick={() => setMobileMoreOpen((v) => !v)}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-sm text-white/90"
                >
                  <span className="inline-flex items-center gap-2">
                    <LifeBuoy className="h-4 w-4" />
                    <span>More</span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-150 ${
                      mobileMoreOpen ? 'rotate-180' : 'rotate-0'
                    }`}
                  />
                </button>
                {mobileMoreOpen && (
                  <div className="border-t border-white/10 py-1">
                    {moreLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="block px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </nav>
  );
}
