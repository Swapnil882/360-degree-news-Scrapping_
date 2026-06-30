import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000, // 20 seconds timeout to prevent indefinite hangs
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Don't redirect on auth endpoints — let login/register handle their own errors
      const requestUrl = err.config?.url || ''
      const isAuthEndpoint = requestUrl.includes('/auth/')

      // Don't redirect if we're already on the login or register page
      const currentPath = window.location.pathname
      const isOnAuthPage = currentPath === '/login' || currentPath === '/register'

      if (!isAuthEndpoint && !isOnAuthPage) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: (config) => api.get('/auth/me', config),
  updateMe: (data) => api.put('/auth/me', data),
}

export const scraperAPI = {
  scrape: (url) => api.post('/scraper/scrape', { url }),
  history: () => api.get('/scraper/history'),
  exports: () => api.get('/scraper/exports'),
  exportContent: (filename) => api.get(`/scraper/exports/${filename}`),
  deleteExport: (filename) => api.delete(`/scraper/exports/${filename}`),
}

export const sourcesAPI = {
  list: () => api.get('/sources/'),
  create: (data) => api.post('/sources/', data),
  update: (id, data) => api.put(`/sources/${id}`, data),
  delete: (id) => api.delete(`/sources/${id}`),
  scrapeSource: (id) => api.post(`/sources/${id}/scrape`),
}

export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats'),
  trends: () => api.get('/dashboard/trends'),
}

export const usersAPI = {
  list: () => api.get('/users/'),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}

export const alertsAPI = {
  list: () => api.get('/alerts/'),
  get: (id) => api.get(`/alerts/${id}`),
  update: (id, data) => api.put(`/alerts/${id}`, data),
}

export default api
