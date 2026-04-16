import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from '@/pages/auth/AuthPage'
import DashboardLayout from '@/pages/dashboard/DashboardLayout'
import MonitorsPage from '@/pages/dashboard/MonitorsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="monitors" replace />} />
          <Route path="monitors" element={<MonitorsPage />} />
          <Route path="alerts"   element={<Placeholder title="Alertas" />} />
          <Route path="settings" element={<Placeholder title="Settings" />} />
        </Route>
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">{title}</h1>
      </div>
      <div className="empty-state card">
        <p className="empty-text">Proximamente</p>
      </div>
    </div>
  )
}
