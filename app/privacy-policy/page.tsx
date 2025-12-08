import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SmartShort Privacy Policy',
  description:
    'Understand how SmartShort collects and uses data, cookies, analytics, third-party ads, and your rights to control your information.',
};

const sections = [
  {
    title: 'Data collection',
    body: 'We collect account data (name, email), device/OS details, IP addresses, and click analytics to calculate earnings and prevent fraud.',
  },
  {
    title: 'Cookies & tracking',
    body: 'We use cookies and similar technologies to keep you signed in, measure performance, and protect against abuse. You can clear cookies in your browser, but some features may stop working.',
  },
  {
    title: 'Third-party ads',
    body: 'SmartShort may show ads from monetization partners on redirect pages. These partners may set their own cookies; please review their policies for details.',
  },
  {
    title: 'User control & deletion',
    body: 'You can request account deletion or data export at any time. Contact support@smartshort.io and we will process requests promptly, subject to fraud review requirements.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <PublicNav />

      <main className="container-custom py-16 space-y-10">
        <header className="max-w-3xl space-y-3">
          <p className="text-sm uppercase tracking-wide text-blue-300">Privacy Policy</p>
          <h1 className="text-4xl md:text-5xl font-bold">Your data. Your control.</h1>
          <p className="text-lg text-slate-300">
            We collect only what we need to power analytics, payouts, and fraud prevention—and we keep it transparent.
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          {sections.map((section) => (
            <article key={section.title} className="card bg-slate-900/80 border-slate-800">
              <h2 className="text-xl font-semibold text-white mb-2">{section.title}</h2>
              <p className="text-slate-300 text-sm leading-relaxed">{section.body}</p>
            </article>
          ))}
        </div>

        <div className="card bg-slate-900/70 border-blue-700/40">
          <h3 className="text-lg font-semibold text-white mb-2">Advertising & analytics partners</h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            We may work with third-party ad networks and analytics providers. These partners help measure CPM performance and may process anonymized click data. You can opt out of non-essential cookies in your browser settings.
          </p>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

