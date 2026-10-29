import { Type, type FunctionDeclaration, type Tool } from "@google/genai";
import { createToolbox, type ToolFunctionsMap } from "@llm-multi-provider/core";
import { STUDIO_HOURS, STUDIO_INFO, STUDIO_SERVICES, findStudioService } from "../studio/config";
import {
  computeDayAvailability,
  computeRangeAvailability,
  validateAndResolveSlot,
} from "../calendar/availability";
import {
  formatLocalDate,
  formatPrettyDate,
  formatTime12h,
  getNextOpenStudioDates,
} from "../calendar/dateUtils";
import {
  createBookingRecord,
  findAppointmentByQuery,
  updateBookingRecord,
} from "../storage/appointmentStore";

export const STUDIO_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "getStudioServices",
    description:
      "Returns the photo studio's session packages, pricing, durations, deposit policies, operating hours, and studio address.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          description:
            "Optional category filter: 'portrait', 'family', 'milestone', 'commercial', or 'all'.",
        },
      },
    },
  },
  {
    name: "getAvailableSlots",
    description:
      "Checks the studio calendar for open time slots on a specific date or a multi-day range for a given photography package.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: {
          type: Type.STRING,
          description:
            "Start date to check in YYYY-MM-DD format. If omitted, defaults to today's date.",
        },
        daysCount: {
          type: Type.NUMBER,
          description:
            "Number of consecutive days to check starting from `date` (1 to 7). Default is 3.",
        },
        serviceId: {
          type: Type.STRING,
          description:
            "Service ID or name (e.g. 'headshot-express', 'portrait-signature', 'family-maternity', 'graduation-senior', 'commercial-brand').",
        },
      },
      required: ["date"],
    },
  },
  {
    name: "bookAppointment",
    description:
      "Books and confirms a photo studio session for a client after verifying slot availability and collecting their contact details.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        clientName: {
          type: Type.STRING,
          description: "Full name of the client booking the shoot.",
        },
        clientPhone: {
          type: Type.STRING,
          description: "Client's phone number for SMS confirmation.",
        },
        clientEmail: {
          type: Type.STRING,
          description: "Client's email address for calendar invite and gallery delivery.",
        },
        serviceId: {
          type: Type.STRING,
          description:
            "Service ID ('headshot-express', 'portrait-signature', 'family-maternity', 'graduation-senior', 'commercial-brand').",
        },
        date: {
          type: Type.STRING,
          description: "Appointment date in YYYY-MM-DD format.",
        },
        startTime: {
          type: Type.STRING,
          description: "Start time in 24-hour HH:mm format (e.g. '10:00', '14:30') or '2:30 PM'.",
        },
        participants: {
          type: Type.NUMBER,
          description: "Number of people participating in the shoot (default 1).",
        },
        notes: {
          type: Type.STRING,
          description: "Optional notes, backdrop preferences, or special requests.",
        },
      },
      required: ["clientName", "clientPhone", "clientEmail", "serviceId", "date", "startTime"],
    },
  },
  {
    name: "getAppointment",
    description:
      "Looks up an existing studio appointment by booking reference code (e.g. 'LUM-2041'), client phone number, name, or email.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "Booking reference (e.g. 'LUM-2041'), client phone number, name, or email.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "rescheduleAppointment",
    description:
      "Moves an existing appointment to a new date and start time after verifying the new slot is open.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        bookingRef: {
          type: Type.STRING,
          description: "Booking reference code (e.g. 'LUM-2041').",
        },
        newDate: {
          type: Type.STRING,
          description: "New target date in YYYY-MM-DD format.",
        },
        newStartTime: {
          type: Type.STRING,
          description: "New start time in HH:mm format (e.g. '11:00', '15:00').",
        },
      },
      required: ["bookingRef", "newDate", "newStartTime"],
    },
  },
  {
    name: "cancelAppointment",
    description: "Cancels an existing appointment by its booking reference code and frees the slot.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        bookingRef: {
          type: Type.STRING,
          description: "Booking reference code (e.g. 'LUM-2041').",
        },
        reason: {
          type: Type.STRING,
          description: "Optional cancellation reason from the client.",
        },
      },
      required: ["bookingRef"],
    },
  },
];

