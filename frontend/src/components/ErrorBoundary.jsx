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
    if (this.state.error) {
      return (
        <div style={{
          padding: 32,
          margin: 24,
          background: 'rgba(255, 71, 111, 0.1)',
          border: '1px solid rgba(255, 71, 111, 0.4)',
          borderRadius: 16,
          color: '#fff',
          fontFamily: 'monospace',
          maxWidth: 900,
        }}>
          <h2 style={{ color: '#ff8aa3', marginBottom: 12 }}>⚠ 런타임 오류</h2>
          <p style={{ marginBottom: 12, fontSize: 14, lineHeight: 1.5 }}>
            {String(this.state.error?.message || this.state.error)}
          </p>
          <pre style={{
            background: 'rgba(0,0,0,0.4)',
            padding: 16,
            borderRadius: 8,
            fontSize: 11,
            overflow: 'auto',
            maxHeight: 320,
            color: '#b6ff3a',
            lineHeight: 1.5,
          }}>
            {this.state.error?.stack || ''}
            {this.state.info?.componentStack || ''}
          </pre>
          <button
            onClick={() => this.setState({ error: null, info: null })}
            style={{
              marginTop: 16,
              padding: '10px 20px',
              background: 'linear-gradient(135deg,#7c5cff,#18d6ff)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >다시 시도</button>
        </div>
      );
    }
    return this.props.children;
  }
}
