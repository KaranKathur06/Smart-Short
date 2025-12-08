'use client';

import { Mail, MessageSquare, Send, User } from 'lucide-react';
import { useState } from 'react';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (!name || !email || !subject || !message) {
      setStatus({ type: 'error', message: 'All fields are required.' });
      return;
      
    }
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ type: 'error', message: data?.error || 'Failed to send message.' });
        return;
      }
      setStatus({ type: 'success', message: 'Thanks! Your message has been sent.' });
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch {
      setStatus({ type: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card bg-slate-900/80 border-slate-800 space-y-4" onSubmit={handleSubmit}>
      <div className="grid md:grid-cols-2 gap-4">
        <label className="flex items-center gap-3">
          <User className="w-4 h-4 text-blue-400" />
          <input
            className="input-field"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-3">
          <Mail className="w-4 h-4 text-blue-400" />
          <input
            className="input-field"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
      </div>
      <label className="flex items-center gap-3">
        <MessageSquare className="w-4 h-4 text-blue-400" />
        <input
          className="input-field"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm text-slate-300 mb-2 block">Message</span>
        <textarea
          className="input-field min-h-[140px]"
          placeholder="Tell us how we can help."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>
      {status && (
        <p className={`text-sm ${status.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {status.message}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
      >
        <Send className="w-4 h-4" />
        {loading ? 'Sending...' : 'Send message'}
      </button>
    </form>
  );
}

