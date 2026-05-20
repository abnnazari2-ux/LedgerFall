import axios from 'axios'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: attach auth token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ledgerfall_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ledgerfall_token')
      localStorage.removeItem('ledgerfall_user')
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

export default axiosClient
