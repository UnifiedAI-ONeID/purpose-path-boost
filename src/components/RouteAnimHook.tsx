import React, { Suspense } from 'react';
import RouteAnimHookInternal from './RouteAnimHookInternal';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('RouteAnimHook: Router context not ready', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null; // Don't render anything if there's an error
    }

    return this.props.children;
  }
}

export default function RouteAnimHook() {
  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <RouteAnimHookInternal />
      </Suspense>
    </ErrorBoundary>
  );
}
