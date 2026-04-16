import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PulseLogo } from '@/components/ui/PulseLogo'
import { useAuthStore } from '@/store/authStore'

type Tab = 'login' | 'register'

const preview = [
  { name: 'api.payments', pct: 99.98, status: 'up' },
  { name: 'api.auth',     pct: 100,   status: 'up' },
  { name: 'api.storage',  pct: 97.41, status: 'warn' },
  { name: 'api.notify',   pct: 99.81, status: 'up' },
]

export default function AuthPage() {
  const navigate = useNavigate()
  const { login, register } = useAuthStore()

  const [tab, setTab]         = useState<Tab>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'login') {
        await login(email, password)
      } else {
        await register(name, email, password)
      }
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message
      setError(Array.isArray(msg) ? msg[0] : (msg ?? 'Algo salio mal'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-root">

      {/* -- left: branding panel */}
      <div className="auth-left">
        <div className="auth-left-top">
          <PulseLogo size={32} />
          <span className="auth-wordmark">PULSE</span>
        </div>

        <div className="auth-left-body">
          <h1 className="auth-tagline">
            Tus APIs,<br />
            siempre bajo <span>control</span>
          </h1>
          <p className="auth-tagline-desc">
            Monitoreo de uptime en tiempo real. Alertas instantaneas.
            Metricas de latencia. Todo en un solo lugar.
          </p>

          <div style={{ marginTop: 36 }}>
            <div className="auth-preview">
              <div className="auth-preview-header">Estado actual</div>
              {preview.map(s => (
                <div key={s.name} className="auth-preview-row">
                  <span className="auth-preview-name">{s.name}</span>
                  <div className="auth-preview-bar">
                    <div
                      className={`auth-preview-bar-fill ${s.status === 'warn' ? 'warn' : ''}`}
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                  <span className="auth-preview-pct">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'var(--color-subtle)' }}>
          &copy; 2026 Pulse
        </div>

        {/* - signal arcs decoration */}
        <svg className="auth-arcs" width="320" height="320" viewBox="0 0 120 120" fill="none">
          <path d="M 30,68 A 22,22 0 0 1 52,90" stroke="#60519b" strokeWidth="3" strokeLinecap="round"/>
          <path d="M 30,50 A 40,40 0 0 1 70,90" stroke="#60519b" strokeWidth="2.2" strokeLinecap="round"/>
          <path d="M 30,30 A 60,60 0 0 1 90,90" stroke="#60519b" strokeWidth="1.6" strokeLinecap="round"/>
          <path d="M 30,10 A 80,80 0 0 1 110,90" stroke="#60519b" strokeWidth="1" strokeLinecap="round"/>
          <circle cx="30" cy="90" r="5" fill="#60519b"/>
        </svg>
      </div>

      {/* -- right: form panel */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <p className="auth-form-title">
            {tab === 'login' ? 'Bienvenido de vuelta' : 'Crear cuenta'}
          </p>
          <p className="auth-form-sub">
            {tab === 'login'
              ? 'Ingresa a tu workspace de monitoreo'
              : 'Empieza a monitorear tus APIs gratis'}
          </p>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${tab === 'login' ? 'auth-tab--active' : ''}`}
              onClick={() => { setTab('login'); setError('') }}
            >
              Ingresar
            </button>
            <button
              className={`auth-tab ${tab === 'register' ? 'auth-tab--active' : ''}`}
              onClick={() => { setTab('register'); setError('') }}
            >
              Registrarse
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {tab === 'register' && (
              <div className="auth-field">
                <label className="label">Nombre</label>
                <input className="input" placeholder="Tu nombre" value={name}
                  onChange={e => setName(e.target.value)} required />
              </div>
            )}

            <div className="auth-field">
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="tu@email.com" value={email}
                onChange={e => setEmail(e.target.value)} required />
            </div>

            <div className="auth-field">
              <label className="label">Password</label>
              <input className="input" type="password"
                placeholder={tab === 'register' ? 'Minimo 8 caracteres' : '••••••••'}
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'Cargando...' : tab === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </button>
          </form>

          <p className="auth-divider">
            {tab === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button
              onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError('') }}
              style={{ background: 'none', border: 'none', color: 'var(--color-purple-hi)', cursor: 'pointer', fontSize: 11 }}
            >
              {tab === 'login' ? 'Registrate' : 'Ingresa'}
            </button>
          </p>
        </div>
      </div>

    </div>
  )
}
