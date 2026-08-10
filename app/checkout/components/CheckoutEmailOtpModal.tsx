'use client';

import { useEffect, useRef } from 'react';

type CheckoutEmailOtpModalProps = {
  email: string;
  otp: string;
  busy: boolean;
  error: string;
  onOtpChange: (value: string) => void;
  onVerify: () => void;
  onResend: () => void;
  onClose: () => void;
};

export default function CheckoutEmailOtpModal({
  email,
  otp,
  busy,
  error,
  onOtpChange,
  onVerify,
  onResend,
  onClose,
}: CheckoutEmailOtpModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [busy, onClose]);

  return (
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-otp-title"
      onMouseDown={() => {
        if (!busy) onClose();
      }}
    >
      <div
        className="w-full max-w-md animate-[fadeIn_180ms_ease-out] rounded-[2rem] border border-white/40 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,245,236,0.98))] p-5 shadow-2xl sm:p-6"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary/70">Secure checkout</p>
            <h2 id="checkout-otp-title" className="mt-2 font-headline text-2xl font-bold text-primary">
              Verify your email
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              Enter the 6-digit OTP sent to <span className="font-semibold text-primary">{email}</span>.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close verification modal"
            onClick={onClose}
            disabled={busy}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant/30 text-on-surface-variant transition hover:border-primary hover:text-primary disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-center text-[11px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            OTP Code
          </label>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={otp}
            maxLength={6}
            placeholder="000000"
            onChange={(event) => onOtpChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full rounded-2xl border border-outline-variant/25 bg-white px-5 py-4 text-center text-2xl font-black tracking-[0.45em] text-primary outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
          />
          {error ? (
            <p className="mt-3 rounded-xl border border-error/20 bg-error/10 px-3 py-2 text-center text-xs text-error">
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onResend}
            disabled={busy}
            className="rounded-full border border-outline-variant/30 px-5 py-3 text-sm font-bold text-primary transition hover:border-primary disabled:opacity-50"
          >
            Resend OTP
          </button>
          <button
            type="button"
            onClick={onVerify}
            disabled={busy || otp.length !== 6}
            className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary shadow-lg shadow-primary/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {busy ? 'Verifying...' : 'Verify OTP'}
          </button>
        </div>
      </div>
    </div>
  );
}