export const STUDIO_TOOLS: Tool[] = [createToolbox(STUDIO_FUNCTION_DECLARATIONS)];

export function createStudioToolFunctions(defaultClientPhone?: string): ToolFunctionsMap {
  return {
    getStudioServices: async (rawArgs: unknown) => {
      const args = (rawArgs || {}) as { category?: string };
      const cat = args.category?.toLowerCase().trim();
      const services =
        cat && cat !== "all"
          ? STUDIO_SERVICES.filter(
              (s) => s.category === cat || s.id.includes(cat) || s.name.toLowerCase().includes(cat),
            )
          : STUDIO_SERVICES;

      return {
        studio: STUDIO_INFO,
        operatingHours: STUDIO_HOURS.filter((h) => h.isOpen).map(
          (h) => `${h.dayName}: ${formatTime12h(h.openTime)} – ${formatTime12h(h.closeTime)}`,
        ),
        closedDays: STUDIO_HOURS.filter((h) => !h.isOpen).map((h) => h.dayName),
        services: services.length > 0 ? services : STUDIO_SERVICES,
      };
    },

    getAvailableSlots: async (rawArgs: unknown) => {
      const args = (rawArgs || {}) as {
        date?: string;
        daysCount?: number;
        serviceId?: string;
      };
      const startDate =
        args.date && /^\d{4}-\d{2}-\d{2}$/.test(args.date.trim())
          ? args.date.trim()
          : formatLocalDate(new Date());
      const daysCount = typeof args.daysCount === "number" ? args.daysCount : 3;
      const service = findStudioService(args.serviceId || "") || STUDIO_SERVICES[1];

      const range = computeRangeAvailability(startDate, daysCount, service.id);
      const nextOpenDates = getNextOpenStudioDates(startDate, 4);

      return {
        service: {
          id: service.id,
          name: service.name,
          durationMinutes: service.durationMinutes,
          price: service.price,
        },
        checkedRange: range.map((day) => ({
          date: day.date,
          prettyDate: formatPrettyDate(day.date),
          dayName: day.dayName,
          isOpen: day.isOpen,
          operatingHours: day.operatingHours,
          availableCount: day.availableSlots.length,
          availableSlots: day.availableSlots.map((s) => ({
            startTime: s.startTime,
            endTime: s.endTime,
            label: s.label,
          })),
        })),
        nextOpenStudioDates: nextOpenDates,
      };
    },

    bookAppointment: async (rawArgs: unknown) => {
      const args = (rawArgs || {}) as {
        clientName?: string;
        clientPhone?: string;
        clientEmail?: string;
        serviceId?: string;
        date?: string;
        startTime?: string;
        participants?: number;
        notes?: string;
      };

      const clientName = args.clientName?.trim();
      const clientPhone = args.clientPhone?.trim() || defaultClientPhone || "(555) 019-2834";
      const clientEmail = args.clientEmail?.trim() || "client@example.com";
      const dateStr = args.date?.trim() || "";
      const startTimeRaw = args.startTime?.trim() || "";
      const service = findStudioService(args.serviceId || "") || STUDIO_SERVICES[1];

      if (!clientName || !dateStr || !startTimeRaw) {
        return {
          success: false,
          error:
            "Missing required booking fields. Please provide clientName, date (YYYY-MM-DD), and startTime (HH:mm).",
        };
      }

      const validation = validateAndResolveSlot(dateStr, startTimeRaw, service.id);
      if (!validation.valid || !validation.normalizedStart || !validation.normalizedEnd) {
        return {
          success: false,
          error: validation.reason || "Requested slot is not available.",
          suggestedAlternatives: (validation.alternatives || []).map((s) => ({
            startTime: s.startTime,
            label: s.label,
          })),
        };
      }

      const booked = createBookingRecord({
        clientName,
        clientPhone,
        clientEmail,
        serviceId: service.id,
        date: dateStr,
        startTime: validation.normalizedStart,
        endTime: validation.normalizedEnd,
        participants: args.participants || 1,
        notes: args.notes,
        source: "sms",
      });

      return {
        success: true,
        message: `Appointment confirmed! Booking reference: ${booked.bookingRef}`,
        appointment: {
          bookingRef: booked.bookingRef,
          clientName: booked.clientName,
          clientPhone: booked.clientPhone,
          clientEmail: booked.clientEmail,
          serviceName: booked.serviceName,
          date: booked.date,
          prettyDate: formatPrettyDate(booked.date),
          time: `${formatTime12h(booked.startTime)} – ${formatTime12h(booked.endTime)}`,
          price: `$${booked.price}`,
          depositRequired: `$${service.depositAmount}`,
          studioAddress: STUDIO_INFO.address,
        },
      };
    },

    getAppointment: async (rawArgs: unknown) => {
      const args = (rawArgs || {}) as { query?: string };
      const query = args.query?.trim() || defaultClientPhone || "";
      const matches = findAppointmentByQuery(query);

      if (matches.length === 0) {
        return {
          found: false,
          message: `No appointments found matching "${query}".`,
        };
      }

      return {
        found: true,
        count: matches.length,
        appointments: matches.map((m) => ({
          bookingRef: m.bookingRef,
          clientName: m.clientName,
          clientPhone: m.clientPhone,
          clientEmail: m.clientEmail,
          serviceId: m.serviceId,
          serviceName: m.serviceName,
          date: m.date,
          prettyDate: formatPrettyDate(m.date),
          startTime: m.startTime,
          endTime: m.endTime,
          timeLabel: `${formatTime12h(m.startTime)} – ${formatTime12h(m.endTime)}`,
          status: m.status,
          notes: m.notes,
        })),
      };
    },

    rescheduleAppointment: async (rawArgs: unknown) => {
      const args = (rawArgs || {}) as {
        bookingRef?: string;
        newDate?: string;
        newStartTime?: string;
      };

      const ref = args.bookingRef?.trim() || "";
      const newDate = args.newDate?.trim() || "";
      const newStartTime = args.newStartTime?.trim() || "";

      const existingList = findAppointmentByQuery(ref);
      const existing = existingList[0];

      if (!existing) {
        return {
          success: false,
          error: `Could not find an appointment with reference "${ref}".`,
        };
      }

      const validation = validateAndResolveSlot(
        newDate,
        newStartTime,
        existing.serviceId,
        existing.bookingRef,
      );

      if (!validation.valid || !validation.normalizedStart || !validation.normalizedEnd) {
        return {
          success: false,
          error: validation.reason || "Requested new slot is unavailable.",
          suggestedAlternatives: (validation.alternatives || []).map((s) => ({
            startTime: s.startTime,
            label: s.label,
          })),
        };
      }

      const updated = updateBookingRecord(existing.bookingRef, {
        date: newDate,
        startTime: validation.normalizedStart,
        endTime: validation.normalizedEnd,
        status: "rescheduled",
      });

      if (!updated) {
        return { success: false, error: "Failed to update appointment record." };
      }

      const dayAvail = computeDayAvailability(newDate, updated.serviceId);

      return {
        success: true,
        message: `Appointment ${updated.bookingRef} has been rescheduled to ${formatPrettyDate(updated.date)} at ${formatTime12h(updated.startTime)}.`,
        appointment: {
          bookingRef: updated.bookingRef,
          clientName: updated.clientName,
          serviceName: updated.serviceName,
          date: updated.date,
          prettyDate: formatPrettyDate(updated.date),
          time: `${formatTime12h(updated.startTime)} – ${formatTime12h(updated.endTime)}`,
          status: updated.status,
        },
        remainingSlotsOnDay: dayAvail.availableSlots.length,
      };
    },

    cancelAppointment: async (rawArgs: unknown) => {
      const args = (rawArgs || {}) as { bookingRef?: string; reason?: string };
      const ref = args.bookingRef?.trim() || "";
      const existing = findAppointmentByQuery(ref)[0];

      if (!existing) {
        return {
          success: false,
          error: `No appointment found with reference "${ref}".`,
        };
      }

      const updated = updateBookingRecord(existing.bookingRef, {
        status: "cancelled",
        notes: args.reason
          ? `${existing.notes ? existing.notes + " | " : ""}Cancelled: ${args.reason}`
          : existing.notes,
      });

      return {
        success: true,
        message: `Appointment ${existing.bookingRef} for ${existing.clientName} on ${formatPrettyDate(existing.date)} at ${formatTime12h(existing.startTime)} has been cancelled.`,
        appointment: updated,
      };
    },
  };
}
