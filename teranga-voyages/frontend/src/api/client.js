import axios from 'axios'

/**
 * Client HTTP unique pour toute l'application.
 * - baseURL : /api (même domaine grâce à Nginx ou au proxy Vite)
 *   ou VITE_API_URL si l'API est hébergée sur un autre domaine.
 * - Ajoute automatiquement le jeton d'authentification.
 */
export const TOKEN_KEY = 'teranga_token'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY)
      window.dispatchEvent(new Event('auth:logout'))
    }
    return Promise.reject(error)
  },
)

/** Extrait un message lisible d'une erreur Axios/Laravel. */
export function errorMessage(error, fallback = 'Une erreur est survenue. Réessayez.') {
  const data = error?.response?.data
  if (data?.errors) {
    const first = Object.values(data.errors)[0]
    if (Array.isArray(first) && first[0]) return first[0]
  }
  return data?.message || fallback
}

/** Retourne les erreurs de validation { champ: message }. */
export function fieldErrors(error) {
  const errors = error?.response?.data?.errors || {}
  return Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]))
}

export default api
