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
import type { ScenarioConfig } from "../studio/types";

export const STUDIO_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "getStudioServices",
    description:
      "Devuelve los paquetes fotográficos de juntosxsiempre, precios en MXN, duraciones, políticas de anticipo, complementos opcionales (maquillaje, retoques extra, reel), horarios de servicio y dirección en Nogales, Sonora, México.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          description:
            "Filtro opcional de categoría: 'portrait', 'family', 'milestone', 'commercial' o 'all'.",
        },
      },
    },
  },
  {
    name: "getAvailableSlots",
    description:
      "Consulta el calendario de juntosxsiempre para encontrar horarios disponibles en una fecha específica o rango de días para un paquete fotográfico.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: {
          type: Type.STRING,
          description:
            "Fecha inicial a consultar en formato YYYY-MM-DD. Si se omite, usa la próxima fecha abierta del estudio.",
        },
        daysCount: {
          type: Type.NUMBER,
          description:
            "Número de días consecutivos a consultar (1 a 7). Por defecto 3.",
        },
        serviceId: {
          type: Type.STRING,
          description:
            "ID o nombre del servicio ('pareja-juntos', 'retrato-editorial', 'familia-maternidad', 'quince-graduacion', 'campana-comercial').",
        },
      },
    },
  },
  {
    name: "checkAvailableBookings",
    description:
      "Verifica el calendario del estudio y obtiene todos los horarios disponibles para sesiones de fotos. Úsalo cuando el cliente pregunte qué fechas u horarios hay abiertos o pida disponibilidad.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: {
          type: Type.STRING,
          description:
            "Fecha a verificar en formato YYYY-MM-DD. Por defecto la primera fecha abierta.",
        },
        daysCount: {
          type: Type.NUMBER,
          description:
            "Cantidad de días de estudio a consultar (1 a 7). Por defecto 3.",
        },
        serviceId: {
          type: Type.STRING,
          description:
            "ID o nombre del paquete fotográfico ('pareja-juntos', 'retrato-editorial', 'familia-maternidad', 'quince-graduacion', 'campana-comercial').",
        },
        timeOfDay: {
          type: Type.STRING,
          description:
            "Filtro opcional por momento del día: 'morning' (9 AM–12 PM), 'afternoon' (12 PM–4 PM), 'late' (4 PM–6 PM) o 'any'.",
        },
      },
    },
  },
  {
    name: "calculateSessionQuote",
    description:
      "Calcula una cotización personalizada y detallada en Pesos Mexicanos (MXN) para un paquete fotográfico con complementos opcionales (maquillaje y peinado, fotos extra, entrega express 24h, video reel vertical o asesoría de vestuario).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        serviceId: {
          type: Type.STRING,
          description:
            "ID o nombre del paquete ('pareja-juntos', 'retrato-editorial', 'familia-maternidad', 'quince-graduacion', 'campana-comercial').",
        },
        addOns: {
          type: Type.STRING,
          description:
            "Lista separada por comas de complementos ('maquillaje-peinado, fotos-extra-5, entrega-express, video-reel, asesoria-vestuario').",
        },
        participants: {
          type: Type.NUMBER,
          description: "Número de personas participantes en la sesión (por defecto 1 o 2 según paquete).",
        },
      },
    },
  },
  {
    name: "getStudioTeamAndSpaces",
    description:
      "Obtiene detalles de los fotógrafos de juntosxsiempre (Sofía Morales, Mateo Hernández, Valentina Ramos), sus especialidades, sets en Nogales, Sonora, equipo Profoto y fondos artesanales disponibles.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        specialtyFilter: {
          type: Type.STRING,
          description:
            "Filtro opcional por especialidad o nombre del fotógrafo ('Sofía', 'Mateo', 'Valentina', 'parejas', 'editorial', 'quinceañera', 'familia').",
        },
      },
    },
  },
  {
    name: "bookAppointment",
    description:
      "Reserva y confirma una sesión fotográfica en juntosxsiempre tras verificar disponibilidad de horario y capturar los datos de contacto del cliente.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        clientName: {
          type: Type.STRING,
          description: "Nombre completo del cliente que reserva la sesión.",
        },
        clientPhone: {
          type: Type.STRING,
          description: "Número telefónico o celular del cliente para confirmación por WhatsApp/SMS.",
        },
        clientEmail: {
          type: Type.STRING,
          description: "Correo electrónico del cliente para confirmación y envío de galería digital.",
        },
        serviceId: {
          type: Type.STRING,
          description:
            "ID del servicio ('pareja-juntos', 'retrato-editorial', 'familia-maternidad', 'quince-graduacion', 'campana-comercial').",
        },
        date: {
          type: Type.STRING,
          description: "Fecha de la cita en formato YYYY-MM-DD.",
        },
        startTime: {
          type: Type.STRING,
          description: "Hora de inicio en formato 24h HH:mm (ej. '10:00', '14:30') o '2:30 PM'.",
        },
        participants: {
          type: Type.NUMBER,
          description: "Número de personas en la sesión fotográfica.",
        },
        photographerName: {
          type: Type.STRING,
          description: "Fotógrafo solicitado opcional ('Sofía Morales', 'Mateo Hernández', 'Valentina Ramos').",
        },
        addOns: {
          type: Type.STRING,
          description: "Complementos opcionales separados por comas ('maquillaje-peinado, video-reel').",
        },
        notes: {
          type: Type.STRING,
          description: "Notas adicionales, preferencia de fondo o solicitudes especiales.",
        },
      },
      required: ["clientName", "clientPhone", "clientEmail", "serviceId", "date", "startTime"],
    },
  },
  {
    name: "getAppointment",
    description:
      "Busca una reservación existente en juntosxsiempre por código de referencia (ej. 'JXS-2041'), teléfono del cliente, nombre o correo.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "Código de reserva (ej. 'JXS-2041'), celular, nombre o email del cliente.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "updateAppointmentDetails",
    description:
      "Actualiza las notas, fondo solicitado, cantidad de personas, fotógrafo asignado o complementos de una cita existente sin alterar su fecha/hora.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        bookingRef: {
          type: Type.STRING,
          description: "Código de reservación (ej. 'JXS-2041') o nombre/celular.",
        },
        participants: {
          type: Type.NUMBER,
          description: "Número actualizado de participantes.",
        },
        photographerName: {
          type: Type.STRING,
          description: "Nombre del fotógrafo solicitado ('Sofía Morales', 'Mateo Hernández', 'Valentina Ramos').",
        },
        addOns: {
          type: Type.STRING,
          description: "Complementos a agregar (ej. 'maquillaje-peinado, fotos-extra-5').",
        },
        notes: {
          type: Type.STRING,
          description: "Notas actualizadas, detalles de vestuario o color de fondo solicitado.",
        },
      },
      required: ["bookingRef"],
    },
  },
  {
    name: "sendPrepGuideAndDepositLink",
    description:
      "Envía la guía de preparación y vestuario, información del estacionamiento en Nogales, Sonora y el enlace de pago de anticipo para una reservación existente.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        bookingRef: {
          type: Type.STRING,
          description: "Código de reservación (ej. 'JXS-2041') o nombre/celular.",
        },
      },
      required: ["bookingRef"],
    },
  },
  {
    name: "joinWaitlist",
    description:
      "Agrega al cliente a la lista de espera prioritaria de juntosxsiempre cuando su fecha u horario deseado ya se encuentra ocupado.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        clientName: {
          type: Type.STRING,
          description: "Nombre completo del cliente.",
        },
        clientPhone: {
          type: Type.STRING,
          description: "Número celular para alerta inmediata por SMS/WhatsApp si se libera un espacio.",
        },
        clientEmail: {
          type: Type.STRING,
          description: "Correo electrónico del cliente.",
        },
        serviceId: {
          type: Type.STRING,
          description: "ID o nombre del paquete fotográfico deseado.",
        },
        preferredDate: {
          type: Type.STRING,
          description: "Fecha preferida en formato YYYY-MM-DD.",
        },
        preferredTimeWindow: {
          type: Type.STRING,
          description: "Ventana de horario preferida (ej. 'Mañana 10:00 AM', 'Tarde', 'Sábado mediodía').",
        },
        notes: {
          type: Type.STRING,
          description: "Notas opcionales para la lista de espera.",
        },
      },
      required: ["clientName", "preferredDate"],
    },
  },
  {
    name: "rescheduleAppointment",
    description:
      "Mueve una reservación existente a una nueva fecha y hora de inicio previa verificación de disponibilidad.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        bookingRef: {
          type: Type.STRING,
          description: "Código de reservación (ej. 'JXS-2041').",
        },
        newDate: {
          type: Type.STRING,
          description: "Nueva fecha en formato YYYY-MM-DD.",
        },
        newStartTime: {
          type: Type.STRING,
          description: "Nueva hora de inicio en formato HH:mm (ej. '11:00', '15:00').",
        },
      },
      required: ["bookingRef", "newDate", "newStartTime"],
    },
  },
  {
    name: "cancelAppointment",
    description: "Cancela una reservación existente por su código de referencia y libera el horario para la lista de espera.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        bookingRef: {
          type: Type.STRING,
          description: "Código de reservación (ej. 'JXS-2041').",
        },
        reason: {
          type: Type.STRING,
          description: "Motivo opcional de la cancelación.",
        },
      },
      required: ["bookingRef"],
    },
  },
];

