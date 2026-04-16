import api from '../lib/api'

export type MonitorStatus = 'PENDING' | 'UP' | 'DOWN' | 'DEGRADED'
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD'

export interface Monitor {
  _id: string
  name: string
  url: string
  method: HttpMethod
  intervalSecs: number
  timeoutMs: number
  active: boolean
  status: MonitorStatus
  lastCheckedAt: string | null
  nextCheckAt: string
  createdAt: string
}

export interface CreateMonitorPayload {
  name: string
  url: string
  method?: HttpMethod
  intervalSecs?: number
  timeoutMs?: number
}

export const monitorsService = {
  list: () =>
    api.get<Monitor[]>('/monitors').then(r => r.data),

  create: (payload: CreateMonitorPayload) =>
    api.post<Monitor>('/monitors', payload).then(r => r.data),

  toggle: (id: string) =>
    api.patch<Monitor>(`/monitors/${id}/toggle`).then(r => r.data),

  remove: (id: string) =>
    api.delete(`/monitors/${id}`),
}
