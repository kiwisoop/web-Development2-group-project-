import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
    this.setState({ info });
  }

  render() {
    if (!this.state.error) return this.props.children;

    const message = String(this.state.error?.message || this.state.error);
    const stack = `${this.state.error?.stack || ''}\n${this.state.info?.componentStack || ''}`.trim();

    return (
      <main className="app-error-boundary" role="alert">
        <section className="app-error-panel">
          <p className="eyebrow">Application Error</p>
          <h1>화면을 불러오지 못했습니다.</h1>
          <p>{message}</p>
          {import.meta.env.DEV && stack && <pre>{stack}</pre>}
          <button type="button" onClick={() => window.location.reload()}>
            새로고침
          </button>
        </section>
      </main>
    );
  }
}
