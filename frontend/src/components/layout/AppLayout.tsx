import { useState } from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import {
  Building2,
  Calendar,
  CreditCard,
  Layers,
  LogOut,
  Shield,
  Truck,
  Wrench,
} from "lucide-react"

import { AccountDetailsModal } from "@/components/account/AccountDetailsModal"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/toast"
import { useAuth } from "@/context/AuthContext"

function formatRoleName(role: string | null): string {
  if (!role) return "User"
  switch (role) {
    case "ROLE_FLEET_MANAGER":
      return "Fleet Manager"
    case "ROLE_CLIENT":
      return "Client"
    case "ROLE_TECHNICIAN":
      return "Technician"
    default:
      return role.replace("ROLE_", "").replaceAll("_", " ")
  }
}

function getRoleBadgeColor(role: string | null): string {
  switch (role) {
    case "ROLE_FLEET_MANAGER":
      return "border-amber-500/40 bg-amber-500/10 text-amber-400"
    case "ROLE_TECHNICIAN":
      return "border-yellow-400/40 bg-yellow-400/10 text-yellow-300"
    case "ROLE_CLIENT":
      return "border-zinc-500/40 bg-zinc-800 text-zinc-200"
    default:
      return "border-zinc-700 bg-zinc-800 text-zinc-300"
  }
}

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { email, role, companyId, logout } = useAuth()
  const [accountModalOpen, setAccountModalOpen] = useState(false)

  const navItems =
    role === "ROLE_CLIENT"
      ? [
          {
            title: "My Fleet & Invoicing",
            url: "/client-portal",
            icon: Building2,
          },
          {
            title: "Machinery Catalog",
            url: "/assets",
            icon: Truck,
          },
        ]
      : role === "ROLE_TECHNICIAN"
      ? [
          {
            title: "Maintenance Hub",
            url: "/work-orders",
            icon: Wrench,
          },
          {
            title: "Fleet Catalog",
            url: "/assets",
            icon: Truck,
          },
        ]
      : [
          {
            title: "Fleet Operations & Rates",
            url: "/assets",
            icon: Truck,
          },
          {
            title: "Dispatch & Approvals",
            url: "/bookings",
            icon: Calendar,
          },
          {
            title: "Maintenance Hub",
            url: "/work-orders",
            icon: Wrench,
          },
        ]

  const currentNav = navItems.find(
    (item) =>
      location.pathname === item.url ||
      location.pathname.startsWith(`${item.url}/`),
  )

  const pageTitle = currentNav?.title ?? "Dashboard"

  function handleLogout() {
    logout()
    navigate("/login")
  }

  const userInitial = (email?.[0] || role?.[0] || "U").toUpperCase()

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r border-zinc-800 bg-zinc-950 text-zinc-100">
        <SidebarHeader className="border-b border-zinc-800/80 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 font-bold shadow-md shadow-amber-500/5">
              <Layers className="size-5" />
            </div>
            <div className="flex flex-col truncate leading-tight group-data-[collapsible=icon]:hidden">
              <span className="font-bold text-zinc-100 tracking-tight flex items-center gap-1.5">
                Apex<span className="text-amber-400">Fleet</span>
              </span>
              <span className="text-xs text-zinc-400 font-medium">
                {role === "ROLE_CLIENT" ? "Client Dispatch Portal" : "Heavy Equipment Operations"}
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-4">
          <SidebarMenu className="gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                location.pathname === item.url ||
                (item.url !== "/" && location.pathname.startsWith(item.url))

              return (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    render={
                      <Link to={item.url} className="flex items-center gap-3">
                        <Icon className="size-4 shrink-0" />
                        <div className="flex flex-col">
                          <span>{item.title}</span>
                        </div>
                      </Link>
                    }
                    isActive={isActive}
                    tooltip={item.title}
                    className={
                      isActive
                        ? "bg-zinc-900 text-amber-400 font-semibold border-l-2 border-amber-400 hover:bg-zinc-800 hover:text-amber-300"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                    }
                  />
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="border-t border-zinc-800/80 p-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition-colors hover:bg-zinc-900 group-data-[collapsible=icon]:justify-center"
                    >
                      <Avatar className="size-8 rounded-lg border border-amber-500/30 bg-zinc-900">
                        <AvatarFallback className="rounded-lg bg-zinc-900 text-xs font-bold text-amber-400">
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-medium text-zinc-200">
                          {email || "User"}
                        </span>
                        <span className="truncate text-zinc-400">
                          {formatRoleName(role)}
                        </span>
                      </div>
                    </button>
                  }
                />
                <DropdownMenuContent
                  className="w-56 border-zinc-800 bg-zinc-950 text-zinc-100"
                  align="end"
                  side="right"
                  sideOffset={8}
                >
                  <DropdownMenuLabel className="font-normal text-zinc-400 text-xs">
                    Signed in as
                    <div className="font-medium text-zinc-200 truncate mt-0.5">
                      {email || "User"}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <div className="px-2 py-1.5 text-xs text-zinc-400 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Shield className="size-3 text-amber-400" />
                      <span>Role:</span>
                      <span className="font-medium text-zinc-300">
                        {formatRoleName(role)}
                      </span>
                    </div>
                    {companyId ? (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="size-3 text-zinc-500" />
                        <span>Company:</span>
                        <span
                          className="font-mono text-zinc-300 truncate max-w-[120px]"
                          title={companyId}
                        >
                          {companyId.slice(0, 8)}...
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem
                    onClick={() => setAccountModalOpen(true)}
                    className="cursor-pointer text-amber-400 focus:bg-amber-500/10 focus:text-amber-300 font-semibold gap-2 py-2"
                  >
                    <CreditCard className="size-4 text-amber-400" />
                    <span>
                      {role === "ROLE_CLIENT"
                        ? "Spending & Booking Records"
                        : "Fleet Operations & Analytics"}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <LogOut className="size-4 mr-2" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="bg-zinc-950 text-zinc-100 flex flex-col min-h-svh">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-950/80 px-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-zinc-400 hover:text-amber-400" />
            <Separator orientation="vertical" className="h-4 bg-zinc-800" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={
                      <Link
                        to={role === "ROLE_CLIENT" ? "/client-portal" : "/assets"}
                        className="text-zinc-400 hover:text-amber-400 text-xs"
                      >
                        {role === "ROLE_CLIENT" ? "Client Workspace" : "Logistics & Fleet Operations"}
                      </Link>
                    }
                  />
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-zinc-600" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-medium text-zinc-100 text-xs">
                    {pageTitle}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAccountModalOpen(true)}
              className="border-amber-500/30 bg-zinc-900/90 text-amber-400 hover:bg-amber-500/15 hover:text-amber-300 text-xs font-semibold gap-1.5 shadow-sm shadow-amber-500/5 h-8"
            >
              <CreditCard className="size-3.5" />
              <span className="hidden sm:inline">
                {role === "ROLE_CLIENT" ? "Account & Spending" : "Executive Overview"}
              </span>
            </Button>

            <Badge
              variant="outline"
              className={getRoleBadgeColor(role)}
            >
              {formatRoleName(role)}
            </Badge>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 gap-1.5 h-8"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
        <Toaster />

        {/* Global Account Details Modal */}
        <AccountDetailsModal
          open={accountModalOpen}
          onOpenChange={setAccountModalOpen}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}
export default AppLayout
