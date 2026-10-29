import { Type, type FunctionDeclaration, type Tool } from "@google/genai";
import { createToolbox, type ToolFunctionsMap } from "@llm-multi-provider/core";
import {
  STUDIO_ADDONS,
  STUDIO_BACKDROPS,
  STUDIO_HOURS,
  STUDIO_INFO,
  STUDIO_PHOTOGRAPHERS,
  STUDIO_SERVICES,
  findPhotographer,
  findStudioAddOns,
  findStudioService,
} from "../studio/config";
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
  timeToMinutes,
} from "../calendar/dateUtils";
import {
  createBookingRecord,
  createWaitlistRecord,
  findAppointmentByQuery,
  getAllWaitlistEntries,
  getAppointmentsByDate,
  updateBookingRecord,
} from "../storage/appointmentStore";

export const STUDIO_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "getStudioServices",
    description:
      "Returns the photo studio's session packages, pricing, durations, deposit policies, optional add-ons, operating hours, and studio address.",
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
            "Start date to check in YYYY-MM-DD format. If omitted, defaults to the next open studio date.",
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
    },
  },
  {
    name: "checkAvailableBookings",
    description:
      "Checks the studio calendar and retrieves all available booking times for photo shoots. Use this whenever the client asks what's available, wants to see open times, or checks availability for a date or session type.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: {
          type: Type.STRING,
          description:
            "Date to check in YYYY-MM-DD format (e.g. '2026-10-30'). Defaults to the earliest open studio date if omitted.",
        },
        daysCount: {
          type: Type.NUMBER,
          description:
            "Number of upcoming studio days to retrieve (1 to 7). Default is 3.",
        },
        serviceId: {
          type: Type.STRING,
          description:
            "Photography package ID or name (e.g. 'headshot-express', 'portrait-signature', 'family-maternity', 'graduation-senior', 'commercial-brand'). If omitted, defaults to express headshot.",
        },
        timeOfDay: {
          type: Type.STRING,
          description:
            "Optional filter for time of day: 'morning' (9 AM–12 PM), 'afternoon' (12 PM–4 PM), 'late' (4 PM–6 PM), or 'any'.",
        },
      },
    },
  },
  {
    name: "calculateSessionQuote",
    description:
      "Calculates a customized itemized price and duration quote for a photography package combined with optional studio add-ons (hair & makeup, extra retouched photos, 24h rush delivery, wardrobe styling, or behind-the-scenes social reel).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        serviceId: {
          type: Type.STRING,
          description:
            "Package ID or name (e.g. 'headshot-express', 'portrait-signature', 'family-maternity', 'graduation-senior', 'commercial-brand').",
        },
        addOns: {
          type: Type.STRING,
          description:
            "Comma-separated list of add-on IDs or names (e.g. 'hair-makeup, extra-retouch-5, rush-delivery, wardrobe-styling, bts-social-reel').",
        },
        participants: {
          type: Type.NUMBER,
          description: "Number of participants in the shoot (default 1).",
        },
      },
    },
  },
  {
    name: "getStudioTeamAndSpaces",
    description:
      "Retrieves details about the studio's photographers, their specialties, studio suites, lighting equipment, and available hand-painted & seamless backdrops.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        specialtyFilter: {
          type: Type.STRING,
          description:
            "Optional filter by specialty or photographer name (e.g. 'Elena', 'Marcus', 'Sofia', 'headshot', 'family', 'editorial').",
        },
      },
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
        photographerName: {
          type: Type.STRING,
          description: "Optional requested photographer (e.g. 'Elena Vance', 'Marcus Chen', 'Sofia Patel').",
        },
        addOns: {
          type: Type.STRING,
          description: "Optional comma-separated add-ons to include with the booking.",
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
    name: "updateAppointmentDetails",
    description:
      "Updates an existing appointment's notes, backdrop requests, participant count, assigned photographer, or add-on upgrades without changing its date/time.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        bookingRef: {
          type: Type.STRING,
          description: "Booking reference code (e.g. 'LUM-2041') or client name/phone.",
        },
        participants: {
          type: Type.NUMBER,
          description: "Updated number of participants.",
        },
        photographerName: {
          type: Type.STRING,
          description: "Requested photographer name (e.g. 'Elena Vance', 'Marcus Chen', 'Sofia Patel').",
        },
        addOns: {
          type: Type.STRING,
          description:
            "Comma-separated add-on names or IDs to add to the booking (e.g. 'hair-makeup, rush-delivery').",
        },
        notes: {
          type: Type.STRING,
          description: "Updated session notes, wardrobe details, or backdrop color requests.",
        },
      },
      required: ["bookingRef"],
    },
  },
  {
    name: "sendPrepGuideAndDepositLink",
    description:
      "Generates and sends a tailored pre-shoot preparation checklist, wardrobe guide, parking pass info, and deposit payment link for an existing booking.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        bookingRef: {
          type: Type.STRING,
          description: "Booking reference code (e.g. 'LUM-2041') or client name/phone.",
        },
      },
      required: ["bookingRef"],
    },
  },
  {
    name: "joinWaitlist",
    description:
      "Adds a client to the studio's priority slot waitlist when their desired date or time window is currently booked.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        clientName: {
          type: Type.STRING,
          description: "Client's full name.",
        },
        clientPhone: {
          type: Type.STRING,
          description: "Client's phone number for instant SMS slot-opening alerts.",
        },
        clientEmail: {
          type: Type.STRING,
          description: "Client's email address.",
        },
        serviceId: {
          type: Type.STRING,
          description: "Desired photography package ID or name.",
        },
        preferredDate: {
          type: Type.STRING,
          description: "Preferred date in YYYY-MM-DD format.",
        },
        preferredTimeWindow: {
          type: Type.STRING,
          description: "Preferred time window (e.g. 'Morning 10:00 AM', 'Afternoon', 'Saturday morning').",
        },
        notes: {
          type: Type.STRING,
          description: "Optional waitlist notes.",
        },
      },
      required: ["clientName", "preferredDate"],
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
        availableAddOns: STUDIO_ADDONS,
      };
    },

    getAvailableSlots: async (rawArgs: unknown) => {
      const args = (rawArgs || {}) as {
        date?: string;
        daysCount?: number;
        serviceId?: string;
      };
      const todayStr = formatLocalDate(new Date());
      const nextOpen = getNextOpenStudioDates(todayStr, 1);
      const startDate =
        args.date && /^\d{4}-\d{2}-\d{2}$/.test(args.date.trim())
          ? args.date.trim()
          : nextOpen[0] || todayStr;
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

    checkAvailableBookings: async (rawArgs: unknown) => {
      const args = (rawArgs || {}) as {
        date?: string;
        daysCount?: number;
        serviceId?: string;
        timeOfDay?: string;
      };

      const todayStr = formatLocalDate(new Date());
      const nextOpenDates = getNextOpenStudioDates(todayStr, 7);
      const startDate =
        args.date && /^\d{4}-\d{2}-\d{2}$/.test(args.date.trim())
          ? args.date.trim()
          : nextOpenDates[0] || todayStr;

      const daysCount = Math.min(
        Math.max(typeof args.daysCount === "number" ? args.daysCount : 3, 1),
        7,
      );
      const service = findStudioService(args.serviceId || "") || STUDIO_SERVICES[0];
      const range = computeRangeAvailability(startDate, daysCount, service.id);
      const timeFilter = args.timeOfDay?.toLowerCase().trim();

      const days = range.map((day) => {
        const existingBookings = getAppointmentsByDate(day.date);
        let slots = day.availableSlots;

        if (timeFilter && timeFilter !== "any") {
          slots = slots.filter((slot) => {
            const startMins = timeToMinutes(slot.startTime);
            if (timeFilter === "morning") return startMins < 720; // 9 AM - 12 PM
            if (timeFilter === "afternoon") return startMins >= 720 && startMins < 960; // 12 PM - 4 PM
            if (timeFilter === "late") return startMins >= 960; // 4 PM - 6 PM
            return true;
          });
        }

        return {
          date: day.date,
          prettyDate: formatPrettyDate(day.date),
          dayName: day.dayName,
          isOpen: day.isOpen,
          operatingHours: day.operatingHours,
          bookedAppointmentsCount: existingBookings.length,
          availableCount: slots.length,
          availableSlots: slots.map((s) => ({
            startTime: s.startTime,
            endTime: s.endTime,
            label: s.label,
          })),
        };
      });

      const totalOpen = days.reduce((sum, d) => sum + d.availableCount, 0);

      return {
        status: "success",
        serviceChecked: {
          id: service.id,
          name: service.name,
          durationMinutes: service.durationMinutes,
          price: service.price,
        },
        timeFilterApplied: timeFilter || "all",
        totalAvailableSlotsFound: totalOpen,
        days,
        nextOpenStudioDates: nextOpenDates,
      };
    },

    calculateSessionQuote: async (rawArgs: unknown) => {
      const args = (rawArgs || {}) as {
        serviceId?: string;
        addOns?: string | string[];
        participants?: number;
      };

      const service = findStudioService(args.serviceId || "") || STUDIO_SERVICES[1];
      const matchedAddOns = args.addOns ? findStudioAddOns(args.addOns) : [];
      const participants = typeof args.participants === "number" ? args.participants : 1;

      const addOnsTotal = matchedAddOns.reduce((sum, a) => sum + a.price, 0);
      const extraMinutes = matchedAddOns.reduce((sum, a) => sum + a.extraMinutes, 0);
      const extraParticipantFee =
        participants > service.maxParticipants
          ? (participants - service.maxParticipants) * 35
          : 0;

      const totalPrice = service.price + addOnsTotal + extraParticipantFee;
      const totalDurationMinutes = service.durationMinutes + extraMinutes;
      const depositDueToday = service.depositAmount;
      const balanceDueAtShoot = totalPrice - depositDueToday;

      return {
        package: {
          id: service.id,
          name: service.name,
          basePrice: service.price,
          baseDurationMinutes: service.durationMinutes,
          maxIncludedParticipants: service.maxParticipants,
        },
        selectedAddOns: matchedAddOns.map((a) => ({
          id: a.id,
          name: a.name,
          price: a.price,
          extraMinutes: a.extraMinutes,
        })),
        participantsCount: participants,
        extraParticipantFee,
        quoteSummary: {
          totalPrice: `$${totalPrice}`,
          totalPriceNumeric: totalPrice,
          depositRequiredToBook: `$${depositDueToday}`,
          remainingBalanceAtSession: `$${balanceDueAtShoot}`,
          estimatedTotalTimeMinutes: totalDurationMinutes,
        },
        allAvailableAddOnsCatalog: STUDIO_ADDONS,
      };
    },

    getStudioTeamAndSpaces: async (rawArgs: unknown) => {
      const args = (rawArgs || {}) as { specialtyFilter?: string };
      const q = args.specialtyFilter?.toLowerCase().trim();

      const photographers = q
        ? STUDIO_PHOTOGRAPHERS.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.role.toLowerCase().includes(q) ||
              p.specialties.some((s) => s.toLowerCase().includes(q)),
          )
        : STUDIO_PHOTOGRAPHERS;

      return {
        studioName: STUDIO_INFO.name,
        address: STUDIO_INFO.address,
        photographers: photographers.length > 0 ? photographers : STUDIO_PHOTOGRAPHERS,
        backdropsAvailable: STUDIO_BACKDROPS,
        equipmentHighlights: [
          "Profoto Pro-11 & B10X Plus Studio Strobes",
          "18-ft Heated Infinity Cyclorama Wall",
          "Capture One Live Wireless iPad Client Review",
          "Full Garment Steamer, Changing Suite & Illuminated Vanity Station",
        ],
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
        photographerName?: string;
        addOns?: string;
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

      const matchedAddOns = args.addOns ? findStudioAddOns(args.addOns) : [];
      const extraPrice = matchedAddOns.reduce((sum, a) => sum + a.price, 0);
      const assignedPhotographer = findPhotographer(
        args.photographerName || service.id,
      ).name;

      const booked = createBookingRecord({
        clientName,
        clientPhone,
        clientEmail,
        serviceId: service.id,
        date: dateStr,
        startTime: validation.normalizedStart,
        endTime: validation.normalizedEnd,
        participants: args.participants || 1,
        photographerName: assignedPhotographer,
        addOns: matchedAddOns.map((a) => a.name),
        extraPrice,
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
          photographerName: booked.photographerName,
          addOns: booked.addOns,
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
          photographerName: m.photographerName,
          addOns: m.addOns || [],
          prepGuideSent: Boolean(m.prepGuideSent),
          price: `$${m.price}`,
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

    updateAppointmentDetails: async (rawArgs: unknown) => {
      const args = (rawArgs || {}) as {
        bookingRef?: string;
        participants?: number;
        photographerName?: string;
        addOns?: string;
        notes?: string;
      };

      const ref = args.bookingRef?.trim() || "";
      const existing = findAppointmentByQuery(ref)[0];
      if (!existing) {
        return {
          success: false,
          error: `Could not find an appointment matching "${ref}".`,
        };
      }

      const service =
        STUDIO_SERVICES.find((s) => s.id === existing.serviceId) || STUDIO_SERVICES[0];

      const newAddOns = args.addOns
        ? Array.from(
            new Set([
              ...(existing.addOns || []),
              ...findStudioAddOns(args.addOns).map((a) => a.name),
            ]),
          )
        : existing.addOns || [];

      const addOnsObjects = findStudioAddOns(newAddOns);
      const addOnsPrice = addOnsObjects.reduce((sum, a) => sum + a.price, 0);
      const newPrice = service.price + addOnsPrice;

      const updatedPhotographer = args.photographerName
        ? findPhotographer(args.photographerName).name
        : existing.photographerName;

      const updatedNotes = args.notes
        ? existing.notes
          ? `${existing.notes} | ${args.notes.trim()}`
          : args.notes.trim()
        : existing.notes;

      const updated = updateBookingRecord(existing.bookingRef, {
        participants:
          typeof args.participants === "number"
            ? args.participants
            : existing.participants,
        photographerName: updatedPhotographer,
        addOns: newAddOns,
        price: newPrice,
        notes: updatedNotes,
      });

      return {
        success: true,
        message: `Updated booking ${existing.bookingRef} for ${existing.clientName}.`,
        appointment: updated,
      };
    },

    sendPrepGuideAndDepositLink: async (rawArgs: unknown) => {
      const args = (rawArgs || {}) as { bookingRef?: string };
      const ref = args.bookingRef?.trim() || "";
      const existing = findAppointmentByQuery(ref)[0];

      if (!existing) {
        return {
          success: false,
          error: `Could not find booking matching "${ref}".`,
        };
      }

      const service =
        STUDIO_SERVICES.find((s) => s.id === existing.serviceId) || STUDIO_SERVICES[0];

      const updated = updateBookingRecord(existing.bookingRef, {
        prepGuideSent: true,
      });

      return {
        success: true,
        bookingRef: existing.bookingRef,
        clientName: existing.clientName,
        clientEmail: existing.clientEmail,
        depositAmount: `$${service.depositAmount}`,
        totalPrice: `$${existing.price}`,
        depositPaymentUrl: `https://pay.luminastudio.co/deposit/${existing.bookingRef}`,
        prepChecklist: [
          `Arrive 10 minutes before your ${formatTime12h(existing.startTime)} start time at ${STUDIO_INFO.address}.`,
          STUDIO_INFO.parkingInfo,
          STUDIO_INFO.wardrobeTips,
          "Bring 2–3 pressed outfit options on hangers; our studio steamer is ready for you.",
        ],
        appointment: updated,
      };
    },

    joinWaitlist: async (rawArgs: unknown) => {
      const args = (rawArgs || {}) as {
        clientName?: string;
        clientPhone?: string;
        clientEmail?: string;
        serviceId?: string;
        preferredDate?: string;
        preferredTimeWindow?: string;
        notes?: string;
      };

      const todayStr = formatLocalDate(new Date());
      const openDates = getNextOpenStudioDates(todayStr, 3);
      const service = findStudioService(args.serviceId || "") || STUDIO_SERVICES[0];

      const entry = createWaitlistRecord({
        clientName: args.clientName?.trim() || "Valued Client",
        clientPhone: args.clientPhone?.trim() || defaultClientPhone || "(555) 019-2834",
        clientEmail: args.clientEmail?.trim() || "client@example.com",
        serviceId: service.id,
        preferredDate:
          args.preferredDate && /^\d{4}-\d{2}-\d{2}$/.test(args.preferredDate.trim())
            ? args.preferredDate.trim()
            : openDates[0] || todayStr,
        preferredTimeWindow: args.preferredTimeWindow?.trim() || "First available slot",
        notes: args.notes,
      });

      return {
        success: true,
        message: `Added ${entry.clientName} to the priority waitlist (${entry.waitlistRef}) for ${formatPrettyDate(entry.preferredDate)}.`,
        waitlistEntry: entry,
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

      const openedWaitlist = getAllWaitlistEntries().filter(
        (w) => w.preferredDate === existing.date && w.status === "slot_opened",
      );

      return {
        success: true,
        message: `Appointment ${existing.bookingRef} for ${existing.clientName} on ${formatPrettyDate(existing.date)} at ${formatTime12h(existing.startTime)} has been cancelled.`,
        appointment: updated,
        waitlistAutoNotified: openedWaitlist.map((w) => ({
          waitlistRef: w.waitlistRef,
          clientName: w.clientName,
          preferredTimeWindow: w.preferredTimeWindow,
        })),
      };
    },
  };
}
