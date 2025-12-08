/* eslint-disable react/no-unescaped-entities */
'use client';
import Link from 'next/link';
import { Menu, X, Zap, ChevronDown } from 'lucide-react';
import { useState } from 'react';

type PublicNavProps = {
  showAuthButtons?: boolean;
};

const importantLinks = [
  { href: '/about', label: 'About' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy-policy', label: 'Privacy' },
  { href: '/contact', label: 'Contact' },
];

export default function PublicNav({ showAuthButtons = true }: PublicNavProps) {
  const [open, setOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <nav className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50 bg-slate-950/80">
      <div className="container-custom flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-blue-400" />
          <span className="text-xl font-bold">SmartShort</span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-slate-200">
          <div className="relative">
            <button
              className="inline-flex items-center gap-1 text-sm hover:text-white transition-colors"
              onClick={() => setOpenMenu((v) => !v)}
              onBlur={() => setOpenMenu(false)}
            >
              Important Pages <ChevronDown className="w-4 h-4" />
            </button>
            {openMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-slate-900 border border-slate-800 rounded-lg shadow-lg">
                <div className="py-1">
                  {importantLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Link href="/about" className="text-sm hover:text-white">About</Link>
          <Link href="/terms" className="text-sm hover:text-white">Terms</Link>
          <Link href="/privacy-policy" className="text-sm hover:text-white">Privacy</Link>
          <Link href="/contact" className="text-sm hover:text-white">Contact</Link>
          {showAuthButtons && (
            <>
              <Link href="/auth/login" className="btn-secondary">
                Login
              </Link>
              <Link href="/auth/signup" className="btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 rounded-lg bg-slate-800 text-white"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950">
          <div className="container-custom py-4 space-y-3 text-slate-200">
            {importantLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-sm hover:text-white"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {showAuthButtons && (
              <div className="flex gap-3">
                <Link href="/auth/login" className="btn-secondary flex-1 text-center" onClick={() => setOpen(false)}>
                  Login
                </Link>
                <Link href="/auth/signup" className="btn-primary flex-1 text-center" onClick={() => setOpen(false)}>
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

