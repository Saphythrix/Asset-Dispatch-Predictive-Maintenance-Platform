import axios from "axios"
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Timer,
  Truck,
} from "lucide-react"

import { apiClient } from "@/api/client"
import { EquipmentIcon } from "@/components/icons/EquipmentIcon"
import { InvoiceModal } from "@/components/invoice/InvoiceModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"
import type {
  Asset,
  Booking,
  BookingRequest,
} from "@/types/api"

function formatDate(value: string) {
  if (!value) return "N/A"
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value))
  } catch {
    return value
  }
}

function formatToLocalInput(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0")
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function toLocalDateTime(value: string) {
  return value.length === 16 ? `${value}:00` : value
}

function getDefaultSlotStart(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)
  return formatToLocalInput(tomorrow)
}

function getDefaultSlotEnd(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(17, 0, 0, 0)
  return formatToLocalInput(tomorrow)
}

export default function ClientDashboard() {
  const { companyId, userId, email } = useAuth()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Booking Modal State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAssetId, setSelectedAssetId] = useState("")
  const [slotStart, setSlotStart] = useState(getDefaultSlotStart)
  const [slotEnd, setSlotEnd] = useState(getDefaultSlotEnd)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Machinery Search & Filter State
  const [machinerySearch, setMachinerySearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("ALL")

  // Invoice Modal State
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null)

  // Fetch all available platform fleet assets & company bookings
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      // 1. Fetch all platform assets for client selection
      try {
        const { data: assetList } = await apiClient.get<Asset[]>("/assets")
        const validAssets = assetList || []
        setAssets(validAssets)
        if (validAssets.length > 0) {
          setSelectedAssetId((current) => current || validAssets[0].id)
        }
      } catch (assetErr) {
        console.warn("Could not load fleet assets from /assets", assetErr)
      }

      // 2. Fetch bookings for this client company
      let clientBookings: Booking[] = []
      if (companyId) {
        try {
          const { data } = await apiClient.get<Booking[]>(
            `/bookings/company/${companyId}`,
          )
          clientBookings = data || []
        } catch {
          try {
            const { data } = await apiClient.get<Booking[]>("/bookings")
            clientBookings = (data || []).filter(
              (b) => b.clientCompanyId === companyId,
            )
          } catch {
            console.warn("Could not load bookings")
          }
        }
      } else {
        try {
          const { data } = await apiClient.get<Booking[]>("/bookings")
          clientBookings = data || []
        } catch {
          console.warn("Could not load bookings")
        }
      }
      setBookings(clientBookings)
    } finally {
      setIsLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const assetMap = useMemo(() => {
    return new Map(assets.map((a) => [a.id, a]))
  }, [assets])

  const selectedAsset = useMemo(() => {
    return assets.find((a) => a.id === selectedAssetId) || (assets.length > 0 ? assets[0] : null)
  }, [assets, selectedAssetId])

  // Filtered machinery list for Catalog tab and Selector
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesSearch =
        machinerySearch === "" ||
        asset.name.toLowerCase().includes(machinerySearch.toLowerCase()) ||
        asset.category.toLowerCase().includes(machinerySearch.toLowerCase()) ||
        asset.serialNumber.toLowerCase().includes(machinerySearch.toLowerCase())

      const matchesCategory =
        categoryFilter === "ALL" || asset.category === categoryFilter

      return matchesSearch && matchesCategory
    })
  }, [assets, machinerySearch, categoryFilter])

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(assets.map((a) => a.category))
    return Array.from(set)
  }, [assets])

  // Calculate live estimate for dialog modal
  const estimatedHours = useMemo(() => {
    if (!slotStart || !slotEnd) return 0
    const start = new Date(slotStart).getTime()
    const end = new Date(slotEnd).getTime()
    if (isNaN(start) || isNaN(end) || end <= start) return 0
    return Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10
  }, [slotStart, slotEnd])

  const estimatedCost = useMemo(() => {
    const rate = selectedAsset?.hourlyRate || 100
    return Math.round(estimatedHours * rate * 100) / 100
  }, [estimatedHours, selectedAsset])

  // Quick preset helper
  function handlePreset(hours: number) {
    const start = new Date()
    start.setHours(start.getHours() + 1, 0, 0, 0)
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000)
    setSlotStart(formatToLocalInput(start))
    setSlotEnd(formatToLocalInput(end))
  }

  // Open modal with specific pre-selected asset
  function handleSelectAndBook(asset: Asset) {
    setSelectedAssetId(asset.id)
    setFormError(null)
    setDialogOpen(true)
  }

  // Computed metrics for Client Portal
  const metrics = useMemo(() => {
    const now = new Date().getTime()
    let activeVehiclesCount = 0
    let totalHoursRemaining = 0
    let isOvertimeActive = false
    let pendingCount = 0
    let totalExpenditure = 0
    let overtimeExpenditure = 0

    for (const b of bookings) {
      const bCost = b.totalCost || b.baseCost || 0
      const bOvertime = b.overtimeCost || 0

      if (b.status === "CONFIRMED") {
        totalExpenditure += bCost
        overtimeExpenditure += bOvertime

        const startTime = new Date(b.slotStart).getTime()
        const endTime = new Date(b.slotEnd).getTime()

        if (now >= startTime && now <= endTime) {
          activeVehiclesCount++
          const hoursLeft = Math.max(0, (endTime - now) / (1000 * 60 * 60))
          totalHoursRemaining += hoursLeft
        } else if (now > endTime) {
          isOvertimeActive = true
          const extraHrs = (now - endTime) / (1000 * 60 * 60)
          totalHoursRemaining = extraHrs
        }
      } else if (b.status === "PENDING") {
        pendingCount++
      }
    }

    return {
      activeVehiclesCount,
      totalHoursRemaining: Math.round(totalHoursRemaining * 10) / 10,
      isOvertimeActive,
      pendingCount,
      totalExpenditure: Math.round(totalExpenditure * 100) / 100,
      overtimeExpenditure: Math.round(overtimeExpenditure * 100) / 100,
    }
  }, [bookings])

  // Create Booking handler
  async function handleCreateBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const targetAssetId = selectedAssetId || (assets.length > 0 ? assets[0].id : "")

    if (!targetAssetId || !companyId || !userId) {
      setFormError("Please select an equipment unit from the list.")
      return
    }

    if (estimatedHours <= 0) {
      setFormError("End time must be strictly after start time.")
      return
    }

    setIsSubmitting(true)
    const payload: BookingRequest = {
      assetId: targetAssetId,
      clientCompanyId: companyId,
      createdBy: userId,
      slotStart: toLocalDateTime(slotStart),
      slotEnd: toLocalDateTime(slotEnd),
    }

    try {
      await apiClient.post<Booking>("/bookings", payload)
      toast.success({
        title: "Dispatch Order Placed",
        description: `Booking requested for ${selectedAsset?.name || "Equipment"}! Estimated charge: ₹${estimatedCost.toFixed(2)}`,
      })
      setDialogOpen(false)
      await fetchData()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409) {
          setFormError(
            "Conflict Alert (HTTP 409): Asset is unavailable for this time window. Please select another slot or equipment.",
          )
        } else {
          setFormError(
            (err.response?.data as { message?: string } | undefined)?.message ||
              "Failed to place reservation.",
          )
        }
      } else {
        setFormError("An unexpected error occurred.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const waitingListBookings = useMemo(
    () => bookings.filter((b) => b.status === "PENDING"),
    [bookings],
  )
  const confirmedBookings = useMemo(
    () => bookings.filter((b) => b.status === "CONFIRMED"),
    [bookings],
  )

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header Banner - Industrial Yellow/Grey Tone */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-zinc-900/80 border border-amber-500/30 rounded-2xl p-6 shadow-xl backdrop-blur relative overflow-hidden">
        {/* Subtle decorative yellow gradient glow */}
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-1 z-10">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 shadow-inner">
              <Building2 className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-100 flex items-center gap-2">
                Client Dispatch & Asset Portal
              </h1>
              <span className="text-xs font-mono font-medium text-amber-400/90 uppercase tracking-wider">
                Logistics & Equipment Fleet Management
              </span>
            </div>
          </div>
          <p className="text-sm text-zinc-400 mt-2">
            Logged in as <strong className="text-amber-300 font-medium">{email || "Client Organization"}</strong> • Browse machinery & electronic instruments, monitor active hours, and inspect monthly billing.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData()}
            disabled={isLoading}
            className="border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-900 hover:text-amber-400 hover:border-amber-500/40"
          >
            <RefreshCw
              className={cn("size-4 mr-1.5", isLoading && "animate-spin")}
            />
            Refresh
          </Button>

          {/* New Equipment Request Dialog */}
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) setFormError(null)
            }}
          >
            <DialogTrigger render={<Button className="bg-amber-400 text-zinc-950 font-bold hover:bg-amber-300 gap-1.5 shadow-lg shadow-amber-500/20" />}>
              <Plus className="size-4" />
              Request Equipment
            </DialogTrigger>
            <DialogContent className="border-amber-500/30 bg-zinc-950 text-zinc-100 sm:max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-zinc-100">
                  <Truck className="size-5 text-amber-400" />
                  Order Equipment Dispatch
                </DialogTitle>
                <DialogDescription className="text-zinc-400 text-xs">
                  Choose an asset unit from the platform fleet and specify operating hours.
                </DialogDescription>
              </DialogHeader>

              <form
                id="client-booking-form"
                className="flex flex-col gap-4 py-2"
                onSubmit={handleCreateBooking}
              >
                {formError ? (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive"
                  >
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                ) : null}

                {/* Visual Machinery Cards Grid for Selection */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs text-zinc-300 font-semibold flex items-center justify-between">
                    <span>Select Equipment Unit ({assets.length} Available)</span>
                    {selectedAsset ? (
                      <span className="text-amber-400 font-mono font-medium text-[11px]">
                        Selected: {selectedAsset.name} (₹{selectedAsset.hourlyRate || 100}/hr)
                      </span>
                    ) : null}
                  </Label>

                  {assets.length === 0 ? (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 text-center text-xs text-zinc-400">
                      <Truck className="size-8 mx-auto mb-2 text-zinc-600" />
                      <span>No equipment is registered in the fleet yet. Please contact your Fleet Manager.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-52 overflow-y-auto p-1 border border-zinc-800/80 rounded-xl bg-zinc-900/50">
                      {assets.map((asset) => {
                        const isSelected = (selectedAssetId || assets[0]?.id) === asset.id
                        const isAvailable = asset.status === "AVAILABLE"

                        return (
                          <div
                            key={asset.id}
                            onClick={() => setSelectedAssetId(asset.id)}
                            className={cn(
                              "cursor-pointer rounded-xl border p-2.5 transition-all flex items-center gap-3 select-none",
                              isSelected
                                ? "border-amber-400 bg-amber-500/15 shadow-md shadow-amber-500/10"
                                : "border-zinc-800/80 bg-zinc-950/90 hover:border-zinc-700 hover:bg-zinc-900/80",
                            )}
                          >
                            {/* Equipment Symbol */}
                            <EquipmentIcon
                              category={asset.category}
                              name={asset.name}
                              size="md"
                              className={cn(
                                "shrink-0",
                                isSelected ? "border-amber-400 bg-zinc-900 text-amber-300" : "text-amber-400/80",
                              )}
                            />

                            <div className="flex flex-col flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs text-zinc-100 truncate">
                                  {asset.name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[9px] py-0 px-1 font-mono shrink-0",
                                    isAvailable
                                      ? "border-amber-500/40 text-amber-300 bg-amber-500/10"
                                      : "border-zinc-700 text-zinc-400 bg-zinc-900",
                                  )}
                                >
                                  {asset.status}
                                </Badge>
                              </div>
                              <span className="font-mono text-[10px] text-zinc-500 truncate">
                                {asset.category} • #{asset.serialNumber}
                              </span>
                              <div className="flex items-center justify-between mt-1">
                                <span className="font-mono text-xs font-bold text-amber-400">
                                  ₹{(asset.hourlyRate || 100).toFixed(2)}/hr
                                </span>
                                <span className={cn("text-[10px]", isSelected ? "text-amber-300 font-bold" : "text-zinc-500")}>
                                  {isSelected ? "✓ Active" : "Select"}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Quick Duration Presets */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-zinc-400 font-medium">Quick Duration Presets</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreset(4)}
                      className="h-7 text-xs border-zinc-800 bg-zinc-900 text-zinc-300 flex-1 hover:bg-zinc-800 hover:text-amber-300 hover:border-amber-500/30"
                    >
                      4 Hours
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreset(8)}
                      className="h-7 text-xs border-zinc-800 bg-zinc-900 text-zinc-300 flex-1 hover:bg-zinc-800 hover:text-amber-300 hover:border-amber-500/30"
                    >
                      8 Hours (Shift)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreset(24)}
                      className="h-7 text-xs border-zinc-800 bg-zinc-900 text-zinc-300 flex-1 hover:bg-zinc-800 hover:text-amber-300 hover:border-amber-500/30"
                    >
                      24 Hours (Full Day)
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="c-slot-start" className="text-xs text-zinc-300 font-medium">
                      Start Time
                    </Label>
                    <Input
                      id="c-slot-start"
                      type="datetime-local"
                      value={slotStart}
                      onChange={(e) => setSlotStart(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="border-zinc-800 bg-zinc-900 text-xs text-zinc-100 focus-visible:border-amber-400"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="c-slot-end" className="text-xs text-zinc-300 font-medium">
                      End Time
                    </Label>
                    <Input
                      id="c-slot-end"
                      type="datetime-local"
                      value={slotEnd}
                      onChange={(e) => setSlotEnd(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="border-zinc-800 bg-zinc-900 text-xs text-zinc-100 focus-visible:border-amber-400"
                    />
                  </div>
                </div>

                {/* Live Price Estimation Box */}
                <div className="rounded-xl border border-amber-500/40 bg-zinc-900 p-3.5 text-zinc-200 flex flex-col gap-2 shadow-inner">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Hourly Rate:</span>
                    <strong className="text-amber-400 font-mono font-bold">
                      ₹{selectedAsset?.hourlyRate || 100}/hour
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Duration:</span>
                    <span className="font-mono text-zinc-200 font-medium">
                      {estimatedHours > 0 ? `${estimatedHours} hours` : "Invalid window"}
                    </span>
                  </div>
                  <div className="border-t border-zinc-800 pt-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-100">
                      Total Estimated Charge:
                    </span>
                    <span className="text-lg font-black text-amber-400 font-mono">
                      ₹{estimatedCost.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-tight">
                    * Extra hours beyond scheduled window are billed at a 1.5× overtime rate.
                  </p>
                </div>
              </form>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setDialogOpen(false)}
                  className="border-zinc-800 text-zinc-300 hover:bg-zinc-900"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="client-booking-form"
                  disabled={isSubmitting || estimatedHours <= 0 || assets.length === 0}
                  className="bg-amber-400 text-zinc-950 font-bold hover:bg-amber-300 shadow-md shadow-amber-500/20"
                >
                  {isSubmitting ? "Submitting Order…" : "Confirm & Place Order"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metric Cards Row - Industrial Yellow / Grey */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Hours Left */}
        <Card className="border-zinc-800 bg-zinc-900/80 text-zinc-100 shadow-md hover:border-amber-500/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              {metrics.isOvertimeActive ? "Overtime Active" : "Active Time Left"}
            </CardDescription>
            <Timer className="size-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-3xl font-black tracking-tight tabular-nums",
                metrics.isOvertimeActive ? "text-amber-400" : "text-zinc-100",
              )}
            >
              {isLoading ? (
                <Skeleton className="h-8 w-16 bg-zinc-800" />
              ) : metrics.activeVehiclesCount > 0 ? (
                `${metrics.totalHoursRemaining} hrs`
              ) : (
                "0 hrs"
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {metrics.isOvertimeActive
                ? "Overtime surcharge active on usage"
                : "Remaining on active reservations"}
            </p>
          </CardContent>
        </Card>

        {/* Vehicles Working For You */}
        <Card className="border-zinc-800 bg-zinc-900/80 text-zinc-100 shadow-md hover:border-amber-500/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              Equipments Dispatched
            </CardDescription>
            <Truck className="size-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-amber-400 tabular-nums">
              {isLoading ? (
                <Skeleton className="h-8 w-16 bg-zinc-800" />
              ) : (
                metrics.activeVehiclesCount
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Currently operating on your site
            </p>
          </CardContent>
        </Card>

        {/* Waiting List / Pending */}
        <Card className="border-zinc-800 bg-zinc-900/80 text-zinc-100 shadow-md hover:border-amber-500/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              Waiting List Queue
            </CardDescription>
            <Clock className="size-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-zinc-200 tabular-nums">
              {isLoading ? (
                <Skeleton className="h-8 w-16 bg-zinc-800" />
              ) : (
                metrics.pendingCount
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Pending Fleet Manager dispatch
            </p>
          </CardContent>
        </Card>

        {/* Accumulated Expenditure */}
        <Card className="border-zinc-800 bg-zinc-900/80 text-zinc-100 shadow-md hover:border-amber-500/30 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              Total Amount Billed
            </CardDescription>
            <DollarSign className="size-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-amber-400 tabular-nums">
              {isLoading ? (
                <Skeleton className="h-8 w-16 bg-zinc-800" />
              ) : (
                `₹${metrics.totalExpenditure.toFixed(2)}`
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {metrics.overtimeExpenditure > 0
                ? `Includes ₹${metrics.overtimeExpenditure.toFixed(2)} overtime charge`
                : "Standard rate charges"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Area */}
      <Tabs defaultValue="catalog" className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
          <TabsTrigger value="catalog" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-400 text-xs font-semibold gap-2">
            <Sparkles className="size-3.5 text-amber-400" />
            Equipment Catalog ({assets.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-400 text-xs font-semibold gap-2">
            <ShieldCheck className="size-3.5 text-amber-400" />
            Active Dispatches ({confirmedBookings.length})
          </TabsTrigger>
          <TabsTrigger value="waiting" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-400 text-xs font-semibold gap-2">
            <Clock className="size-3.5 text-zinc-400" />
            Waiting List ({waitingListBookings.length})
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-400 text-xs font-semibold gap-2">
            <CreditCard className="size-3.5 text-amber-400" />
            Billing & Invoiced Ledger
          </TabsTrigger>
        </TabsList>

        {/* Tab 0: Equipment Catalog with Visual Symbols */}
        <TabsContent value="catalog" className="mt-4">
          <div className="flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl">
              <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-2.5 size-4 text-zinc-500" />
                <Input
                  placeholder="Search bulldozers, trucks, oscilloscopes, meters..."
                  value={machinerySearch}
                  onChange={(e) => setMachinerySearch(e.target.value)}
                  className="h-9 pl-8 border-zinc-800 bg-zinc-950 text-xs text-zinc-100 placeholder:text-zinc-500 focus-visible:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1">
                  <Filter className="size-3.5 text-amber-400" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-transparent text-xs text-zinc-300 outline-none cursor-pointer font-medium"
                  >
                    <option value="ALL" className="bg-zinc-950 text-zinc-200">
                      All Categories
                    </option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className="bg-zinc-950 text-zinc-200">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Equipment Grid Cards with Visual Icons */}
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-52 w-full bg-zinc-800 rounded-xl" />
                <Skeleton className="h-52 w-full bg-zinc-800 rounded-xl" />
                <Skeleton className="h-52 w-full bg-zinc-800 rounded-xl" />
              </div>
            ) : filteredAssets.length === 0 ? (
              <Card className="border-zinc-800 bg-zinc-900/60 text-zinc-100 p-12 text-center">
                <Truck className="size-12 mx-auto mb-3 text-zinc-600" />
                <h3 className="text-base font-bold text-zinc-200">No equipment found</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  {machinerySearch || categoryFilter !== "ALL"
                    ? "Try adjusting your search query or category filter."
                    : "No equipment registered in the platform catalog yet."}
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAssets.map((asset) => {
                  const isAvailable = asset.status === "AVAILABLE"

                  return (
                    <Card
                      key={asset.id}
                      className={cn(
                        "border-zinc-800 bg-zinc-900/80 text-zinc-100 shadow-lg flex flex-col justify-between transition-all hover:border-amber-500/40 group",
                      )}
                    >
                      <CardHeader className="p-4 pb-3 border-b border-zinc-800/80">
                        <div className="flex items-start gap-3">
                          {/* Equipment Symbol */}
                          <EquipmentIcon
                            category={asset.category}
                            name={asset.name}
                            size="lg"
                            className="shrink-0"
                          />

                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-sm text-zinc-100 truncate">
                                {asset.name}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] py-0.5 px-2 font-mono shrink-0 font-medium",
                                  isAvailable
                                    ? "border-amber-500/40 text-amber-300 bg-amber-500/10"
                                    : "border-zinc-700 text-zinc-400 bg-zinc-800",
                                )}
                              >
                                {asset.status}
                              </Badge>
                            </div>
                            <span className="font-mono text-[11px] text-zinc-400 mt-0.5">
                              {asset.category}
                            </span>
                            <span className="font-mono text-[10px] text-zinc-500">
                              SN: {asset.serialNumber}
                            </span>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 flex flex-col gap-3 flex-1 justify-between">
                        <div className="flex items-center justify-between text-xs bg-zinc-950 border border-zinc-800/80 rounded-lg p-2.5">
                          <div className="flex flex-col">
                            <span className="text-zinc-500 text-[10px] uppercase font-semibold">Monthly Rate</span>
                            <span className="font-mono text-base font-black text-amber-400">
                              ₹{(asset.hourlyRate || 100).toFixed(2)}<span className="text-xs font-normal text-zinc-400">/hr</span>
                            </span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-zinc-500 text-[10px] uppercase font-semibold">Operating Logs</span>
                            <span className="font-mono text-xs text-zinc-300">
                              {asset.operatingHours}h / {asset.maintenanceThresholdHours}h
                            </span>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleSelectAndBook(asset)}
                          className={cn(
                            "w-full text-xs font-bold gap-1.5 transition-colors",
                            isAvailable
                              ? "bg-amber-400 text-zinc-950 hover:bg-amber-300 shadow-md shadow-amber-500/15"
                              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700",
                          )}
                        >
                          <Plus className="size-3.5" />
                          Book / Request This Equipment
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 1: Active Dispatched Assets */}
        <TabsContent value="active" className="mt-4">
          <Card className="border-zinc-800 bg-zinc-900/80 text-zinc-100 shadow-xl">
            <CardHeader className="border-b border-zinc-800/80 p-4 sm:p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Truck className="size-5 text-amber-400" />
                Equipment Currently Working for You
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs">
                Real-time operational dispatch schedule, machine telemetry, and hourly rates
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-2 p-6">
                  <Skeleton className="h-10 w-full bg-zinc-800" />
                  <Skeleton className="h-10 w-full bg-zinc-800" />
                </div>
              ) : confirmedBookings.length === 0 ? (
                <div className="py-16 text-center text-sm text-zinc-400">
                  <Truck className="size-10 mx-auto mb-3 text-zinc-600" />
                  <p className="font-bold text-zinc-300">No active dispatches</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Select a machine from the "Equipment Catalog" tab to order machinery or testing equipment.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800 hover:bg-transparent">
                        <TableHead className="text-zinc-400 text-xs">Equipment</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Category</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Hourly Rate</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Slot Window</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Base Cost</TableHead>
                        <TableHead className="text-zinc-400 text-xs">Overtime Cost</TableHead>
                        <TableHead className="text-zinc-400 text-xs text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {confirmedBookings.map((b) => {
                        const asset = assetMap.get(b.assetId)
                        const rate = b.hourlyRateSnapshot || asset?.hourlyRate || 100
                        const nowTime = new Date().getTime()
                        const endTime = new Date(b.slotEnd).getTime()
                        const isOvertime = nowTime > endTime

                        return (
                          <TableRow key={b.id} className="border-zinc-800/80 hover:bg-zinc-800/40">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <EquipmentIcon
                                  category={asset?.category}
                                  name={asset?.name}
                                  size="sm"
                                />
                                <div className="flex flex-col">
                                  <span className="font-bold text-zinc-200 text-xs">
                                    {asset?.name || "Equipment Unit"}
                                  </span>
                                  <span className="font-mono text-[10px] text-zinc-500">
                                    {asset?.serialNumber || b.assetId.slice(0, 8)}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] font-mono text-zinc-300">
                                {asset?.category || "EQUIPMENT"}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-amber-400 font-bold">
                              ₹{rate.toFixed(2)}/hr
                            </TableCell>
                            <TableCell className="text-xs text-zinc-300">
                              <div>{formatDate(b.slotStart)}</div>
                              <div className="text-zinc-500 text-[11px]">until {formatDate(b.slotEnd)}</div>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-zinc-200 font-medium">
                              ₹{(b.baseCost || 0).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {b.overtimeCost && b.overtimeCost > 0 ? (
                                <span className="font-mono text-xs text-amber-400 font-bold flex items-center gap-1">
                                  <AlertTriangle className="size-3" />
                                  +₹{b.overtimeCost.toFixed(2)} ({b.overtimeHours}h OT)
                                </span>
                              ) : isOvertime ? (
                                <span className="font-mono text-[11px] text-amber-400 font-medium">
                                  Running overtime (1.5×)
                                </span>
                              ) : (
                                <span className="text-xs text-zinc-500">₹0.00</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Badge
                                  variant="outline"
                                  className="border border-amber-500/40 bg-amber-500/10 text-amber-400 text-xs py-0.5 px-2 font-semibold inline-flex items-center gap-1.5"
                                >
                                  <span className="size-1.5 rounded-full bg-amber-400" />
                                  Active
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedInvoiceBooking(b)
                                    setInvoiceModalOpen(true)
                                  }}
                                  className="h-7 text-xs text-zinc-300 hover:text-amber-400 hover:bg-amber-500/10 gap-1.5 px-2 font-medium"
                                >
                                  <FileText className="size-3.5 text-amber-400" />
                                  Invoice
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Waiting List */}
        <TabsContent value="waiting" className="mt-4">
          <Card className="border-zinc-800 bg-zinc-900/80 text-zinc-100 shadow-xl">
            <CardHeader className="border-b border-zinc-800/80 p-4 sm:p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Clock className="size-5 text-amber-400" />
                Waiting List & Pending Requests
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs">
                Requests queued awaiting assignment and approval from the Fleet Manager
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {waitingListBookings.length === 0 ? (
                <div className="py-16 text-center text-sm text-zinc-400">
                  <CheckCircle2 className="size-10 mx-auto mb-3 text-zinc-600" />
                  <p className="font-bold text-zinc-300">No items on the waiting list</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    All your equipment requests have been processed!
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-400 text-xs">Request</TableHead>
                      <TableHead className="text-zinc-400 text-xs">Equipment</TableHead>
                      <TableHead className="text-zinc-400 text-xs">Requested Start</TableHead>
                      <TableHead className="text-zinc-400 text-xs">Requested End</TableHead>
                      <TableHead className="text-zinc-400 text-xs">Estimated Cost</TableHead>
                      <TableHead className="text-zinc-400 text-xs text-right">Queue State</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waitingListBookings.map((b) => {
                      const asset = assetMap.get(b.assetId)
                      return (
                        <TableRow key={b.id} className="border-zinc-800/80 hover:bg-zinc-800/40">
                          <TableCell className="font-mono text-xs text-zinc-400">
                            #{b.id.slice(0, 8)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <EquipmentIcon
                                category={asset?.category}
                                name={asset?.name}
                                size="sm"
                              />
                              <span className="font-bold text-xs text-zinc-200">
                                {asset?.name || "Asset"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-zinc-300">
                            {formatDate(b.slotStart)}
                          </TableCell>
                          <TableCell className="text-xs text-zinc-300">
                            {formatDate(b.slotEnd)}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-amber-400">
                            ₹{(b.baseCost || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant="outline"
                              className="border border-zinc-700 bg-zinc-800 text-zinc-300 text-xs py-0.5 px-2 inline-flex items-center gap-1.5"
                            >
                              <span className="size-1.5 rounded-full bg-amber-400" />
                              Waiting List
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Billing & Invoiced Ledger */}
        <TabsContent value="billing" className="mt-4">
          <Card className="border-zinc-800 bg-zinc-900/80 text-zinc-100 shadow-xl">
            <CardHeader className="border-b border-zinc-800/80 p-4 sm:p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <CreditCard className="size-5 text-amber-400" />
                Itemized Billing & Overtime Ledger
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs">
                Cost breakdown per equipment, regular hours, and extra overtime surcharges
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400 text-xs">Equipment</TableHead>
                    <TableHead className="text-zinc-400 text-xs">Rate (₹/hr)</TableHead>
                    <TableHead className="text-zinc-400 text-xs">Scheduled</TableHead>
                    <TableHead className="text-zinc-400 text-xs">Actual Usage</TableHead>
                    <TableHead className="text-zinc-400 text-xs">Base Charge</TableHead>
                    <TableHead className="text-zinc-400 text-xs">Overtime (1.5×)</TableHead>
                    <TableHead className="text-zinc-400 text-xs">Total Charged</TableHead>
                    <TableHead className="text-zinc-400 text-xs text-right">Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => {
                    const asset = assetMap.get(b.assetId)
                    const rate = b.hourlyRateSnapshot || asset?.hourlyRate || 100
                    const start = new Date(b.slotStart).getTime()
                    const end = new Date(b.slotEnd).getTime()
                    const schedHours = Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10
                    const actualHours = b.actualHoursUsed || schedHours

                    return (
                      <TableRow key={b.id} className="border-zinc-800/80 hover:bg-zinc-800/40">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <EquipmentIcon
                              category={asset?.category}
                              name={asset?.name}
                              size="sm"
                            />
                            <div className="flex flex-col">
                              <span className="font-bold text-xs text-zinc-200">
                                {asset?.name || "Asset"}
                              </span>
                              <span className="font-mono text-[10px] text-zinc-500">
                                #{b.id.slice(0, 8)}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-zinc-300">
                          ₹{rate.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-zinc-300">
                          {schedHours}h
                        </TableCell>
                        <TableCell className="font-mono text-xs text-zinc-200 font-bold">
                          {actualHours}h
                        </TableCell>
                        <TableCell className="font-mono text-xs text-zinc-300">
                          ₹{(b.baseCost || schedHours * rate).toFixed(2)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-amber-400">
                          {b.overtimeCost && b.overtimeCost > 0
                            ? `+₹${b.overtimeCost.toFixed(2)} (${b.overtimeHours}h)`
                            : "₹0.00"}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-amber-400 font-black">
                          ₹{(b.totalCost || b.baseCost || schedHours * rate).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedInvoiceBooking(b)
                              setInvoiceModalOpen(true)
                            }}
                            className="h-7 text-xs border-zinc-800 text-zinc-300 hover:text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/10 gap-1.5 font-medium"
                          >
                            <FileText className="size-3.5 text-amber-400" />
                            View Invoice
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Modal for Client */}
      <InvoiceModal
        open={invoiceModalOpen}
        onOpenChange={setInvoiceModalOpen}
        booking={selectedInvoiceBooking}
        asset={selectedInvoiceBooking ? assetMap.get(selectedInvoiceBooking.assetId) : null}
        clientEmail={email || undefined}
      />
    </div>
  )
}
