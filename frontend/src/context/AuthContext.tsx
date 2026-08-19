import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  AUTH_COMPANY_ID_KEY,
  AUTH_EMAIL_KEY,
  AUTH_ROLE_KEY,
  AUTH_TOKEN_KEY,
  AUTH_USER_ID_KEY,
} from "@/api/client"
import type { AuthResponse } from "@/types/api"

export interface AuthState {
  token: string | null
  userId: string | null
  companyId: string | null
  role: string | null
  email: string | null
}

export interface AuthContextValue extends AuthState {
  isAuthenticated: boolean
  login: (response: AuthResponse) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredAuth(): AuthState {
  return {
    token: localStorage.getItem(AUTH_TOKEN_KEY),
    userId: localStorage.getItem(AUTH_USER_ID_KEY),
    companyId: localStorage.getItem(AUTH_COMPANY_ID_KEY),
    role: localStorage.getItem(AUTH_ROLE_KEY),
    email: localStorage.getItem(AUTH_EMAIL_KEY),
  }
}

function clearStoredAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_ID_KEY)
  localStorage.removeItem(AUTH_COMPANY_ID_KEY)
  localStorage.removeItem(AUTH_ROLE_KEY)
  localStorage.removeItem(AUTH_EMAIL_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(readStoredAuth)

  const login = useCallback((response: AuthResponse) => {
    localStorage.setItem(AUTH_TOKEN_KEY, response.token)
    localStorage.setItem(AUTH_USER_ID_KEY, response.userId)
    localStorage.setItem(AUTH_COMPANY_ID_KEY, response.companyId)
    localStorage.setItem(AUTH_ROLE_KEY, response.role)
    if (response.email) {
      localStorage.setItem(AUTH_EMAIL_KEY, response.email)
    }

    setAuth({
      token: response.token,
      userId: response.userId,
      companyId: response.companyId,
      role: response.role,
      email: response.email || null,
    })
  }, [])

  const logout = useCallback(() => {
    clearStoredAuth()
    setAuth({
      token: null,
      userId: null,
      companyId: null,
      role: null,
      email: null,
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...auth,
      isAuthenticated: Boolean(auth.token),
      login,
      logout,
    }),
    [auth, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
