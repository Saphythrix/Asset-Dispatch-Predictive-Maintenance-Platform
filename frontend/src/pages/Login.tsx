import axios from "axios"
import { useState, type FormEvent } from "react"
import { Navigate, useNavigate, Link } from "react-router-dom"
import { AlertCircle, ArrowRight, Layers, Lock, Mail } from "lucide-react"

import { apiClient } from "@/api/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import type { AuthResponse } from "@/types/api"

export default function Login() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/assets" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { data } = await apiClient.post<AuthResponse>("/auth/login", {
        email: email.trim(),
        password,
      })
      login(data)
      navigate("/assets")
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          (err.response?.data as { message?: string } | undefined)?.message ??
          (err.response?.status === 401
            ? "Invalid email or password. Please verify your credentials."
            : "Authentication failed. Please check your backend connection.")
        setError(message)
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-zinc-950 p-4 text-zinc-100 selection:bg-amber-400 selection:text-zinc-950">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/15 text-amber-400 font-bold shadow-lg shadow-amber-500/10">
          <Layers className="size-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-zinc-100">
            Apex<span className="text-amber-400">Fleet</span>
          </span>
          <span className="text-xs text-zinc-400">
            Equipment Logistics & Predictive Platform
          </span>
        </div>
      </div>

      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/90 text-zinc-100 shadow-2xl backdrop-blur">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Sign in</CardTitle>
          <CardDescription className="text-zinc-400 text-sm">
            Enter your credentials to access the fleet dispatch & maintenance system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {error ? (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-destructive/50 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
              >
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-zinc-200">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 size-4 text-zinc-500" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="operator@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  disabled={isLoading}
                  className="border-zinc-800 bg-zinc-950 pl-9 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-400"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-zinc-200">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 size-4 text-zinc-500" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={isLoading}
                  className="border-zinc-800 bg-zinc-950 pl-9 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-400"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full bg-amber-400 text-zinc-950 font-bold hover:bg-amber-300 shadow-md shadow-amber-500/20"
            >
              {isLoading ? (
                "Authenticating…"
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign in <ArrowRight className="size-4" />
                </span>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t border-zinc-800/80 pt-4 text-sm text-zinc-400">
          Need an account?{" "}
          <Link
            to="/register"
            className="ml-1.5 font-medium text-amber-400 underline-offset-4 hover:underline"
          >
            Register company
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
