import { cn } from "@/lib/utils"

export type EquipmentCategoryType =
  | "BULLDOZER"
  | "HAUL_TRUCK"
  | "CRANE"
  | "EXCAVATOR"
  | "OSCILLOSCOPE"
  | "OHMMETER"
  | "COMPUTER"
  | "FORKLIFT"
  | "GENERATOR"
  | "CONCRETE_MIXER"
  | "SPECTRUM_ANALYZER"
  | "WELDING_MACHINE"
  | "SURVEYING_STATION"
  | "GENERAL_TOOL"

export function detectEquipmentCategory(
  name?: string,
  category?: string,
): EquipmentCategoryType {
  const combined = `${name || ""} ${category || ""}`.toLowerCase()

  if (combined.includes("dozer") || combined.includes("bulldozer") || combined.includes("crawler")) {
    return "BULLDOZER"
  }
  if (
    combined.includes("truck") ||
    combined.includes("tipper") ||
    combined.includes("dumper") ||
    combined.includes("haul") ||
    combined.includes("transport")
  ) {
    return "HAUL_TRUCK"
  }
  if (
    combined.includes("crane") ||
    combined.includes("hoist") ||
    combined.includes("boom") ||
    combined.includes("telehandler") ||
    combined.includes("lift")
  ) {
    return "CRANE"
  }
  if (
    combined.includes("excavator") ||
    combined.includes("jcb") ||
    combined.includes("backhoe") ||
    combined.includes("digger") ||
    combined.includes("loader")
  ) {
    return "EXCAVATOR"
  }
  if (
    combined.includes("oscilloscope") ||
    combined.includes("scope") ||
    combined.includes("dso") ||
    combined.includes("waveform")
  ) {
    return "OSCILLOSCOPE"
  }
  if (
    combined.includes("ohmmeter") ||
    combined.includes("multimeter") ||
    combined.includes("voltmeter") ||
    combined.includes("dmm") ||
    combined.includes("meter") ||
    combined.includes("tester")
  ) {
    return "OHMMETER"
  }
  if (
    combined.includes("computer") ||
    combined.includes("workstation") ||
    combined.includes("server") ||
    combined.includes("laptop") ||
    combined.includes("cad") ||
    combined.includes("pc")
  ) {
    return "COMPUTER"
  }
  if (combined.includes("forklift") || combined.includes("stacker") || combined.includes("pallet")) {
    return "FORKLIFT"
  }
  if (
    combined.includes("generator") ||
    combined.includes("genset") ||
    combined.includes("power") ||
    combined.includes("diesel")
  ) {
    return "GENERATOR"
  }
  if (
    combined.includes("mixer") ||
    combined.includes("concrete") ||
    combined.includes("cement") ||
    combined.includes("compactor") ||
    combined.includes("roller")
  ) {
    return "CONCRETE_MIXER"
  }
  if (
    combined.includes("spectrum") ||
    combined.includes("rf") ||
    combined.includes("microwave") ||
    combined.includes("network analyzer")
  ) {
    return "SPECTRUM_ANALYZER"
  }
  if (
    combined.includes("weld") ||
    combined.includes("welder") ||
    combined.includes("torch") ||
    combined.includes("cutter")
  ) {
    return "WELDING_MACHINE"
  }
  if (
    combined.includes("survey") ||
    combined.includes("theodolite") ||
    combined.includes("total station") ||
    combined.includes("tripod")
  ) {
    return "SURVEYING_STATION"
  }

  return "GENERAL_TOOL"
}

interface EquipmentIconProps {
  category?: string
  name?: string
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

export function EquipmentIcon({
  category,
  name,
  className,
  size = "md",
}: EquipmentIconProps) {
  const detected = detectEquipmentCategory(name, category)

  const sizeClasses = {
    sm: "size-6",
    md: "size-10",
    lg: "size-14",
    xl: "size-20",
  }[size]

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl bg-zinc-900/90 border border-amber-500/30 p-2 shadow-inner text-amber-400 group-hover:border-amber-400/60 group-hover:shadow-amber-500/10 transition-all",
        sizeClasses,
        className,
      )}
    >
      <EquipmentSvg type={detected} />
    </div>
  )
}

