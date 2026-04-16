import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// - attach access token to every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('accessToken')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export default api
