import PublicFooter from '@/components/PublicFooter';
import ContactForm from './ContactForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact SmartShort | Support & Partnerships',
  description: 'Get in touch with SmartShort for support, partnerships, and billing questions. Replies within 24–48 hours.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <main className="container-custom py-16 space-y-12">
        <div className="max-w-3xl space-y-3">
          <p className="text-sm uppercase tracking-wide text-blue-300">Contact</p>
          <h1 className="text-4xl md:text-5xl font-bold">We reply within 24–48 hours.</h1>
          <p className="text-lg text-slate-300">
            Need help with payouts, integrations, or policy questions? Send us a message and the SmartShort team will respond quickly.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-3">
            <ContactForm />
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="card bg-slate-900/70 border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-2">Support</h3>
              <p className="text-slate-300 text-sm">Email: support@smartshort.io</p>
              <p className="text-slate-300 text-sm mt-1">Telegram: @smartshort_support</p>
              <p className="text-slate-400 text-xs mt-3">Replies within 24–48 hours</p>
            </div>
            <div className="card bg-slate-900/70 border-blue-800/50">
              <h3 className="text-lg font-semibold text-white mb-2">Need faster help?</h3>
              <p className="text-slate-300 text-sm mb-3">
                Check our policies and FAQs to resolve most issues instantly.
              </p>
              <div className="flex gap-2">
                <a className="btn-secondary flex-1 text-center" href="/privacy-policy">
                  Privacy
                </a>
                <a className="btn-secondary flex-1 text-center" href="/terms">
                  Terms
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

