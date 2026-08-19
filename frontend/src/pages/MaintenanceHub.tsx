import axios from "axios"
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Hammer,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  UserCheck,
  UserPlus,
  Wrench,
  XCircle,
} from "lucide-react"

import { apiClient } from "@/api/client"
import { EquipmentIcon } from "@/components/icons/EquipmentIcon"
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
import { toast } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"
import type {
  Asset,
  CreateWorkOrderRequest,
  WorkOrder,
  WorkOrderState,
} from "@/types/api"

const kanbanColumns: {
  state: WorkOrderState
  title: string
  icon: React.ComponentType<{ className?: string }>
  badgeStyle: string
  columnHeaderStyle: string
}[] = [
  {
    state: "CREATED",
    title: "Created / Backlog",
    icon: Clock,
    badgeStyle: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    columnHeaderStyle: "border-blue-500/40 text-blue-400",
  },
  {
    state: "ASSIGNED",
    title: "Assigned",
    icon: UserCheck,
    badgeStyle: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    columnHeaderStyle: "border-purple-500/40 text-purple-400",
  },
  {
    state: "IN_PROGRESS",
    title: "In Progress",
    icon: Hammer,
    badgeStyle: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    columnHeaderStyle: "border-amber-500/40 text-amber-400",
  },
  {
    state: "COMPLETED",
    title: "Completed",
    icon: CheckCircle,
    badgeStyle: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    columnHeaderStyle: "border-emerald-500/40 text-emerald-400",
  },
  {
    state: "FAILED",
    title: "Failed / Blocked",
    icon: XCircle,
    badgeStyle: "border-destructive/30 bg-destructive/10 text-destructive",
    columnHeaderStyle: "border-destructive/40 text-destructive",
  },
]

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

function toLocalDateTime(value: string) {
  return value.length === 16 ? `${value}:00` : value
}

const defaultScheduledTime = () => {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  date.setHours(10, 0, 0, 0)
  return date.toISOString().slice(0, 16)
}

