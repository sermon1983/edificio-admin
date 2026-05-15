import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
    this.setState({ info })
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          textAlign: 'center',
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={26} color="#EF4444" />
          </div>
          <div>
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
              Error al renderizar
            </p>
            <p style={{ color: '#EF4444', fontFamily: 'var(--font-mono)', fontSize: 12.5, background: 'rgba(239,68,68,0.08)', padding: '10px 16px', borderRadius: 8, maxWidth: 600, wordBreak: 'break-word' }}>
              {this.state.error?.message || String(this.state.error)}
            </p>
            {this.state.info?.componentStack && (
              <details style={{ marginTop: 12, textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12 }}>Ver stack trace</summary>
                <pre style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8, overflow: 'auto', maxHeight: 200 }}>
                  {this.state.info.componentStack}
                </pre>
              </details>
            )}
          </div>
          <button
            onClick={() => { this.setState({ error: null, info: null }); window.location.reload() }}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'var(--bg-elevated)', border: '1px solid var(--border-main)', borderRadius: 8, color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13 }}
          >
            <RefreshCw size={14} /> Recargar página
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
