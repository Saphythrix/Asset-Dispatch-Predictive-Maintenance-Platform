import { Navigate, Route, Routes } from "react-router-dom"

import { ProtectedRoute } from "@/components/ProtectedRoute"
import AppLayout from "@/components/layout/AppLayout"
import { useAuth } from "@/context/AuthContext"
import BookingEngine from "@/pages/BookingEngine"
import ClientDashboard from "@/pages/ClientDashboard"
import FleetCatalog from "@/pages/FleetCatalog"
import Login from "@/pages/Login"
import MaintenanceHub from "@/pages/MaintenanceHub"
import Register from "@/pages/Register"

function RoleRedirect() {
  const { role } = useAuth()
  if (role === "ROLE_CLIENT") {
    return <Navigate to="/client-portal" replace />
  }
  return <Navigate to="/assets" replace />
}

function App() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Dashboard Routes wrapped inside AppLayout shell */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/client-portal" element={<ClientDashboard />} />
        <Route path="/assets" element={<FleetCatalog />} />
        <Route path="/bookings" element={<BookingEngine />} />
        <Route path="/work-orders" element={<MaintenanceHub />} />
        <Route path="/maintenance" element={<Navigate to="/work-orders" replace />} />
        <Route path="/" element={<RoleRedirect />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  )
}

export default App