export default function MaintenanceHub() {
  const { companyId, userId } = useAuth()
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [transitioningId, setTransitioningId] = useState<string | null>(null)

  // Create Work Order modal state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [selectedAssetId, setSelectedAssetId] = useState("")
  const [scheduledAt, setScheduledAt] = useState(defaultScheduledTime)

  // Technician assignment modal state for ASSIGNED transition
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignWorkOrderId, setAssignWorkOrderId] = useState<string | null>(null)
  const [technicianIdInput, setTechnicianIdInput] = useState("")

  // Fetch company fleet assets
  const fetchAssets = useCallback(async () => {
    try {
      const endpoint = companyId ? `/assets/company/${companyId}` : "/assets"
      const { data } = await apiClient.get<Asset[]>(endpoint)
      setAssets(data || [])
      if (data && data.length > 0 && !selectedAssetId) {
        setSelectedAssetId(data[0].id)
      }
    } catch {
      // Ignored
    }
  }, [companyId, selectedAssetId])

  // Load / refresh work orders
  const fetchWorkOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch assets first
      try {
        const endpoint = companyId ? `/assets/company/${companyId}` : "/assets"
        const { data: assetList } = await apiClient.get<Asset[]>(endpoint)
        setAssets(assetList || [])
      } catch {
        try {
          const { data: assetList } = await apiClient.get<Asset[]>("/assets")
          setAssets(assetList || [])
        } catch {
          // Continue
        }
      }

      try {
        const { data } = await apiClient.get<WorkOrder[]>("/work-orders")
        if (Array.isArray(data)) {
          setWorkOrders(data)
          return
        }
      } catch {
        // Fallback to stored IDs if bulk endpoint not available
      }

      const storedIds: string[] = JSON.parse(
        localStorage.getItem("active_work_order_ids") || "[]",
      )

      if (storedIds.length > 0) {
        const fetchedOrders: WorkOrder[] = []
        for (const id of storedIds) {
          try {
            const { data } = await apiClient.get<WorkOrder>(`/work-orders/${id}`)
            fetchedOrders.push(data)
          } catch {
            // If deleted or not found, skip
          }
        }
        setWorkOrders(fetchedOrders)
      }
    } catch (err) {
      console.error("Failed to load work orders", err)
    } finally {
      setIsLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    void fetchWorkOrders()
    void fetchAssets()
  }, [fetchWorkOrders, fetchAssets])

  // Save work order IDs locally for tracking in the Kanban board
  const recordWorkOrderId = useCallback((id: string) => {
    const storedIds: string[] = JSON.parse(
      localStorage.getItem("active_work_order_ids") || "[]",
    )
    if (!storedIds.includes(id)) {
      const updated = [id, ...storedIds]
      localStorage.setItem("active_work_order_ids", JSON.stringify(updated))
    }
  }, [])

  // Create a new work order
  async function handleCreateWorkOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedAssetId) {
      setCreateError("Please select an asset.")
      return
    }

    setCreateError(null)
    setIsSubmitting(true)

    const payload: CreateWorkOrderRequest = {
      assetId: selectedAssetId,
      scheduledAt: toLocalDateTime(scheduledAt),
    }

    try {
      const { data } = await apiClient.post<WorkOrder>("/work-orders", payload)
      recordWorkOrderId(data.id)
      setWorkOrders((prev) => [data, ...prev.filter((wo) => wo.id !== data.id)])
      setCreateDialogOpen(false)
      setScheduledAt(defaultScheduledTime())
      toast.success({
        title: "Work Order Created",
        description: `Work order #${data.id.slice(0, 8)} registered successfully in CREATED state.`,
      })
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg =
          (err.response?.data as { message?: string } | undefined)?.message ??
          "Failed to create work order. Check asset state."
        setCreateError(msg)
      } else {
        setCreateError("An unexpected error occurred.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // State Transition function: PATCH /work-orders/{id}/transition?targetState=:state&technicianId=:technicianId
  async function handleTransition(
    workOrderId: string,
    targetState: WorkOrderState,
    techId?: string,
  ) {
    setTransitioningId(workOrderId)
    try {
      const params = new URLSearchParams()
      params.append("targetState", targetState)
      if (techId) {
        params.append("technicianId", techId)
      }

      const { data } = await apiClient.patch<WorkOrder>(
        `/work-orders/${workOrderId}/transition?${params.toString()}`,
      )

      setWorkOrders((prev) =>
        prev.map((order) => (order.id === data.id ? data : order)),
      )

      toast.success({
        title: `State Transitioned to ${targetState}`,
        description: `Work order #${workOrderId.slice(0, 8)} is now ${targetState}.`,
      })
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg =
          (err.response?.data as { message?: string } | undefined)?.message ||
          `Transition to ${targetState} is not allowed by state machine logic.`
        toast.error({
          title: "State Transition Failed",
          description: msg,
        })
      } else {
        toast.error({
          title: "Transition Error",
          description: "Could not execute state transition.",
        })
      }
    } finally {
      setTransitioningId(null)
      setAssignDialogOpen(false)
      setAssignWorkOrderId(null)
      setTechnicianIdInput("")
    }
  }

  function promptTechnicianAssignment(workOrderId: string) {
    setAssignWorkOrderId(workOrderId)
    setTechnicianIdInput(userId || "")
    setAssignDialogOpen(true)
  }

  const assetMap = useMemo(() => {
    return new Map(assets.map((a) => [a.id, a]))
  }, [assets])

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <Wrench className="size-7 text-emerald-400" />
            Maintenance Hub
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Kanban workflow state machine (CREATED → ASSIGNED → IN_PROGRESS → COMPLETED)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchWorkOrders()}
            disabled={isLoading}
            className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <RefreshCw
              className={cn("size-4 mr-1.5", isLoading && "animate-spin")}
            />
            Refresh Kanban
          </Button>

          {/* Create Work Order Modal */}
          <Dialog
            open={createDialogOpen}
            onOpenChange={(open) => {
              setCreateDialogOpen(open)
              if (!open) setCreateError(null)
            }}
          >
            <DialogTrigger render={<Button className="bg-emerald-500 text-zinc-950 font-medium hover:bg-emerald-400 gap-1.5" />}>
              <Plus className="size-4" />
              New Work Order
            </DialogTrigger>
            <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">
                  Create Maintenance Work Order
                </DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Initiate a maintenance cycle for an asset in need of repair or scheduled service.
                </DialogDescription>
              </DialogHeader>

              <form
                id="create-work-order-form"
                className="flex flex-col gap-4 py-2"
                onSubmit={handleCreateWorkOrder}
              >
                {createError ? (
                  <div
                    role="alert"
                    className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{createError}</span>
                  </div>
                ) : null}

                <div className="flex flex-col gap-2">
                  <Label htmlFor="wo-asset-select">Target Asset</Label>
                  <select
                    id="wo-asset-select"
                    value={selectedAssetId}
                    onChange={(e) => setSelectedAssetId(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 outline-none focus-visible:border-emerald-500"
                  >
                    {assets.length === 0 ? (
                      <option value="">No assets registered</option>
                    ) : (
                      assets.map((asset) => (
                        <option
                          key={asset.id}
                          value={asset.id}
                          className="bg-zinc-950"
                        >
                          {asset.name} ({asset.serialNumber}) — {asset.operatingHours}h
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="wo-scheduled-at">Scheduled Service Time</Label>
                  <Input
                    id="wo-scheduled-at"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="border-zinc-800 bg-zinc-900 text-zinc-100 text-xs"
                  />
                </div>
              </form>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setCreateDialogOpen(false)}
                  className="border-zinc-800 bg-zinc-900 text-zinc-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="create-work-order-form"
                  disabled={isSubmitting || assets.length === 0}
                  className="bg-emerald-500 text-zinc-950 font-medium hover:bg-emerald-400"
                >
                  {isSubmitting ? "Creating…" : "Initialize Work Order"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Technician Assignment Dialog */}
      <Dialog
        open={assignDialogOpen}
        onOpenChange={(open) => {
          setAssignDialogOpen(open)
          if (!open) setAssignWorkOrderId(null)
        }}
      >
        <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <UserPlus className="size-5 text-purple-400" />
              Assign Technician
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Provide the Technician UUID to transition work order to ASSIGNED state.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <Label htmlFor="tech-id" className="text-xs">Technician ID</Label>
            <Input
              id="tech-id"
              placeholder="e.g. 11111111-1111-1111-1111-111111111111"
              value={technicianIdInput}
              onChange={(e) => setTechnicianIdInput(e.target.value)}
              className="border-zinc-800 bg-zinc-900 text-xs font-mono"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAssignDialogOpen(false)}
              className="border-zinc-800 text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (assignWorkOrderId) {
                  void handleTransition(
                    assignWorkOrderId,
                    "ASSIGNED",
                    technicianIdInput.trim() || undefined,
                  )
                }
              }}
              className="bg-purple-600 text-white hover:bg-purple-500 text-xs font-medium"
            >
              Confirm Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {kanbanColumns.map((col) => {
          const ColIcon = col.icon
          const columnOrders = workOrders.filter((wo) => wo.state === col.state)

          return (
            <div
              key={col.state}
              className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 min-h-[500px]"
            >
              {/* Column Header */}
              <div
                className={cn(
                  "flex items-center justify-between border-b pb-2.5 mb-3 px-1",
                  col.columnHeaderStyle,
                )}
              >
                <div className="flex items-center gap-2">
                  <ColIcon className="size-4" />
                  <span className="font-semibold text-xs uppercase tracking-wider">
                    {col.title}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={cn("text-xs font-mono px-2 py-0", col.badgeStyle)}
                >
                  {columnOrders.length}
                </Badge>
              </div>

              {/* Cards Container */}
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                {columnOrders.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center p-6 text-center text-xs text-zinc-500 border border-dashed border-zinc-800/80 rounded-lg">
                    No work orders in {col.state.toLowerCase()}
                  </div>
                ) : (
                  columnOrders.map((order) => {
                    const asset = assetMap.get(order.assetId)
                    const isTransitioning = transitioningId === order.id

                    return (
                      <Card
                        key={order.id}
                        className="border-zinc-800 bg-zinc-950 text-zinc-100 shadow-md hover:border-zinc-700 transition-all"
                      >
                        <CardHeader className="p-3 pb-2 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] text-zinc-400">
                              #{order.id.slice(0, 8)}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1.5 py-0 font-medium",
                                col.badgeStyle,
                              )}
                            >
                              {order.state}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <EquipmentIcon
                              category={asset?.category}
                              name={asset?.name}
                              size="sm"
                            />
                            <div className="flex flex-col min-w-0 flex-1">
                              <CardTitle className="text-xs font-bold text-zinc-100 truncate">
                                {asset ? asset.name : "Equipment Unit"}
                              </CardTitle>
                              <CardDescription className="text-[10px] text-zinc-400 truncate">
                                SN: {asset?.serialNumber || order.assetId.slice(0, 8)}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="p-3 pt-0 flex flex-col gap-2.5">
                          <div className="flex flex-col gap-1 text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-2">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Clock className="size-3 text-zinc-500" />
                                Scheduled:
                              </span>
                              <span className="text-zinc-300 font-medium truncate ml-1">
                                {formatDate(order.scheduledAt)}
                              </span>
                            </div>
                            {order.technicianId ? (
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <UserCheck className="size-3 text-zinc-500" />
                                  Tech:
                                </span>
                                <span className="font-mono text-zinc-300 truncate max-w-[100px]">
                                  {order.technicianId.slice(0, 8)}
                                </span>
                              </div>
                            ) : null}
                          </div>

                          {/* State Transition Actions */}
                          <div className="flex flex-col gap-1.5 pt-1 border-t border-zinc-800/80">
                            {order.state === "CREATED" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    promptTechnicianAssignment(order.id)
                                  }
                                  disabled={isTransitioning}
                                  className="h-7 text-xs bg-purple-600 hover:bg-purple-500 text-white font-medium gap-1 justify-center"
                                >
                                  <UserPlus className="size-3" />
                                  Assign Tech
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleTransition(order.id, "FAILED")
                                  }
                                  disabled={isTransitioning}
                                  className="h-6 text-[11px] text-destructive hover:bg-destructive/10"
                                >
                                  Mark Failed
                                </Button>
                              </>
                            )}

                            {order.state === "ASSIGNED" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleTransition(order.id, "IN_PROGRESS")
                                  }
                                  disabled={isTransitioning}
                                  className="h-7 text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold gap-1 justify-center"
                                >
                                  <Play className="size-3" />
                                  Start Service
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleTransition(order.id, "FAILED")
                                  }
                                  disabled={isTransitioning}
                                  className="h-6 text-[11px] text-destructive hover:bg-destructive/10"
                                >
                                  Mark Failed
                                </Button>
                              </>
                            )}

                            {order.state === "IN_PROGRESS" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleTransition(order.id, "COMPLETED")
                                  }
                                  disabled={isTransitioning}
                                  className="h-7 text-xs bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold gap-1 justify-center"
                                >
                                  <CheckCircle className="size-3" />
                                  Complete Service
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleTransition(order.id, "FAILED")
                                  }
                                  disabled={isTransitioning}
                                  className="h-6 text-[11px] text-destructive hover:bg-destructive/10"
                                >
                                  Mark Failed
                                </Button>
                              </>
                            )}

                            {order.state === "FAILED" && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleTransition(order.id, "CREATED")
                                }
                                disabled={isTransitioning}
                                className="h-7 text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium gap-1 justify-center"
                              >
                                <RotateCcw className="size-3" />
                                Retry Work Order
                              </Button>
                            )}

                            {order.state === "COMPLETED" && (
                              <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-400 font-medium py-1">
                                <CheckCircle className="size-3.5" />
                                Service Resolved
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
