'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#050A1A',
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: '#0A1122',
        borderRadius: 16,
        padding: 32,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
          Reset Password
        </h1>
        <p style={{ fontSize: 14, color: '#8E9CBC', marginBottom: 24 }}>
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {sent ? (
          <div style={{
            padding: 16,
            borderRadius: 8,
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.2)',
            color: '#22c55e',
            fontSize: 14,
          }}>
            Check your email for the reset link.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: 14,
                outline: 'none',
                marginBottom: 16,
                boxSizing: 'border-box' as const,
              }}
            />
            {error && (
              <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #7C3AED, #3B82F6)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <a
          href="/login"
          style={{
            display: 'block',
            textAlign: 'center',
            marginTop: 16,
            color: '#8E9CBC',
            fontSize: 13,
            textDecoration: 'none',
          }}
        >
          Back to login
        </a>
      </div>
    </div>
  );
}
