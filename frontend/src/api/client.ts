import axios from "axios"

export const AUTH_TOKEN_KEY = "auth_token"
export const AUTH_USER_ID_KEY = "auth_userId"
export const AUTH_COMPANY_ID_KEY = "auth_companyId"
export const AUTH_ROLE_KEY = "auth_role"
export const AUTH_EMAIL_KEY = "auth_email"

// Use relative /api/v1 so Vite dev-server proxy handles it without CORS issues,
// or fallback to custom environment variable if specified.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "/api/v1"

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname
      if (currentPath !== "/login" && currentPath !== "/register") {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(AUTH_USER_ID_KEY)
        localStorage.removeItem(AUTH_COMPANY_ID_KEY)
        localStorage.removeItem(AUTH_ROLE_KEY)
        localStorage.removeItem(AUTH_EMAIL_KEY)
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient
