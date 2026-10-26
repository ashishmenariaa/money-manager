import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// One refresh at a time: concurrent 401s wait for the same refresh call
let refreshPromise = null

function refreshSession() {
  const { refreshToken, setSession } = useAuthStore.getState()
  if (!refreshToken) return Promise.reject(new Error('No refresh token'))

  refreshPromise ??= axios
    .post('/api/auth/refresh', { refreshToken })
    .then(({ data }) => {
      setSession(data.data)
      return data.data.accessToken
    })
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

const isAuthCall = (url = '') => url.startsWith('/auth/')

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && original && !original._retried && !isAuthCall(original.url)) {
      original._retried = true
      try {
        const accessToken = await refreshSession()
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch {
        useAuthStore.getState().clearSession()
        toast.error('Your session has expired. Please sign in again.')
        return Promise.reject(error)
      }
    }

    const message = error.response?.data?.message || 'Something went wrong'
    toast.error(message)
    return Promise.reject(error)
  }
)

export default api
