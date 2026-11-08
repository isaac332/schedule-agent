import { connection } from "next/server";
import {
  computeDayAvailability,
  computeRangeAvailability,
  validateAndResolveSlot,
} from "@/lib/calendar/availability";
import { formatLocalDate, getNextOpenStudioDates } from "@/lib/calendar/dateUtils";
import {
  createBookingRecord,
  getAllAppointments,
  getAllWaitlistEntries,
  resetDemoStore,
  updateBookingRecord,
  updateWaitlistRecord,
} from "@/lib/storage/appointmentStore";
import {
  STUDIO_ADDONS,
  STUDIO_BACKDROPS,
  STUDIO_HOURS,
  STUDIO_INFO,
  STUDIO_PHOTOGRAPHERS,
  STUDIO_SERVICES,
} from "@/lib/studio/config";
import type { AppointmentStatus } from "@/lib/studio/types";

export async function GET(request: Request) {
  await connection();
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const serviceId = searchParams.get("serviceId") || "pareja-juntos";
  const daysParam = parseInt(searchParams.get("days") || "35", 10);

  const todayStr = formatLocalDate(new Date());
  const nextOpen = getNextOpenStudioDates(todayStr, 35);
  const targetDate = dateParam || nextOpen[0] || todayStr;

  const dayAvailability = computeDayAvailability(targetDate, serviceId);
  const monthAvailability = computeRangeAvailability(todayStr, Math.min(daysParam, 45), serviceId);

  return Response.json({
    studio: STUDIO_INFO,
    services: STUDIO_SERVICES,
    addOns: STUDIO_ADDONS,
    photographers: STUDIO_PHOTOGRAPHERS,
    backdrops: STUDIO_BACKDROPS,
    hours: STUDIO_HOURS,
    appointments: getAllAppointments(),
    waitlist: getAllWaitlistEntries(),
    selectedDateAvailability: dayAvailability,
    weekAvailability: monthAvailability.slice(0, 7),
    monthAvailability,
    nextOpenDates: nextOpen,
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      clientName?: string;
      clientPhone?: string;
      clientEmail?: string;
      serviceId?: string;
      date?: string;
      startTime?: string;
      participants?: number;
      notes?: string;
    };

    const clientName = (body.clientName || "").trim();
    const clientPhone = (body.clientPhone || "").trim();
    const clientEmail = (body.clientEmail || "").trim();
    const serviceId = body.serviceId || "pareja-juntos";
    const date = (body.date || "").trim();
    const startTime = (body.startTime || "").trim();

    if (!clientName || !clientPhone || !clientEmail || !date || !startTime) {
      return Response.json(
        { error: "All required booking fields must be provided." },
        { status: 400 },
      );
    }

    const validation = validateAndResolveSlot(date, startTime, serviceId);
    if (!validation.valid || !validation.normalizedStart || !validation.normalizedEnd) {
      return Response.json(
        {
          error: validation.reason || "Selected time slot is unavailable.",
          alternatives: validation.alternatives || [],
        },
        { status: 409 },
      );
    }

    const appointment = createBookingRecord({
      clientName,
      clientPhone,
      clientEmail,
      serviceId,
      date,
      startTime: validation.normalizedStart,
      endTime: validation.normalizedEnd,
      participants: body.participants || 1,
      notes: body.notes,
      source: "dashboard",
    });

    return Response.json({
      success: true,
      appointment,
      appointments: getAllAppointments(),
      waitlist: getAllWaitlistEntries(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: "reset" | "status" | "reschedule" | "reassign_waitlist";
      bookingRef?: string;
      waitlistId?: string;
      waitlistRef?: string;
      status?: AppointmentStatus;
      newDate?: string;
      newStartTime?: string;
      serviceId?: string;
    };

    if (body.action === "reset") {
      resetDemoStore();
      return Response.json({
        success: true,
        appointments: getAllAppointments(),
        waitlist: getAllWaitlistEntries(),
      });
    }

    if (body.action === "reassign_waitlist") {
      const waitlistId = body.waitlistId || body.waitlistRef || "wl-seed-1";
      const allWl = getAllWaitlistEntries();
      const targetWl = allWl.find(
        (w) =>
          w.id === waitlistId ||
          w.waitlistRef === waitlistId ||
          (waitlistId.includes("8104") && w.waitlistRef.includes("8104")) ||
          w.clientName.toLowerCase().includes("lucía") ||
          w.clientName.toLowerCase().includes("lucia"),
      );

      if (!targetWl) {
        return Response.json({ error: "Waitlist entry not found." }, { status: 404 });
      }

      const date = body.newDate || targetWl.preferredDate;
      const startTime = body.newStartTime || "11:00";
      const service =
        STUDIO_SERVICES.find((s) => s.id === targetWl.serviceId) || STUDIO_SERVICES[0];
      const startParts = startTime.split(":").map(Number);
      const startMin = (startParts[0] || 11) * 60 + (startParts[1] || 0);
      const endMin = startMin + service.durationMinutes;
      const endH = String(Math.floor(endMin / 60)).padStart(2, "0");
      const endM = String(endMin % 60).padStart(2, "0");
      const endTime = `${endH}:${endM}`;

      const created = createBookingRecord({
        clientName: targetWl.clientName,
        clientPhone: targetWl.clientPhone,
        clientEmail: targetWl.clientEmail,
        serviceId: targetWl.serviceId,
        date,
        startTime,
        endTime,
        notes: `Cita auto-rescatada desde lista de espera (${targetWl.waitlistRef}) tras cancelación`,
        source: "dashboard",
      });

      updateWaitlistRecord(targetWl.id, "booked");

      return Response.json({
        success: true,
        appointment: created,
        rescuedFromWaitlist: targetWl,
        appointments: getAllAppointments(),
        waitlist: getAllWaitlistEntries(),
      });
    }

    const bookingRef = (body.bookingRef || "").trim();
    if (!bookingRef) {
      return Response.json({ error: "bookingRef is required." }, { status: 400 });
    }

    if (body.action === "reschedule" && body.newDate && body.newStartTime) {
      const validation = validateAndResolveSlot(
        body.newDate,
        body.newStartTime,
        body.serviceId || "pareja-juntos",
        bookingRef,
      );
      if (!validation.valid || !validation.normalizedStart || !validation.normalizedEnd) {
        return Response.json(
          { error: validation.reason || "Slot conflict." },
          { status: 409 },
        );
      }
      const updated = updateBookingRecord(bookingRef, {
        date: body.newDate,
        startTime: validation.normalizedStart,
        endTime: validation.normalizedEnd,
        status: "rescheduled",
      });
      return Response.json({
        success: true,
        appointment: updated,
        appointments: getAllAppointments(),
        waitlist: getAllWaitlistEntries(),
      });
    }

    const updated = updateBookingRecord(bookingRef, {
      status: body.status || "cancelled",
    });

    if (!updated) {
      return Response.json({ error: "Appointment not found." }, { status: 404 });
    }

    return Response.json({
      success: true,
      appointment: updated,
      appointments: getAllAppointments(),
      waitlist: getAllWaitlistEntries(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return Response.json({ error: msg }, { status: 500 });
  }
}
