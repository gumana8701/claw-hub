'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: username || email.split('@')[0] } },
        });
        if (error) throw error;
      }
      router.push('/chat');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    fontSize: 14,
    outline: 'none',
    background: 'var(--bg-app)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-default)',
    transition: 'border-color 150ms',
    fontFamily: 'inherit',
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ padding: 24, background: 'var(--bg-app)' }}>
      <div style={{ width: '100%', maxWidth: 400, borderRadius: 'var(--radius-lg)', padding: 40, background: 'var(--bg-surface)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            className="flex items-center justify-center"
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-brand)',
              margin: '0 auto 16px',
              boxShadow: 'var(--shadow-glow-violet)',
            }}
          >
            <Zap size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif" }}>
            ClawHub
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {isLogin ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
          />

          {error && (
            <p style={{ fontSize: 13, textAlign: 'center', color: 'var(--error)', padding: '4px 0' }}>{error}</p>
          )}

          {isLogin && (
            <a
              href="/reset-password"
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                textAlign: 'right',
                marginTop: -8,
              }}
            >
              Forgot password?
            </a>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 'var(--radius-md)',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              background: 'var(--gradient-brand)',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              marginTop: 8,
              fontFamily: 'inherit',
            }}
          >
            {loading ? '...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, marginTop: 32, color: 'var(--text-secondary)' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{
              fontWeight: 600,
              color: 'var(--accent-blue)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontFamily: 'inherit',
            }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
