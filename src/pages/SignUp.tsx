import { useState } from 'react';
import { COUNTRIES } from '../constants/countries';

interface SignUpProps {
  onSignUp: (email: string, password: string, firstName: string, lastName: string, country: string) => Promise<{ error: any }>;
  onBack: () => void;
  prefillName?: string;
}

export function SignUp({ onSignUp, onBack, prefillName }: SignUpProps) {
  const [firstName, setFirstName] = useState(prefillName || '');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!firstName.trim()) return 'First name is required';
    if (!lastName.trim()) return 'Last name is required';
    if (!country) return 'Please select a country';
    if (!email.trim()) return 'Email is required';
    if (!email.includes('@')) return 'Please enter a valid email';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    console.log('Attempting signup...'); // Debug
    
    try {
      // Add timeout protection
      const signupPromise = onSignUp(email, password, firstName, lastName, country);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Signup timeout after 30 seconds')), 30000)
      );
      
      const { error: signUpError } = await Promise.race([signupPromise, timeoutPromise]) as any;
      
      if (signUpError) {
        console.error('Signup error:', signUpError);
        setError(signUpError.message || 'An error occurred during sign up');
        setLoading(false);
      } else {
        console.log('Signup successful!'); // Debug
        // Keep loading state - user will be auto-redirected to verify email page
        // This happens via authentication state change in App.tsx
        
        // Force redirect to verify email page after a short delay
        setTimeout(() => {
          // Instead of reloading, manually navigate to verify email
          window.location.href = window.location.origin + '?verify=' + email;
        }, 1000);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Full Screen Background Gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(167,139,250,0.12), rgba(253,186,116,0.12))',
          zIndex: 1,
        }}
      />

      {/* Content Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px 24px',
          position: 'relative',
          zIndex: 2,
        }}
      >
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Back Button */}
        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            top: '40px',
            left: '24px',
            background: 'transparent',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            opacity: 0.7,
            color: '#6b7280',
            fontSize: '13px',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.7';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          Back
        </button>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 80, marginBottom: 24 }}>🌿</div>
          <h2 style={{ margin: 0, fontSize: 32, fontWeight: 700, color: '#3b3b3b' }}>Almost There!</h2>
          <p style={{ color: '#6b6b6b', marginTop: 12, fontSize: 16, lineHeight: 1.5, maxWidth: '340px', margin: '12px auto 0' }}>
            We've prepared your personalized insights. Just verify your email and you'll be ready to explore your InnerCode! ✨
          </p>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 24,
            padding: 32,
            boxShadow: '0 20px 60px rgba(106, 58, 191, 0.15)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: 20 }}>
              {/* First Name */}
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
                  First Name *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    border: '2px solid rgba(106, 58, 191, 0.2)',
                    borderRadius: 50,
                    fontSize: 16,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Last Name */}
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
                  Last Name *
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    border: '2px solid rgba(106, 58, 191, 0.2)',
                    borderRadius: 50,
                    fontSize: 16,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Country */}
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
                  Country *
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    border: '2px solid rgba(106, 58, 191, 0.2)',
                    borderRadius: 50,
                    fontSize: 16,
                    outline: 'none',
                    background: '#fff',
                  }}
                >
                  <option value="">Select your country</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

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
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    border: '2px solid rgba(106, 58, 191, 0.2)',
                    borderRadius: 50,
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
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    border: '2px solid rgba(106, 58, 191, 0.2)',
                    borderRadius: 50,
                    fontSize: 16,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Confirm Password */}
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
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    border: '2px solid rgba(106, 58, 191, 0.2)',
                    borderRadius: 50,
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

              {/* Loading Indicator */}
              {loading && (
                <div
                  style={{
                    background: 'rgba(139,92,246,0.08)',
                    border: '1px solid rgba(139,92,246,0.2)',
                    color: '#8B5CF6',
                    padding: '12px 14px',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ marginBottom: 8, fontSize: 24 }}>⏳</div>
                  Creating your account...
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  borderRadius: 50,
                  border: 'none',
                  background: loading ? 'rgba(106, 58, 191, 0.3)' : '#6A3ABF',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 18,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 8px 32px rgba(106, 58, 191, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button
              onClick={onBack}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: 14,
              }}
            >
              ← Back to name collection
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255, 255, 255, 0.7)' }}>
          By signing up, you agree to keep your data private and secure
        </p>
      </div>
      </div>
    </div>
  );
}

