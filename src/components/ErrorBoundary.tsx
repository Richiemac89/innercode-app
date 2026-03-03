import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
    // In production, you could send this to an error tracking service like Sentry
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            textAlign: 'center',
            backgroundColor: '#f9fafb',
          }}
        >
          <div
            style={{
              maxWidth: '500px',
              backgroundColor: 'white',
              padding: '32px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
            <h1 style={{ fontSize: '24px', marginBottom: '12px', color: '#1f2937' }}>
              Oops! Something went wrong
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '16px' }}>
              We're sorry for the inconvenience. The app encountered an unexpected error.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <div
                style={{
                  textAlign: 'left',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '20px',
                  fontSize: '14px',
                  overflowX: 'auto',
                }}
              >
                <strong>Error:</strong> {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              style={{
                backgroundColor: '#6366f1',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                minHeight: '44px',
                minWidth: '44px',
              }}
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

