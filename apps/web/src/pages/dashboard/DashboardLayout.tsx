import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { PulseLogo } from '@/components/ui/PulseLogo'
import { useAuthStore } from '@/store/authStore'

const navItems = [
  { to: '/dashboard/monitors', label: 'Monitores' },
  { to: '/dashboard/alerts',   label: 'Alertas'   },
  { to: '/dashboard/settings', label: 'Settings'  },
]

// mock - will come from global status store
const GLOBAL_STATUS = { ok: false, down: 1, total: 8 }

export default function DashboardLayout() {
  const navigate = useNavigate()
  const { user, loading, logout } = useAuthStore()
  const [menuOpen, setMenuOpen]   = useState(false)
  const [bellOpen, setBellOpen]   = useState(false)
  const bellRef                   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading && !user) navigate('/auth')
  }, [loading, user])

  if (loading) return <div className="dash-loading"><PulseLogo size={28} /></div>

  async function handleLogout() {
    await logout()
    navigate('/auth')
  }

  return (
    <div className="dash-root">

      {/* -- top header */}
      <header className="topnav">
        <div className="topnav-left">
          <NavLink to="/dashboard/monitors" className="topnav-brand">
            <PulseLogo size={26} />
            <span className="topnav-wordmark">PULSE</span>
          </NavLink>
        </div>

        {/* - desktop center nav */}
        <nav className="topnav-center">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `topnav-link ${isActive ? 'topnav-link--active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="topnav-right">
          {/* - bell */}
          <div className="bell-wrap" ref={bellRef}>
            <button
              className={`bell-btn ${!GLOBAL_STATUS.ok ? 'bell-btn--alert' : ''}`}
              onClick={() => setBellOpen(o => !o)}
              title="Alertas"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {!GLOBAL_STATUS.ok && <span className="bell-badge">{GLOBAL_STATUS.down}</span>}
            </button>

            {bellOpen && (
              <>
                <div className="bell-overlay" onClick={() => setBellOpen(false)} />
                <div className="bell-dropdown">
                  <div className="bell-dropdown-header">
                    <span className="bell-dropdown-title">Incidentes activos</span>
                    <span className="bell-dropdown-count">{GLOBAL_STATUS.down}</span>
                  </div>
                  <div className="bell-incident">
                    <div className="bell-incident-top">
                      <span className="dot dot-down" />
                      <span className="bell-incident-name">Payments</span>
                      <span className="bell-incident-time">hace 2m</span>
                    </div>
                    <p className="bell-incident-desc">
                      El endpoint no responde. Ultimo check: timeout a los 30s.
                    </p>
                    <div className="bell-incident-meta">
                      <span>pay.example.com/v2/status</span>
                    </div>
                  </div>
                  {GLOBAL_STATUS.ok && (
                    <div className="bell-empty">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      </svg>
                      Sin incidentes activos
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* - user menu */}
          <div className="user-menu-wrap">
            <button className="user-chip" onClick={() => setMenuOpen(o => !o)}>
              <span className="user-chip-avatar">
                {user?.name?.[0]?.toUpperCase()}
              </span>
              <span className="user-chip-name">{user?.name}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {menuOpen && (
              <>
                <div className="user-menu-overlay" onClick={() => setMenuOpen(false)} />
                <div className="user-menu">
                  <div className="user-menu-info">
                    <div className="user-menu-name">{user?.name}</div>
                    <div className="user-menu-email">{user?.email}</div>
                  </div>
                  <div className="user-menu-divider" />
                  <button className="user-menu-item user-menu-item--danger" onClick={handleLogout}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Cerrar sesion
                  </button>
                </div>
              </>
            )}
          </div>

          {/* - mobile hamburger */}
          <button className="topnav-hamburger" onClick={() => setMenuOpen(o => !o)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6"  x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </header>

      {/* - mobile nav drawer */}
      {menuOpen && (
        <div className="mobile-drawer">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `mobile-drawer-link ${isActive ? 'mobile-drawer-link--active' : ''}`
              }
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}
          <div className="mobile-drawer-divider" />
          <button className="mobile-drawer-logout" onClick={handleLogout}>
            Cerrar sesion
          </button>
        </div>
      )}

      {/* -- main content */}
      <main className="dash-main">
        <Outlet />
      </main>

    </div>
  )
}
