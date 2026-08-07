"use client";
import React, { useState } from 'react';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const supportEmail = 'support@gramansh.com';
    const subject = `Contact from website: ${name || email}`;
    const body = `${message}\n\n---\nFrom: ${name || 'Anonymous'}\nEmail: ${email || ''}`;
    // Open user's mail client as a minimal fallback
    window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      {sent ? (
        <div className="p-4 bg-surface-container-highest rounded-md">
          <p className="font-headline text-sm">Thanks — your message is ready in your mail client.</p>
        </div>
      ) : (
        <>
          <div>
            <label className="text-sm font-label uppercase text-on-surface-variant">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 p-3 rounded-md bg-transparent border border-outline-variant/40 focus:border-primary outline-none"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="text-sm font-label uppercase text-on-surface-variant">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 p-3 rounded-md bg-transparent border border-outline-variant/40 focus:border-primary outline-none"
              placeholder="you@example.com"
              type="email"
            />
          </div>

          <div>
            <label className="text-sm font-label uppercase text-on-surface-variant">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full mt-1 p-3 rounded-md bg-transparent border border-outline-variant/40 focus:border-primary outline-none min-h-[140px]"
              placeholder="How can we help?"
            />
          </div>

          <div className="pt-2">
            <button type="submit" className="px-6 py-3 bg-primary text-on-primary rounded-full font-bold hover:opacity-90">
              Send Message
            </button>
          </div>
        </>
      )}
    </form>
  );
}
