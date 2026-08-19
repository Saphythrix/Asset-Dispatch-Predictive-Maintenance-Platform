export type UserRole =
  | "ROLE_CLIENT"
  | "ROLE_FLEET_MANAGER"
  | "ROLE_TECHNICIAN"

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  companyName: string
  billingTier: string
  role: UserRole
}

export interface AuthResponse {
  token: string
  tokenType: string
  userId: string
  companyId: string
  email: string
  role: string
}

export interface ApiError {
  message?: string
  status?: number
  timestamp?: string
  errors?: Record<string, string>
}

export type AssetStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "IN_MAINTENANCE"
  | "DECOMMISSIONED"

export interface Asset {
  id: string
  clientCompanyId: string
  serialNumber: string
  name: string
  category: string
  status: AssetStatus
  operatingHours: number
  maintenanceThresholdHours: number
  nextMaintenanceDue: string
  hourlyRate?: number
}

export interface CreateAssetRequest {
  clientCompanyId: string
  serialNumber: string
  name: string
  category: string
  maintenanceThresholdHours: number
  nextMaintenanceDue: string
  hourlyRate?: number
}

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"

export interface BookingRequest {
  assetId: string
  clientCompanyId: string
  createdBy: string
  slotStart: string
  slotEnd: string
}

export type CreateBookingRequest = BookingRequest

export interface BookingResponse {
  id: string
  assetId: string
  clientCompanyId: string
  createdBy: string
  slotStart: string
  slotEnd: string
  status: BookingStatus
  hourlyRateSnapshot?: number
  baseCost?: number
  actualHoursUsed?: number
  overtimeHours?: number
  overtimeCost?: number
  totalCost?: number
  createdAt: string
}

export type Booking = BookingResponse

export type WorkOrderState =
  | "CREATED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED"

export interface WorkOrder {
  id: string
  assetId: string
  bookingId?: string | null
  technicianId?: string | null
  state: WorkOrderState
  scheduledAt: string
  createdAt: string
}

export type WorkOrderResponse = WorkOrder

export interface CreateWorkOrderRequest {
  assetId: string
  bookingId?: string | null
  scheduledAt: string
}

export interface WorkOrderStateLog {
  id: string
  workOrderId: string
  previousState: WorkOrderState
  newState: WorkOrderState
  timestamp: string
  triggeredBy: string
}
