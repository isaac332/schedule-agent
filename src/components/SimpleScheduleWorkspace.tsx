"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";
import type {
  Appointment,
  AppointmentStatus,
  DayAvailability,
  StudioPhotographer,
  StudioService,
  TimeSlot,
  WaitlistEntry,
} from "@/lib/studio/types";
import {
  addDays,
  formatLocalDate,
  formatMonthYear,
  formatPrettyDate,
  formatTime12h,
  getCalendarGridForMonth,
  getDayScheduleForDate,
  getNextOpenStudioDates,
  parseDateString,
  timeToMinutes,
} from "@/lib/calendar/dateUtils";

type ViewRole = "client" | "admin";
type AdminSubView = "timeline" | "month" | "waitlist" | "all-bookings";

export function SimpleScheduleWorkspace() {
  // Role switcher: client only views available schedule; admin views full calendar
  const [viewRole, setViewRole] = useState<ViewRole>("client");
  const [adminSubView, setAdminSubView] = useState<AdminSubView>("timeline");

  // Studio data state
  const [services, setServices] = useState<StudioService[]>([]);
  const [photographers, setPhotographers] = useState<StudioPhotographer[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [nextOpenDates, setNextOpenDates] = useState<string[]>([]);
  const [monthAvailability, setMonthAvailability] = useState<DayAvailability[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string>("");

  // Selected filters
  const [selectedServiceId, setSelectedServiceId] = useState<string>("pareja-juntos");
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Month navigation state (for admin month view and client month picker)
  const [currentYear, setCurrentYear] = useState<number>(() => new Date().getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(() => new Date().getMonth());

  // Client quick booking modal state
  const [bookingModalSlot, setBookingModalSlot] = useState<TimeSlot | null>(null);
  const [clientFormName, setClientFormName] = useState("");
  const [clientFormPhone, setClientFormPhone] = useState("");
  const [clientFormEmail, setClientFormEmail] = useState("");
  const [clientFormNotes, setClientFormNotes] = useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingSuccessRef, setBookingSuccessRef] = useState<string | null>(null);

  // Admin booking modal state
  const [isAdminBookingOpen, setIsAdminBookingOpen] = useState(false);
  const [adminCustomStartTime, setAdminCustomStartTime] = useState("10:00");

  // Admin search filter
  const [adminSearchQuery, setAdminSearchQuery] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  // Fetch all schedule data
  const loadScheduleData = useCallback(
    async (targetDate?: string, targetServiceId?: string) => {
      setIsLoading(true);
      try {
        const dateToFetch = targetDate || selectedDate || formatLocalDate(new Date());
        const svcToFetch = targetServiceId || selectedServiceId;
        const res = await fetch(
          `/api/appointments?date=${encodeURIComponent(dateToFetch)}&serviceId=${encodeURIComponent(
            svcToFetch,
          )}&days=45`,
        );
        if (!res.ok) throw new Error("Error loading schedule");
        const data = await res.json();

        setServices(data.services || []);
        setPhotographers(data.photographers || []);
        setAppointments(data.appointments || []);
        setWaitlist(data.waitlist || []);
        setNextOpenDates(data.nextOpenDates || []);
        setMonthAvailability(data.monthAvailability || []);

        if (!selectedDate && data.nextOpenDates && data.nextOpenDates.length > 0) {
          setSelectedDate(data.nextOpenDates[0]);
        }
      } catch (err) {
        console.error("Failed to load schedule", err);
        showToast("Error al cargar datos del calendario.");
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDate, selectedServiceId],
  );

  useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]);

  // Selected service object
  const currentService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) || services[0],
    [services, selectedServiceId],
  );

  // Active day availability from computed month range or calculate on the fly
  const activeDayAvailability = useMemo(() => {
    if (!selectedDate) return null;
    return monthAvailability.find((d) => d.date === selectedDate) || null;
  }, [monthAvailability, selectedDate]);

  // Appointments for the currently selected date
  const selectedDateAppointments = useMemo(() => {
    if (!selectedDate) return [];
    return appointments.filter(
      (apt) => apt.date === selectedDate && apt.status !== "cancelled",
    );
  }, [appointments, selectedDate]);

  // Month grid days for the current calendar month view
  const calendarGrid = useMemo(() => {
    return getCalendarGridForMonth(currentYear, currentMonthIndex);
  }, [currentYear, currentMonthIndex]);

  // Helper map of appointments count by date for calendar month badges
  const appointmentsCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const apt of appointments) {
      if (apt.status !== "cancelled") {
        map.set(apt.date, (map.get(apt.date) || 0) + 1);
      }
    }
    return map;
  }, [appointments]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthIndex((m) => m + 1);
    }
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonthIndex(today.getMonth());
    const todayStr = formatLocalDate(today);
    setSelectedDate(todayStr);
    loadScheduleData(todayStr);
  };

  // Day navigation handlers
  const handlePrevDay = () => {
    if (!selectedDate) return;
    const prev = addDays(selectedDate, -1);
    setSelectedDate(prev);
    loadScheduleData(prev);
  };

  const handleNextDay = () => {
    if (!selectedDate) return;
    const next = addDays(selectedDate, 1);
    setSelectedDate(next);
    loadScheduleData(next);
  };

  // Handle client quick booking submission
  const handleClientBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModalSlot || !selectedDate) return;

    if (!clientFormName.trim() || !clientFormPhone.trim() || !clientFormEmail.trim()) {
      showToast("Por favor completa tu nombre, teléfono y correo.");
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientFormName.trim(),
          clientPhone: clientFormPhone.trim(),
          clientEmail: clientFormEmail.trim(),
          serviceId: selectedServiceId,
          date: selectedDate,
          startTime: bookingModalSlot.startTime,
          notes: clientFormNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        showToast(data.error || "No fue posible agendar la cita.");
      } else {
        setBookingSuccessRef(data.appointment?.bookingRef || "JXS-OK");
        loadScheduleData(selectedDate);
        showToast("¡Tu cita ha sido apartada con éxito!");
      }
    } catch {
      showToast("Error de conexión al registrar la cita.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Handle admin appointment cancellation
  const handleAdminCancelAppointment = async (bookingRef: string) => {
    if (!confirm(`¿Deseas cancelar la reservación ${bookingRef}? Se liberará el horario inmediatamente.`)) {
      return;
    }
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "status",
          bookingRef,
          status: "cancelled",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Cita ${bookingRef} cancelada. Horario liberado.`);
        loadScheduleData(selectedDate);
      } else {
        showToast(data.error || "Error al cancelar la cita.");
      }
    } catch {
      showToast("Error al conectar con el servidor.");
    }
  };

  // Handle admin reassigning waitlist client to open slot
  const handleAdminReassignWaitlist = async (waitlistId: string) => {
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reassign_waitlist",
          waitlistId,
          newDate: selectedDate,
          newStartTime: "11:00",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("¡Cliente de lista de espera asignado exitosamente!");
        loadScheduleData(selectedDate);
      } else {
        showToast(data.error || "Error al asignar cliente de lista de espera.");
      }
    } catch {
      showToast("Error al procesar la asignación.");
    }
  };

  // Operating schedule of the selected day
  const selectedDaySchedule = useMemo(() => {
    if (!selectedDate) return { isOpen: false, dayName: "Domingo", openTime: "00:00", closeTime: "00:00" };
    return getDayScheduleForDate(selectedDate);
  }, [selectedDate]);

  return (
    <div className="min-h-dvh flex flex-col bg-[#fbf7f4] text-[#2d1822]">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 inset-x-4 z-50 mx-auto max-w-md rounded-2xl border border-pink-300 bg-white/95 px-4 py-3 text-center text-xs font-semibold text-[#9e193e] shadow-xl animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* --- Top Navigation Bar --- */}
      <header className="sticky top-0 z-30 border-b border-pink-200/80 bg-[#fffdfb]/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-3.5 py-2.5">
          {/* Brand & Studio Location */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="group flex items-center gap-2 rounded-xl border border-pink-200/70 bg-white px-2.5 py-1.5 text-xs font-bold text-[#c52752] shadow-2xs hover:bg-pink-50 transition"
              title="Volver a la pantalla de Chat y Servicios"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-[#e0446e] group-hover:-translate-x-0.5 transition" />
              <span>Volver al Chat</span>
            </Link>

            <div className="hidden sm:block h-5 w-px bg-pink-200/70" />

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-extrabold tracking-tight text-[#2d1822]">
                  juntosxsiempre
                </h1>
                <span className="rounded-full bg-pink-100 px-1.5 py-0.2 text-[9px] font-bold text-[#c52752]">
                  Nogales, Son.
                </span>
              </div>
              <p className="text-[10px] text-[#7b5965] hidden md:block">
                Mar–Vie 9:00 AM – 6:00 PM • Sáb 10:00 AM – 5:00 PM (GMT-7)
              </p>
            </div>
          </div>

          {/* Persona / Role Selector (Client vs Admin) */}
          <div className="flex items-center gap-1 rounded-2xl border border-pink-200 bg-pink-50/70 p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewRole("client")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                viewRole === "client"
                  ? "bg-white text-[#c52752] shadow-xs"
                  : "text-[#7b5965] hover:text-[#2d1822]"
              }`}
              title="Vista para clientes: consulta únicamente los horarios libres para apartar sesión."
            >
              <User className="h-3.5 w-3.5 text-[#e0446e]" />
              <span>Vista Cliente</span>
              <span className="hidden sm:inline text-[9px] font-normal opacity-75">
                (Solo Disponibilidad)
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewRole("admin")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                viewRole === "admin"
                  ? "bg-gradient-to-r from-[#e0446e] to-[#c52752] text-white shadow-xs"
                  : "text-[#7b5965] hover:text-[#2d1822]"
              }`}
              title="Vista para administradores: consulta el calendario completo a nivel día y hora hasta un mes."
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Vista Admin</span>
              <span className="hidden sm:inline text-[9px] font-normal opacity-90">
                (Calendario Completo)
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* --- Main Content Area --- */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3.5 py-4">
        {/* ==================================================================== */}
        {/* CLIENT VIEW: STRICTLY ONLY AVAILABLE SCHEDULE                       */}
        {/* ==================================================================== */}
        {viewRole === "client" && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            {/* Friendly Header Notice */}
            <div className="rounded-3xl border border-pink-200/90 bg-gradient-to-r from-[#fffdfb] via-pink-50/40 to-[#fffdfb] p-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-[#e0446e] text-white shadow-xs">
                      <CalendarIcon className="h-3.5 w-3.5" />
                    </span>
                    <h2 className="text-sm font-extrabold text-[#2d1822]">
                      Consulta de Horarios Disponibles
                    </h2>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                      En Vivo
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#7b5965] leading-relaxed">
                    Selecciona tu sesión fotográfica y elige entre las fechas y horarios disponibles en nuestro estudio en Nogales, Sonora.
                  </p>
                </div>

                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-2xl bg-gradient-to-r from-[#e0446e] to-[#c52752] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:opacity-95 active:scale-95 transition"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>¿Prefieres agendar por Chat?</span>
                </Link>
              </div>
            </div>

            {/* Step 1: Package Selector */}
            <div className="rounded-3xl border border-pink-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold text-[#2d1822] flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#e0446e] text-[10px] font-bold text-white">
                    1
                  </span>
                  <span>Selecciona tu Paquete Fotográfico:</span>
                </label>
                {currentService && (
                  <span className="text-[11px] font-bold text-[#c52752]">
                    ${currentService.price.toLocaleString("es-MX")} MXN • {currentService.durationMinutes} min
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {services.map((svc) => {
                  const isSelected = selectedServiceId === svc.id;
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => {
                        setSelectedServiceId(svc.id);
                        loadScheduleData(selectedDate, svc.id);
                      }}
                      className={`flex flex-col text-left rounded-2xl p-2.5 transition active:scale-95 ${
                        isSelected
                          ? "border-2 border-[#e0446e] bg-pink-50/70 shadow-xs"
                          : "border border-pink-200/80 bg-[#fbf7f4]/60 hover:bg-pink-50/40 text-[#5e3347]"
                      }`}
                    >
                      <span className="font-bold text-xs text-[#2d1822] line-clamp-1">
                        {svc.name}
                      </span>
                      <span className="text-[10px] text-[#7b5965] mt-0.5">
                        {svc.durationMinutes}m • ${svc.price.toLocaleString("es-MX")} MXN
                      </span>
                    </button>
                  );
                })}
              </div>

              {currentService && (
                <div className="mt-3 rounded-2xl bg-[#faf3ec] p-3 text-xs text-[#5e3347] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="line-clamp-2">{currentService.description}</p>
                  <div className="shrink-0 flex items-center gap-2 font-bold text-[11px] text-[#c52752]">
                    <span>Anticipo: ${currentService.depositAmount.toLocaleString("es-MX")} MXN</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Date Selector (Carousel of Open Studio Days) */}
            <div className="rounded-3xl border border-pink-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-[#2d1822] flex items-center gap-1.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#e0446e] text-[10px] font-bold text-white">
                    2
                  </span>
                  <span>Selecciona una Fecha Disponible:</span>
                </label>
                <div className="flex items-center gap-2 text-xs text-[#7b5965]">
                  <span>{formatMonthYear(currentYear, currentMonthIndex)}</span>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={handlePrevDay}
                      className="rounded-lg p-1 hover:bg-pink-100 text-[#5e3347]"
                      title="Día anterior"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextDay}
                      className="rounded-lg p-1 hover:bg-pink-100 text-[#5e3347]"
                      title="Día siguiente"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {nextOpenDates.map((dateStr) => {
                  const isSelected = selectedDate === dateStr;
                  const dateObj = parseDateString(dateStr);
                  const dayName = dateObj.toLocaleDateString("es-MX", { weekday: "short" });
                  const monthName = dateObj.toLocaleDateString("es-MX", { month: "short" });

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => {
                        setSelectedDate(dateStr);
                        loadScheduleData(dateStr, selectedServiceId);
                      }}
                      className={`flex shrink-0 min-w-[70px] flex-col items-center justify-center rounded-2xl px-3 py-2.5 text-xs transition active:scale-95 ${
                        isSelected
                          ? "bg-gradient-to-r from-[#e0446e] to-[#c52752] text-white shadow-md shadow-pink-500/20 font-bold"
                          : "border border-pink-200 bg-[#faf3ec]/60 text-[#5e3347] hover:bg-pink-50"
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-wide">
                        {dayName.toUpperCase()}
                      </span>
                      <span className="text-base font-extrabold">{dateStr.slice(8)}</span>
                      <span className="text-[9px] opacity-80 uppercase">{monthName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Strictly Available Schedule Grid */}
            <div className="rounded-3xl border border-pink-200/80 bg-white p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pink-100 pb-3 mb-3">
                <div>
                  <h3 className="text-xs font-bold text-[#2d1822] flex items-center gap-1.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#e0446e] text-[10px] font-bold text-white">
                      3
                    </span>
                    <span>
                      Horarios Disponibles para el {formatPrettyDate(selectedDate || "2026-11-10")}
                    </span>
                  </h3>
                  <p className="text-[10px] text-[#7b5965] mt-0.5">
                    Estudio abierto: {selectedDaySchedule.isOpen ? `${formatTime12h(selectedDaySchedule.openTime)} a ${formatTime12h(selectedDaySchedule.closeTime)}` : "Cerrado"} • Duración: {currentService?.durationMinutes} min
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => loadScheduleData(selectedDate, selectedServiceId)}
                  className="self-start sm:self-center inline-flex items-center gap-1 rounded-xl border border-pink-200 bg-white px-2.5 py-1 text-xs text-[#7b5965] hover:text-[#c52752] transition"
                  title="Actualizar disponibilidad"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Actualizar</span>
                </button>
              </div>

              {/* Notice: Client only views available slots; no booked client details exist here */}
              {activeDayAvailability && activeDayAvailability.isOpen && activeDayAvailability.availableSlots.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {activeDayAvailability.availableSlots.map((slot) => (
                    <div
                      key={slot.startTime}
                      className="group flex flex-col justify-between rounded-2xl border border-pink-200 bg-gradient-to-br from-white to-[#fdf8f5] p-3 text-xs shadow-2xs hover:border-pink-400 hover:shadow-xs transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-[#2d1822]">
                          <Clock className="h-3.5 w-3.5 text-[#e0446e]" />
                          <span>{formatTime12h(slot.startTime)}</span>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800">
                          Disponible
                        </span>
                      </div>

                      <div className="my-2 text-[10px] text-[#7b5965]">
                        <span>Término: {formatTime12h(slot.endTime)}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setBookingModalSlot(slot);
                          setBookingSuccessRef(null);
                        }}
                        className="w-full rounded-xl bg-gradient-to-r from-[#e0446e] to-[#c52752] py-1.5 text-center text-[11px] font-bold text-white shadow-2xs hover:opacity-95 active:scale-95 transition"
                      >
                        Apartar Horario →
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 text-center text-xs text-amber-900">
                  <p className="font-bold text-sm">
                    {!selectedDaySchedule.isOpen
                      ? `El estudio se encuentra cerrado los días ${selectedDaySchedule.dayName}.`
                      : "No hay horarios libres para esta fecha seleccionada."}
                  </p>
                  <p className="mt-1 text-[11px] text-amber-800">
                    Nuestro horario habitual es de martes a viernes de 9:00 AM a 6:00 PM y sábados de 10:00 AM a 5:00 PM.
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <Link
                      href="/"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#e0446e] px-4 py-1.5 text-xs font-bold text-white shadow"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Anotarme en Lista de Espera con Camila</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* ADMIN VIEW: FULL CALENDAR AT PER DAY & HOUR LEVEL UP TO A MONTH     */}
        {/* ==================================================================== */}
        {viewRole === "admin" && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            {/* Admin Header & Sub-Navigation */}
            <div className="rounded-3xl border border-pink-200/90 bg-gradient-to-r from-[#2d1822] via-[#422131] to-[#2d1822] p-4 text-white shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white border border-white/20">
                    <ShieldCheck className="h-5 w-5 text-pink-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-extrabold tracking-tight">
                        Panel de Administración • Calendario General
                      </h2>
                      <span className="rounded-full bg-pink-500/20 px-2 py-0.5 text-[9px] font-bold text-pink-200 border border-pink-400/30">
                        Nogales Studio
                      </span>
                    </div>
                    <p className="text-[11px] text-pink-100/70">
                      Vista completa a nivel día y hora de hasta 1 mes con control de citas, buffers y lista de espera.
                    </p>
                  </div>
                </div>

                {/* Sub-view selector */}
                <div className="flex items-center gap-1 self-start sm:self-center rounded-2xl bg-white/10 p-1 border border-white/15">
                  <button
                    type="button"
                    onClick={() => setAdminSubView("timeline")}
                    className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                      adminSubView === "timeline"
                        ? "bg-white text-[#2d1822] shadow-xs"
                        : "text-pink-100 hover:text-white"
                    }`}
                  >
                    Por Día &amp; Hora
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminSubView("month")}
                    className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                      adminSubView === "month"
                        ? "bg-white text-[#2d1822] shadow-xs"
                        : "text-pink-100 hover:text-white"
                    }`}
                  >
                    Vista Mensual (Mes)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminSubView("waitlist")}
                    className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                      adminSubView === "waitlist"
                        ? "bg-white text-[#2d1822] shadow-xs"
                        : "text-pink-100 hover:text-white"
                    }`}
                  >
                    <span>Lista de Espera</span>
                    {waitlist.length > 0 && (
                      <span className="rounded-full bg-[#e0446e] px-1.5 py-0.2 text-[8px] text-white">
                        {waitlist.length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminSubView("all-bookings")}
                    className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                      adminSubView === "all-bookings"
                        ? "bg-white text-[#2d1822] shadow-xs"
                        : "text-pink-100 hover:text-white"
                    }`}
                  >
                    Todas ({appointments.filter((a) => a.status !== "cancelled").length})
                  </button>
                </div>
              </div>

              {/* Monthly Quick KPI Bar */}
              <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/10 text-xs">
                <div className="rounded-xl bg-white/5 p-2 border border-white/5">
                  <span className="text-[10px] text-pink-200/70 block">Citas Agendadas:</span>
                  <span className="text-sm font-extrabold text-white">
                    {appointments.filter((a) => a.status !== "cancelled").length} activas
                  </span>
                </div>
                <div className="rounded-xl bg-white/5 p-2 border border-white/5">
                  <span className="text-[10px] text-pink-200/70 block">Ingresos en Agenda:</span>
                  <span className="text-sm font-extrabold text-emerald-300">
                    $
                    {appointments
                      .filter((a) => a.status !== "cancelled")
                      .reduce((sum, a) => sum + (a.price || 0), 0)
                      .toLocaleString("es-MX")}{" "}
                    MXN
                  </span>
                </div>
                <div className="rounded-xl bg-white/5 p-2 border border-white/5">
                  <span className="text-[10px] text-pink-200/70 block">En Lista de Espera:</span>
                  <span className="text-sm font-extrabold text-amber-300">
                    {waitlist.length} clientes
                  </span>
                </div>
                <div className="rounded-xl bg-white/5 p-2 border border-white/5">
                  <span className="text-[10px] text-pink-200/70 block">Protección de Set:</span>
                  <span className="text-sm font-extrabold text-pink-200">
                    15m Buffer Profoto
                  </span>
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* SUBVIEW 1: PER DAY AND HOUR LEVEL TIMELINE                       */}
            {/* ---------------------------------------------------------------- */}
            {adminSubView === "timeline" && (
              <div className="flex flex-col gap-3">
                {/* Day selector & quick navigation */}
                <div className="rounded-3xl border border-pink-200/80 bg-white p-3.5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handlePrevDay}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-pink-200 bg-pink-50/50 hover:bg-pink-100 transition text-[#5e3347]"
                        title="Día anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextDay}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-pink-200 bg-pink-50/50 hover:bg-pink-100 transition text-[#5e3347]"
                        title="Día siguiente"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleGoToToday}
                        className="rounded-xl border border-pink-200 bg-white px-2.5 py-1 text-xs font-bold text-[#c52752] hover:bg-pink-50 transition"
                      >
                        Hoy
                      </button>

                      <div className="ml-2">
                        <h3 className="text-xs font-extrabold text-[#2d1822]">
                          {formatPrettyDate(selectedDate || "2026-11-10")}
                        </h3>
                        <p className="text-[10px] text-[#7b5965]">
                          Horario: {selectedDaySchedule.isOpen ? `${formatTime12h(selectedDaySchedule.openTime)} – ${formatTime12h(selectedDaySchedule.closeTime)}` : "Cerrado"} • {selectedDateAppointments.length} cita(s) programada(s)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsAdminBookingOpen(true)}
                        className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#e0446e] to-[#c52752] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-95 active:scale-95 transition"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Agendar Cita Manual</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => loadScheduleData(selectedDate, selectedServiceId)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-pink-200 bg-white text-[#7b5965] hover:text-[#c52752]"
                        title="Actualizar agenda"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hour-by-Hour Detailed Schedule for the Selected Day */}
                <div className="rounded-3xl border border-pink-200/80 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3 border-b border-pink-100 pb-2">
                    <span className="text-xs font-bold text-[#2d1822] uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#e0446e]" />
                      <span>Cronograma Detallado por Hora:</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#7b5965]">
                      Zona Horaria: Nogales, Sonora (GMT-7)
                    </span>
                  </div>

                  {!selectedDaySchedule.isOpen ? (
                    <div className="rounded-2xl bg-stone-100 p-6 text-center text-xs text-stone-600">
                      <p className="font-bold text-sm">Estudio Cerrado</p>
                      <p className="text-[11px] mt-1">
                        Los días {selectedDaySchedule.dayName} no hay servicio presencial en estudio.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {/* Generate hour blocks from open to close */}
                      {(() => {
                        const openMins = timeToMinutes(selectedDaySchedule.openTime);
                        const closeMins = timeToMinutes(selectedDaySchedule.closeTime);
                        const blocks: React.ReactNode[] = [];

                        let cursor = openMins;
                        while (cursor < closeMins) {
                          const blockStartH = Math.floor(cursor / 60);
                          const blockStartM = cursor % 60;
                          const blockStartStr = `${String(blockStartH).padStart(2, "0")}:${String(blockStartM).padStart(2, "0")}`;

                          // Find if any appointment overlaps this time
                          const matchingApt = selectedDateAppointments.find((a) => {
                            const aStart = timeToMinutes(a.startTime);
                            const aEnd = timeToMinutes(a.endTime);
                            return cursor >= aStart && cursor < aEnd;
                          });

                          // Find if this time is during the 15-min Profoto buffer immediately following an appointment
                          const matchingBufferApt = selectedDateAppointments.find((a) => {
                            const aEnd = timeToMinutes(a.endTime);
                            return cursor >= aEnd && cursor < aEnd + 15;
                          });

                          if (matchingApt && cursor === timeToMinutes(matchingApt.startTime)) {
                            // Render Booked Appointment Card
                            blocks.push(
                              <div
                                key={`apt-${matchingApt.id}`}
                                className="rounded-2xl border-2 border-pink-300 bg-gradient-to-br from-pink-50/90 via-white to-pink-50/50 p-3.5 text-xs shadow-xs"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pink-200 pb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-lg bg-[#e0446e] px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                                      {formatTime12h(matchingApt.startTime)} – {formatTime12h(matchingApt.endTime)}
                                    </span>
                                    <span className="font-extrabold text-[#2d1822] text-sm">
                                      {matchingApt.clientName}
                                    </span>
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800">
                                      {matchingApt.bookingRef}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-[#c52752]">
                                      ${matchingApt.price.toLocaleString("es-MX")} MXN
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleAdminCancelAppointment(matchingApt.bookingRef)}
                                      className="rounded-lg border border-rose-300 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 hover:bg-rose-100 transition"
                                      title="Cancelar esta cita y liberar horario"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>

                                <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-[#5e3347]">
                                  <div>
                                    <span className="font-bold text-[#2d1822] block">Paquete:</span>
                                    <span>{matchingApt.serviceName}</span>
                                  </div>
                                  <div>
                                    <span className="font-bold text-[#2d1822] block">Fotógrafo / Set:</span>
                                    <span>{matchingApt.photographerName || "Sofía Morales"}</span>
                                  </div>
                                  <div>
                                    <span className="font-bold text-[#2d1822] block">Contacto:</span>
                                    <span className="flex items-center gap-2">
                                      <span className="font-mono">{matchingApt.clientPhone}</span>
                                    </span>
                                  </div>
                                </div>

                                {matchingApt.addOns && matchingApt.addOns.length > 0 && (
                                  <div className="mt-2 flex flex-wrap items-center gap-1">
                                    <span className="text-[10px] font-bold text-[#7b5965]">Add-ons:</span>
                                    {matchingApt.addOns.map((add, idx) => (
                                      <span
                                        key={idx}
                                        className="rounded-md bg-pink-100 px-1.5 py-0.2 text-[9px] font-medium text-[#9e193e]"
                                      >
                                        + {add}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {matchingApt.notes && (
                                  <div className="mt-2 rounded-xl bg-white/80 p-2 text-[10px] text-[#7b5965] border border-pink-100 italic">
                                    &ldquo;{matchingApt.notes}&rdquo;
                                  </div>
                                )}
                              </div>,
                            );

                            // Advance cursor to end of appointment
                            cursor = timeToMinutes(matchingApt.endTime);
                            continue;
                          } else if (matchingBufferApt) {
                            // Render 15-Minute Profoto Buffer
                            blocks.push(
                              <div
                                key={`buffer-${matchingBufferApt.id}`}
                                className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50/90 px-3 py-1.5 text-[10px] font-bold text-amber-900"
                              >
                                <span className="flex items-center gap-1.5">
                                  <span>⚡</span>
                                  <span>
                                    {formatTime12h(matchingBufferApt.endTime)} –{" "}
                                    {formatTime12h(
                                      `${String(Math.floor((timeToMinutes(matchingBufferApt.endTime) + 15) / 60)).padStart(2, "0")}:${String((timeToMinutes(matchingBufferApt.endTime) + 15) % 60).padStart(2, "0")}`,
                                    )}
                                  </span>
                                  <span className="font-sans font-medium text-amber-800">
                                    Buffer Profoto Pro-11 (Calibración &amp; Sanitización de Set)
                                  </span>
                                </span>
                                <span className="rounded bg-amber-200/90 px-1.5 py-0.2 text-[8px] font-extrabold uppercase">
                                  15m Protegidos
                                </span>
                              </div>,
                            );
                            cursor += 15;
                            continue;
                          } else if (!matchingApt) {
                            // Free Slot block (next 30 or 60 mins)
                            const nextIntervalMins = Math.min(cursor + 60, closeMins);
                            const nextIntervalStr = `${String(Math.floor(nextIntervalMins / 60)).padStart(2, "0")}:${String(nextIntervalMins % 60).padStart(2, "0")}`;

                            blocks.push(
                              <div
                                key={`free-${cursor}`}
                                className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/50 px-3 py-2 text-xs text-[#2d1822] hover:bg-emerald-50 transition"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-emerald-800 font-bold">
                                    {formatTime12h(blockStartStr)} – {formatTime12h(nextIntervalStr)}
                                  </span>
                                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                                    Horario Disponible
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setAdminCustomStartTime(blockStartStr);
                                    setIsAdminBookingOpen(true);
                                  }}
                                  className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700 active:scale-95 transition"
                                >
                                  + Agendar Cita
                                </button>
                              </div>,
                            );

                            cursor = nextIntervalMins;
                            continue;
                          }

                          cursor += 30;
                        }

                        return blocks;
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* SUBVIEW 2: FULL MONTH CALENDAR GRID (UP TO A MONTH)              */}
            {/* ---------------------------------------------------------------- */}
            {adminSubView === "month" && (
              <div className="flex flex-col gap-3">
                <div className="rounded-3xl border border-pink-200/80 bg-white p-4 shadow-sm">
                  {/* Month header & navigation */}
                  <div className="flex items-center justify-between mb-4 border-b border-pink-100 pb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-[#2d1822]">
                        {formatMonthYear(currentYear, currentMonthIndex)}
                      </h3>
                      <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-[#c52752]">
                        Calendario Mensual
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="rounded-xl border border-pink-200 p-1.5 hover:bg-pink-50 text-[#5e3347] transition"
                        title="Mes anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleGoToToday}
                        className="rounded-xl border border-pink-200 bg-white px-2.5 py-1 text-xs font-bold text-[#c52752] hover:bg-pink-50 transition"
                      >
                        Hoy
                      </button>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="rounded-xl border border-pink-200 p-1.5 hover:bg-pink-50 text-[#5e3347] transition"
                        title="Mes siguiente"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* 7-column calendar grid (Dom to Sáb) */}
                  <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-[#7b5965] mb-1">
                    <span>Dom</span>
                    <span>Lun</span>
                    <span>Mar</span>
                    <span>Mié</span>
                    <span>Jue</span>
                    <span>Vie</span>
                    <span>Sáb</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {calendarGrid.map((cell) => {
                      const daySched = getDayScheduleForDate(cell.dateStr);
                      const aptCount = appointmentsCountByDate.get(cell.dateStr) || 0;
                      const isSelected = selectedDate === cell.dateStr;
                      const todayStr = formatLocalDate(new Date());
                      const isToday = cell.dateStr === todayStr;

                      return (
                        <button
                          key={cell.dateStr}
                          type="button"
                          onClick={() => {
                            setSelectedDate(cell.dateStr);
                            setAdminSubView("timeline");
                            loadScheduleData(cell.dateStr, selectedServiceId);
                          }}
                          className={`min-h-[75px] sm:min-h-[90px] rounded-2xl p-2 flex flex-col justify-between text-left transition active:scale-95 ${
                            isSelected
                              ? "ring-2 ring-[#e0446e] bg-pink-50 shadow-sm"
                              : cell.isCurrentMonth
                              ? daySched.isOpen
                                ? "border border-pink-100 bg-[#fffdfb] hover:bg-pink-50/50"
                                : "border border-stone-200/60 bg-stone-50/60 text-stone-400"
                              : "border border-stone-100 bg-stone-50/30 text-stone-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-extrabold ${
                                isToday
                                  ? "flex h-5 w-5 items-center justify-center rounded-full bg-[#e0446e] text-white"
                                  : isSelected
                                  ? "text-[#c52752]"
                                  : "text-[#2d1822]"
                              }`}
                            >
                              {cell.dayNumber}
                            </span>
                            {!daySched.isOpen && (
                              <span className="text-[8px] font-bold text-stone-400">
                                Cerrado
                              </span>
                            )}
                          </div>

                          {daySched.isOpen && (
                            <div className="mt-1 flex flex-col gap-0.5 text-[9px]">
                              {aptCount > 0 ? (
                                <span className="rounded-md bg-pink-100 px-1 py-0.2 font-extrabold text-[#9e193e] truncate">
                                  {aptCount} cita{aptCount > 1 ? "s" : ""}
                                </span>
                              ) : (
                                <span className="rounded-md bg-emerald-50 px-1 py-0.2 font-bold text-emerald-700 truncate">
                                  Libre
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-3 text-center text-[11px] text-[#7b5965]">
                    Haz clic en cualquier día para abrir su desglose hora por hora.
                  </p>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* SUBVIEW 3: WAITLIST MANAGEMENT                                   */}
            {/* ---------------------------------------------------------------- */}
            {adminSubView === "waitlist" && (
              <div className="rounded-3xl border border-pink-200/80 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3 border-b border-pink-100 pb-2">
                  <h3 className="text-xs font-bold text-[#2d1822] flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-[#e0446e]" />
                    <span>Lista de Espera Activa ({waitlist.length} registros)</span>
                  </h3>
                  <span className="text-[10px] text-[#7b5965]">
                    Rescate automático de horarios cancelados
                  </span>
                </div>

                {waitlist.length === 0 ? (
                  <div className="rounded-2xl bg-pink-50/50 p-6 text-center text-xs text-[#7b5965]">
                    No hay clientes en lista de espera actualmente.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {waitlist.map((wl) => (
                      <div
                        key={wl.id}
                        className="rounded-2xl border border-pink-200 bg-[#fbf7f4] p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[#2d1822]">
                              {wl.clientName}
                            </span>
                            <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">
                              {wl.waitlistRef}
                            </span>
                            <span className="text-[10px] text-[#7b5965] font-mono">
                              {wl.clientPhone}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-[#5e3347]">
                            Fecha preferida: {formatPrettyDate(wl.preferredDate)} • {wl.preferredTimeWindow || "Cualquier horario"}
                          </p>
                          {wl.notes && (
                            <p className="mt-0.5 text-[10px] italic text-[#7b5965]">
                              &ldquo;{wl.notes}&rdquo;
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAdminReassignWaitlist(wl.id)}
                          className="shrink-0 rounded-xl bg-gradient-to-r from-[#e0446e] to-[#c52752] px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:opacity-95 active:scale-95 transition"
                        >
                          Asignar a Horario Libre
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* SUBVIEW 4: ALL BOOKINGS LIST                                     */}
            {/* ---------------------------------------------------------------- */}
            {adminSubView === "all-bookings" && (
              <div className="rounded-3xl border border-pink-200/80 bg-white p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-pink-100 pb-2">
                  <h3 className="text-xs font-bold text-[#2d1822]">
                    Catálogo Completo de Reservaciones
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#7b5965]" />
                    <input
                      type="text"
                      value={adminSearchQuery}
                      onChange={(e) => setAdminSearchQuery(e.target.value)}
                      placeholder="Buscar por cliente o clave JXS..."
                      className="rounded-xl border border-pink-200 bg-pink-50/40 pl-8 pr-3 py-1 text-xs text-[#2d1822] focus:outline-pink-400"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {appointments
                    .filter((apt) => {
                      if (!adminSearchQuery.trim()) return true;
                      const q = adminSearchQuery.toLowerCase();
                      return (
                        apt.clientName.toLowerCase().includes(q) ||
                        apt.bookingRef.toLowerCase().includes(q) ||
                        apt.clientPhone.toLowerCase().includes(q) ||
                        apt.date.includes(q)
                      );
                    })
                    .map((apt) => (
                      <div
                        key={apt.id}
                        className="rounded-2xl border border-pink-100 bg-[#fbf7f4] p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[#2d1822]">
                              {apt.clientName}
                            </span>
                            <span className="rounded-full bg-pink-100 px-1.5 py-0.2 text-[9px] font-bold text-[#9e193e]">
                              {apt.bookingRef}
                            </span>
                            <span
                              className={`rounded-full px-1.5 py-0.2 text-[8px] font-extrabold ${
                                apt.status === "confirmed"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : apt.status === "cancelled"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {apt.status}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-[#5e3347]">
                            {formatPrettyDate(apt.date)} • {formatTime12h(apt.startTime)}–{formatTime12h(apt.endTime)} • {apt.serviceName}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <span className="font-bold text-[#c52752]">
                            ${apt.price.toLocaleString("es-MX")} MXN
                          </span>
                          {apt.status !== "cancelled" && (
                            <button
                              type="button"
                              onClick={() => handleAdminCancelAppointment(apt.bookingRef)}
                              className="rounded-lg border border-rose-300 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 hover:bg-rose-100 transition"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ==================================================================== */}
      {/* CLIENT BOOKING MODAL (APARTAR HORARIO DIRECTAMENTE)                 */}
      {/* ==================================================================== */}
      {bookingModalSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 animate-in fade-in duration-200">
          <div className="relative flex max-h-[90dvh] w-full max-w-md flex-col rounded-3xl border border-pink-200 bg-white p-5 shadow-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setBookingModalSlot(null)}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-[#7b5965] hover:bg-pink-100 hover:text-[#2d1822]"
            >
              <X className="h-4 w-4" />
            </button>

            {bookingSuccessRef ? (
              <div className="py-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-3">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-extrabold text-[#2d1822]">
                  ¡Cita Apartada con Éxito!
                </h3>
                <p className="mt-1 text-xs text-[#7b5965]">
                  Tu clave de reservación es:
                </p>
                <div className="mt-2 inline-block rounded-2xl bg-pink-100 px-4 py-2 font-mono text-sm font-extrabold text-[#9e193e]">
                  {bookingSuccessRef}
                </div>
                <p className="mt-3 text-[11px] text-[#5e3347] leading-relaxed">
                  Te esperamos el <strong>{formatPrettyDate(selectedDate)}</strong> a las{" "}
                  <strong>{formatTime12h(bookingModalSlot.startTime)}</strong> en Av. Álvaro Obregón 354, Nogales, Sonora.
                </p>
                <button
                  type="button"
                  onClick={() => setBookingModalSlot(null)}
                  className="mt-5 w-full rounded-2xl bg-[#e0446e] py-2.5 text-xs font-bold text-white shadow"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-extrabold text-[#2d1822] flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#e0446e]" />
                  <span>Apartar Sesión Fotográfica</span>
                </h3>
                <p className="text-[11px] text-[#7b5965] mt-0.5">
                  {formatPrettyDate(selectedDate)} • {formatTime12h(bookingModalSlot.startTime)} ({currentService?.durationMinutes} min)
                </p>

                <form onSubmit={handleClientBookingSubmit} className="mt-4 flex flex-col gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#2d1822]">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={clientFormName}
                      onChange={(e) => setClientFormName(e.target.value)}
                      placeholder="ej. Fernanda Castillo"
                      className="mt-1 w-full rounded-xl border border-pink-200 bg-pink-50/30 px-3 py-2 text-xs text-[#2d1822] focus:outline-pink-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#2d1822]">
                      Teléfono Celular / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={clientFormPhone}
                      onChange={(e) => setClientFormPhone(e.target.value)}
                      placeholder="ej. +52 631 313 8920"
                      className="mt-1 w-full rounded-xl border border-pink-200 bg-pink-50/30 px-3 py-2 text-xs text-[#2d1822] focus:outline-pink-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#2d1822]">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      value={clientFormEmail}
                      onChange={(e) => setClientFormEmail(e.target.value)}
                      placeholder="ej. fernanda@gmail.com"
                      className="mt-1 w-full rounded-xl border border-pink-200 bg-pink-50/30 px-3 py-2 text-xs text-[#2d1822] focus:outline-pink-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#2d1822]">
                      Notas o preferencias (opcional)
                    </label>
                    <input
                      type="text"
                      value={clientFormNotes}
                      onChange={(e) => setClientFormNotes(e.target.value)}
                      placeholder="ej. Sesión con mi pareja, luz natural"
                      className="mt-1 w-full rounded-xl border border-pink-200 bg-pink-50/30 px-3 py-2 text-xs text-[#2d1822] focus:outline-pink-400"
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-pink-100 pt-3">
                    <Link
                      href="/"
                      onClick={() => setBookingModalSlot(null)}
                      className="text-xs font-bold text-[#c52752] hover:underline"
                    >
                      Prefiero hablar con Camila 💬
                    </Link>

                    <button
                      type="submit"
                      disabled={isSubmittingBooking}
                      className="rounded-xl bg-gradient-to-r from-[#e0446e] to-[#c52752] px-4 py-2 text-xs font-bold text-white shadow-xs hover:opacity-95 active:scale-95 disabled:opacity-40 transition"
                    >
                      {isSubmittingBooking ? "Apartando..." : "Confirmar Apartado"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ADMIN QUICK BOOKING MODAL                                            */}
      {/* ==================================================================== */}
      {isAdminBookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 animate-in fade-in duration-200">
          <div className="relative flex max-h-[90dvh] w-full max-w-md flex-col rounded-3xl border border-pink-200 bg-white p-5 shadow-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setIsAdminBookingOpen(false)}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-[#7b5965] hover:bg-pink-100"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-sm font-extrabold text-[#2d1822] flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#e0446e]" />
              <span>Agendar Cita en Firme (Admin)</span>
            </h3>
            <p className="text-[11px] text-[#7b5965] mt-0.5">
              Registra una cita directa para el {formatPrettyDate(selectedDate)}
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmittingBooking(true);
                try {
                  const res = await fetch("/api/appointments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      clientName: clientFormName.trim(),
                      clientPhone: clientFormPhone.trim(),
                      clientEmail: clientFormEmail.trim(),
                      serviceId: selectedServiceId,
                      date: selectedDate,
                      startTime: adminCustomStartTime,
                      notes: clientFormNotes.trim() || "Cita agendada manualmente por administrador",
                    }),
                  });
                  const data = await res.json();
                  if (res.ok && data.appointment) {
                    showToast(`Cita creada con clave ${data.appointment.bookingRef}`);
                    setIsAdminBookingOpen(false);
                    loadScheduleData(selectedDate);
                  } else {
                    showToast(data.error || "Error al agendar cita");
                  }
                } catch {
                  showToast("Error de conexión");
                } finally {
                  setIsSubmittingBooking(false);
                }
              }}
              className="mt-3 flex flex-col gap-2.5 text-xs"
            >
              <div>
                <label className="font-bold text-[#2d1822]">Horario de Inicio</label>
                <input
                  type="time"
                  required
                  value={adminCustomStartTime}
                  onChange={(e) => setAdminCustomStartTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-pink-200 p-2 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-[#2d1822]">Nombre del Cliente</label>
                <input
                  type="text"
                  required
                  value={clientFormName}
                  onChange={(e) => setClientFormName(e.target.value)}
                  placeholder="ej. Laura Sánchez"
                  className="mt-1 w-full rounded-xl border border-pink-200 p-2"
                />
              </div>
              <div>
                <label className="font-bold text-[#2d1822]">Teléfono</label>
                <input
                  type="tel"
                  required
                  value={clientFormPhone}
                  onChange={(e) => setClientFormPhone(e.target.value)}
                  placeholder="+52 631 ..."
                  className="mt-1 w-full rounded-xl border border-pink-200 p-2"
                />
              </div>
              <div>
                <label className="font-bold text-[#2d1822]">Correo</label>
                <input
                  type="email"
                  required
                  value={clientFormEmail}
                  onChange={(e) => setClientFormEmail(e.target.value)}
                  placeholder="cliente@correo.com"
                  className="mt-1 w-full rounded-xl border border-pink-200 p-2"
                />
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdminBookingOpen(false)}
                  className="rounded-xl border border-pink-200 px-3 py-1.5 font-bold text-[#7b5965]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBooking}
                  className="rounded-xl bg-[#e0446e] px-4 py-1.5 font-bold text-white shadow"
                >
                  {isSubmittingBooking ? "Guardando..." : "Guardar Cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
