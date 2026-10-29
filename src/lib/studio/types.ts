import type { LLMProviderId, StandardMessage } from "@llm-multi-provider/core";

export type ProviderMode =
  | "gemini-with-fallback"
  | "openrouter-with-fallback"
  | "gemini-only"
  | "openrouter-only";

export interface StudioService {
  id: string;
  name: string;
  shortName: string;
  durationMinutes: number;
  price: number;
  depositAmount: number;
  maxParticipants: number;
  description: string;
  includes: string[];
  category: "portrait" | "family" | "milestone" | "commercial";
}

export interface StudioAddOn {
  id: string;
  name: string;
  price: number;
  extraMinutes: number;
  description: string;
}

export interface StudioPhotographer {
  id: string;
  name: string;
  role: string;
  specialties: string[];
  bio: string;
  assignedRoom: string;
}

export interface WaitlistEntry {
  id: string;
  waitlistRef: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceId: string;
  serviceName: string;
  preferredDate: string;
  preferredTimeWindow: string;
  notes?: string;
  status: "waiting" | "slot_opened" | "booked";
  createdAt: string;
}

export interface DaySchedule {
  dayOfWeek: number; // 0 = Sunday ... 6 = Saturday
  dayName: string;
  isOpen: boolean;
  openTime: string; // "09:00"
  closeTime: string; // "18:00"
}

export type AppointmentStatus = "confirmed" | "rescheduled" | "cancelled";

export interface Appointment {
  id: string;
  bookingRef: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceId: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h)
  endTime: string; // HH:mm (24h)
  durationMinutes: number;
  price: number;
  participants: number;
  photographerName?: string;
  addOns?: string[];
  prepGuideSent?: boolean;
  notes?: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
  source: "sms" | "web" | "dashboard";
}

export interface TimeSlot {
  startTime: string; // "10:00"
  endTime: string; // "11:00"
  label: string; // "10:00 AM - 11:00 AM"
  available: boolean;
  conflictRef?: string;
}

export interface DayAvailability {
  date: string; // YYYY-MM-DD
  dayName: string;
  isOpen: boolean;
  operatingHours: string;
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  availableSlots: TimeSlot[];
  allSlots: TimeSlot[];
}

export interface ToolExecutionRecord {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  result: unknown;
  timestamp: string;
}

export interface ProviderTelemetry {
  configuredMode: ProviderMode;
  primaryProvider: LLMProviderId;
  activeProvider: string;
  fallbackTriggered: boolean;
  fallbackReason?: string;
  latencyMs: number;
  usingDemoFallback: boolean;
  geminiConfigured: boolean;
  openrouterConfigured: boolean;
}

export interface ChatTurnMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: string;
  toolExecutions?: ToolExecutionRecord[];
  telemetry?: ProviderTelemetry;
}

export interface ConversationSession {
  sessionId: string;
  clientPhone: string;
  history: StandardMessage[];
  uiMessages: ChatTurnMessage[];
  updatedAt: string;
}
