import { STUDIO_INFO, STUDIO_SERVICES, findStudioService } from "../studio/config";
import type { DayAvailability, TimeSlot } from "../studio/types";
import { getAppointmentsByDate } from "../storage/appointmentStore";
import {
  addDays,
  formatTime12h,
  getDayScheduleForDate,
  minutesToTime,
  normalizeTimeInput,
  timeToMinutes,
} from "./dateUtils";

export function computeDayAvailability(
  dateStr: string,
  serviceQueryOrId: string = "portrait-signature",
  excludeBookingRef?: string,
): DayAvailability {
  const service = findStudioService(serviceQueryOrId) || STUDIO_SERVICES[1];
  const daySched = getDayScheduleForDate(dateStr);

  if (!daySched.isOpen) {
    return {
      date: dateStr,
      dayName: daySched.dayName,
      isOpen: false,
      operatingHours: "Closed",
      serviceId: service.id,
      serviceName: service.name,
      durationMinutes: service.durationMinutes,
      availableSlots: [],
      allSlots: [],
    };
  }

  const openMins = timeToMinutes(daySched.openTime);
  const closeMins = timeToMinutes(daySched.closeTime);
  const duration = service.durationMinutes;
  const buffer = STUDIO_INFO.bufferMinutes;

  const existingBookings = getAppointmentsByDate(dateStr).filter(
    (apt) =>
      !excludeBookingRef ||
      apt.bookingRef.toLowerCase() !== excludeBookingRef.trim().toLowerCase(),
  );

  const allSlots: TimeSlot[] = [];

  // Step through the day in 30-minute increments
  for (let start = openMins; start + duration <= closeMins; start += 30) {
    const end = start + duration;
    const startTime24 = minutesToTime(start);
    const endTime24 = minutesToTime(end);

    // Check overlap with existing bookings (including buffer before and after)
    let conflictRef: string | undefined;
    for (const booked of existingBookings) {
      const bStart = timeToMinutes(booked.startTime);
      const bEnd = timeToMinutes(booked.endTime) + buffer;
      const candidateEndWithBuffer = end + buffer;

      const overlaps = start < bEnd && candidateEndWithBuffer > bStart;
      if (overlaps) {
        conflictRef = booked.bookingRef;
        break;
      }
    }

    allSlots.push({
      startTime: startTime24,
      endTime: endTime24,
      label: `${formatTime12h(startTime24)} – ${formatTime12h(endTime24)}`,
      available: !conflictRef,
      conflictRef,
    });
  }

  return {
    date: dateStr,
    dayName: daySched.dayName,
    isOpen: true,
    operatingHours: `${formatTime12h(daySched.openTime)} – ${formatTime12h(daySched.closeTime)}`,
    serviceId: service.id,
    serviceName: service.name,
    durationMinutes: service.durationMinutes,
    availableSlots: allSlots.filter((s) => s.available),
    allSlots,
  };
}

export function computeRangeAvailability(
  startDateStr: string,
  daysCount: number = 5,
  serviceQueryOrId: string = "portrait-signature",
): DayAvailability[] {
  const safeDays = Math.min(Math.max(daysCount, 1), 14);
  const results: DayAvailability[] = [];

  for (let i = 0; i < safeDays; i++) {
    const d = addDays(startDateStr, i);
    results.push(computeDayAvailability(d, serviceQueryOrId));
  }

  return results;
}

export function validateAndResolveSlot(
  dateStr: string,
  requestedTime: string,
  serviceQueryOrId: string,
  excludeBookingRef?: string,
): {
  valid: boolean;
  reason?: string;
  normalizedStart?: string;
  normalizedEnd?: string;
  alternatives?: TimeSlot[];
} {
  const service = findStudioService(serviceQueryOrId) || STUDIO_SERVICES[1];
  const dayAvail = computeDayAvailability(dateStr, service.id, excludeBookingRef);

  if (!dayAvail.isOpen) {
    return {
      valid: false,
      reason: `Lumina Studio is closed on ${dayAvail.dayName}s (${dateStr}). We are open Tuesday–Friday 9:00 AM–6:00 PM and Saturday 10:00 AM–5:00 PM.`,
      alternatives: [],
    };
  }

  const normalizedStart = normalizeTimeInput(requestedTime);
  const startMins = timeToMinutes(normalizedStart);
  const endMins = startMins + service.durationMinutes;
  const normalizedEnd = minutesToTime(endMins);

  const openMins = timeToMinutes(getDayScheduleForDate(dateStr).openTime);
  const closeMins = timeToMinutes(getDayScheduleForDate(dateStr).closeTime);

  if (startMins < openMins || endMins > closeMins) {
    return {
      valid: false,
      reason: `Requested time ${formatTime12h(normalizedStart)}–${formatTime12h(normalizedEnd)} is outside our ${dayAvail.dayName} operating hours (${dayAvail.operatingHours}).`,
      alternatives: dayAvail.availableSlots.slice(0, 4),
    };
  }

  const existingBookings = getAppointmentsByDate(dateStr).filter(
    (apt) =>
      !excludeBookingRef ||
      apt.bookingRef.toLowerCase() !== excludeBookingRef.trim().toLowerCase(),
  );

  for (const booked of existingBookings) {
    const bStart = timeToMinutes(booked.startTime);
    const bEnd = timeToMinutes(booked.endTime) + STUDIO_INFO.bufferMinutes;
    const candidateEndWithBuffer = endMins + STUDIO_INFO.bufferMinutes;

    if (startMins < bEnd && candidateEndWithBuffer > bStart) {
      return {
        valid: false,
        reason: `The ${formatTime12h(normalizedStart)} slot conflicts with an existing studio session (${booked.startTime}–${booked.endTime}, plus 15m lighting reset).`,
        alternatives: dayAvail.availableSlots.slice(0, 4),
      };
    }
  }

  return {
    valid: true,
    normalizedStart,
    normalizedEnd,
  };
}
