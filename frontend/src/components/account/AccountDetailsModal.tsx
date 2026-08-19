import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Activity,
  Building2,
  CreditCard,
  FileText,
  LogOut,
  RefreshCw,
  Shield,
  TrendingUp,
  User,
} from "lucide-react"

import { apiClient } from "@/api/client"
import { EquipmentIcon } from "@/components/icons/EquipmentIcon"
import { InvoiceModal } from "@/components/invoice/InvoiceModal"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"
import type { Asset, Booking, WorkOrder } from "@/types/api"

interface AccountDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDate(value?: string) {
  if (!value) return "N/A"
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value))
  } catch {
    return value
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount)
}

export function AccountDetailsModal({
  open,
  onOpenChange,
}: AccountDetailsModalProps) {
  const { email, role, companyId, userId, logout } = useAuth()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Invoice Submodal
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null)

  const isClient = role === "ROLE_CLIENT"
  const isManager = role === "ROLE_FLEET_MANAGER"
  const isTech = role === "ROLE_TECHNICIAN"

  const fetchData = useCallback(async () => {
    if (!open) return
    setIsLoading(true)
    try {
      // 1. Fetch Assets
      try {
        const { data: assetData } = await apiClient.get<Asset[]>("/assets")
        setAssets(assetData || [])
      } catch {}

      // 2. Fetch Bookings
      try {
        const endpoint =
          isClient && companyId
            ? `/bookings/company/${companyId}`
            : "/bookings"
        const { data: bookingData } = await apiClient.get<Booking[]>(endpoint)
        setBookings(bookingData || [])
      } catch {}

      // 3. Fetch Work Orders
      try {
        const { data: woData } = await apiClient.get<WorkOrder[]>("/work-orders")
        setWorkOrders(woData || [])
      } catch {}
    } finally {
      setIsLoading(false)
    }
  }, [open, isClient, companyId])

  useEffect(() => {
    if (open) {
      void fetchData()
    }
  }, [open, fetchData])

  const assetMap = useMemo(() => {
    return new Map(assets.map((a) => [a.id, a]))
  }, [assets])

  // Analytics for Client
  const clientStats = useMemo(() => {
    let totalSpent = 0
    let baseSpent = 0
    let overtimeSpent = 0
    let totalHours = 0
    let confirmedCount = 0
    let pendingCount = 0

    for (const b of bookings) {
      const bTotal = b.totalCost || b.baseCost || 0
      const bBase = b.baseCost || 0
      const bOt = b.overtimeCost || 0
      totalSpent += bTotal
      baseSpent += bBase
      overtimeSpent += bOt

      const start = new Date(b.slotStart).getTime()
      const end = new Date(b.slotEnd).getTime()
      const hrs = !isNaN(start) && !isNaN(end) && end > start ? (end - start) / (1000 * 60 * 60) : 0
      totalHours += b.actualHoursUsed || hrs

      if (b.status === "CONFIRMED") confirmedCount++
      if (b.status === "PENDING") pendingCount++
    }

    return {
      totalSpent,
      baseSpent,
      overtimeSpent,
      totalHours: Math.round(totalHours * 10) / 10,
      totalBookings: bookings.length,
      confirmedCount,
      pendingCount,
    }
  }, [bookings])

  // Analytics for Fleet Manager
  const managerStats = useMemo(() => {
    let totalRevenue = 0
    let overtimeRevenue = 0
    let totalBookedHours = 0

    for (const b of bookings) {
      totalRevenue += b.totalCost || b.baseCost || 0
      overtimeRevenue += b.overtimeCost || 0
      totalBookedHours += b.actualHoursUsed || 0
    }

    const availableAssets = assets.filter((a) => a.status === "AVAILABLE").length
    const reservedAssets = assets.filter((a) => a.status === "RESERVED").length
    const inMaintenanceAssets = assets.filter((a) => a.status === "IN_MAINTENANCE").length

    return {
      totalRevenue,
      overtimeRevenue,
      totalBookedHours: Math.round(totalBookedHours * 10) / 10,
      totalAssets: assets.length,
      availableAssets,
      reservedAssets,
      inMaintenanceAssets,
      totalBookings: bookings.length,
      activeWorkOrders: workOrders.filter((w) => w.state !== "COMPLETED" && w.state !== "FAILED").length,
    }
  }, [bookings, assets, workOrders])

  const userInitial = (email?.[0] || role?.[0] || "U").toUpperCase()

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="border-amber-500/30 bg-zinc-950 text-zinc-100 sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 shadow-2xl">
          {/* Header Profile Banner */}
          <div className="bg-zinc-900/90 border-b border-zinc-800 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden">
            <div className="absolute -right-12 -top-12 size-40 rounded-full bg-amber-500/5 blur-2xl pointer-events-none" />

            <div className="flex items-center gap-4 z-10">
              <Avatar className="size-14 rounded-2xl border-2 border-amber-500/40 bg-zinc-950 shadow-lg shadow-amber-500/10">
                <AvatarFallback className="rounded-2xl bg-zinc-950 text-xl font-black text-amber-400">
                  {userInitial}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black tracking-tight text-zinc-100">
                    {email || "User Account"}
                  </h2>
                  <Badge
                    variant="outline"
                    className="border-amber-500/40 bg-amber-500/10 text-amber-400 text-xs font-semibold"
                  >
                    {role?.replace("ROLE_", "").replaceAll("_", " ")}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                  <span className="flex items-center gap-1 font-mono">
                    <Building2 className="size-3.5 text-zinc-500" />
                    Org ID: {companyId ? `${companyId.slice(0, 10)}...` : "System-wide"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Shield className="size-3.5 text-amber-400" />
                    Verified Account
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchData()}
              disabled={isLoading}
              className="border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-amber-400 hover:border-amber-500/40 gap-1.5 z-10"
            >
              <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
              Refresh Data
            </Button>
          </div>

          {/* Modal Body Content */}
          <div className="p-6 flex flex-col gap-6">
            {/* CLIENT VIEW */}
            {isClient && (
              <Tabs defaultValue="spending" className="w-full">
                <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
                  <TabsTrigger value="spending" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-400 text-xs font-semibold gap-1.5">
                    <CreditCard className="size-3.5" />
                    Expenditure & Ledger ({bookings.length})
                  </TabsTrigger>
                  <TabsTrigger value="profile" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-400 text-xs font-semibold gap-1.5">
                    <User className="size-3.5" />
                    Organization Profile
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Client Spending & Lifetime Invoices */}
                <TabsContent value="spending" className="mt-4 flex flex-col gap-4">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-amber-500/30 bg-zinc-900/70 p-3 flex flex-col">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Total Spent</span>
                      <span className="text-xl font-black text-amber-400 font-mono mt-0.5">
                        {formatCurrency(clientStats.totalSpent)}
                      </span>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 flex flex-col">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Base Rentals</span>
                      <span className="text-xl font-black text-zinc-200 font-mono mt-0.5">
                        {formatCurrency(clientStats.baseSpent)}
                      </span>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 flex flex-col">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Overtime Surcharges</span>
                      <span className="text-xl font-black text-yellow-400 font-mono mt-0.5">
                        {formatCurrency(clientStats.overtimeSpent)}
                      </span>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 flex flex-col">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Total Logged Hours</span>
                      <span className="text-xl font-black text-zinc-200 font-mono mt-0.5">
                        {clientStats.totalHours} hrs
                      </span>
                    </div>
                  </div>

                  {/* Booking Records Table */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                    <div className="p-3.5 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
                      <span className="font-bold text-xs text-zinc-200 flex items-center gap-2">
                        <FileText className="size-4 text-amber-400" />
                        Complete Order History & Tax Invoices
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">{bookings.length} Orders</span>
                    </div>

                    {bookings.length === 0 ? (
                      <div className="p-8 text-center text-xs text-zinc-500">
                        No bookings or dispatches recorded yet for this organization.
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-transparent">
                              <TableHead className="text-zinc-400 text-xs">Equipment</TableHead>
                              <TableHead className="text-zinc-400 text-xs">Slot Window</TableHead>
                              <TableHead className="text-zinc-400 text-xs">Total Billed</TableHead>
                              <TableHead className="text-zinc-400 text-xs">Status</TableHead>
                              <TableHead className="text-zinc-400 text-xs text-right">Invoice</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bookings.map((b) => {
                              const asset = assetMap.get(b.assetId)
                              return (
                                <TableRow key={b.id} className="border-zinc-800/60 hover:bg-zinc-800/40">
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <EquipmentIcon
                                        category={asset?.category}
                                        name={asset?.name}
                                        size="sm"
                                      />
                                      <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-xs text-zinc-200 truncate">
                                          {asset?.name || "Equipment Unit"}
                                        </span>
                                        <span className="font-mono text-[10px] text-zinc-500">
                                          #{b.id.slice(0, 8)}
                                        </span>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs text-zinc-400">
                                    {formatDate(b.slotStart)}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs font-bold text-amber-400">
                                    {formatCurrency(b.totalCost || b.baseCost || 0)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-[10px] py-0 px-1.5 font-medium",
                                        b.status === "CONFIRMED"
                                          ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                                          : "border-zinc-700 text-zinc-400 bg-zinc-800",
                                      )}
                                    >
                                      {b.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setSelectedInvoiceBooking(b)
                                        setInvoiceModalOpen(true)
                                      }}
                                      className="h-6 text-xs text-amber-400 hover:bg-amber-500/15 gap-1 px-2"
                                    >
                                      <FileText className="size-3" />
                                      View
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Tab 2: Client Profile */}
                <TabsContent value="profile" className="mt-4 flex flex-col gap-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col gap-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-zinc-800">
                      <span className="text-zinc-400">Registered Email:</span>
                      <span className="font-medium text-zinc-100">{email}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-800">
                      <span className="text-zinc-400">Company UUID:</span>
                      <span className="font-mono text-zinc-200">{companyId || "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-800">
                      <span className="text-zinc-400">User Account ID:</span>
                      <span className="font-mono text-zinc-200">{userId || "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-800">
                      <span className="text-zinc-400">Assigned Platform Role:</span>
                      <span className="text-amber-400 font-semibold">{role}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-zinc-400">Default Currency:</span>
                      <span className="font-bold text-amber-400">INR (₹) Indian Rupee</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {/* FLEET MANAGER VIEW */}
            {isManager && (
              <Tabs defaultValue="operations" className="w-full">
                <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
                  <TabsTrigger value="operations" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-400 text-xs font-semibold gap-1.5">
                    <TrendingUp className="size-3.5" />
                    Revenue & Operations Summary
                  </TabsTrigger>
                  <TabsTrigger value="audit" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-400 text-xs font-semibold gap-1.5">
                    <Activity className="size-3.5" />
                    Global Activities & Bookings ({bookings.length})
                  </TabsTrigger>
                  <TabsTrigger value="profile" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-400 text-xs font-semibold gap-1.5">
                    <User className="size-3.5" />
                    Manager Credentials
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Manager Revenue & Operations Summary */}
                <TabsContent value="operations" className="mt-4 flex flex-col gap-4">
                  {/* Revenue Summary Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-amber-500/30 bg-zinc-900/70 p-3 flex flex-col">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Gross Fleet Revenue</span>
                      <span className="text-xl font-black text-amber-400 font-mono mt-0.5">
                        {formatCurrency(managerStats.totalRevenue)}
                      </span>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 flex flex-col">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Overtime Surcharges</span>
                      <span className="text-xl font-black text-yellow-400 font-mono mt-0.5">
                        {formatCurrency(managerStats.overtimeRevenue)}
                      </span>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 flex flex-col">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Total Managed Fleet</span>
                      <span className="text-xl font-black text-zinc-100 font-mono mt-0.5">
                        {managerStats.totalAssets} Units
                      </span>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 flex flex-col">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Dispatched Hours</span>
                      <span className="text-xl font-black text-zinc-100 font-mono mt-0.5">
                        {managerStats.totalBookedHours} hrs
                      </span>
                    </div>
                  </div>

                  {/* Fleet Health Breakdown */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-center">
                      <span className="text-xs text-amber-300 font-semibold block">Available Units</span>
                      <span className="text-2xl font-black text-amber-400 font-mono mt-1">
                        {managerStats.availableAssets}
                      </span>
                    </div>

                    <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-center">
                      <span className="text-xs text-zinc-400 font-semibold block">Active Reservations</span>
                      <span className="text-2xl font-black text-zinc-200 font-mono mt-1">
                        {managerStats.reservedAssets}
                      </span>
                    </div>

                    <div className="rounded-xl border border-yellow-600/40 bg-yellow-600/10 p-3 text-center">
                      <span className="text-xs text-yellow-400 font-semibold block">In Maintenance</span>
                      <span className="text-2xl font-black text-yellow-500 font-mono mt-1">
                        {managerStats.inMaintenanceAssets}
                      </span>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 2: Global Activity Log */}
                <TabsContent value="audit" className="mt-4 flex flex-col gap-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                    <div className="p-3.5 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
                      <span className="font-bold text-xs text-zinc-200 flex items-center gap-2">
                        <Activity className="size-4 text-amber-400" />
                        Global Client Reservations & Invoice Ledger
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">{bookings.length} Total</span>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-zinc-800 hover:bg-transparent">
                            <TableHead className="text-zinc-400 text-xs">Equipment</TableHead>
                            <TableHead className="text-zinc-400 text-xs">Client ID</TableHead>
                            <TableHead className="text-zinc-400 text-xs">Timing</TableHead>
                            <TableHead className="text-zinc-400 text-xs">Amount</TableHead>
                            <TableHead className="text-zinc-400 text-xs">Status</TableHead>
                            <TableHead className="text-zinc-400 text-xs text-right">Invoice</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bookings.map((b) => {
                            const asset = assetMap.get(b.assetId)
                            return (
                              <TableRow key={b.id} className="border-zinc-800/60 hover:bg-zinc-800/40">
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <EquipmentIcon
                                      category={asset?.category}
                                      name={asset?.name}
                                      size="sm"
                                    />
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-bold text-xs text-zinc-200 truncate">
                                        {asset?.name || "Asset"}
                                      </span>
                                      <span className="font-mono text-[10px] text-zinc-500">
                                        #{b.id.slice(0, 8)}
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs text-zinc-400 truncate max-w-[90px]">
                                  {b.clientCompanyId.slice(0, 8)}...
                                </TableCell>
                                <TableCell className="text-xs text-zinc-400">
                                  {formatDate(b.slotStart)}
                                </TableCell>
                                <TableCell className="font-mono text-xs font-bold text-amber-400">
                                  {formatCurrency(b.totalCost || b.baseCost || 0)}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] py-0 px-1.5 font-medium border-zinc-700 text-zinc-300"
                                  >
                                    {b.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedInvoiceBooking(b)
                                      setInvoiceModalOpen(true)
                                    }}
                                    className="h-6 text-xs text-amber-400 hover:bg-amber-500/15 gap-1 px-2"
                                  >
                                    <FileText className="size-3" />
                                    Invoice
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 3: Manager Profile */}
                <TabsContent value="profile" className="mt-4 flex flex-col gap-4">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col gap-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-zinc-800">
                      <span className="text-zinc-400">Manager Email:</span>
                      <span className="font-medium text-zinc-100">{email}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-800">
                      <span className="text-zinc-400">Company / Tenant ID:</span>
                      <span className="font-mono text-zinc-200">{companyId || "Platform Admin Root"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-800">
                      <span className="text-zinc-400">Manager Account ID:</span>
                      <span className="font-mono text-zinc-200">{userId || "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-zinc-800">
                      <span className="text-zinc-400">Access Privileges:</span>
                      <span className="text-amber-400 font-semibold">Full Fleet Dispatch, Pricing & Maintenance Management</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-zinc-400">System Currency:</span>
                      <span className="font-bold text-amber-400">INR (₹) Indian Rupee</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {/* TECHNICIAN VIEW */}
            {isTech && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col gap-3 text-xs">
                <h3 className="font-bold text-sm text-zinc-100">Technician Maintenance Workspace</h3>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-3">
                    <span className="text-zinc-400 text-[11px]">Total Work Orders</span>
                    <span className="text-xl font-bold text-amber-400 block mt-1">{workOrders.length}</span>
                  </div>
                  <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-3">
                    <span className="text-zinc-400 text-[11px]">Available Machinery</span>
                    <span className="text-xl font-bold text-zinc-200 block mt-1">{assets.length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer with Logout and Close */}
          <DialogFooter className="border-t border-zinc-800 bg-zinc-900/90 p-4 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false)
                logout()
              }}
              className="border-destructive/40 text-destructive hover:bg-destructive/10 gap-1.5"
            >
              <LogOut className="size-3.5" />
              Sign Out
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="bg-amber-400 text-zinc-950 font-bold hover:bg-amber-300 px-4"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Modal triggered from inside Account Modal */}
      <InvoiceModal
        open={invoiceModalOpen}
        onOpenChange={setInvoiceModalOpen}
        booking={selectedInvoiceBooking}
        asset={selectedInvoiceBooking ? assetMap.get(selectedInvoiceBooking.assetId) : null}
        clientEmail={email || undefined}
      />
    </>
  )
}
