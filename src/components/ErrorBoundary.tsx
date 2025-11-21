import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { trackEvent } from '@/lib/trackEvent';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Track error
    trackEvent('app_error', {
      message: error.message,
      stack: errorInfo.componentStack,
      url: window.location.href
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-muted-foreground mb-6 max-w-md">
            We apologize for the inconvenience. Please try refreshing the page.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="text-xs text-left bg-muted p-4 rounded mb-6 overflow-auto max-w-full">
              {this.state.error.toString()}
            </pre>
          )}
          <Button onClick={this.handleReload}>
            Refresh Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
