import axios from "axios"
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import {
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Flame,
  Plus,
  RefreshCw,
  X,
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
import { toast } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"
import type {
  Asset,
  Booking,
  BookingRequest,
  BookingStatus,
} from "@/types/api"

const bookingStatusStyles: Record<BookingStatus, { badge: string; dot: string }> = {
  PENDING: {
    badge: "border-zinc-700 bg-zinc-800 text-zinc-300",
    dot: "bg-amber-400",
  },
  CONFIRMED: {
    badge: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    dot: "bg-amber-400",
  },
  REJECTED: {
    badge: "border-destructive/30 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
  CANCELLED: {
    badge: "border-zinc-800 bg-zinc-900 text-zinc-500",
    dot: "bg-zinc-600",
  },
}

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

export default function BookingEngine() {
  const { userId, companyId } = useAuth()

  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAssetId, setSelectedAssetId] = useState<string>("")
  const [slotStart, setSlotStart] = useState(getDefaultSlotStart)
  const [slotEnd, setSlotEnd] = useState(getDefaultSlotEnd)

  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [isLoadingAssets, setIsLoadingAssets] = useState(true)
  const [isLoadingBookings, setIsLoadingBookings] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [conflictError, setConflictError] = useState<string | null>(null)
  const [successNotification, setSuccessNotification] = useState<string | null>(
    null,
  )

  // Complete / Overtime Dialog
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const [completingBooking, setCompletingBooking] = useState<Booking | null>(null)
  const [actualHoursInput, setActualHoursInput] = useState<string>("")
  const [isCompleting, setIsCompleting] = useState(false)

  // Invoice Modal State
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null)

  // Fetch available fleet assets
  const fetchAssets = useCallback(async () => {
    setIsLoadingAssets(true)
    try {
      const endpoint = companyId ? `/assets/company/${companyId}` : "/assets"
      const { data } = await apiClient.get<Asset[]>(endpoint)
      setAssets(data || [])
      if (data && data.length > 0 && !selectedAssetId) {
        setSelectedAssetId(data[0].id)
      }
    } catch {
      toast.error({
        title: "Error Loading Assets",
        description: "Unable to retrieve fleet assets for reservation booking.",
      })
    } finally {
      setIsLoadingAssets(false)
    }
  }, [companyId, selectedAssetId])

  // Fetch all bookings for the manager
  const fetchAllBookings = useCallback(async () => {
    setIsLoadingBookings(true)
    try {
      const { data } = await apiClient.get<Booking[]>("/bookings")
      setAllBookings(data || [])
    } catch {
      setAllBookings([])
    } finally {
      setIsLoadingBookings(false)
    }
  }, [])

  useEffect(() => {
    void fetchAssets()
    void fetchAllBookings()
  }, [fetchAssets, fetchAllBookings])

  const selectedAsset = useMemo(() => {
    return assets.find((a) => a.id === selectedAssetId)
  }, [assets, selectedAssetId])

  const assetMap = useMemo(() => {
    return new Map(assets.map((a) => [a.id, a]))
  }, [assets])

  // Live price estimate
  const estimatedHours = useMemo(() => {
    const start = new Date(slotStart).getTime()
    const end = new Date(slotEnd).getTime()
    if (isNaN(start) || isNaN(end) || end <= start) return 0
    return Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10
  }, [slotStart, slotEnd])

  const estimatedCost = useMemo(() => {
    const rate = selectedAsset?.hourlyRate || 100
    return Math.round(estimatedHours * rate * 100) / 100
  }, [estimatedHours, selectedAsset])

  function handlePreset(hours: number) {
    const start = new Date()
    start.setHours(start.getHours() + 1, 0, 0, 0)
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000)
    setSlotStart(formatToLocalInput(start))
    setSlotEnd(formatToLocalInput(end))
  }

  async function handleCreateBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setConflictError(null)
    setSuccessNotification(null)

    if (!selectedAssetId || !companyId || !userId) {
      setConflictError("Missing required parameters.")
      return
    }

    if (estimatedHours <= 0) {
      setConflictError("Reservation end time must be strictly after the start time.")
      return
    }

    setIsSubmitting(true)

    const payload: BookingRequest = {
      assetId: selectedAssetId,
      clientCompanyId: companyId,
      createdBy: userId,
      slotStart: toLocalDateTime(slotStart),
      slotEnd: toLocalDateTime(slotEnd),
    }

    try {
      const response = await apiClient.post<Booking>("/bookings", payload)

      if (response.status === 201 || response.status === 200) {
        const successMsg = `Booking reservation #${response.data.id.slice(
          0,
          8,
        )} confirmed at ₹${(response.data.baseCost || estimatedCost).toFixed(2)}.`
        setSuccessNotification(successMsg)
        toast.success({
          title: "Booking Confirmed",
          description: successMsg,
        })

        await fetchAllBookings()
        setSlotStart(getDefaultSlotStart())
        setSlotEnd(getDefaultSlotEnd())
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409) {
          const msg =
            (err.response?.data as { message?: string } | undefined)?.message ||
            "Conflict Alert (HTTP 409): Asset is unavailable for this time window."
          setConflictError(msg)
          toast.error({
            title: "Reservation Conflict",
            description: msg,
          })
        } else {
          const msg =
            (err.response?.data as { message?: string } | undefined)?.message ||
            "Booking request failed."
          setConflictError(msg)
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Status updates (Confirm / Reject)
  async function handleUpdateStatus(bookingId: string, status: BookingStatus) {
    try {
      await apiClient.patch(`/bookings/${bookingId}/status?status=${status}`)
      toast.success({
        title: `Status Changed to ${status}`,
        description: `Booking #${bookingId.slice(0, 8)} updated.`,
      })
      await fetchAllBookings()
    } catch {
      toast.error({
        title: "Action Failed",
        description: "Could not update booking status.",
      })
    }
  }

  // Handle Complete & Overtime
  async function handleCompleteBooking(e: FormEvent) {
    e.preventDefault()
    if (!completingBooking) return
    setIsCompleting(true)
    try {
      const hours = Number(actualHoursInput)
      await apiClient.patch(
        `/bookings/${completingBooking.id}/status?status=CONFIRMED&actualHoursUsed=${hours}`,
      )
      toast.success({
        title: "Service Completed & Ledger Updated",
        description: `Recorded ${hours} operating hours for #${completingBooking.id.slice(0, 8)}.`,
      })
      setCompleteModalOpen(false)
      await fetchAllBookings()
    } catch {
      toast.error({
        title: "Completion Failed",
        description: "Could not record actual usage.",
      })
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-zinc-900/80 border border-amber-500/30 rounded-2xl p-6 shadow-xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-100 flex items-center gap-3">
            <Calendar className="size-8 text-amber-400" />
            Dispatch & Approvals Manager
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Review client equipment orders, approve requests, monitor active slots, and record actual usage
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void fetchAssets()
            void fetchAllBookings()
          }}
          disabled={isLoadingAssets || isLoadingBookings}
          className="border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-800 hover:text-amber-400 hover:border-amber-500/30"
        >
          <RefreshCw
            className={cn(
              "size-4 mr-1.5",
              (isLoadingAssets || isLoadingBookings) && "animate-spin",
            )}
          />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Reservation Request Form Card */}
        <Card className="lg:col-span-5 border-zinc-800 bg-zinc-900/80 text-zinc-100 shadow-xl flex flex-col">
          <CardHeader className="border-b border-zinc-800/80 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="size-5 text-amber-400" />
              Direct Dispatch Form
            </CardTitle>
            <CardDescription className="text-zinc-400 text-xs">
              Manually dispatch machinery and create an immediate reservation
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5 flex-1">
            <form
              id="booking-form"
              className="flex flex-col gap-4"
              onSubmit={handleCreateBooking}
            >
              {conflictError ? (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-destructive/50 bg-destructive/10 p-3.5 text-sm text-destructive"
                >
                  <Flame className="size-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold block text-xs uppercase tracking-wide">
                      Booking Conflict (HTTP 409)
                    </span>
                    <span className="text-xs leading-snug">{conflictError}</span>
                  </div>
                </div>
              ) : null}

              {successNotification ? (
                <div
                  role="status"
                  className="flex items-start gap-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3.5 text-sm text-amber-400"
                >
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold block text-xs uppercase tracking-wide">
                      Reservation Created
                    </span>
                    <span className="text-xs leading-snug">
                      {successNotification}
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Asset Selection */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="assetSelect" className="text-zinc-200 text-xs font-semibold">
                  Select Equipment
                </Label>
                {isLoadingAssets ? (
                  <Skeleton className="h-9 w-full bg-zinc-800" />
                ) : (
                  <select
                    id="assetSelect"
                    value={selectedAssetId}
                    onChange={(e) => {
                      setSelectedAssetId(e.target.value)
                      setConflictError(null)
                    }}
                    required
                    disabled={isSubmitting}
                    className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus-visible:border-amber-400 font-medium"
                  >
                    {assets.map((asset) => (
                      <option
                        key={asset.id}
                        value={asset.id}
                        className="bg-zinc-950 text-zinc-200"
                      >
                        {asset.name} (₹{asset.hourlyRate || 100}/hr) — [{asset.category}]
                      </option>
                    ))}
                  </select>
                )}
                {selectedAsset ? (
                  <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800/80 rounded-xl p-3 mt-1">
                    <EquipmentIcon
                      category={selectedAsset.category}
                      name={selectedAsset.name}
                      size="md"
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-bold text-xs text-zinc-200 truncate">
                        {selectedAsset.name}
                      </span>
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-0.5">
                        <span>Rate: <strong className="text-amber-400 font-bold">₹{selectedAsset.hourlyRate || 100}/hr</strong></span>
                        <span>Logged: {selectedAsset.operatingHours}h</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Quick Presets */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-zinc-400 font-medium">Quick Duration Presets</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreset(4)}
                    className="h-7 text-xs border-zinc-800 bg-zinc-950 text-zinc-300 flex-1 hover:text-amber-300 hover:border-amber-500/30"
                  >
                    4 Hours
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreset(8)}
                    className="h-7 text-xs border-zinc-800 bg-zinc-950 text-zinc-300 flex-1 hover:text-amber-300 hover:border-amber-500/30"
                  >
                    8 Hours (Shift)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreset(24)}
                    className="h-7 text-xs border-zinc-800 bg-zinc-950 text-zinc-300 flex-1 hover:text-amber-300 hover:border-amber-500/30"
                  >
                    24 Hours (Day)
                  </Button>
                </div>
              </div>

              {/* Date-Range Inputs */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="slotStart" className="text-zinc-200 text-xs font-semibold">
                    Start Time
                  </Label>
                  <Input
                    id="slotStart"
                    type="datetime-local"
                    value={slotStart}
                    onChange={(e) => setSlotStart(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="border-zinc-800 bg-zinc-950 text-zinc-100 text-xs focus-visible:border-amber-400"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="slotEnd" className="text-zinc-200 text-xs font-semibold">
                    End Time
                  </Label>
                  <Input
                    id="slotEnd"
                    type="datetime-local"
                    value={slotEnd}
                    onChange={(e) => setSlotEnd(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="border-zinc-800 bg-zinc-950 text-zinc-100 text-xs focus-visible:border-amber-400"
                  />
                </div>
              </div>

              {/* Estimated Cost Summary */}
              <div className="flex items-center justify-between text-xs bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
                <span className="text-zinc-400 font-medium">Estimated Base Rental:</span>
                <span className="font-mono text-base font-black text-amber-400">
                  ₹{estimatedCost.toFixed(2)}
                </span>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || assets.length === 0}
                className="mt-2 w-full bg-amber-400 text-zinc-950 font-bold hover:bg-amber-300 shadow-md shadow-amber-500/20"
              >
                {isSubmitting ? (
                  "Processing…"
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Plus className="size-4" />
                    Submit Dispatch Booking
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Incoming Client Bookings Table Card */}
        <Card className="lg:col-span-7 border-zinc-800 bg-zinc-900/80 text-zinc-100 shadow-xl flex flex-col">
          <CardHeader className="border-b border-zinc-800/80 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Building2 className="size-5 text-amber-400" />
                  Client Requests & Active Reservations
                </CardTitle>
                <CardDescription className="text-zinc-400 text-xs mt-0.5">
                  Approve incoming requests, track scheduled vs actual hours, and finalize billing
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-zinc-700 bg-zinc-800 text-zinc-300 font-mono text-xs">
                {allBookings.length} Total
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1">
            {isLoadingBookings ? (
              <div className="space-y-2 p-6">
                <Skeleton className="h-10 w-full bg-zinc-800" />
                <Skeleton className="h-10 w-full bg-zinc-800" />
              </div>
            ) : allBookings.length === 0 ? (
              <div className="py-16 text-center text-sm text-zinc-400">
                <Clock className="size-10 mx-auto mb-3 text-zinc-600" />
                <p className="font-bold text-zinc-300">No client bookings in record</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-zinc-400 text-xs font-semibold">Equipment</TableHead>
                      <TableHead className="text-zinc-400 text-xs font-semibold">Client Company</TableHead>
                      <TableHead className="text-zinc-400 text-xs font-semibold">Slot Timing</TableHead>
                      <TableHead className="text-zinc-400 text-xs font-semibold">Billed Cost</TableHead>
                      <TableHead className="text-zinc-400 text-xs font-semibold">Status</TableHead>
                      <TableHead className="text-zinc-400 text-xs font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allBookings.map((booking) => {
                      const statusMeta =
                        bookingStatusStyles[booking.status] ??
                        bookingStatusStyles.CANCELLED
                      const asset = assetMap.get(booking.assetId)

                      return (
                        <TableRow
                          key={booking.id}
                          className="border-zinc-800/80 hover:bg-zinc-800/40"
                        >
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
                                  ₹{booking.hourlyRateSnapshot || 100}/hr
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-zinc-400 truncate max-w-[100px]">
                            {booking.clientCompanyId.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="text-xs text-zinc-300">
                            <div>{formatDate(booking.slotStart)}</div>
                            <div className="text-zinc-500 text-[11px]">to {formatDate(booking.slotEnd)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-mono text-xs font-bold text-amber-400">
                                ₹{(booking.totalCost || booking.baseCost || 0).toFixed(2)}
                              </span>
                              {booking.overtimeCost && booking.overtimeCost > 0 ? (
                                <span className="font-mono text-[10px] text-yellow-400 font-medium">
                                  +₹{booking.overtimeCost.toFixed(2)} OT
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "border text-[11px] gap-1.5 py-0.5 px-2 inline-flex items-center font-medium",
                                statusMeta.badge,
                              )}
                            >
                              <span
                                className={cn(
                                  "size-1.5 rounded-full",
                                  statusMeta.dot,
                                )}
                              />
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {booking.status === "PENDING" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateStatus(booking.id, "CONFIRMED")}
                                    className="h-7 text-xs bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold gap-1 px-2"
                                  >
                                    <Check className="size-3" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleUpdateStatus(booking.id, "REJECTED")}
                                    className="h-7 text-xs text-destructive hover:bg-destructive/10 px-2"
                                  >
                                    <X className="size-3" />
                                  </Button>
                                </>
                              )}

                              {booking.status === "CONFIRMED" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setCompletingBooking(booking)
                                    const start = new Date(booking.slotStart).getTime()
                                    const end = new Date(booking.slotEnd).getTime()
                                    const schedHours = Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10
                                    setActualHoursInput(String(booking.actualHoursUsed || schedHours))
                                    setCompleteModalOpen(true)
                                  }}
                                  className="h-7 text-[11px] border-zinc-800 text-zinc-300 hover:text-amber-400 hover:border-amber-500/30"
                                >
                                  Record Usage
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedInvoiceBooking(booking)
                                  setInvoiceModalOpen(true)
                                }}
                                className="h-7 text-xs text-zinc-300 hover:text-amber-400 hover:bg-amber-500/10 gap-1 px-1.5 font-medium"
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
      </div>

      {/* Record Actual Hours Modal */}
      <Dialog open={completeModalOpen} onOpenChange={setCompleteModalOpen}>
        <DialogContent className="border-amber-500/30 bg-zinc-950 text-zinc-100 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <DollarSign className="size-5 text-amber-400" />
              Record Actual Operating Usage
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Enter total hours the client utilized this equipment. Extra hours will automatically calculate overtime surcharge (1.5× rate).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCompleteBooking} className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="actual-hrs" className="text-xs font-semibold text-zinc-300">Actual Operating Hours</Label>
              <Input
                id="actual-hrs"
                type="number"
                step="0.1"
                min="0.1"
                value={actualHoursInput}
                onChange={(e) => setActualHoursInput(e.target.value)}
                required
                disabled={isCompleting}
                className="border-zinc-800 bg-zinc-900 text-zinc-100 font-mono text-sm focus-visible:border-amber-400"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCompleteModalOpen(false)}
                className="border-zinc-800 text-zinc-300 hover:bg-zinc-900"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCompleting}
                className="bg-amber-400 text-zinc-950 font-bold hover:bg-amber-300 shadow-md shadow-amber-500/20"
              >
                {isCompleting ? "Saving…" : "Save & Finalize Invoice"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invoice Modal for Fleet Manager */}
      <InvoiceModal
        open={invoiceModalOpen}
        onOpenChange={setInvoiceModalOpen}
        booking={selectedInvoiceBooking}
        asset={selectedInvoiceBooking ? assetMap.get(selectedInvoiceBooking.assetId) : null}
      />
    </div>
  )
}