function EquipmentSvg({ type }: { type: EquipmentCategoryType }) {
  switch (type) {
    case "BULLDOZER":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="size-full stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Tracks */}
          <rect x="4" y="32" width="36" height="10" rx="5" className="stroke-amber-400 fill-zinc-950" />
          <circle cx="10" cy="37" r="2" className="fill-amber-400" />
          <circle cx="18" cy="37" r="2" className="fill-amber-400" />
          <circle cx="26" cy="37" r="2" className="fill-amber-400" />
          <circle cx="34" cy="37" r="2" className="fill-amber-400" />
          {/* Body Cab */}
          <path d="M12 32V20L20 12H30V32" className="stroke-amber-300 fill-zinc-900" />
          <rect x="22" y="16" width="6" height="7" rx="1" className="stroke-amber-400 fill-amber-500/20" />
          {/* Blade Push Arm */}
          <path d="M30 28L42 22V38L38 34" className="stroke-amber-400" />
          {/* Dozer Blade */}
          <path d="M42 18V40L45 38V20L42 18Z" className="stroke-amber-400 fill-amber-500" />
          {/* Exhaust Pipe */}
          <path d="M14 20V8L16 6" className="stroke-amber-300" />
        </svg>
      )

    case "HAUL_TRUCK":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="size-full stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Chassis */}
          <path d="M6 34H42" className="stroke-zinc-600" />
          {/* Large Wheels */}
          <circle cx="12" cy="35" r="5.5" className="stroke-amber-400 fill-zinc-950" />
          <circle cx="12" cy="35" r="2" className="fill-amber-400" />
          <circle cx="36" cy="35" r="5.5" className="stroke-amber-400 fill-zinc-950" />
          <circle cx="36" cy="35" r="2" className="fill-amber-400" />
          {/* Dump Bed */}
          <path d="M6 30L10 12H28L25 30H6Z" className="stroke-amber-400 fill-amber-500/15" />
          <line x1="14" y1="12" x2="13" y2="30" className="stroke-amber-500/50" />
          <line x1="21" y1="12" x2="19" y2="30" className="stroke-amber-500/50" />
          {/* Driver Cab */}
          <path d="M28 30V18L35 18L40 25V30H28Z" className="stroke-amber-300 fill-zinc-900" />
          <path d="M34 20H37L39 25H34V20Z" className="stroke-amber-400 fill-amber-500/30" />
        </svg>
      )

    case "CRANE":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="size-full stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Base Outriggers */}
          <rect x="8" y="36" width="32" height="6" rx="2" className="stroke-zinc-600 fill-zinc-950" />
          <circle cx="14" cy="42" r="2" className="fill-amber-400" />
          <circle cx="34" cy="42" r="2" className="fill-amber-400" />
          {/* Turret */}
          <rect x="14" y="30" width="12" height="6" rx="1" className="stroke-amber-400 fill-zinc-900" />
          {/* Lattice Boom */}
          <line x1="20" y1="30" x2="42" y2="6" className="stroke-amber-400 stroke-[2.5]" />
          <line x1="24" y1="30" x2="40" y2="10" className="stroke-amber-300" />
          {/* Cross trussing */}
          <line x1="22" y1="26" x2="27" y2="24" className="stroke-amber-500/60" />
          <line x1="28" y1="19" x2="33" y2="17" className="stroke-amber-500/60" />
          {/* Cable & Pulley */}
          <circle cx="42" cy="6" r="1.5" className="fill-amber-400" />
          <line x1="42" y1="7.5" x2="42" y2="22" className="stroke-zinc-400 stroke-1" strokeDasharray="1 1" />
          {/* Heavy Hook */}
          <path d="M42 22V25C42 27 40 28 38 27" className="stroke-amber-400 stroke-2" />
        </svg>
      )

    case "EXCAVATOR":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="size-full stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Tracks */}
          <rect x="6" y="34" width="24" height="8" rx="4" className="stroke-amber-400 fill-zinc-950" />
          <circle cx="11" cy="38" r="1.5" className="fill-amber-400" />
          <circle cx="18" cy="38" r="1.5" className="fill-amber-400" />
          <circle cx="25" cy="38" r="1.5" className="fill-amber-400" />
          {/* Rotating Body */}
          <rect x="8" y="24" width="16" height="10" rx="2" className="stroke-amber-300 fill-zinc-900" />
          <rect x="15" y="26" width="6" height="5" rx="1" className="stroke-amber-400 fill-amber-500/25" />
          {/* Articulated Boom Arm */}
          <path d="M22 26L30 10L40 16" className="stroke-amber-400 stroke-[2.5]" />
          {/* Hydraulic Cylinder Line */}
          <line x1="24" y1="22" x2="31" y2="14" className="stroke-zinc-400 stroke-1" />
          {/* Bucket */}
          <path d="M40 16L44 23L38 27L36 21Z" className="stroke-amber-400 fill-amber-500" />
        </svg>
      )

    case "OSCILLOSCOPE":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="size-full stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Instrument Chassis */}
          <rect x="6" y="10" width="36" height="28" rx="3" className="stroke-amber-400 fill-zinc-950" />
          {/* Handle */}
          <path d="M12 10V6H36V10" className="stroke-zinc-500" />
          {/* CRT/LCD Screen */}
          <rect x="10" y="14" width="20" height="20" rx="2" className="stroke-zinc-700 fill-zinc-900" />
          {/* Grid lines */}
          <line x1="10" y1="24" x2="30" y2="24" className="stroke-zinc-800 stroke-1" strokeDasharray="2 2" />
          <line x1="20" y1="14" x2="20" y2="34" className="stroke-zinc-800 stroke-1" strokeDasharray="2 2" />
          {/* Sine Wave */}
          <path d="M12 24Q15 16 18 24T24 24T30 24" className="stroke-amber-400 stroke-[1.5]" />
          {/* Control Dials & Buttons */}
          <circle cx="35" cy="17" r="2.5" className="stroke-amber-400 fill-zinc-900" />
          <circle cx="35" cy="24" r="2.5" className="stroke-amber-400 fill-zinc-900" />
          <circle cx="35" cy="30" r="1.5" className="fill-amber-400" />
          {/* BNC Inputs */}
          <circle cx="14" cy="36" r="1" className="fill-zinc-500" />
          <circle cx="18" cy="36" r="1" className="fill-zinc-500" />
        </svg>
      )

    case "OHMMETER":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="size-full stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Multimeter Body Case */}
          <rect x="12" y="6" width="24" height="36" rx="5" className="stroke-amber-400 fill-zinc-950" />
          {/* Rugged Bumper Edge */}
          <path d="M14 6H34M14 42H34" className="stroke-amber-500 stroke-[3]" />
          {/* Digital LCD Display */}
          <rect x="16" y="10" width="16" height="10" rx="2" className="stroke-zinc-700 fill-zinc-900" />
          {/* Omega Ω Symbol on Display */}
          <path d="M20 18H22C22 15 26 15 26 18H28" className="stroke-amber-400 stroke-[1.5]" />
          <circle cx="24" cy="15" r="1.5" className="stroke-amber-400 fill-transparent" />
          {/* Central Rotary Dial */}
          <circle cx="24" cy="27" r="5" className="stroke-amber-400 fill-zinc-900" />
          <line x1="24" y1="27" x2="27" y2="24" className="stroke-amber-300 stroke-2" />
          {/* Banana Jack Terminals */}
          <circle cx="18" cy="37" r="1.5" className="fill-amber-400" />
          <circle cx="24" cy="37" r="1.5" className="fill-zinc-400" />
          <circle cx="30" cy="37" r="1.5" className="fill-red-400" />
        </svg>
      )

    case "COMPUTER":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="size-full stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Monitor Screen */}
          <rect x="6" y="8" width="26" height="18" rx="2" className="stroke-amber-400 fill-zinc-950" />
          <rect x="9" y="11" width="20" height="12" rx="1" className="stroke-zinc-700 fill-zinc-900" />
          {/* Terminal prompt symbol on screen */}
          <path d="M12 15L15 17L12 19" className="stroke-amber-400" />
          <line x1="16" y1="19" x2="20" y2="19" className="stroke-amber-400" />
          {/* Stand */}
          <path d="M19 26V30M13 30H25" className="stroke-zinc-500" />
          {/* Workstation Tower Chassis */}
          <rect x="34" y="10" width="8" height="26" rx="2" className="stroke-amber-400 fill-zinc-900" />
          <line x1="36" y1="14" x2="40" y2="14" className="stroke-amber-300" />
          <circle cx="38" cy="18" r="1" className="fill-amber-400" />
          <line x1="36" y1="28" x2="40" y2="28" className="stroke-zinc-700" />
          <line x1="36" y1="31" x2="40" y2="31" className="stroke-zinc-700" />
          {/* Keyboard */}
          <rect x="8" y="33" width="22" height="4" rx="1" className="stroke-zinc-600 fill-zinc-900" />
        </svg>
      )

    case "FORKLIFT":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="size-full stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Wheels */}
          <circle cx="14" cy="36" r="4.5" className="stroke-amber-400 fill-zinc-950" />
          <circle cx="30" cy="36" r="4.5" className="stroke-amber-400 fill-zinc-950" />
          {/* Body Cab */}
          <path d="M8 32H32V24L26 16H16V32" className="stroke-amber-400 fill-zinc-900" />
          {/* Overhead Guard Cage */}
          <path d="M16 16V10H24V24" className="stroke-amber-300" />
          {/* Mast & Forks */}
          <line x1="36" y1="8" x2="36" y2="36" className="stroke-amber-400 stroke-[2.5]" />
          <path d="M36 28H44V31H36" className="stroke-amber-400 fill-amber-500" />
        </svg>
      )

    case "GENERATOR":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="size-full stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Enclosure */}
          <rect x="6" y="12" width="36" height="26" rx="3" className="stroke-amber-400 fill-zinc-950" />
          {/* Base skid */}
          <line x1="4" y1="38" x2="44" y2="38" className="stroke-zinc-600 stroke-[2.5]" />
          {/* Air Vents */}
          <line x1="10" y1="18" x2="10" y2="32" className="stroke-zinc-700" />
          <line x1="14" y1="18" x2="14" y2="32" className="stroke-zinc-700" />
          <line x1="18" y1="18" x2="18" y2="32" className="stroke-zinc-700" />
          {/* Power Lightning Badge */}
          <path d="M29 16L24 24H28L25 32L34 22H29L32 16H29Z" className="stroke-amber-400 fill-amber-400" />
          {/* Control Panel */}
          <rect x="34" y="16" width="6" height="8" rx="1" className="stroke-amber-300 fill-zinc-900" />
        </svg>
      )

    case "CONCRETE_MIXER":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="size-full stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Chassis */}
          <circle cx="12" cy="36" r="4.5" className="stroke-amber-400 fill-zinc-950" />
          <circle cx="34" cy="36" r="4.5" className="stroke-amber-400 fill-zinc-950" />
          {/* Driver Cab */}
          <path d="M30 32V22L36 22L40 27V32H30Z" className="stroke-amber-400 fill-zinc-900" />
          {/* Rotating Drum */}
          <path d="M8 28L14 14L28 18L30 30L18 32Z" className="stroke-amber-400 fill-amber-500/20" />
          <path d="M12 20L26 24" className="stroke-amber-300 stroke-[1.5]" />
        </svg>
      )

    case "SPECTRUM_ANALYZER":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="size-full stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Body */}
          <rect x="6" y="10" width="36" height="28" rx="3" className="stroke-amber-400 fill-zinc-950" />
          {/* Screen with FFT Spectrum peaks */}
          <rect x="10" y="14" width="22" height="18" rx="2" className="stroke-zinc-700 fill-zinc-900" />
          <path d="M12 28L15 28L17 20L19 28L22 28L24 16L26 28L29 28" className="stroke-amber-400 stroke-2" />
          {/* Frequency marker indicator */}
          <polygon points="24,14 26,17 22,17" className="fill-amber-400 stroke-none" />
          {/* RF Input Ports */}
          <circle cx="36" cy="18" r="2" className="stroke-amber-400 fill-zinc-900" />
          <circle cx="36" cy="26" r="2" className="stroke-amber-400 fill-zinc-900" />
        </svg>
      )

    case "WELDING_MACHINE":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="size-full stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Welder Unit */}
          <rect x="10" y="14" width="22" height="24" rx="3" className="stroke-amber-400 fill-zinc-950" />
          <path d="M16 14V10H26V14" className="stroke-zinc-500" />
          <circle cx="21" cy="22" r="3" className="stroke-amber-400 fill-zinc-900" />
          {/* Cables & Electrode Torch */}
          <path d="M26 34C32 34 36 28 40 22" className="stroke-zinc-400 stroke-2" />
          <line x1="38" y1="20" x2="44" y2="16" className="stroke-amber-400 stroke-[3]" />
          {/* Arc Sparks */}
          <line x1="44" y1="14" x2="46" y2="11" className="stroke-amber-300 stroke-2" />
          <line x1="46" y1="16" x2="49" y2="17" className="stroke-amber-300 stroke-2" />
        </svg>
      )

    case "SURVEYING_STATION":
      return (
        <svg viewBox="0 0 48 48" fill="none" className="size-full stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {/* Tripod Legs */}
          <line x1="24" y1="24" x2="10" y2="44" className="stroke-amber-400 stroke-2" />
          <line x1="24" y1="24" x2="24" y2="44" className="stroke-amber-400 stroke-2" />
          <line x1="24" y1="24" x2="38" y2="44" className="stroke-amber-400 stroke-2" />
          <line x1="16" y1="36" x2="32" y2="36" className="stroke-zinc-600 stroke-1" />
          {/* Tribrach Base */}
          <rect x="18" y="20" width="12" height="4" rx="1" className="stroke-zinc-400 fill-zinc-900" />
          {/* Optical Theodolite Scope Body */}
          <rect x="20" y="10" width="8" height="10" rx="2" className="stroke-amber-300 fill-zinc-950" />
          {/* Telescope Barrel */}
          <path d="M14 13H34V17H14Z" className="stroke-amber-400 fill-amber-500/30" />
          <circle cx="34" cy="15" r="2" className="fill-amber-400" />
        </svg>
      )

    default:
      return (
        <svg viewBox="0 0 48 48" fill="none" className="size-full stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="8" y="12" width="32" height="24" rx="3" className="stroke-amber-400 fill-zinc-950" />
          <line x1="8" y1="22" x2="40" y2="22" className="stroke-amber-500/40" />
          <circle cx="16" cy="29" r="2" className="fill-amber-400" />
          <line x1="22" y1="29" x2="32" y2="29" className="stroke-amber-300" />
        </svg>
      )
  }
}
