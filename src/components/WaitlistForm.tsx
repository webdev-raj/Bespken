'use client';

import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';

interface WaitlistFormProps {
  id?: string;
  variant?: 'hero' | 'cta';
}

export default function WaitlistForm({ id = 'waitlist-form', variant = 'hero' }: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const isValidEmail = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isValidEmail(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setStatus('loading');

    try {
      const supabase = getSupabase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('waitlist') as any).insert({ email: email.trim().toLowerCase() });

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation — already signed up
          setStatus('duplicate');
        } else {
          console.error('Supabase error:', error);
          setStatus('error');
          setErrorMsg('Something went wrong. Please try again.');
        }
      } else {
        setStatus('success');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div
        id={`${id}-success`}
        className="flex flex-col items-center gap-2 text-center"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 text-amber-400">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="9" stroke="#F2A84D" strokeWidth="1.5" />
            <path d="M6 10.5l2.5 2.5L14 7.5" stroke="#F2A84D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-semibold text-amber-400">You&apos;re on the list.</span>
        </div>
        <p className="text-stone-400 text-sm">We&apos;ll be in touch when we launch.</p>
      </div>
    );
  }

  if (status === 'duplicate') {
    return (
      <div
        id={`${id}-duplicate`}
        className="flex flex-col items-center gap-2 text-center"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 text-amber-400">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="9" stroke="#F2A84D" strokeWidth="1.5" />
            <path d="M10 6v4" stroke="#F2A84D" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="10" cy="14" r="0.75" fill="#F2A84D" />
          </svg>
          <span className="font-semibold text-amber-400">You&apos;re already on the list.</span>
        </div>
        <p className="text-stone-400 text-sm">We&apos;ve got your email — you&apos;ll hear from us at launch.</p>
      </div>
    );
  }

  return (
    <form
      id={id}
      onSubmit={handleSubmit}
      className={`flex flex-col sm:flex-row gap-3 w-full ${variant === 'cta' ? 'max-w-md mx-auto' : 'max-w-lg'}`}
      noValidate
    >
      <div className="flex-1 flex flex-col gap-1">
        <label htmlFor={`${id}-email`} className="sr-only">
          Email address
        </label>
        <input
          id={`${id}-email`}
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errorMsg) setErrorMsg('');
          }}
          placeholder="you@yourcompany.com"
          autoComplete="email"
          disabled={status === 'loading'}
          aria-describedby={errorMsg ? `${id}-error` : undefined}
          className={`w-full px-4 py-3 rounded-lg bg-white/5 border text-white placeholder-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/60 transition-all duration-200 disabled:opacity-50 ${
            errorMsg ? 'border-red-500/60' : 'border-white/10 hover:border-white/20'
          }`}
        />
        {errorMsg && (
          <p id={`${id}-error`} className="text-xs text-red-400 mt-1 ml-1" role="alert">
            {errorMsg}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-6 py-3 rounded-lg bg-amber-400 text-stone-900 font-semibold text-sm whitespace-nowrap hover:bg-amber-300 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-[#0B0B0F]"
      >
        {status === 'loading' ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Joining...
          </span>
        ) : (
          'Join the waitlist'
        )}
      </button>
    </form>
  );
}
