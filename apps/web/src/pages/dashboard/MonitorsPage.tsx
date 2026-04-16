import { useEffect, useState } from 'react'
import { monitorsService, type Monitor, type CreateMonitorPayload, type HttpMethod } from '../../services/monitorsService'

// - map backend status + active flag to display status
type DisplayStatus = 'up' | 'down' | 'warn' | 'paused' | 'pending'

function toDisplay(m: Monitor): DisplayStatus {
  if (!m.active) return 'paused'
  switch (m.status) {
    case 'UP':       return 'up'
    case 'DOWN':     return 'down'
    case 'DEGRADED': return 'warn'
    default:         return 'pending'
  }
}

const statusLabel: Record<DisplayStatus, string> = {
  up: 'Operativo', down: 'Caido', warn: 'Degradado', paused: 'Pausado', pending: 'Pendiente',
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'nunca'
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (secs < 60)  return `hace ${secs}s`
  if (secs < 3600) return `hace ${Math.floor(secs / 60)}m`
  return `hace ${Math.floor(secs / 3600)}h`
}

// ---------------------------------------------------------------------------

export default function MonitorsPage() {
  const [monitors, setMonitors]     = useState<Monitor[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [showModal, setShowModal]   = useState(false)

  const load = () => {
    setLoading(true)
    monitorsService.list()
      .then(data => { setMonitors(data); setError(null) })
      .catch(() => setError('No se pudieron cargar los monitores'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (id: string) => {
    const updated = await monitorsService.toggle(id)
    setMonitors(prev => prev.map(m => m._id === id ? updated : m))
  }

  const handleRemove = async (id: string) => {
    await monitorsService.remove(id)
    setMonitors(prev => prev.filter(m => m._id !== id))
  }

  const handleCreated = (m: Monitor) => {
    setMonitors(prev => [m, ...prev])
    setShowModal(false)
  }

  // - stats derived from real data
  const active  = monitors.filter(m => m.active).length
  const paused  = monitors.filter(m => !m.active).length
  const down    = monitors.filter(m => m.active && m.status === 'DOWN').length

  const STATS = [
    { label: 'Monitores activos', value: String(active),  sub: `${paused} pausados` },
    { label: 'Caidos ahora',      value: String(down),    sub: 'endpoints down', warn: down > 0 },
    { label: 'Total',             value: String(monitors.length), sub: 'endpoints configurados' },
    { label: 'Pendientes',        value: String(monitors.filter(m => m.active && m.status === 'PENDING').length), sub: 'sin primer check' },
  ]

  return (
    <div className="monitors-page">

      {/* -- page header */}
      <div className="monitors-header">
        <div className="monitors-header-left">
          <div className="monitors-title-row">
            <h1 className="page-title">Monitores</h1>
            {!loading && (
              <div className={`overall-badge ${down > 0 ? 'overall-badge--down' : 'overall-badge--up'}`}>
                <span className={`dot dot-${down > 0 ? 'down' : 'up'}`} />
                {down > 0 ? `${down} caido${down > 1 ? 's' : ''}` : 'Todos operativos'}
              </div>
            )}
          </div>
          <p className="page-desc">{monitors.length} endpoint{monitors.length !== 1 ? 's' : ''} configurados</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
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
      {loading ? (
        <div className="monitors-loading">Cargando monitores...</div>
      ) : error ? (
        <div className="monitors-error">{error} <button onClick={load}>Reintentar</button></div>
      ) : monitors.length === 0 ? (
        <div className="monitors-empty">
          <p>No tienes monitores aun.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Crear el primero</button>
        </div>
      ) : (
        <div className="monitor-list">
          <div className="monitor-list-header">
            <span>Servicio</span>
            <span className="col-interval">Intervalo</span>
            <span className="col-latency">Ultimo check</span>
            <span className="col-status">Estado</span>
            <span className="col-actions" />
          </div>
          {monitors.map(m => (
            <MonitorRow
              key={m._id}
              monitor={m}
              onToggle={handleToggle}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {/* -- create modal */}
      {showModal && (
        <CreateMonitorModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function MonitorRow({
  monitor: m,
  onToggle,
  onRemove,
}: {
  monitor: Monitor
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}) {
  const display = toDisplay(m)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className={`monitor-row monitor-row--${display}`}>
      {/* name + url */}
      <div className="monitor-name-col">
        <span className={`dot dot-${display}`} />
        <div>
          <div className="monitor-name">{m.name}</div>
          <div className="monitor-url">{m.url}</div>
        </div>
      </div>

      {/* interval */}
      <div className="col-interval">
        <span className="interval-val">
          {m.intervalSecs < 60 ? `${m.intervalSecs}s` : `${m.intervalSecs / 60}m`}
        </span>
        <span className="interval-method">{m.method}</span>
      </div>

      {/* last checked */}
      <div className="col-latency">
        <span className="latency-val">{timeAgo(m.lastCheckedAt)}</span>
      </div>

      {/* status badge */}
      <div className="col-status">
        <span className={`badge badge-${display}`}>{statusLabel[display]}</span>
      </div>

      {/* actions */}
      <div className="col-actions">
        <button
          className={`row-action ${m.active ? 'row-action--pause' : 'row-action--resume'}`}
          title={m.active ? 'Pausar' : 'Reanudar'}
          onClick={() => onToggle(m._id)}
        >
          {m.active ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          )}
        </button>
        {confirmDelete ? (
          <>
            <button className="row-action row-action--confirm" onClick={() => onRemove(m._id)}>Confirmar</button>
            <button className="row-action" onClick={() => setConfirmDelete(false)}>Cancelar</button>
          </>
        ) : (
          <button className="row-action row-action--delete" title="Eliminar" onClick={() => setConfirmDelete(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14H6L5,6"/><path d="M10,11v6"/><path d="M14,11v6"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD']

function CreateMonitorModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (m: Monitor) => void
}) {
  const [form, setForm] = useState<CreateMonitorPayload>({
    name: '',
    url: '',
    method: 'GET',
    intervalSecs: 60,
  })
  const [error, setError]     = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)

  const set = (k: keyof CreateMonitorPayload, v: string | number) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.url.trim()) {
      setError('Nombre y URL son requeridos')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const created = await monitorsService.create(form)
      onCreated(created)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al crear el monitor'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Nuevo monitor</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Nombre</label>
            <input
              type="text"
              placeholder="Nombre del servicio"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-field">
            <label>URL</label>
            <input
              type="text"
              placeholder="https://tu-dominio.com/health"
              value={form.url}
              onChange={e => set('url', e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Metodo</label>
              <select value={form.method} onChange={e => set('method', e.target.value as HttpMethod)}>
                {METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Intervalo (seg)</label>
              <input
                type="number"
                min={30}
                max={86400}
                value={form.intervalSecs}
                onChange={e => set('intervalSecs', Number(e.target.value))}
              />
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creando...' : 'Crear monitor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
