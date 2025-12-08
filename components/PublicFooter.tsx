import Link from 'next/link';
import { Zap } from 'lucide-react';

const footerLinks = [
  { href: '/about', label: 'About' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy-policy', label: 'Privacy' },
  { href: '/contact', label: 'Contact' },
];

export default function PublicFooter() {
  return (
    <footer className="border-t border-slate-700/50 py-10 mt-20 bg-slate-950/80">
      <div className="container-custom flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-slate-300">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-white">SmartShort</span>
          </div>
          <p className="text-sm text-slate-400">Monetized link shortener built for creators.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="container-custom mt-6 text-sm text-slate-500">
        <p>© {new Date().getFullYear()} SmartShort. All rights reserved.</p>
      </div>
    </footer>
  );
}

