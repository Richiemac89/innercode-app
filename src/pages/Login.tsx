import { useState } from 'react';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<{ error: any }>;
  onBack: () => void;
}

export function Login({ onLogin, onBack }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    const { error: loginError } = await onLogin(email, password);
    setLoading(false);

    if (loginError) {
      setError(loginError.message || 'Invalid email or password');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(135deg, rgba(167,139,250,0.12), rgba(253,186,116,0.12))',
        padding: 20,
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌿</div>
          <h2 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>Welcome Back</h2>
          <p style={{ color: '#6b6b6b', marginTop: 8 }}>Continue your journey</p>
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            padding: 32,
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          }}
        >
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: 20 }}>
              {/* Email */}
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 6,
                    fontWeight: 600,
                    fontSize: 14,
                    color: '#3b3b3b',
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: 12,
                    fontSize: 16,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 6,
                    fontWeight: 600,
                    fontSize: 14,
                    color: '#3b3b3b',
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="off"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #d1d5db',
                    borderRadius: 12,
                    fontSize: 16,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div
                  style={{
                    background: '#fee2e2',
                    border: '1px solid #fca5a5',
                    color: '#991b1b',
                    padding: '12px 14px',
                    borderRadius: 12,
                    fontSize: 14,
                  }}
                >
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: 12,
                  border: 'none',
                  background: loading ? '#d1d5db' : 'linear-gradient(135deg,#8B5CF6,#7C3AED)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 18,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 10px 24px rgba(124,58,237,0.35)',
                }}
              >
                {loading ? 'Logging In...' : 'Log In'}
              </button>
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button
              onClick={onBack}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#8B5CF6',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              ← Back to landing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}






