import { connection } from "next/server";
import {
  computeDayAvailability,
  computeRangeAvailability,
} from "@/lib/calendar/availability";
import { formatLocalDate, getNextOpenStudioDates } from "@/lib/calendar/dateUtils";
import {
  getAllAppointments,
  getAllWaitlistEntries,
  resetDemoStore,
} from "@/lib/storage/appointmentStore";
import {
  STUDIO_ADDONS,
  STUDIO_BACKDROPS,
  STUDIO_HOURS,
  STUDIO_INFO,
  STUDIO_PHOTOGRAPHERS,
  STUDIO_SERVICES,
} from "@/lib/studio/config";

export async function POST(request: Request) {
  try {
    await connection();
    const body = (await request.json().catch(() => ({}))) as {
      serviceId?: string;
    };

    const serviceId = body.serviceId || "headshot-express";
    resetDemoStore();

    const todayStr = formatLocalDate(new Date());
    const nextOpen = getNextOpenStudioDates(todayStr, 6);
    const targetDate = nextOpen[0] || todayStr;

    const dayAvailability = computeDayAvailability(targetDate, serviceId);
    const weekAvailability = computeRangeAvailability(todayStr, 7, serviceId);

    return Response.json({
      success: true,
      message: "Studio appointments, priority waitlist, and all chat sessions reset to initial demo state.",
      studio: STUDIO_INFO,
      services: STUDIO_SERVICES,
      addOns: STUDIO_ADDONS,
      photographers: STUDIO_PHOTOGRAPHERS,
      backdrops: STUDIO_BACKDROPS,
      hours: STUDIO_HOURS,
      appointments: getAllAppointments(),
      waitlist: getAllWaitlistEntries(),
      selectedDateAvailability: dayAvailability,
      weekAvailability,
      nextOpenDates: nextOpen,
      resetAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return Response.json({ error: msg }, { status: 500 });
  }
}
