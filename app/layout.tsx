import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import Providers from './providers';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'SmartShort - Monetized Link Shortener',
  description: 'Create short links with advanced analytics and monetization',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5626394852414662"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <Providers>
          <Navbar />
          <div className="pt-[70px]">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
