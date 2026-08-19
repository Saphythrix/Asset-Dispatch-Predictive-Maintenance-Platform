import axios from "axios"
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react"
import {
  AlertCircle,
  Clock,
  DollarSign,
  Edit,
  Filter,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Truck,
  Wrench,
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
import type { Asset, AssetStatus, CreateAssetRequest } from "@/types/api"

const statusStyles: Record<AssetStatus, { badge: string; dot: string }> = {
  AVAILABLE: {
    badge: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    dot: "bg-amber-400",
  },
  RESERVED: {
    badge: "border-zinc-600 bg-zinc-800 text-zinc-300",
    dot: "bg-zinc-400",
  },
  IN_MAINTENANCE: {
    badge: "border-yellow-600/40 bg-yellow-600/10 text-yellow-500",
    dot: "bg-yellow-500",
  },
  DECOMMISSIONED: {
    badge: "border-zinc-800 bg-zinc-900 text-zinc-500",
    dot: "bg-zinc-600",
  },
}

function formatStatus(status: AssetStatus) {
  return status.replaceAll("_", " ")
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

function toLocalDateTime(value: string) {
  return value.length === 16 ? `${value}:00` : value
}

const defaultDue = () => {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString().slice(0, 16)
}

const CATEGORY_PRESETS = [
  "BULLDOZER",
  "HAUL_TRUCK",
  "CRANE",
  "EXCAVATOR",
  "OSCILLOSCOPE",
  "OHMMETER",
  "COMPUTER",
  "FORKLIFT",
  "GENERATOR",
  "CONCRETE_MIXER",
  "SPECTRUM_ANALYZER",
  "WELDING_MACHINE",
  "SURVEYING_STATION",
  "HEAVY_MACHINERY",
]

const emptyForm = {
  serialNumber: "",
  name: "",
  category: "BULLDOZER",
  maintenanceThresholdHours: "500",
  hourlyRate: "150",
  nextMaintenanceDue: "",
}

export default function FleetCatalog() {
  const { companyId } = useAuth()
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    nextMaintenanceDue: defaultDue(),
  }))

  // Price Edit Modal
  const [priceModalOpen, setPriceModalOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [newPrice, setNewPrice] = useState<string>("100")
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false)

  const fetchAssets = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const endpoint = companyId ? `/assets/company/${companyId}` : "/assets"
      const { data } = await apiClient.get<Asset[]>(endpoint)
      setAssets(data || [])
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          (err.response?.data as { message?: string } | undefined)?.message ??
          "Failed to load fleet assets."
        setError(message)
      } else {
        setError("Failed to load fleet assets.")
      }
    } finally {
      setIsLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    void fetchAssets()
  }, [fetchAssets])

  const metrics = useMemo(
    () => ({
      total: assets.length,
      available: assets.filter((asset) => asset.status === "AVAILABLE").length,
      inMaintenance: assets.filter(
        (asset) => asset.status === "IN_MAINTENANCE",
      ).length,
      reserved: assets.filter((asset) => asset.status === "RESERVED").length,
    }),
    [assets],
  )

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesSearch =
        searchQuery === "" ||
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.category.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === "ALL" || asset.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [assets, searchQuery, statusFilter])

  function resetForm() {
    setForm({
      ...emptyForm,
      nextMaintenanceDue: defaultDue(),
    })
    setFormError(null)
  }

  async function handleRegisterAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!companyId) {
      setFormError("Company context is missing. Please sign in again.")
      return
    }

    setFormError(null)
    setIsSubmitting(true)

    const payload: CreateAssetRequest = {
      clientCompanyId: companyId,
      serialNumber: form.serialNumber.trim(),
      name: form.name.trim(),
      category: form.category.trim(),
      maintenanceThresholdHours: Number(form.maintenanceThresholdHours),
      hourlyRate: Number(form.hourlyRate) || 100,
      nextMaintenanceDue: toLocalDateTime(form.nextMaintenanceDue),
    }

    try {
      await apiClient.post<Asset>("/assets", payload)
      setDialogOpen(false)
      resetForm()
      await fetchAssets()
      toast.success({
        title: "Asset Registered",
        description: `Successfully added ${form.name} (${form.category}) at ₹${form.hourlyRate}/hr.`,
      })
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message =
          (err.response?.data as { message?: string } | undefined)?.message ??
          "Failed to register asset. Please check the form and try again."
        setFormError(message)
      } else {
        setFormError("Failed to register asset. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdatePrice(e: FormEvent) {
    e.preventDefault()
    if (!editingAsset) return
    setIsUpdatingPrice(true)
    try {
      await apiClient.patch(
        `/assets/${editingAsset.id}/price?hourlyRate=${Number(newPrice)}`,
      )
      toast.success({
        title: "Rate Updated",
        description: `Hourly price for ${editingAsset.name} set to ₹${newPrice}/hr.`,
      })
      setPriceModalOpen(false)
      await fetchAssets()
    } catch {
      toast.error({
        title: "Price Update Failed",
        description: "Could not update monthly hourly rate.",
      })
    } finally {
      setIsUpdatingPrice(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-zinc-900/80 border border-amber-500/30 rounded-2xl p-6 shadow-xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-100 flex items-center gap-3">
            <Truck className="size-8 text-amber-400" />
            Equipment & Machinery Operations
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Contractor fleet management, electronic testing instruments, and monthly rental pricing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAssets()}
            disabled={isLoading}
            className="border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-800 hover:text-amber-400 hover:border-amber-500/30"
          >
            <RefreshCw
              className={cn("size-4 mr-1.5", isLoading && "animate-spin")}
            />
            Refresh
          </Button>

          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) {
                resetForm()
              }
            }}
          >
            <DialogTrigger render={<Button className="bg-amber-400 text-zinc-950 font-bold hover:bg-amber-300 gap-1.5 shadow-lg shadow-amber-500/15" />}>
              <Plus className="size-4" />
              Register Equipment
            </DialogTrigger>
            <DialogContent className="border-amber-500/30 bg-zinc-950 text-zinc-100 sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Truck className="size-5 text-amber-400" />
                  Register New Fleet Asset
                </DialogTitle>
                <DialogDescription className="text-zinc-400 text-xs">
                  Register heavy machinery, testing instruments, or computers with monthly hourly rental rates.
                </DialogDescription>
              </DialogHeader>

              <form
                id="register-asset-form"
                className="flex flex-col gap-4 py-2"
                onSubmit={handleRegisterAsset}
              >
                {formError ? (
                  <div
                    role="alert"
                    className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                  >
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor="serialNumber" className="text-xs text-zinc-300 font-medium">
                      Serial Number / VIN / Asset Tag
                    </Label>
                    <Input
                      id="serialNumber"
                      placeholder="e.g. CAT-D8T-8820 or TEK-DSO-4054"
                      value={form.serialNumber}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          serialNumber: event.target.value,
                        }))
                      }
                      required
                      disabled={isSubmitting}
                      className="border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-400"
                    />
                  </div>

                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor="name" className="text-xs text-zinc-300 font-medium">
                      Equipment Name / Model
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g. Caterpillar D8T Bulldozer, Tektronix Oscilloscope"
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      required
                      disabled={isSubmitting}
                      className="border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-400"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="category-select" className="text-xs text-zinc-300 font-medium">
                      Equipment Category
                    </Label>
                    <select
                      id="category-select"
                      value={form.category}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          category: e.target.value,
                        }))
                      }
                      required
                      disabled={isSubmitting}
                      className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-100 outline-none focus-visible:border-amber-400 font-medium"
                    >
                      {CATEGORY_PRESETS.map((cat) => (
                        <option key={cat} value={cat} className="bg-zinc-950 text-zinc-200">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="hourlyRate" className="text-xs text-zinc-300 font-medium">
                      Rental Rate (₹/hr)
                    </Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      min={1}
                      value={form.hourlyRate}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          hourlyRate: event.target.value,
                        }))
                      }
                      required
                      disabled={isSubmitting}
                      className="border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-400 font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="maintenanceThresholdHours" className="text-xs text-zinc-300 font-medium">
                      Service Threshold (Hrs)
                    </Label>
                    <Input
                      id="maintenanceThresholdHours"
                      type="number"
                      min={1}
                      value={form.maintenanceThresholdHours}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          maintenanceThresholdHours: event.target.value,
                        }))
                      }
                      required
                      disabled={isSubmitting}
                      className="border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-400 font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="nextMaintenanceDue" className="text-xs text-zinc-300 font-medium">
                      Next Calibration / Service Date
                    </Label>
                    <Input
                      id="nextMaintenanceDue"
                      type="datetime-local"
                      value={form.nextMaintenanceDue}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          nextMaintenanceDue: event.target.value,
                        }))
                      }
                      required
                      disabled={isSubmitting}
                      className="border-zinc-800 bg-zinc-900 text-zinc-100 text-xs focus-visible:border-amber-400"
                    />
                  </div>
                </div>
              </form>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setDialogOpen(false)}
                  className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="register-asset-form"
                  disabled={isSubmitting}
                  className="bg-amber-400 text-zinc-950 font-bold hover:bg-amber-300"
                >
                  {isSubmitting ? "Registering…" : "Confirm Registration"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Fleet Assets"
          value={metrics.total}
          description="Total machinery & tools under management"
          isLoading={isLoading}
          icon={Layers}
        />
        <MetricCard
          title="Available for Dispatch"
          value={metrics.available}
          description="Ready for immediate contractor assignment"
          isLoading={isLoading}
          icon={Truck}
          valueClassName="text-amber-400"
          borderClassName="border-amber-500/30"
        />
        <MetricCard
          title="In Maintenance / Calibration"
          value={metrics.inMaintenance}
          description="Work orders active or scheduled"
          isLoading={isLoading}
          icon={Wrench}
          valueClassName="text-zinc-300"
        />
        <MetricCard
          title="Currently Reserved"
          value={metrics.reserved}
          description="Operating under active contractor dispatches"
          isLoading={isLoading}
          icon={Clock}
          valueClassName="text-zinc-300"
        />
      </div>

      {/* Assets Inventory Table Card */}
      <Card className="border-zinc-800 bg-zinc-900/80 text-zinc-100 shadow-xl">
        <CardHeader className="p-4 sm:p-6 border-b border-zinc-800/80">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Layers className="size-5 text-amber-400" />
                Equipment Inventory & Monthly Rate Setting
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs mt-0.5">
                Current telemetry hours, set hourly rental rates, and service schedules
              </CardDescription>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[220px] flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-2.5 size-4 text-zinc-500" />
                <Input
                  placeholder="Search serial, name, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 border-zinc-800 bg-zinc-950 pl-8 text-xs text-zinc-100 placeholder:text-zinc-600 focus-visible:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1">
                <Filter className="size-3.5 text-amber-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs text-zinc-300 outline-none cursor-pointer font-medium"
                >
                  <option value="ALL" className="bg-zinc-950 text-zinc-200">
                    All Statuses
                  </option>
                  <option value="AVAILABLE" className="bg-zinc-950 text-zinc-200">
                    Available
                  </option>
                  <option value="RESERVED" className="bg-zinc-950 text-zinc-200">
                    Reserved
                  </option>
                  <option value="IN_MAINTENANCE" className="bg-zinc-950 text-zinc-200">
                    In Maintenance
                  </option>
                  <option value="DECOMMISSIONED" className="bg-zinc-950 text-zinc-200">
                    Decommissioned
                  </option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div
              role="alert"
              className="m-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive"
            >
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {isLoading ? (
            <div className="space-y-2 p-6">
              <Skeleton className="h-10 w-full bg-zinc-800" />
              <Skeleton className="h-10 w-full bg-zinc-800" />
              <Skeleton className="h-10 w-full bg-zinc-800" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="py-16 text-center text-sm text-zinc-400">
              <Truck className="size-10 mx-auto mb-3 text-zinc-600" />
              <p className="font-bold text-zinc-300">No equipment found</p>
              <p className="text-xs text-zinc-500 mt-1">
                {searchQuery || statusFilter !== "ALL"
                  ? "Try changing your search query or status filter."
                  : "Register your first equipment unit using the button above."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400 font-medium text-xs">Equipment</TableHead>
                    <TableHead className="text-zinc-400 font-medium text-xs">Serial / VIN</TableHead>
                    <TableHead className="text-zinc-400 font-medium text-xs">Category</TableHead>
                    <TableHead className="text-zinc-400 font-medium text-xs">Monthly Rate</TableHead>
                    <TableHead className="text-zinc-400 font-medium text-xs">Operating Hours</TableHead>
                    <TableHead className="text-zinc-400 font-medium text-xs">Status</TableHead>
                    <TableHead className="text-zinc-400 font-medium text-xs text-right">Pricing Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => {
                    const statusMeta =
                      statusStyles[asset.status] ?? statusStyles.DECOMMISSIONED

                    return (
                      <TableRow
                        key={asset.id}
                        className="border-zinc-800/80 hover:bg-zinc-800/40 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <EquipmentIcon
                              category={asset.category}
                              name={asset.name}
                              size="md"
                            />
                            <span className="font-bold text-zinc-100 text-xs">
                              {asset.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-zinc-400">
                          {asset.serialNumber}
                        </TableCell>
                        <TableCell className="text-zinc-400 text-xs">
                          <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-300">
                            {asset.category}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm font-bold text-amber-400">
                            ₹{(asset.hourlyRate || 100).toFixed(2)}/hr
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-mono font-medium text-zinc-300 text-xs">
                              {asset.operatingHours}h / {asset.maintenanceThresholdHours}h
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              Next: {formatDate(asset.nextMaintenanceDue)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "border text-xs gap-1.5 py-0.5 px-2.5 inline-flex items-center font-medium",
                              statusMeta.badge,
                            )}
                          >
                            <span className={cn("size-1.5 rounded-full", statusMeta.dot)} />
                            {formatStatus(asset.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingAsset(asset)
                              setNewPrice(String(asset.hourlyRate || 100))
                              setPriceModalOpen(true)
                            }}
                            className="h-8 text-xs text-zinc-300 hover:text-amber-400 hover:bg-amber-500/10 gap-1.5 font-medium"
                          >
                            <Edit className="size-3.5" />
                            Set Rate
                          </Button>
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

      {/* Edit Price Modal */}
      <Dialog open={priceModalOpen} onOpenChange={setPriceModalOpen}>
        <DialogContent className="border-amber-500/30 bg-zinc-950 text-zinc-100 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <DollarSign className="size-5 text-amber-400" />
              Adjust Monthly Hourly Rate
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Set the rental dispatch rate for <strong className="text-zinc-200">{editingAsset?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdatePrice} className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-rate" className="text-xs font-medium text-zinc-300">Hourly Rate (INR ₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-zinc-400 text-sm font-semibold">₹</span>
                <Input
                  id="edit-rate"
                  type="number"
                  min={1}
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  required
                  disabled={isUpdatingPrice}
                  className="pl-7 border-zinc-800 bg-zinc-900 text-zinc-100 font-mono text-sm focus-visible:border-amber-400"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPriceModalOpen(false)}
                className="border-zinc-800 text-zinc-300 hover:bg-zinc-900"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdatingPrice}
                className="bg-amber-400 text-zinc-950 font-bold hover:bg-amber-300 shadow-md shadow-amber-500/15"
              >
                {isUpdatingPrice ? "Updating…" : "Save New Rate"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MetricCard({
  title,
  value,
  description,
  isLoading,
  icon: Icon,
  valueClassName,
  borderClassName,
}: {
  title: string
  value: number
  description: string
  isLoading: boolean
  icon?: React.ComponentType<{ className?: string }>
  valueClassName?: string
  borderClassName?: string
}) {
  return (
    <Card
      className={cn(
        "border-zinc-800 bg-zinc-900/80 text-zinc-100 shadow-md",
        borderClassName,
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
          {title}
        </CardDescription>
        {Icon ? <Icon className="size-4 text-zinc-500" /> : null}
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-3xl font-black tracking-tight tabular-nums",
            valueClassName,
          )}
        >
          {isLoading ? <Skeleton className="h-8 w-16 bg-zinc-800" /> : value}
        </div>
        <p className="text-xs text-zinc-500 mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}
