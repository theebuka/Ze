import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Without one of these, a throw anywhere in the tree unmounts the entire
 * React root and you get a white screen with no clue why. That is exactly
 * what `ReactPlayer is not a function` did to /work/monibac.
 *
 * Class component because React still has no hook equivalent.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="page-wrapper error-state" role="alert">
          <h1>Something broke here.</h1>
          <p>
            This page failed to render. Try reloading, or head back to{' '}
            <a href="/">the homepage</a>.
          </p>
          {import.meta.env.DEV && (
            <pre className="error-detail">{this.state.error.message}</pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
