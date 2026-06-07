import { Component } from 'react';

/**
 * App-level error boundary. Catches render-time crashes anywhere in the
 * tree and shows a branded recovery card instead of a blank white
 * screen (which is what a thrown error produces by default). Logs to
 * the console + Sentry if present.
 *
 * Class component because React error boundaries require the
 * componentDidCatch / getDerivedStateFromError lifecycle, which has no
 * hook equivalent.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
    // Forward to Sentry if the global is present (loaded in main.jsx).
    if (typeof window !== 'undefined' && window.Sentry?.captureException) {
      try { window.Sentry.captureException(error); } catch { /* noop */ }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-card">
            <p className="error-boundary-eyebrow">Something broke</p>
            <h1 className="error-boundary-title">
              A page didn't load <em>right.</em>
            </h1>
            <p className="error-boundary-body">
              That's on us, not you. A reload usually clears it. If it keeps
              happening, the catalog is always a safe place to land.
            </p>
            <div className="error-boundary-actions">
              <button
                type="button"
                className="btn-gold"
                onClick={() => window.location.reload()}
              >Reload</button>
              <a href="/shop" className="error-boundary-link">Go to the catalog</a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
