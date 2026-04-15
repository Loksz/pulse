import { useState, useEffect } from 'react'

interface HealthResponse {
  status: string
  app: string
  version: string
  environment: string
  timestamp: string
}

type ConnectionState = 'idle' | 'loading' | 'connected' | 'error'

export default function App() {
  const [state, setState] = useState<ConnectionState>('idle')
  const [data, setData] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function ping() {
    setState('loading')
    setError(null)
    try {
      const res = await fetch('/api/health')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: HealthResponse = await res.json()
      setData(json)
      setState('connected')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setState('error')
    }
  }

  useEffect(() => {
    ping()
  }, [])

  return (
    <div style={styles.root}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="15" stroke="#8b5cf6" strokeWidth="2" />
              <path
                d="M6 16 Q10 8 14 16 Q18 24 22 16 Q26 8 28 12"
                stroke="#8b5cf6"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
          <div>
            <h1 style={styles.title}>PULSE</h1>
            <p style={styles.subtitle}>API Status Monitor</p>
          </div>
        </div>

        {/* Status badge */}
        <div style={styles.statusRow}>
          <span style={{ ...styles.badge, ...badgeColor[state] }}>
            <span style={{ ...styles.dot, background: dotColor[state] }} />
            {stateLabel[state]}
          </span>
          <button onClick={ping} style={styles.button} disabled={state === 'loading'}>
            {state === 'loading' ? 'Conectando...' : 'Ping'}
          </button>
        </div>

        {/* Response */}
        {state === 'connected' && data && (
          <div style={styles.responseBox}>
            <p style={styles.fieldLabel}>Respuesta de <code style={styles.code}>GET /api/health</code></p>
            <div style={styles.fields}>
              <Field label="app" value={data.app} />
              <Field label="version" value={data.version} />
              <Field label="status" value={data.status} highlight />
              <Field label="environment" value={data.environment} />
              <Field label="timestamp" value={new Date(data.timestamp).toLocaleString()} />
            </div>
          </div>
        )}

        {state === 'error' && (
          <div style={styles.errorBox}>
            <p style={styles.errorText}>No se pudo conectar con la API</p>
            <p style={styles.errorDetail}>{error}</p>
            <p style={styles.errorHint}>Asegúrate de que el backend esté corriendo en <code style={styles.code}>http://localhost:3000</code></p>
          </div>
        )}

        {state === 'idle' && (
          <p style={styles.hint}>Presiona Ping para verificar la conexión</p>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={styles.field}>
      <span style={styles.fieldKey}>{label}</span>
      <span style={{ ...styles.fieldValue, ...(highlight ? styles.fieldHighlight : {}) }}>{value}</span>
    </div>
  )
}

const stateLabel: Record<ConnectionState, string> = {
  idle: 'Sin conectar',
  loading: 'Conectando...',
  connected: 'Conectado',
  error: 'Sin conexión',
}

const badgeColor: Record<ConnectionState, React.CSSProperties> = {
  idle: { background: '#f1f0f5', color: '#6b6375' },
  loading: { background: '#ede9fe', color: '#7c3aed' },
  connected: { background: '#d1fae5', color: '#065f46' },
  error: { background: '#fee2e2', color: '#991b1b' },
}

const dotColor: Record<ConnectionState, string> = {
  idle: '#9ca3af',
  loading: '#8b5cf6',
  connected: '#10b981',
  error: '#ef4444',
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: '#0f0d14',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "system-ui, 'Segoe UI', sans-serif",
    padding: '24px',
  },
  card: {
    background: '#1a1625',
    border: '1px solid #2d2640',
    borderRadius: '16px',
    padding: '32px',
    width: '100%',
    maxWidth: '460px',
    boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '28px',
  },
  logo: {
    width: '48px',
    height: '48px',
    background: '#2d2640',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 700,
    color: '#f0edf8',
    letterSpacing: '3px',
  },
  subtitle: {
    margin: '2px 0 0',
    fontSize: '13px',
    color: '#6b6375',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '6px 12px',
    borderRadius: '99px',
    fontSize: '13px',
    fontWeight: 500,
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  button: {
    background: '#8b5cf6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 18px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  responseBox: {
    background: '#130f1e',
    border: '1px solid #2d2640',
    borderRadius: '10px',
    padding: '16px',
  },
  fieldLabel: {
    margin: '0 0 12px',
    fontSize: '12px',
    color: '#6b6375',
  },
  code: {
    fontFamily: 'ui-monospace, Consolas, monospace',
    fontSize: '12px',
    color: '#a78bfa',
  },
  fields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  field: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
  },
  fieldKey: {
    color: '#6b6375',
    fontFamily: 'ui-monospace, Consolas, monospace',
    fontSize: '13px',
  },
  fieldValue: {
    color: '#d4cfe3',
    fontWeight: 500,
  },
  fieldHighlight: {
    color: '#10b981',
  },
  errorBox: {
    background: '#130f1e',
    border: '1px solid #3d1a1a',
    borderRadius: '10px',
    padding: '16px',
  },
  errorText: {
    margin: '0 0 6px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#f87171',
  },
  errorDetail: {
    margin: '0 0 8px',
    fontSize: '13px',
    color: '#9ca3af',
    fontFamily: 'ui-monospace, Consolas, monospace',
  },
  errorHint: {
    margin: 0,
    fontSize: '12px',
    color: '#6b6375',
  },
  hint: {
    margin: 0,
    fontSize: '13px',
    color: '#6b6375',
    textAlign: 'center',
  },
}
