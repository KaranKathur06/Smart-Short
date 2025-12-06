'use client';

import Link from 'next/link';
import { ArrowRight, Zap, BarChart3, Shield, Smartphone } from 'lucide-react';

export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container-custom flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-400" />
            <span className="text-xl font-bold">SmartShort</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="btn-secondary">
              Login
            </Link>
            <Link href="/auth/signup" className="btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container-custom py-20 md:py-32">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Shorten Links & <span className="text-blue-400">Earn Money</span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            Create short links with advanced analytics, monetize your traffic with ads, and track every click in real-time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/auth/signup" className="btn-primary text-lg py-3 inline-flex items-center justify-center gap-2">
              Start Free <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="btn-secondary text-lg py-3">Learn More</button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container-custom py-20">
        <h2 className="text-4xl font-bold mb-16 text-center">Powerful Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: Zap,
              title: 'Lightning Fast',
              desc: 'Redirects with 0.001s latency',
            },
            {
              icon: BarChart3,
              title: 'Advanced Analytics',
              desc: 'Track clicks, devices, locations & more',
            },
            {
              icon: Shield,
              title: 'Secure & Reliable',
              desc: 'Enterprise-grade security',
            },
            {
              icon: Smartphone,
              title: 'Mobile Optimized',
              desc: 'Perfect on any device',
            },
          ].map((feature, i) => (
            <div key={i} className="card hover:border-blue-500/50 transition-colors">
              <feature.icon className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container-custom py-20">
        <div className="card bg-gradient-to-r from-blue-600 to-blue-700 border-0 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-blue-100 mb-8 text-lg">Join thousands of creators earning with SmartShort</p>
          <Link href="/auth/signup" className="btn-primary bg-white text-blue-600 hover:bg-slate-100">
            Create Account Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-8 mt-20">
        <div className="container-custom text-center text-slate-400">
          <p>&copy; 2024 SmartShort. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
