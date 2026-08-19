import { useRef } from "react"
import { Printer, ShieldCheck, Truck } from "lucide-react"

import { EquipmentIcon } from "@/components/icons/EquipmentIcon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type { Asset, Booking } from "@/types/api"

interface InvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: Booking | null
  asset?: Asset | null
  clientEmail?: string
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

export function InvoiceModal({
  open,
  onOpenChange,
  booking,
  asset,
  clientEmail,
}: InvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null)

  if (!booking) return null

  const invoiceNumber = `INV-${booking.id.slice(0, 8).toUpperCase()}`
  const invoiceDate = formatDate(booking.createdAt || booking.slotStart)
  const rate = booking.hourlyRateSnapshot || asset?.hourlyRate || 100

  // Calculate scheduled hours
  const start = new Date(booking.slotStart).getTime()
  const end = new Date(booking.slotEnd).getTime()
  const scheduledHours =
    !isNaN(start) && !isNaN(end) && end > start
      ? Math.round(((end - start) / (1000 * 60 * 60)) * 10) / 10
      : 1

  const actualHours = booking.actualHoursUsed || scheduledHours
  const baseCost = booking.baseCost || scheduledHours * rate
  const overtimeHours = booking.overtimeHours || Math.max(0, actualHours - scheduledHours)
  const overtimeCost = booking.overtimeCost || (overtimeHours > 0 ? overtimeHours * (rate * 1.5) : 0)
  const subtotal = baseCost + overtimeCost

  // GST 18% (9% CGST + 9% SGST)
  const cgst = subtotal * 0.09
  const sgst = subtotal * 0.09
  const totalTax = cgst + sgst
  const grandTotal = subtotal + totalTax

  function handlePrint() {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-amber-500/30 bg-zinc-950 text-zinc-100 sm:max-w-2xl max-h-[92vh] overflow-y-auto p-0 shadow-2xl">
        {/* Printable Invoice Container */}
        <div
          ref={invoiceRef}
          className="p-6 sm:p-8 flex flex-col gap-6 bg-zinc-950 text-zinc-100 print:bg-white print:text-black print:p-8"
        >
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-zinc-800 print:border-zinc-300 pb-6">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 font-bold print:border-black print:text-black">
                  <Truck className="size-5" />
                </span>
                <span className="text-xl font-black tracking-tight text-zinc-100 print:text-black">
                  Apex<span className="text-amber-400 print:text-black">Fleet</span> Logistics
                </span>
              </div>
              <p className="text-xs text-zinc-400 print:text-zinc-600 max-w-xs">
                Industrial Equipment Dispatch & Heavy Machinery Rentals
                <br />
                GSTIN: <strong>27AABCA1234F1Z5</strong> • CIN: U72900MH2024PTC123456
                <br />
                Plot 42, Logistics Park, MIDC Industrial Area, Mumbai 400093
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-1">
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/10 text-amber-400 print:border-black print:text-black text-xs font-mono font-bold px-2.5 py-0.5 w-fit"
              >
                TAX INVOICE
              </Badge>
              <span className="font-mono text-lg font-black text-zinc-100 print:text-black mt-1">
                {invoiceNumber}
              </span>
              <span className="text-xs text-zinc-400 print:text-zinc-600">
                Date: {invoiceDate}
              </span>
              <Badge
                variant="outline"
                className="mt-1 border-zinc-700 bg-zinc-900 text-zinc-300 print:border-zinc-400 print:text-zinc-800 text-[10px] uppercase font-semibold"
              >
                Status: {booking.status}
              </Badge>
            </div>
          </div>

          {/* Bill To & Dispatch Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs border-b border-zinc-800 print:border-zinc-300 pb-6">
            <div className="flex flex-col gap-1">
              <span className="text-zinc-500 print:text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                Billed To (Client Enterprise)
              </span>
              <strong className="text-sm font-bold text-zinc-100 print:text-black">
                {clientEmail ? clientEmail.split("@")[0].toUpperCase() : "Contractor Organization"}
              </strong>
              <span className="text-zinc-400 print:text-zinc-700 font-mono">
                Client ID: #{booking.clientCompanyId}
              </span>
              {clientEmail ? (
                <span className="text-zinc-400 print:text-zinc-700">
                  Email: {clientEmail}
                </span>
              ) : null}
            </div>

            <div className="flex flex-col gap-1 sm:text-right">
              <span className="text-zinc-500 print:text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                Dispatch Schedule Window
              </span>
              <div className="text-zinc-300 print:text-zinc-800">
                <strong>Start:</strong> {formatDate(booking.slotStart)}
              </div>
              <div className="text-zinc-300 print:text-zinc-800">
                <strong>End:</strong> {formatDate(booking.slotEnd)}
              </div>
              <span className="text-amber-400 print:text-zinc-900 font-semibold mt-0.5">
                Scheduled Duration: {scheduledHours} Hours
              </span>
            </div>
          </div>

          {/* Equipment Specifications Line Item Card */}
          <div className="flex items-center gap-3.5 rounded-xl border border-zinc-800 print:border-zinc-300 bg-zinc-900/60 print:bg-zinc-100 p-3.5">
            <EquipmentIcon
              category={asset?.category}
              name={asset?.name}
              size="md"
              className="shrink-0"
            />
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-zinc-100 print:text-black truncate">
                  {asset?.name || "Heavy Machinery / Equipment Unit"}
                </span>
                <span className="font-mono font-bold text-amber-400 print:text-black text-xs">
                  {formatCurrency(rate)}/hr
                </span>
              </div>
              <span className="text-xs text-zinc-400 print:text-zinc-600 font-mono">
                Category: {asset?.category || "EQUIPMENT"} • Tag/VIN: #{asset?.serialNumber || booking.assetId.slice(0, 8)}
              </span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 print:border-zinc-300 text-zinc-400 print:text-zinc-600 font-semibold">
                  <th className="pb-2">Description</th>
                  <th className="pb-2 text-center">Hours</th>
                  <th className="pb-2 text-right">Unit Rate</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 print:divide-zinc-200 text-zinc-300 print:text-zinc-800">
                <tr>
                  <td className="py-2.5 font-medium">
                    <div>Standard Dispatch Rental</div>
                    <div className="text-[10px] text-zinc-500 print:text-zinc-500">
                      Pre-booked slot duration
                    </div>
                  </td>
                  <td className="py-2.5 text-center font-mono">{scheduledHours}h</td>
                  <td className="py-2.5 text-right font-mono">{formatCurrency(rate)}/hr</td>
                  <td className="py-2.5 text-right font-mono font-semibold">
                    {formatCurrency(baseCost)}
                  </td>
                </tr>

                {overtimeHours > 0 && (
                  <tr className="text-amber-400 print:text-amber-700">
                    <td className="py-2.5 font-medium">
                      <div>Overtime Operating Surcharge</div>
                      <div className="text-[10px] text-amber-500/80 print:text-amber-800">
                        Extra hours beyond slot window (1.5× penalty rate)
                      </div>
                    </td>
                    <td className="py-2.5 text-center font-mono font-bold">
                      {overtimeHours}h
                    </td>
                    <td className="py-2.5 text-right font-mono">
                      {formatCurrency(rate * 1.5)}/hr
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold">
                      +{formatCurrency(overtimeCost)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Tax & Total Computation */}
          <div className="flex flex-col sm:flex-row sm:justify-end border-t border-zinc-800 print:border-zinc-300 pt-4">
            <div className="w-full sm:w-72 flex flex-col gap-2 text-xs">
              <div className="flex justify-between text-zinc-400 print:text-zinc-600">
                <span>Taxable Subtotal:</span>
                <span className="font-mono text-zinc-200 print:text-black">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400 print:text-zinc-600">
                <span>CGST (9%):</span>
                <span className="font-mono text-zinc-200 print:text-black">
                  {formatCurrency(cgst)}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400 print:text-zinc-600">
                <span>SGST (9%):</span>
                <span className="font-mono text-zinc-200 print:text-black">
                  {formatCurrency(sgst)}
                </span>
              </div>
              <Separator className="bg-zinc-800 print:bg-zinc-300" />
              <div className="flex justify-between items-center text-sm font-bold text-zinc-100 print:text-black pt-1">
                <span>Total Amount Due:</span>
                <span className="text-base font-black text-amber-400 print:text-black font-mono">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Terms & Footer */}
          <div className="border-t border-zinc-800/80 print:border-zinc-300 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[10px] text-zinc-500 print:text-zinc-600 gap-2">
            <div>
              <strong>Payment Terms:</strong> Net 15 days upon receipt of invoice.
              <br />
              This is a computer-generated tax invoice and requires no physical signature.
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400 print:text-zinc-700 font-medium">
              <ShieldCheck className="size-3.5 text-amber-400 print:text-black" />
              <span>Verified Dispatch & Logged Telemetry</span>
            </div>
          </div>
        </div>

        {/* Action Controls Footer */}
        <DialogFooter className="border-t border-zinc-800 bg-zinc-900/90 p-4 gap-2 print:hidden flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="border-zinc-800 text-zinc-300 hover:bg-zinc-800"
          >
            Close
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            className="bg-amber-400 text-zinc-950 font-bold hover:bg-amber-300 gap-1.5 shadow-md shadow-amber-500/15"
          >
            <Printer className="size-4" />
            Print / Save as PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
