/**
 * Error Boundary - Catches React errors and shows friendly fallback
 */

import React from 'react';
import { logger } from '@lib/logger';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('React Error Boundary caught error:', error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#2d2d2d',
            color: 'white',
            fontFamily: 'Comic Sans MS, cursive',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>😕</h1>
          <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>Something went wonky!</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '40px', maxWidth: '500px', opacity: 0.8 }}>
            Don't worry! We can fix this.
          </p>
          
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleReload}
              style={{
                fontSize: '1.5rem',
                padding: '16px 32px',
                backgroundColor: '#4a9eff',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontFamily: 'Comic Sans MS, cursive',
                fontWeight: 'bold',
                minWidth: '150px',
              }}
            >
              🔄 Reload
            </button>
            
            <button
              onClick={this.handleGoHome}
              style={{
                fontSize: '1.5rem',
                padding: '16px 32px',
                backgroundColor: '#6b6b6b',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontFamily: 'Comic Sans MS, cursive',
                fontWeight: 'bold',
                minWidth: '150px',
              }}
            >
              🏠 Go Home
            </button>
          </div>
          
          {import.meta.env.DEV && this.state.error && (
            <div
              style={{
                marginTop: '40px',
                padding: '20px',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                borderRadius: '8px',
                maxWidth: '600px',
                textAlign: 'left',
                fontSize: '0.9rem',
                fontFamily: 'monospace',
                color: '#ff6b6b',
              }}
            >
              <strong>Error (dev mode):</strong>
              <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                {this.state.error.toString()}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
