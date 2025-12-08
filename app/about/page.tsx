import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About SmartShort | Monetized Link Shortener',
  description:
    'Learn about SmartShort, why monetized link shorteners exist, and how our mission helps creators earn from every click.',
};

const highlights = [
  {
    title: 'What is SmartShort?',
    body: 'SmartShort is a modern link shortener that lets you monetize every click. Shorten URLs, share anywhere, and earn predictable CPM-based payouts.',
  },
  {
    title: 'Why monetized shorteners exist',
    body: 'Creators and communities deserve a fair revenue channel. By pairing lightweight ads with links, we convert traffic into earnings without slowing down redirects.',
  },
  {
    title: 'Trust & integrity',
    body: 'We block click fraud, use transparent analytics, and keep payout rules clear so honest users get paid first—no grey areas.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <PublicNav />

      <main className="container-custom py-16 space-y-12">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm uppercase tracking-wide text-blue-300">About us</p>
          <h1 className="text-4xl md:text-5xl font-bold">Built for creators who want to earn from every click.</h1>
          <p className="text-lg text-slate-300">
            SmartShort combines fast redirects with transparent CPM payouts so you can shorten, share, and monetize without worrying about speed, fraud, or unclear rules.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {highlights.map((item) => (
            <div key={item.title} className="card bg-slate-900/80 border-slate-800">
              <h3 className="text-xl font-semibold mb-3 text-white">{item.title}</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="card bg-slate-900/70 border-blue-700/40">
          <h2 className="text-2xl font-semibold text-white mb-3">Vision & mission</h2>
          <p className="text-slate-300 leading-relaxed">
            We want every community manager, creator, and marketer to turn their audience into dependable income. Our mission is to deliver reliable CPM rates, clean analytics, and payout schedules you can trust—without sacrificing user experience.
          </p>
        </div>

        <div className="card bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-blue-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white">Ready to start earning?</h3>
            <p className="text-slate-200 text-sm mt-1">Create an account or sign in to access your dashboard.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/auth/signup" className="btn-primary">
              Create account
            </Link>
            <Link href="/auth/login" className="btn-secondary">
              Sign in
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