export const STUDIO_TOOLS: Tool[] = [createToolbox(STUDIO_FUNCTION_DECLARATIONS)];

export function createStudioToolFunctions(
  defaultClientPhone?: string,
  scenarioContext?: ScenarioConfig,
): ToolFunctionsMap {
  return {
    getStudioServices: async (rawArgs: unknown) => {
      const args = (rawArgs || {}) as { category?: string };
      const cat = args.category?.toLowerCase().trim();
      let services =
        cat && cat !== "all"
          ? STUDIO_SERVICES.filter(
              (s) => s.category === cat || s.id.includes(cat) || s.name.toLowerCase().includes(cat),
            )
          : STUDIO_SERVICES;

      if (scenarioContext?.customBasePrice) {
        services = services.map((s) =>
          s.id === "pareja-juntos"
            ? {
                ...s,
                price: scenarioContext.customBasePrice,
                depositAmount: Math.round(scenarioContext.customBasePrice * 0.3),
              }
            : s,
        );
      }

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
      const service = findStudioService(args.serviceId || "") || STUDIO_SERVICES[0];

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
            if (timeFilter === "morning" || timeFilter === "mañana") return startMins < 720; // 9 AM - 12 PM
            if (timeFilter === "afternoon" || timeFilter === "tarde") return startMins >= 720 && startMins < 960; // 12 PM - 4 PM
            if (timeFilter === "late" || timeFilter === "noche") return startMins >= 960; // 4 PM - 6 PM
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

      const service = findStudioService(args.serviceId || "") || STUDIO_SERVICES[0];
      const basePrice =
        scenarioContext?.customBasePrice && (service.id === "pareja-juntos" || !args.serviceId)
          ? scenarioContext.customBasePrice
          : service.price;

      const matchedAddOns = args.addOns ? findStudioAddOns(args.addOns) : [];
      const participants = typeof args.participants === "number" ? args.participants : service.maxParticipants;

      // Map matched add-ons to custom prices from scenarioContext if provided
      const resolvedAddOns = matchedAddOns.map((addon) => {
        const custom = scenarioContext?.customAddOns?.find((c) => c.id === addon.id);
        return {
          ...addon,
          price: custom ? custom.price : addon.price,
        };
      });

      const addOnsTotal = resolvedAddOns.reduce((sum, a) => sum + a.price, 0);
      const extraMinutes = resolvedAddOns.reduce((sum, a) => sum + a.extraMinutes, 0);
      const extraParticipantFee =
        participants > service.maxParticipants
          ? (participants - service.maxParticipants) * 450 // $450 MXN por persona extra
          : 0;

      const totalPrice = basePrice + addOnsTotal + extraParticipantFee;
      const totalDurationMinutes = service.durationMinutes + extraMinutes;
      const depositDueToday =
        scenarioContext?.customBasePrice && (service.id === "pareja-juntos" || !args.serviceId)
          ? Math.round(scenarioContext.customBasePrice * 0.3)
          : service.depositAmount;
      const balanceDueAtShoot = totalPrice - depositDueToday;

      return {
        package: {
          id: service.id,
          name: service.name,
          basePrice,
          baseDurationMinutes: service.durationMinutes,
          maxIncludedParticipants: service.maxParticipants,
        },
        selectedAddOns: resolvedAddOns.map((a) => ({
          id: a.id,
          name: a.name,
          price: a.price,
          extraMinutes: a.extraMinutes,
        })),
        participantsCount: participants,
        extraParticipantFee,
        quoteSummary: {
          totalPrice: `$${totalPrice.toLocaleString("es-MX")} MXN`,
          totalPriceNumeric: totalPrice,
          depositRequiredToBook: `$${depositDueToday.toLocaleString("es-MX")} MXN`,
          remainingBalanceAtSession: `$${balanceDueAtShoot.toLocaleString("es-MX")} MXN`,
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
          "Generadores y Flashes Profoto Pro-11 & B10X Plus",
          "Ciclorama infinito climatizado de 6 metros",
          "Visualización inalámbrica en tiempo real con iPad Pro & Capture One",
          "Camerino privado con tocador iluminado estilo Hollywood y vaporizador",
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
      const clientPhone = args.clientPhone?.trim() || defaultClientPhone || STUDIO_INFO.phone;
      const clientEmail = args.clientEmail?.trim() || "cliente@ejemplo.com";
      const dateStr = args.date?.trim() || "";
      const startTimeRaw = args.startTime?.trim() || "";
      const service = findStudioService(args.serviceId || "") || STUDIO_SERVICES[0];

      if (!clientName || !dateStr || !startTimeRaw) {
        return {
          success: false,
          error:
            "Campos requeridos incompletos. Por favor proporciona clientName, date (YYYY-MM-DD) y startTime (HH:mm).",
        };
      }

      const validation = validateAndResolveSlot(dateStr, startTimeRaw, service.id);
      if (!validation.valid || !validation.normalizedStart || !validation.normalizedEnd) {
        return {
          success: false,
          error: validation.reason || "El horario solicitado no se encuentra disponible.",
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
        participants: args.participants || service.maxParticipants,
        photographerName: assignedPhotographer,
        addOns: matchedAddOns.map((a) => a.name),
        extraPrice,
        notes: args.notes,
        source: "sms",
      });

      return {
        success: true,
        message: `¡Cita confirmada con éxito! Código de reservación: ${booked.bookingRef}`,
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
          price: `$${booked.price.toLocaleString("es-MX")} MXN`,
          depositRequired: `$${service.depositAmount.toLocaleString("es-MX")} MXN`,
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
          message: `No se encontraron reservaciones que coincidan con "${query}".`,
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
          price: `$${m.price.toLocaleString("es-MX")} MXN`,
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
          error: `No se encontró una cita que coincida con "${ref}".`,
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
        message: `Se actualizaron los detalles de la reservación ${existing.bookingRef} de ${existing.clientName}.`,
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
          error: `No se encontró la reservación "${ref}".`,
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
        depositAmount: `$${service.depositAmount.toLocaleString("es-MX")} MXN`,
        totalPrice: `$${existing.price.toLocaleString("es-MX")} MXN`,
        depositPaymentUrl: `https://pay.juntosxsiempre.mx/anticipo/${existing.bookingRef}`,
        prepChecklist: [
          `Llegar 10 minutos antes de tu horario (${formatTime12h(existing.startTime)}) en ${STUDIO_INFO.address}.`,
          STUDIO_INFO.parkingInfo,
          STUDIO_INFO.wardrobeTips,
          "Trae hasta 2 o 3 opciones de vestuario en ganchos; en el estudio contamos con vaporizador profesional.",
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
        clientName: args.clientName?.trim() || "Cliente Estimado",
        clientPhone: args.clientPhone?.trim() || defaultClientPhone || STUDIO_INFO.phone,
        clientEmail: args.clientEmail?.trim() || "cliente@ejemplo.com",
        serviceId: service.id,
        preferredDate:
          args.preferredDate && /^\d{4}-\d{2}-\d{2}$/.test(args.preferredDate.trim())
            ? args.preferredDate.trim()
            : openDates[0] || todayStr,
        preferredTimeWindow: args.preferredTimeWindow?.trim() || "Cualquier horario disponible",
        notes: args.notes,
      });

      return {
        success: true,
        message: `Se añadió a ${entry.clientName} a la lista de espera prioritaria (${entry.waitlistRef}) para el ${formatPrettyDate(entry.preferredDate)}.`,
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
          error: `No se encontró una cita con la referencia "${ref}".`,
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
          error: validation.reason || "El nuevo horario solicitado no se encuentra disponible.",
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
        return { success: false, error: "No se pudo actualizar el registro de la cita." };
      }

      const dayAvail = computeDayAvailability(newDate, updated.serviceId);

      return {
        success: true,
        message: `Tu cita ${updated.bookingRef} fue reprogramada para el ${formatPrettyDate(updated.date)} a las ${formatTime12h(updated.startTime)}.`,
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
          error: `No se encontró ninguna cita con la referencia "${ref}".`,
        };
      }

      const updated = updateBookingRecord(existing.bookingRef, {
        status: "cancelled",
        notes: args.reason
          ? `${existing.notes ? existing.notes + " | " : ""}Cancelada: ${args.reason}`
          : existing.notes,
      });

      const openedWaitlist = getAllWaitlistEntries().filter(
        (w) => w.preferredDate === existing.date && w.status === "slot_opened",
      );

      return {
        success: true,
        message: `La cita ${existing.bookingRef} de ${existing.clientName} del ${formatPrettyDate(existing.date)} a las ${formatTime12h(existing.startTime)} ha sido cancelada.`,
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
