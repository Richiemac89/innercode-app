import { useState, useEffect } from 'react';
import { safeGetItem, safeSetItem } from '../utils/helpers';
import { getSupabaseClient } from '../lib/supabase';

interface VerifyEmailProps {
  email: string;
  onResendEmail: () => Promise<void>;
  onLogout: () => void;
  onVerified: () => void;
}

export function VerifyEmail({ email, onResendEmail, onLogout, onVerified }: VerifyEmailProps) {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [checking, setChecking] = useState(false);

  // Clear saved onboarding route to prevent flash on verification redirect
  useEffect(() => {
    const hasResults = !!safeGetItem("innercode_results");
    const hasSeenResults = !!safeGetItem("innercode_hasSeenResults");
    
    // Only clear for users who completed onboarding but haven't seen results
    if (hasResults && !hasSeenResults) {
      try {
        const savedState = safeGetItem("innercode_state_v1");
        if (savedState) {
          const state = JSON.parse(savedState);
          if (state.route === "onboarding") {
            console.log('VerifyEmail: Clearing onboarding route to prevent flash on redirect');
            state.route = "verifyEmail";
            safeSetItem("innercode_state_v1", JSON.stringify(state));
          }
        }
      } catch (e) {
        console.error('Failed to clear onboarding route:', e);
      }
    }
  }, []); // Run once on mount

  // Auto-check for verification every 3 seconds (like Notion, Stripe, LinkedIn)
  useEffect(() => {
    const checkVerification = async () => {
      try {
        setChecking(true);
        const supabase = await getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        console.log('Checking verification for user:', user?.email, 'confirmed:', user?.email_confirmed_at);
        
        if (user?.email_confirmed_at) {
          console.log('Email verified! Redirecting...');
          setIsVerified(true);
          // Wait 2 seconds to show success message, then proceed
          setTimeout(() => {
            onVerified();
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking verification:', error);
      } finally {
        setChecking(false);
      }
    };

    // Check immediately
    checkVerification();

    // Then check every 3 seconds
    const interval = setInterval(checkVerification, 3000);

    return () => clearInterval(interval);
  }, [onVerified]);

  const handleResend = async () => {
    setResending(true);
    await onResendEmail();
    setResending(false);
    setResent(true);
    setTimeout(() => setResent(false), 3000);
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
      <div style={{ width: '100%', maxWidth: 500, textAlign: 'center' }}>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 24,
            padding: 40,
            boxShadow: '0 20px 60px rgba(106, 58, 191, 0.15)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          {/* Icon - animating pulse */}
          <div 
            className="pulse"
            style={{ 
              fontSize: 80, 
              marginBottom: 24,
              animation: 'pulse 2s ease-in-out infinite'
            }}
          >
            📧
          </div>

          {/* Heading */}
          <h1 style={{ margin: '0 0 16px', fontSize: 32, fontWeight: 700, color: '#6A3ABF' }}>
            Check Your Email! 📬
          </h1>

          <p style={{ margin: '0 0 8px', fontSize: 16, color: '#4A5568', lineHeight: 1.6 }}>
            We've sent a verification link to:
          </p>

          <p style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 700, color: '#6A3ABF' }}>
            {email}
          </p>

          {/* Auto-checking indicator */}
          {checking && (
            <div
              style={{
                background: 'rgba(106, 58, 191, 0.1)',
                border: '2px solid rgba(106, 58, 191, 0.2)',
                borderRadius: 16,
                padding: '12px 20px',
                marginBottom: 20,
                fontSize: 14,
                color: '#6A3ABF',
                fontWeight: 600,
              }}
            >
              🔍 Checking for verification...
            </div>
          )}

          {/* Instructions */}
          <div
            style={{
              background: 'rgba(106, 58, 191, 0.05)',
              border: '2px solid rgba(106, 58, 191, 0.15)',
              borderRadius: 16,
              padding: 24,
              marginBottom: 24,
              textAlign: 'left',
            }}
          >
            <p style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#6A3ABF' }}>
              📋 What to do next:
            </p>
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 2, color: '#4A5568' }}>
              <li>Check your email inbox</li>
              <li>Click the verification link</li>
              <li><strong>Stay on this page</strong> - it will automatically continue! ✨</li>
            </ol>
          </div>

          {/* Auto-check info */}
          <div
            style={{
              background: 'rgba(16,185,129,0.08)',
              border: '2px solid rgba(16,185,129,0.2)',
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              fontSize: 14,
              color: '#059669',
              fontWeight: 500,
            }}
          >
            💡 <strong>No need to refresh!</strong> This page automatically checks every few seconds.
          </div>

          {/* Tips */}
          <div
            style={{
              background: 'rgba(251, 191, 36, 0.08)',
              border: '2px solid rgba(251, 191, 36, 0.2)',
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              textAlign: 'left',
            }}
          >
            <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#B45309' }}>
              💡 Can't find the email?
            </p>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.8, color: '#78350f' }}>
              <li>Check your spam/junk folder</li>
              <li>Emails can take 1-2 minutes to arrive</li>
              <li>Verify the email address is correct</li>
              <li>Use the "Resend" button below</li>
            </ul>
          </div>

          {/* Success Message */}
          {resent && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '2px solid rgba(16, 185, 129, 0.3)',
                color: '#059669',
                padding: '14px 20px',
                borderRadius: 16,
                marginBottom: 20,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              ✓ Email resent! Check your inbox.
            </div>
          )}

          {/* Resend Button */}
          <button
            onClick={handleResend}
            disabled={resending || resent}
            style={{
              width: '100%',
              padding: '18px 24px',
              borderRadius: 50,
              border: 'none',
              background: resending || resent ? 'rgba(106, 58, 191, 0.3)' : '#6A3ABF',
              color: '#fff',
              fontWeight: 700,
              fontSize: 16,
              cursor: resending || resent ? 'not-allowed' : 'pointer',
              marginBottom: 16,
              opacity: resending || resent ? 0.6 : 1,
              boxShadow: resending || resent ? 'none' : '0 8px 32px rgba(106, 58, 191, 0.4)',
              transition: 'all 0.3s ease',
            }}
          >
            {resending ? 'Sending...' : resent ? 'Email Sent ✓' : '📧 Resend Verification Email'}
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6A3ABF',
              fontSize: 14,
              cursor: 'pointer',
              textDecoration: 'underline',
              fontWeight: 600,
            }}
          >
            ← Use a different email
          </button>
        </div>

        {/* Footer Note */}
        <p style={{ marginTop: 24, fontSize: 13, color: 'rgba(255, 255, 255, 0.8)' }}>
          🔒 Email verification keeps your account secure
        </p>
      </div>
      </div>
    </div>
  );
}

