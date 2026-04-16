// mock data - will be replaced with real API calls
const STATS = [
  { label: 'Monitores activos', value: '8',     sub: '2 pausados' },
  { label: 'Uptime promedio',   value: '99.3%',  sub: 'ultimos 30d' },
  { label: 'Incidentes hoy',    value: '1',     sub: '3 esta semana', warn: true },
  { label: 'Latencia promedio', value: '142ms', sub: 'p95: 310ms' },
]

type Status = 'up' | 'down' | 'warn' | 'paused'

interface Monitor {
  id: string
  name: string
  url: string
  status: Status
  uptime: number
  latency: number
  latencyP95: number
  checks: ('up' | 'down' | 'warn')[]
  lastChecked: string
}

// - 90-check history (newest right)
function genChecks(uptime: number): ('up' | 'down' | 'warn')[] {
  return Array.from({ length: 90 }, (_, i) => {
    const r = Math.random()
    if (i > 80 && uptime < 99) return r < 0.06 ? 'down' : r < 0.1 ? 'warn' : 'up'
    return r < (1 - uptime / 100) * 0.6 ? 'down' : r < (1 - uptime / 100) ? 'warn' : 'up'
  })
}

const MONITORS: Monitor[] = [
  { id: '1', name: 'API Gateway',      url: 'api.example.com',           status: 'up',     uptime: 99.98, latency: 87,  latencyP95: 140, lastChecked: 'hace 28s',  checks: genChecks(99.98) },
  { id: '2', name: 'Auth Service',     url: 'auth.example.com/health',   status: 'up',     uptime: 100,   latency: 54,  latencyP95: 98,  lastChecked: 'hace 12s',  checks: genChecks(100) },
  { id: '3', name: 'Storage API',      url: 'storage.example.com',       status: 'warn',   uptime: 97.41, latency: 320, latencyP95: 890, lastChecked: 'hace 5s',   checks: genChecks(97.4) },
  { id: '4', name: 'Payments',         url: 'pay.example.com/v2/status', status: 'down',   uptime: 91.20, latency: 0,   latencyP95: 0,   lastChecked: 'hace 2m',   checks: genChecks(91.2) },
  { id: '5', name: 'Notifications',    url: 'notify.example.com',        status: 'up',     uptime: 99.81, latency: 112, latencyP95: 198, lastChecked: 'hace 44s',  checks: genChecks(99.81) },
  { id: '6', name: 'Search Service',   url: 'search.example.com/ping',   status: 'up',     uptime: 99.65, latency: 203, latencyP95: 410, lastChecked: 'hace 19s',  checks: genChecks(99.65) },
  { id: '7', name: 'CDN Edge',         url: 'cdn.example.com/__health',  status: 'up',     uptime: 99.99, latency: 18,  latencyP95: 31,  lastChecked: 'hace 6s',   checks: genChecks(99.99) },
  { id: '8', name: 'Analytics',        url: 'analytics.example.com',     status: 'paused', uptime: 98.10, latency: 0,   latencyP95: 0,   lastChecked: 'pausado',   checks: genChecks(98.1) },
]

const statusLabel: Record<Status, string> = {
  up: 'Operativo', down: 'Caido', warn: 'Degradado', paused: 'Pausado',
}

export default function MonitorsPage() {
  const upCount   = MONITORS.filter(m => m.status === 'up').length
  const downCount = MONITORS.filter(m => m.status === 'down').length

  return (
    <div className="monitors-page">

      {/* -- page header */}
      <div className="monitors-header">
        <div className="monitors-header-left">
          <div className="monitors-title-row">
            <h1 className="page-title">Monitores</h1>
            <div className={`overall-badge ${downCount > 0 ? 'overall-badge--down' : 'overall-badge--up'}`}>
              <span className={`dot dot-${downCount > 0 ? 'down' : 'up'}`} />
              {downCount > 0 ? `${downCount} caido${downCount > 1 ? 's' : ''}` : 'Todos operativos'}
            </div>
          </div>
          <p className="page-desc">{MONITORS.length} endpoints — actualizado cada 30s</p>
        </div>
        <button className="btn btn-primary">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo monitor
        </button>
      </div>

      {/* -- stats strip */}
      <div className="stats-strip">
        {STATS.map(s => (
          <div key={s.label} className={`stat-item ${s.warn ? 'stat-item--warn' : ''}`}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* -- monitor list */}
      <div className="monitor-list">
        {/* header row */}
        <div className="monitor-list-header">
          <span>Servicio</span>
          <span className="col-checks">Ultimos 90 checks</span>
          <span className="col-latency">Latencia</span>
          <span className="col-uptime">Uptime 30d</span>
          <span className="col-status">Estado</span>
        </div>

        {MONITORS.map(m => (
          <MonitorRow key={m.id} monitor={m} />
        ))}
      </div>

    </div>
  )
}

function MonitorRow({ monitor: m }: { monitor: Monitor }) {
  return (
    <div className={`monitor-row monitor-row--${m.status}`}>
      {/* name + url */}
      <div className="monitor-name-col">
        <span className={`dot dot-${m.status}`} />
        <div>
          <div className="monitor-name">{m.name}</div>
          <div className="monitor-url">{m.url}</div>
        </div>
      </div>

      {/* 90-check sparkbar */}
      <div className="col-checks">
        <div className="sparkbar">
          {m.checks.map((c, i) => (
            <div key={i} className={`spark spark--${c}`} />
          ))}
        </div>
        <span className="spark-label">{m.lastChecked}</span>
      </div>

      {/* latency */}
      <div className="col-latency">
        {m.status === 'down' || m.status === 'paused' ? (
          <span className="latency-na">—</span>
        ) : (
          <>
            <span className={`latency-val ${m.latency > 250 ? 'latency-warn' : ''}`}>
              {m.latency}ms
            </span>
            <span className="latency-p95">p95 {m.latencyP95}ms</span>
          </>
        )}
      </div>

      {/* uptime */}
      <div className="col-uptime">
        <span className={`uptime-val ${m.uptime < 99 ? 'uptime-warn' : ''} ${m.uptime < 95 ? 'uptime-down' : ''}`}>
          {m.uptime.toFixed(2)}%
        </span>
      </div>

      {/* status badge */}
      <div className="col-status">
        <span className={`badge badge-${m.status}`}>
          {statusLabel[m.status]}
        </span>
      </div>
    </div>
  )
}
