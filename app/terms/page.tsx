import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SmartShort Terms of Service',
  description:
    'Review SmartShort Terms of Service covering eligibility, account rules, click fraud prevention, earnings and payout conditions, and account termination policies.',
};

const sections = [
  {
    title: 'Eligibility',
    body: 'You must be at least 16 years old (or the minimum age in your country) and legally allowed to receive online payouts to use SmartShort. Business users must have the right to share the content they shorten.',
  },
  {
    title: 'Account creation rules',
    body: 'Use accurate contact information and keep your login secure. One account per individual or business is allowed. We may request verification before payouts to prevent abuse.',
  },
  {
    title: 'Click fraud prevention policy',
    body: 'Artificial traffic, bots, incentivized clicks, or self-clicking are strictly prohibited. We monitor IPs, device fingerprints, and abnormal patterns and may withhold earnings or suspend accounts that trigger fraud signals.',
  },
  {
    title: 'Earnings rules',
    body: 'Earnings are calculated using CPM (cost per thousand views) with rates that may vary by geography, device, or campaign. Earnings shown in the dashboard are estimates until validated against fraud checks.',
  },
  {
    title: 'Payout conditions',
    body: 'Payouts are issued once you meet the minimum threshold and pass compliance checks. You are responsible for providing correct payout details. Failed payments due to incorrect details may incur delays.',
  },
  {
    title: 'Account termination',
    body: 'We may suspend or terminate accounts that violate these Terms, local laws, or fraud rules. You may request account deletion at any time; residual balances under review may be withheld if fraud is suspected.',
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <PublicNav />

      <main className="container-custom py-16 space-y-10">
        <header className="max-w-3xl space-y-3">
          <p className="text-sm uppercase tracking-wide text-blue-300">Terms of Service</p>
          <h1 className="text-4xl md:text-5xl font-bold">Use SmartShort responsibly.</h1>
          <p className="text-lg text-slate-300">
            These terms explain how earnings, fraud prevention, and payouts work so every creator can monetize fairly.
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
      </main>

      <PublicFooter />
    </div>
  );
}

