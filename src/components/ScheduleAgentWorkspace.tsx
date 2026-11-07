"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  BellRing,
  Bot,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  FileCheck2,
  Heart,
  MapPin,
  MessageSquare,
  Palette,
  Phone,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wrench,
} from "lucide-react";
import type {
  Appointment,
  ChatTurnMessage,
  ConversationSession,
  DayAvailability,
  MobileTab,
  ProviderMode,
  ProviderTelemetry,
  StudioAddOn,
  StudioPhotographer,
  StudioService,
  WaitlistEntry,
} from "@/lib/studio/types";
import { formatPrettyDate, formatTime12h } from "@/lib/calendar/dateUtils";
import { LightDismissDialog } from "./LightDismissDialog";
import { OwnerPitchSection } from "./OwnerPitchSection";
import { GuidedTour, type GuidedTourStep } from "./GuidedTour";

const PROVIDER_MODE_LABELS: Record<
  ProviderMode,
  { label: string; badge: string; shortBadge: string; desc: string }
> = {
  "gemini-with-fallback": {
    label: "Gemini → OpenRouter Fallback",
    badge: "Gemini Primario ⇄ OpenRouter",
    shortBadge: "Gemini ⇄ OR",
    desc: "Usa Google Gemini primero; conmuta automáticamente a OpenRouter en caso de error o límite de cuota.",
  },
  "openrouter-with-fallback": {
    label: "OpenRouter → Gemini Fallback",
    badge: "OpenRouter Primario ⇄ Gemini",
    shortBadge: "OR ⇄ Gemini",
    desc: "Usa OpenRouter primero; conmuta automáticamente a Google Gemini en caso de error.",
  },
  "gemini-only": {
    label: "Google Gemini Estricto",
    badge: "Gemini Estricto",
    shortBadge: "Gemini",
    desc: "Enruta estrictamente a través del SDK oficial de Google Gemini (@google/genai).",
  },
  "openrouter-only": {
    label: "OpenRouter Estricto",
    badge: "OpenRouter Estricto",
    shortBadge: "OpenRouter",
    desc: "Enruta estrictamente a través de OpenRouter API.",
  },
};

export function ScheduleAgentWorkspace() {
  const [services, setServices] = useState<StudioService[]>([]);
  const [addOns, setAddOns] = useState<StudioAddOn[]>([]);
  const [photographers, setPhotographers] = useState<StudioPhotographer[]>([]);
  const [backdrops, setBackdrops] = useState<string[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("pareja-juntos");
  const [dayAvailability, setDayAvailability] = useState<DayAvailability | null>(null);
  const [nextOpenDates, setNextOpenDates] = useState<string[]>([]);

  // Mobile navigation state (100% mobile priority)
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");

  // Provider configuration state
  const [providerMode, setProviderMode] = useState<ProviderMode>("gemini-with-fallback");
  const [geminiKey, setGeminiKey] = useState<string>("");
  const [openrouterKey, setOpenrouterKey] = useState<string>("");
  const [geminiModel, setGeminiModel] = useState<string>("");
  const [openrouterModel, setOpenrouterModel] = useState<string>("");
  const [serverKeyStatus, setServerKeyStatus] = useState<{
    geminiConfigured: boolean;
    openrouterConfigured: boolean;
  }>({ geminiConfigured: false, openrouterConfigured: false });
  const [lastTelemetry, setLastTelemetry] = useState<ProviderTelemetry | null>(null);

  // Chat / SMS Simulator state
  const [clientPhone, setClientPhone] = useState<string>("+52 55 4910 2831");
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [llmHistory, setLlmHistory] = useState<ConversationSession["history"]>([]);
  const [messages, setMessages] = useState<ChatTurnMessage[]>([
    {
      id: "welcome-msg",
      role: "assistant",
      text: "¡Hola! 🌸 Soy Camila, Coordinadora de Citas de **juntosxsiempre**, estudio fotográfico en Nogales, Sonora, México.\n\nEscríbeme por aquí para consultar fechas y horarios disponibles, cotizar paquetes con maquillaje o reels de video, y reservar tu sesión. ¿En qué podemos inspirarte hoy?",
      timestamp: "initial",
    },
  ]);

  // Dialog & Guided Tour states
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);
  const [isWebhookDialogOpen, setIsWebhookDialogOpen] = useState(false);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isOwnerPitchOpen, setIsOwnerPitchOpen] = useState(false);
  const [isOwnerPitchMode, setIsOwnerPitchMode] = useState(true);
  const [bufferTestResult, setBufferTestResult] = useState<{
    tested: boolean;
    time: string;
    allowed: boolean;
    message: string;
    suggestedSlot: string;
  } | null>(null);
  const [waitlistRescueMessage, setWaitlistRescueMessage] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetToastMessage, setResetToastMessage] = useState("");
  const [webhookTestOutput, setWebhookTestOutput] = useState<string>("");
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  // Manual booking form states
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("+52 55 4910 2831");
  const [formEmail, setFormEmail] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("11:00");
  const [formService, setFormService] = useState("pareja-juntos");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState("");

  // Parallax elements ref for JS scroll fallback
  const heroWrapperRef = useRef<HTMLDivElement>(null);
  const parallaxBackRef = useRef<HTMLDivElement>(null);
  const parallaxMidRef = useRef<HTMLDivElement>(null);
  const parallaxFrontRef = useRef<HTMLDivElement>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const bookingFormRef = useRef<HTMLFormElement>(null);
  const msgSeqRef = useRef<number>(1);

  // JavaScript Parallax Scroll Fallback for browsers without native scroll-driven animations
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if browser already supports native CSS view-timeline
    const supportsNativeParallax =
      typeof CSS !== "undefined" &&
      CSS.supports &&
      CSS.supports("(animation-timeline: view()) and (animation-range: entry)");

    if (supportsNativeParallax) return;

    const wrapper = heroWrapperRef.current;
    if (!wrapper) return;

    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!wrapper) return;
        const scrollY = window.scrollY;
        const rect = wrapper.getBoundingClientRect();
        const top = rect.top + scrollY;
        const height = rect.height;
        const winHeight = window.innerHeight;

        if (scrollY >= top - winHeight && scrollY <= top + height) {
          const progress = (scrollY - (top - winHeight)) / (height + winHeight);
          if (parallaxBackRef.current) {
            const yBack = -25 + progress * 60;
            parallaxBackRef.current.style.transform = `translate3d(0, ${yBack}px, 0)`;
          }
          if (parallaxMidRef.current) {
            const yMid = 25 - progress * 50;
            parallaxMidRef.current.style.transform = `translate3d(0, ${yMid}px, 0)`;
          }
          if (parallaxFrontRef.current) {
            const yFront = 40 - progress * 55;
            parallaxFrontRef.current.style.transform = `translate3d(0, ${yFront}px, 0)`;
          }
        }
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            window.addEventListener("scroll", handleScroll, { passive: true });
            handleScroll();
          } else {
            window.removeEventListener("scroll", handleScroll);
            if (rafId !== null) {
              cancelAnimationFrame(rafId);
              rafId = null;
            }
          }
        });
      },
      { threshold: 0 },
    );

    observer.observe(wrapper);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  // Fetch studio schedule & availability on demand
  const fetchScheduleData = useCallback(
    async (dateOverride?: string, serviceOverride?: string) => {
      const targetDate = dateOverride ?? selectedDate;
      const targetService = serviceOverride ?? selectedServiceId;
      const params = new URLSearchParams();
      if (targetDate) params.set("date", targetDate);
      if (targetService) params.set("serviceId", targetService);

      const res = await fetch(`/api/appointments?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();

      setServices(data.services || []);
      setAddOns(data.addOns || []);
      setPhotographers(data.photographers || []);
      setBackdrops(data.backdrops || []);
      setAppointments(data.appointments || []);
      setWaitlist(data.waitlist || []);
      setDayAvailability(data.selectedDateAvailability || null);
      setNextOpenDates(data.nextOpenDates || []);

      if (!selectedDate && data.selectedDateAvailability?.date) {
        setSelectedDate(data.selectedDateAvailability.date);
        setFormDate(data.selectedDateAvailability.date);
      }
    },
    [selectedDate, selectedServiceId],
  );

  useEffect(() => {
    let active = true;
    fetch("/api/appointments?serviceId=pareja-juntos")
      .then((r) => r.json())
      .then((data) => {
        if (!active || !data) return;
        setServices(data.services || []);
        setAddOns(data.addOns || []);
        setPhotographers(data.photographers || []);
        setBackdrops(data.backdrops || []);
        setAppointments(data.appointments || []);
        setWaitlist(data.waitlist || []);
        setDayAvailability(data.selectedDateAvailability || null);
        setNextOpenDates(data.nextOpenDates || []);
        if (data.selectedDateAvailability?.date) {
          setSelectedDate(data.selectedDateAvailability.date);
          setFormDate(data.selectedDateAvailability.date);
        }
      })
      .catch(() => {});

    fetch("/api/agent/chat")
      .then((r) => r.json())
      .then((info) => {
        if (!active) return;
        if (info?.providerStatus) {
          setServerKeyStatus({
            geminiConfigured: Boolean(info.providerStatus.geminiConfigured),
            openrouterConfigured: Boolean(info.providerStatus.openrouterConfigured),
          });
          if (info.providerStatus.defaultMode) {
            setProviderMode(info.providerStatus.defaultMode as ProviderMode);
          }
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  // Auto-activate tour if URL param or hash indicates ?tour=true, ?tour=1, or #tour
  useEffect(() => {
    if (typeof window !== "undefined") {
      const search = window.location.search;
      const hash = window.location.hash;
      if (search.includes("tour") || hash.includes("tour")) {
        const timer = setTimeout(() => {
          setIsTourOpen(true);
          setTourStepIndex(0);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Form field validation sync
  useEffect(() => {
    const form = bookingFormRef.current;
    if (!form) return;

    const dirtyState = new WeakMap<
      HTMLInputElement,
      { hasInteracted: boolean; hasBlurred: boolean }
    >();

    const syncAriaAndFallback = (input: HTMLInputElement) => {
      if (typeof input.checkValidity !== "function") return;
      const isValid = input.checkValidity();

      if (!CSS.supports("selector(:user-invalid)")) {
        input.classList.toggle("user-invalid-fallback", !isValid);
        input.classList.toggle("user-valid-fallback", isValid);
      }

      const matchesInvalid =
        (CSS.supports("selector(:user-invalid)") && input.matches(":user-invalid")) ||
        input.classList.contains("user-invalid-fallback");

      input.setAttribute("aria-invalid", matchesInvalid ? "true" : "false");
    };

    const handleBlur = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target || target.tagName !== "INPUT") return;
      const state = dirtyState.get(target) || { hasInteracted: false, hasBlurred: false };
      state.hasBlurred = true;
      dirtyState.set(target, state);
      if (state.hasInteracted) {
        syncAriaAndFallback(target);
      }
    };

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target || target.tagName !== "INPUT") return;
      const state = dirtyState.get(target) || { hasInteracted: false, hasBlurred: false };
      state.hasInteracted = true;
      dirtyState.set(target, state);
      if (state.hasBlurred || target.hasAttribute("aria-invalid")) {
        syncAriaAndFallback(target);
      }
    };

    form.addEventListener("blur", handleBlur, true);
    form.addEventListener("input", handleInput);
    return () => {
      form.removeEventListener("blur", handleBlur, true);
      form.removeEventListener("input", handleInput);
    };
  }, [isBookingDialogOpen]);

  const sendTextMessage = async (textOverride?: string) => {
    const text = (textOverride ?? inputMessage).trim();
    if (!text || isSending) return;

    setMobileTab("chat");

    msgSeqRef.current += 1;
    const seq = msgSeqRef.current;

    const optimisticUserMsg: ChatTurnMessage = {
      id: `user-${seq}`,
      role: "user",
      text,
      timestamp: `turn-${seq}`,
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    if (!textOverride) setInputMessage("");
    setIsSending(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "juntosxsiempre-mobile-session",
          clientPhone,
          message: text,
          clientAppointments: appointments.length > 0 ? appointments : undefined,
          clientWaitlist: waitlist.length > 0 ? waitlist : undefined,
          clientHistory: llmHistory.length > 0 ? llmHistory : undefined,
          providerConfig: {
            mode: providerMode,
            geminiApiKey: geminiKey || undefined,
            openrouterApiKey: openrouterKey || undefined,
            geminiModel: geminiModel || undefined,
            openrouterModel: openrouterModel || undefined,
          },
        }),
      });

      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
      if (Array.isArray(data.history)) {
        setLlmHistory(data.history);
      }
      if (data.telemetry) {
        setLastTelemetry(data.telemetry);
      }
      if (data.waitlist) {
        setWaitlist(data.waitlist);
      }
      if (data.appointments) {
        setAppointments(data.appointments);
        fetchScheduleData(selectedDate, selectedServiceId);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      msgSeqRef.current += 1;
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${msgSeqRef.current}`,
          role: "assistant",
          text: `Error de conexión: ${errMsg}`,
          timestamp: `err-${msgSeqRef.current}`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleFullReset = async () => {
    setIsResetting(true);
    try {
      const res = await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: "pareja-juntos" }),
      });
      const data = await res.json();

      if (data.appointments) setAppointments(data.appointments);
      if (data.waitlist) setWaitlist(data.waitlist);
      if (data.selectedDateAvailability) {
        setDayAvailability(data.selectedDateAvailability);
        setSelectedDate(data.selectedDateAvailability.date);
        setFormDate(data.selectedDateAvailability.date);
      }
      if (data.nextOpenDates) setNextOpenDates(data.nextOpenDates);

      msgSeqRef.current += 1;
      setLlmHistory([]);
      setMessages([
        {
          id: `welcome-${msgSeqRef.current}`,
          role: "assistant",
          text: "¡Hola! 🌸 Soy Camila, Coordinadora de Citas de **juntosxsiempre**, estudio fotográfico en Nogales, Sonora, México.\n\nEscríbeme por aquí para consultar fechas y horarios disponibles, cotizar paquetes con maquillaje o reels de video, y reservar tu sesión. ¿En qué podemos inspirarte hoy?",
          timestamp: `reset-${msgSeqRef.current}`,
        },
      ]);
      setClientPhone("+52 55 4910 2831");
      setInputMessage("");
      setSelectedServiceId("pareja-juntos");
      setLastTelemetry(null);
      setMobileTab("chat");

      setIsResetDialogOpen(false);
      setResetToastMessage("✨ ¡Citas, lista de espera y chat restaurados al estado inicial de juntosxsiempre!");
      setTimeout(() => setResetToastMessage(""), 4500);
    } catch (err: unknown) {
      console.error("Fallo al reiniciar el estudio:", err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleCancelBooking = async (bookingRef: string) => {
    try {
      await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "status",
          bookingRef,
          status: "cancelled",
        }),
      });
      setResetToastMessage(
        `🔔 Cancelación Detectada (${bookingRef}) → Espacio liberado. Camila alertó inmediatamente a Lucía Benítez (Lista de Espera).`,
      );
      setTimeout(() => setResetToastMessage(""), 6000);
      fetchScheduleData(selectedDate, selectedServiceId);
    } catch {
      // ignore
    }
  };

  const handleTestBufferCollision = () => {
    setBufferTestResult({
      tested: true,
      time: "12:05 PM",
      allowed: false,
      message:
        "⚠️ Conflicto de Buffer Profoto: Se requieren 15 minutos exactos para enfriamiento y calibración de luces Profoto Pro-11 y bienvenida de clientes.",
      suggestedSlot: "12:15 PM (Próximo Horario Seguro y Libre)",
    });
  };

  const handleReassignWaitlist = async (waitlistRef: string = "WTL-8104") => {
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reassign_waitlist",
          waitlistRef,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWaitlistRescueMessage(
          `🎉 ¡Horario Salvado! Lucía Benítez confirmó su cita (${data.appointment?.bookingRef || "JXS-Nueva"}). El estudio recuperó $2,800 MXN sin perder un solo peso.`,
        );
        setTimeout(() => setWaitlistRescueMessage(""), 8000);
        fetchScheduleData(selectedDate, selectedServiceId);
      }
    } catch {
      // ignore
    }
  };

  const handleManualBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: formName,
        clientPhone: formPhone,
        clientEmail: formEmail,
        serviceId: formService,
        date: formDate || selectedDate,
        startTime: formTime,
        notes: formNotes,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFormError(data.error || "No se pudo registrar la cita.");
      return;
    }
    setIsBookingDialogOpen(false);
    setFormName("");
    setFormEmail("");
    setFormNotes("");
    fetchScheduleData(formDate || selectedDate, selectedServiceId);
  };

  const handleTestSmsWebhook = async () => {
    setIsTestingWebhook(true);
    setWebhookTestOutput("");
    try {
      const res = await fetch("/api/webhook/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          From: "+525549102831",
          Body: `¡Hola! ¿Qué horarios tienen disponibles para una sesión en pareja este fin de semana?`,
          providerMode,
          format: "twiml",
        }),
      });
      const text = await res.text();
      setWebhookTestOutput(text);
    } catch (err: unknown) {
      setWebhookTestOutput(String(err));
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const confirmedAppointments = appointments.filter((a) => a.status !== "cancelled");
  const totalScheduledRevenue = confirmedAppointments.reduce((sum, a) => sum + a.price, 0);
  const totalDepositsSecured = confirmedAppointments.reduce((sum, a) => {
    const svc = services.find((s) => s.id === a.serviceId);
    return sum + (svc?.depositAmount || 800);
  }, 0);
  const averageTicket = Math.round(
    totalScheduledRevenue / Math.max(1, confirmedAppointments.length),
  );
  const firstOpenDate = nextOpenDates[0] || selectedDate || "2026-11-10";
  const secondOpenDate = nextOpenDates[1] || firstOpenDate;

  const quickPrompts = [
    {
      icon: "💎",
      label: "Cotizar con Maquillaje & Reel",
      text: "Quiero cotizar la Sesión Juntos x Siempre agregando Maquillaje y Peinado Profesional y Video Reel 4K Vertical.",
    },
    {
      icon: "🌙",
      label: "Consulta 11:42 PM (24/7)",
      text: "Hola, buenas noches! Mi prometido y yo queremos una sesión de pareja para este sábado antes del atardecer. ¿Tienen algún espacio libre y cuánto cuesta?",
    },
    {
      icon: "🌸",
      label: "Disponibilidad",
      text: "¿Qué fechas y horarios tienen disponibles para sesión de pareja en juntosxsiempre?",
    },
    {
      icon: "⚡",
      label: "Agendar Cita con Anticipo",
      text: `Deseo agendar la Sesión Juntos x Siempre para el ${firstOpenDate} a las 11:30 AM a nombre de Mariana Rivera, correo mariana.rivera@gmail.com`,
    },
    {
      icon: "🔄",
      label: "Cancelar JXS-2041 (Probar Waitlist)",
      text: "Por favor cancela mi cita JXS-2041 para ver cómo se notifica a la lista de espera.",
    },
    {
      icon: "👗",
      label: "Guía de Vestuario & Sets",
      text: "¿Me puedes enviar la guía de preparación de vestuario y el enlace de anticipo para la cita JXS-2055?",
    },
    {
      icon: "📸",
      label: "Fotógrafos Nogales",
      text: "¿Quiénes son los fotógrafos del estudio y qué fondos tienen disponibles en Nogales, Sonora?",
    },
    {
      icon: "🔔",
      label: "Lista de Espera",
      text: `Por favor anótame en lista de espera para el ${firstOpenDate} por la mañana para sesión de pareja. Soy Lucía Benítez, correo lucia.benitez@outlook.com`,
    },
    {
      icon: "🗓️",
      label: "Reprogramar Cita",
      text: `¿Puedo reprogramar mi cita JXS-2041 para el ${secondOpenDate} a las 3:00 PM?`,
    },
  ];

  const tourSteps: GuidedTourStep[] = [
    {
      id: "tour-step-1",
      targetId: "tour-step-chat",
      targetTab: "chat",
      badge: "IA SMS & WhatsApp 24/7",
      title: "1. Camila: Coordinadora de Citas Inteligente",
      description:
        "Camila atiende a tus clientes día y noche en menos de 2 segundos. Conoce todo el catálogo de sesiones fotográficas, resuelve dudas de vestuario y cotiza ventas cruzadas automáticas para tu estudio en Nogales, Sonora.",
      highlights: [
        "Respuesta cálida e instantánea en español",
        "Venta cruzada automática (+ $1,450 MXN ticket promedio)",
        "Fallback multi-proveedor 99.9% uptime (Gemini ⇄ OpenRouter)",
      ],
      actionLabel: "💬 Cotizar Sesión + Add-Ons con Camila",
      onAction: () => {
        setMobileTab("chat");
        sendTextMessage(
          "Quiero cotizar la Sesión Juntos x Siempre agregando Maquillaje y Peinado Profesional y Video Reel 4K Vertical.",
        );
      },
    },
    {
      id: "tour-step-2",
      targetId: "tour-step-calendar",
      targetTab: "calendar",
      badge: "Buffer 15m Profoto",
      title: "2. Calendario Inteligente con Amortiguamiento",
      description:
        "Calcula la disponibilidad en tiempo real respetando los horarios de Nogales, Sonora (Martes a Sábado) y reserva automáticamente 15 minutos entre sesiones para calibrar flashes Profoto Pro-11.",
      highlights: [
        "Cero empalmes ni carreras entre clientes",
        "Duración dinámica calculada por paquete fotográfico",
        "Validación instantánea de días hábiles y horarios de apertura",
      ],
      actionLabel: "⚡ Probar Buffer Profoto (12:05 PM)",
      onAction: () => {
        setMobileTab("calendar");
        handleTestBufferCollision();
      },
    },
    {
      id: "tour-step-3",
      targetId: "tour-step-bookings",
      targetTab: "bookings",
      badge: "Auto-Rescate de Cancelaciones",
      title: "3. Citas Confirmadas y Lista de Espera Reactiva",
      description:
        "Supervisa todas las reservaciones activas con códigos JXS. Si una sesión se cancela, el sistema contacta de inmediato a clientes en lista de espera (como Lucía Benítez) para salvar los ingresos.",
      highlights: [
        "Códigos únicos JXS con anticipos transferibles",
        "Recupera hasta el 85% de cancelaciones imprevistas",
        "Búsqueda instantánea por nombre, teléfono o código",
      ],
      actionLabel: "🔄 Probar Auto-Rescate de Cancelación (JXS-2041)",
      onAction: () => {
        setMobileTab("bookings");
        handleCancelBooking("JXS-2041");
      },
    },
    {
      id: "tour-step-4",
      targetId: "tour-step-studio",
      targetTab: "studio",
      badge: "Estudio en Nogales, Sonora",
      title: "4. Estudio, Fotógrafos & Sets Temáticos",
      description:
        "Ubicados en Av. Álvaro Obregón 354, Col. Fundo Legal, Nogales, Sonora. Catálogo de 5 paquetes, 5 complementos de alto margen, 3 fotógrafos especializados y sets con luz natural sonorense.",
      highlights: [
        "Sofía Morales (Parejas), Mateo Hernández (Editorial), Valentina Ramos (Familia)",
        "Sets con ventanales de luz natural, cantera y ciclorama",
        "Precios transparentes en Pesos Mexicanos (MXN)",
      ],
      actionLabel: "📸 Preguntar a Camila por Sets de Nogales",
      onAction: () => {
        setMobileTab("chat");
        sendTextMessage(
          "¿Quiénes son los fotógrafos del estudio y qué fondos tienen disponibles en Nogales, Sonora?",
        );
      },
    },
    {
      id: "tour-step-5",
      targetId: "tour-step-roi",
      targetTab: "roi",
      badge: "Proyección +$25,784 MXN/mes",
      title: "5. Rentabilidad y ROI para el Dueño",
      description:
        "Proyecta el impacto económico para el estudio fotográfico: incrementa el ticket promedio, elimina horas muertas por cancelaciones y ahorra más de 60 horas de atención manual al mes.",
      highlights: [
        "Calculadora interactiva con slider de volumen mensual",
        "Menos del 2% de ausentismo gracias a políticas de anticipo",
        "5 demostraciones preparadas para convencer al dueño en 1 clic",
      ],
      actionLabel: "📊 Abrir Presentación Completa de ROI (+Ventajas)",
      onAction: () => {
        setMobileTab("roi");
        setIsOwnerPitchOpen(true);
      },
    },
  ];

  const selectedServiceObj =
    services.find((s) => s.id === selectedServiceId) || services[0];

  return (
    <div className="min-h-dvh bg-[#fbf7f4] text-[#2d1822] pb-28 sm:pb-32 font-sans select-text">
      {/* Toast Notification */}
      {resetToastMessage && (
        <div className="fixed top-4 inset-x-4 z-50 mx-auto max-w-md animate-bounce rounded-2xl border border-pink-300 bg-[#fffdfb] p-4 text-center text-xs font-semibold text-[#9e193e] shadow-[0_12px_30px_rgba(224,68,110,0.2)]">
          {resetToastMessage}
        </div>
      )}

      {/* --- Sticky Top Mobile Bar (100% Mobile Focused) --- */}
      <header className="sticky top-0 z-30 border-b border-pink-200/70 bg-[#fffdfb]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between px-3 py-2.5">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-2">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#e0446e] via-[#f06a8f] to-[#f8cfda] text-white shadow-md shadow-pink-500/25">
              <Camera className="h-5 w-5 stroke-[2.2]" />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white ring-2 ring-white">
                ✓
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-[#2d1822]">
                  juntosxsiempre
                </h1>
                <span className="rounded-full bg-pink-100 px-1.5 py-0.2 text-[9px] font-bold text-[#c52752]">
                  Nogales
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-[#7b5965] flex items-center gap-1">
                <MapPin className="h-3 w-3 text-[#e0446e]" /> Nogales, Sonora • Estudio
              </p>
            </div>
          </div>

          {/* Action Pills */}
          <div className="flex items-center gap-1.5">
            {/* Guided Tour Pill */}
            <button
              type="button"
              onClick={() => {
                setIsTourOpen(true);
                setTourStepIndex(0);
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-pink-300 bg-white/95 px-2 py-1.5 text-xs font-bold text-[#c52752] shadow-xs hover:border-pink-400 active:scale-95 transition"
              title="Activar Tour Guiado Interactivo"
              aria-label="Activar Tour Guiado"
            >
              <Compass className="h-3.5 w-3.5 text-[#e0446e]" />
              <span className="hidden xxs:inline">Tour</span>
            </button>

            {/* Owner Advantages Pitch Pill */}
            <button
              type="button"
              onClick={() => setIsOwnerPitchOpen(true)}
              className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 via-rose-50 to-pink-50 px-2 py-1.5 text-xs font-bold text-[#9e193e] shadow-xs hover:border-pink-300 active:scale-95 transition"
              title="Ventajas Exclusivas para el Dueño del Estudio (ROI)"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
              <span>Ventajas</span>
              <span className="rounded-full bg-emerald-100 px-1 py-0.2 text-[8px] font-black text-emerald-800">
                +ROI
              </span>
            </button>

            {/* Quick Provider Pill */}
            <button
              type="button"
              onClick={() => setIsProviderDialogOpen(true)}
              className="inline-flex items-center gap-1 rounded-xl border border-pink-200 bg-pink-50/70 px-2 py-1.5 text-xs font-semibold text-[#9e193e] active:scale-95 transition"
              title="Configuración de IA & API Keys"
            >
              <Cpu className="h-3.5 w-3.5 text-[#e0446e]" />
              <span className="hidden xs:inline">{PROVIDER_MODE_LABELS[providerMode]?.shortBadge}</span>
            </button>

            {/* Reset Menu Pill */}
            <button
              type="button"
              onClick={() => setIsResetDialogOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-pink-200 bg-white text-[#7b5965] hover:text-[#e0446e] active:scale-95 transition"
              title="Reiniciar Demo"
              aria-label="Reiniciar Demo"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* --- Owner Presentation HUD & 5-Pillar Guided Tour (Selling to Studio Owner) --- */}
      {isOwnerPitchMode ? (
        <div className="border-b border-pink-200/90 bg-gradient-to-r from-[#faebef] via-[#fffdfb] to-[#fdf2f4] px-3 py-2 shadow-xs">
          <div className="mx-auto max-w-md">
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-[#e0446e] text-white text-[10px] shadow-xs">
                  👑
                </span>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#9e193e]">
                  Modo Presentación Dueño (Activo)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsTourOpen(true);
                    setTourStepIndex(0);
                  }}
                  className="rounded-lg bg-white/95 border border-pink-200 px-2 py-0.5 text-[9px] font-extrabold text-[#c52752] hover:bg-pink-100 active:scale-95 transition flex items-center gap-1"
                  title="Iniciar Tour Guiado"
                >
                  <Compass className="h-2.5 w-2.5 text-[#e0446e]" />
                  <span>Tour Guiado</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOwnerPitchOpen(true)}
                  className="rounded-lg bg-pink-100/90 px-2 py-0.5 text-[9px] font-extrabold text-[#c52752] hover:bg-pink-200 active:scale-95 transition"
                >
                  Ver ROI Completo →
                </button>
                <button
                  type="button"
                  onClick={() => setIsOwnerPitchMode(false)}
                  className="text-[9px] font-semibold text-[#7b5965] hover:text-[#2d1822] underline"
                  title="Cambiar a vista de cliente final"
                >
                  Vista Cliente
                </button>
              </div>
            </div>

            {/* 5-Pillar Guided Interactive Proofs Bar */}
            <div className="grid grid-cols-5 gap-1 text-center font-bold text-[9px]">
              <button
                type="button"
                onClick={() => {
                  setMobileTab("chat");
                  sendTextMessage(
                    "Quiero cotizar la Sesión Juntos x Siempre agregando Maquillaje y Peinado Profesional y Video Reel 4K Vertical.",
                  );
                }}
                className="rounded-xl border border-pink-200 bg-white/95 p-1.5 text-[#c52752] shadow-2xs hover:bg-pink-50 active:scale-95 transition"
                title="1. Ver upselling automático de alto margen"
              >
                <span className="block text-xs">💎</span>
                <span className="truncate block font-extrabold">+42% Upsell</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileTab("chat");
                  sendTextMessage(
                    "Hola, buenas noches! Mi prometido y yo queremos una sesión de pareja para este sábado antes del atardecer. ¿Tienen algún espacio libre y cuánto cuesta?",
                  );
                }}
                className="rounded-xl border border-pink-200 bg-white/95 p-1.5 text-[#5e3347] shadow-2xs hover:bg-pink-50 active:scale-95 transition"
                title="2. Simular cliente a las 11:42 PM"
              >
                <span className="block text-xs">🌙</span>
                <span className="truncate block font-extrabold">24/7 &lt; 2s</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileTab("calendar");
                  handleTestBufferCollision();
                }}
                className="rounded-xl border border-pink-200 bg-white/95 p-1.5 text-[#5e3347] shadow-2xs hover:bg-pink-50 active:scale-95 transition"
                title="3. Ver algoritmo de buffer de 15m Profoto"
              >
                <span className="block text-xs">🛡️</span>
                <span className="truncate block font-extrabold">Buffer 15m</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleCancelBooking("JXS-2041");
                  setMobileTab("bookings");
                }}
                className="rounded-xl border border-pink-200 bg-white/95 p-1.5 text-[#5e3347] shadow-2xs hover:bg-pink-50 active:scale-95 transition"
                title="4. Ver rescate de cita cancelada"
              >
                <span className="block text-xs">🔄</span>
                <span className="truncate block font-extrabold">Auto-Rescate</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileTab("roi");
                }}
                className="rounded-xl border border-emerald-300 bg-emerald-50/95 p-1.5 text-emerald-800 shadow-2xs hover:bg-emerald-100 active:scale-95 transition"
                title="5. Proyección económica y ROI"
              >
                <span className="block text-xs">📊</span>
                <span className="truncate block font-extrabold">Calc. ROI</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-pink-50/60 border-b border-pink-100 px-3 py-1 flex items-center justify-between text-[10px]">
          <button
            type="button"
            onClick={() => setIsOwnerPitchMode(true)}
            className="font-bold text-[#c52752] hover:underline inline-flex items-center gap-1"
          >
            <span>👑 Activar Modo Presentación Dueño</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsTourOpen(true);
              setTourStepIndex(0);
            }}
            className="font-bold text-[#9e193e] hover:underline inline-flex items-center gap-1"
          >
            <Compass className="h-3 w-3 text-[#e0446e]" />
            <span>Tour Guiado</span>
          </button>
        </div>
      )}

      {/* --- Parallax Hero Studio Stage (parallax-scroll-effects) --- */}
      <section
        ref={heroWrapperRef}
        className="parallax-stage relative mx-auto max-w-md overflow-clip px-4 pt-4 pb-2"
      >
        {/* Parallax Background Layer: Soft Pink & Cream Bokeh Circles */}
        <div
          ref={parallaxBackRef}
          className="parallax-layer-back pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="h-64 w-64 rounded-full bg-gradient-to-tr from-[#fce7ec] to-[#f8cfda]/50 blur-3xl opacity-80" />
          <div className="absolute top-2 right-4 h-32 w-32 rounded-full bg-[#f4e8dc]/60 blur-2xl" />
          <div className="absolute -bottom-4 left-6 h-28 w-28 rounded-full bg-[#fdf2f4] blur-xl" />
        </div>

        {/* Parallax Midground Layer: Decorative Photographic Optics & Elements */}
        <div
          ref={parallaxMidRef}
          className="parallax-layer-mid pointer-events-none absolute inset-0 z-10 flex items-center justify-between px-6"
          aria-hidden="true"
        >
          {/* Subtle aperture & crop brackets */}
          <div className="h-10 w-10 rounded-full border border-pink-300/40 opacity-70 animate-gentle-sway" />
          <div className="flex flex-col items-center gap-1 text-[9px] tracking-widest text-[#c98894]/60 font-mono">
            <span>[ 50mm f/1.4 ]</span>
            <span>PRO-FOTO 1/250</span>
          </div>
          <div className="h-8 w-8 rounded-full border border-amber-300/40 opacity-60 animate-pulse-subtle" />
        </div>

        {/* Parallax Foreground Layer: Main Mobile Studio Hero Card */}
        <div
          ref={parallaxFrontRef}
          className="parallax-layer-front relative z-20 rounded-3xl border border-pink-200/90 bg-gradient-to-b from-[#fffdfb] to-[#faf3ec]/90 p-4 shadow-[0_12px_35px_-8px_rgba(224,68,110,0.14)]"
        >
          <div className="flex items-center justify-between gap-2 border-b border-pink-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-[#2d1822]">
                Estudio Abierto • Citas en Vivo
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-pink-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-[#9e193e]">
              <Sparkles className="h-3 w-3 text-[#e0446e]" />
              <span>Coordinadora Camila</span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-white/80 p-2.5 border border-pink-100 shadow-sm">
              <p className="text-[10px] font-medium text-[#7b5965]">Anticipo</p>
              <p className="text-sm font-bold text-[#c52752]">Desde $500</p>
              <p className="text-[9px] text-[#8e7079]">100% transferible</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-2.5 border border-pink-100 shadow-sm">
              <p className="text-[10px] font-medium text-[#7b5965]">Galería</p>
              <p className="text-sm font-bold text-[#2d1822]">48 Horas</p>
              <p className="text-[9px] text-[#8e7079]">Revisión digital</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-2.5 border border-pink-100 shadow-sm">
              <p className="text-[10px] font-medium text-[#7b5965]">Ubicación</p>
              <p className="text-sm font-bold text-[#2d1822]">Nogales, Son.</p>
              <p className="text-[9px] text-[#8e7079]">Estacionamiento</p>
            </div>
          </div>

          {/* Interactive Studio Advantages Ticker for the Owner */}
          <div className="mt-3 border-t border-pink-100/80 pt-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#c52752] flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-[#e0446e]" /> Ventajas para el Dueño:
              </span>
              <button
                type="button"
                onClick={() => setIsOwnerPitchOpen(true)}
                className="text-[10px] font-bold text-[#e0446e] hover:underline"
              >
                Ver Demostración →
              </button>
            </div>
            <div className="grid grid-cols-2 xs:grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  sendTextMessage(
                    "Quiero cotizar la Sesión Juntos x Siempre agregando Maquillaje y Peinado Profesional y Video Reel 4K Vertical.",
                  );
                  setMobileTab("chat");
                }}
                className="flex items-center gap-1.5 rounded-xl border border-pink-100 bg-white/80 px-2 py-1.5 text-left text-[10px] font-semibold text-[#5e3347] hover:bg-pink-50 transition active:scale-95"
              >
                <span className="text-xs">💎</span>
                <span className="truncate">+42% Ticket</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sendTextMessage(
                    "Hola, buenas noches! Mi prometido y yo queremos una sesión de pareja para este sábado antes del atardecer. ¿Tienen algún espacio libre y cuánto cuesta?",
                  );
                  setMobileTab("chat");
                }}
                className="flex items-center gap-1.5 rounded-xl border border-pink-100 bg-white/80 px-2 py-1.5 text-left text-[10px] font-semibold text-[#5e3347] hover:bg-pink-50 transition active:scale-95"
              >
                <span className="text-xs">🌙</span>
                <span className="truncate">24/7 en &lt; 2s</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleTestBufferCollision();
                  setMobileTab("calendar");
                }}
                className="flex items-center gap-1.5 rounded-xl border border-pink-100 bg-white/80 px-2 py-1.5 text-left text-[10px] font-semibold text-[#5e3347] hover:bg-pink-50 transition active:scale-95"
              >
                <span className="text-xs">🛡️</span>
                <span className="truncate">Buffer 15m</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleCancelBooking("JXS-2041");
                  setMobileTab("bookings");
                }}
                className="flex items-center gap-1.5 rounded-xl border border-pink-100 bg-white/80 px-2 py-1.5 text-left text-[10px] font-semibold text-[#5e3347] hover:bg-pink-50 transition active:scale-95"
              >
                <span className="text-xs">🔄</span>
                <span className="truncate">Rescate Citas</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sendTextMessage(
                    "¿Me puedes enviar la guía de preparación de vestuario y el enlace de anticipo para la cita JXS-2055?",
                  );
                  setMobileTab("chat");
                }}
                className="flex items-center gap-1.5 rounded-xl border border-pink-100 bg-white/80 px-2 py-1.5 text-left text-[10px] font-semibold text-[#5e3347] hover:bg-pink-50 transition active:scale-95"
              >
                <span className="text-xs">👗</span>
                <span className="truncate">Anti No-Show</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTourOpen(true);
                  setTourStepIndex(0);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50 px-2 py-1.5 text-left text-[10px] font-bold text-[#c52752] hover:bg-pink-100 transition active:scale-95"
                title="Activar Tour Guiado Interactivo"
              >
                <span className="text-xs">🧭</span>
                <span className="truncate">Tour Guiado</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- Main Mobile Viewports (Switched via Bottom Nav) --- */}
      <main className="mx-auto max-w-md px-3 pt-2 pb-12">
        {/* TAB 1: SMS / CHAT COORDINATOR (CAMILA) */}
        {mobileTab === "chat" && (
          <div id="tour-step-chat" className="flex flex-col gap-3 scroll-mt-24 sm:scroll-mt-28">
            {/* Owner Advantage Highlights Banner */}
            <div className="flex items-center justify-between rounded-2xl border border-pink-200/90 bg-gradient-to-r from-[#fffdfb] via-[#fdf2f4] to-[#faebef] px-3.5 py-2 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-[#2d1822]">
                  Coordinadora IA 24/7 en Vivo
                </span>
                <span className="text-[10px] text-[#7b5965] hidden xs:inline">
                  • Vende add-ons, confirma anticipos y llena tu agenda
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOwnerPitchOpen(true)}
                className="shrink-0 text-[10px] font-extrabold text-[#c52752] hover:underline"
              >
                Ver Impacto →
              </button>
            </div>

            {/* Quick Prompts Carousel (Horizontal Flick) */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sendTextMessage(qp.text)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-pink-200/80 bg-[#fffdfb] px-3 py-1.5 text-xs font-medium text-[#5e3347] shadow-sm transition hover:border-pink-300 hover:bg-pink-50 active:scale-95"
                >
                  <span>{qp.icon}</span>
                  <span>{qp.label}</span>
                </button>
              ))}
            </div>

            {/* Chat Messages Frame */}
            <div className="flex flex-col gap-3 min-h-[360px] max-h-[56vh] overflow-y-auto rounded-3xl border border-pink-200/80 bg-[#fffdfb] p-3.5 shadow-sm">
              {messages.map((msg) => {
                const isAssistant = msg.role === "assistant";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAssistant ? "items-start" : "items-end"}`}
                  >
                    {/* Bubble */}
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                        isAssistant
                          ? "rounded-tl-sm border border-pink-100 bg-[#fbf7f4] text-[#2d1822]"
                          : "rounded-tr-sm bg-gradient-to-r from-[#e0446e] to-[#c52752] text-white"
                      }`}
                    >
                      {isAssistant && (
                        <div className="mb-1 flex items-center gap-1 text-[10px] font-bold text-[#e0446e]">
                          <Bot className="h-3 w-3" />
                          <span>Camila • juntosxsiempre</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      {isAssistant && (() => {
                        const t = msg.text.toLowerCase();
                        const hasUpsell =
                          t.includes("maquillaje") ||
                          t.includes("reel") ||
                          t.includes("fotos extra") ||
                          t.includes("complemento") ||
                          t.includes("hmua");
                        const hasBooking =
                          t.includes("jxs-") ||
                          t.includes("reservación") ||
                          t.includes("anticipo") ||
                          t.includes("confirmad") ||
                          t.includes("cita agendada");
                        const hasWaitlist =
                          t.includes("lista de espera") ||
                          t.includes("wtl-");

                        if (hasUpsell) {
                          return (
                            <div className="mt-2.5 rounded-xl border border-pink-200/90 bg-gradient-to-br from-pink-50/90 via-white to-amber-50/70 p-2.5 text-[10px] text-[#2d1822] shadow-2xs">
                              <div className="flex items-center justify-between border-b border-pink-100 pb-1.5 font-bold text-[#c52752]">
                                <span className="flex items-center gap-1">
                                  <Sparkles className="h-3.5 w-3.5 text-[#e0446e]" />
                                  <span>Ventaja Dueño: Upsell Automático Sugerido</span>
                                </span>
                                <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-800">
                                  + $2,300 MXN Extra
                                </span>
                              </div>
                              <div className="mt-1.5 grid grid-cols-3 gap-1 text-center font-semibold">
                                <div className="rounded-lg bg-white/90 p-1 border border-pink-100">
                                  <span className="block text-[8px] text-[#7b5965]">Básico</span>
                                  <span className="text-[#2d1822]">$2,800</span>
                                </div>
                                <div className="rounded-lg bg-white/90 p-1 border border-pink-100">
                                  <span className="block text-[8px] text-[#7b5965]">Con Add-Ons</span>
                                  <span className="text-[#c52752] font-extrabold">$5,100</span>
                                </div>
                                <div className="rounded-lg bg-emerald-50 p-1 border border-emerald-100">
                                  <span className="block text-[8px] text-emerald-800">Margen Neto Extra</span>
                                  <span className="text-emerald-800 font-extrabold">+ $1,850</span>
                                </div>
                              </div>
                              <p className="mt-1.5 text-[9px] text-[#7b5965]">
                                ✓ El cliente aceptó los complementos sin que tu fotógrafo tuviera que hacer labor de venta en el set.
                              </p>
                            </div>
                          );
                        }
                        if (hasBooking) {
                          return (
                            <div className="mt-2.5 rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-white to-pink-50/70 p-2.5 text-[10px] text-[#2d1822] shadow-2xs">
                              <div className="flex items-center justify-between border-b border-emerald-100 pb-1.5 font-bold text-emerald-900">
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>Ventaja Dueño: Cita Blindada &amp; Buffer Reservado</span>
                                </span>
                                <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-800">
                                  Anticipo Garantizado
                                </span>
                              </div>
                              <p className="mt-1 text-[9px] text-[#5e3347]">
                                ✓ Anticipo cobrado al momento, 15m de calibración Profoto bloqueados en agenda y guía de vestuario entregada.
                              </p>
                            </div>
                          );
                        }
                        if (hasWaitlist) {
                          return (
                            <div className="mt-2.5 rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/90 via-white to-pink-50/70 p-2.5 text-[10px] text-[#2d1822] shadow-2xs">
                              <div className="flex items-center justify-between border-b border-amber-100 pb-1.5 font-bold text-amber-900">
                                <span className="flex items-center gap-1">
                                  <BellRing className="h-3.5 w-3.5 text-amber-600" />
                                  <span>Ventaja Dueño: Lead Retenido en Lista de Espera</span>
                                </span>
                                <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-800">
                                  $0 Fugas
                                </span>
                              </div>
                              <p className="mt-1 text-[9px] text-[#5e3347]">
                                ✓ Cuando otro cliente cancele, el sistema le ofrecerá este horario a este lead en automático.
                              </p>
                            </div>
                          );
                        }
                        const isLateNightOrSchedule =
                          t.includes("buenas noches") ||
                          t.includes("atardecer") ||
                          t.includes("sábado") ||
                          t.includes("horarios abiertos");
                        if (isLateNightOrSchedule) {
                          return (
                            <div className="mt-2.5 rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50/90 via-white to-pink-50/70 p-2.5 text-[10px] text-[#2d1822] shadow-2xs">
                              <div className="flex items-center justify-between border-b border-amber-100 pb-1.5 font-bold text-amber-900">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                                  <span>Ventaja Dueño: Respuesta Inmediata 24/7 (&lt; 2s)</span>
                                </span>
                                <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-800">
                                  +35% Conversión
                                </span>
                              </div>
                              <p className="mt-1 text-[9px] text-[#5e3347]">
                                ✓ Consulta nocturna respondida al instante. No se pierde el cliente con otros estudios de Nogales.
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {/* Tool Executions & Telemetry Drawer */}
                    {msg.toolExecutions && msg.toolExecutions.length > 0 && (
                      <details className="mt-1 max-w-[88%] rounded-xl border border-pink-200/60 bg-pink-50/40 p-2 text-[10px] text-[#7b5965]">
                        <summary className="cursor-pointer font-semibold text-[#9e193e] flex items-center gap-1">
                          <Wrench className="h-3 w-3" />
                          <span>
                            {msg.toolExecutions.length} herramienta(s) ejecutada(s)
                          </span>
                        </summary>
                        <div className="mt-1.5 flex flex-col gap-1">
                          {msg.toolExecutions.map((tx) => (
                            <div key={tx.id} className="rounded bg-white/80 p-1.5 border border-pink-100">
                              <span className="font-bold text-[#c52752]">{tx.toolName}</span>
                              <pre className="mt-0.5 overflow-x-auto text-[9px] text-[#2d1822]">
                                {JSON.stringify(tx.args, null, 2)}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}

              {isSending && (
                <div className="flex items-center gap-2 self-start rounded-2xl rounded-tl-sm border border-pink-100 bg-[#fbf7f4] px-4 py-2.5 text-xs text-[#7b5965]">
                  <span className="h-2 w-2 rounded-full bg-[#e0446e] animate-ping" />
                  <span>Camila está revisando la agenda...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Client Phone Bar & Quick Reset */}
            <div className="flex items-center justify-between gap-2 px-1 text-[11px] text-[#7b5965]">
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-[#e0446e]" />
                <span>Simulador SMS Cliente:</span>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="rounded-lg border border-pink-200 bg-white px-2 py-0.5 font-mono text-[11px] text-[#2d1822] focus:outline-pink-400"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsBookingDialogOpen(true)}
                className="text-[11px] font-bold text-[#e0446e] hover:underline"
              >
                + Cita Manual
              </button>
            </div>

            {/* Chat Input Field (Thumb-Optimized) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendTextMessage();
              }}
              className="flex items-center gap-2 rounded-2xl border border-pink-200/90 bg-[#fffdfb] p-1.5 shadow-md shadow-pink-500/5"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Escribe a Camila (ej. ¿Qué fechas tienen?)..."
                disabled={isSending}
                className="flex-1 bg-transparent px-3 py-2 text-xs text-[#2d1822] placeholder:text-[#a0828c] focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSending || !inputMessage.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#e0446e] to-[#c52752] text-white shadow transition hover:opacity-95 active:scale-95 disabled:opacity-40"
                aria-label="Enviar mensaje"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: STUDIO CALENDAR & AVAILABLE SLOTS */}
        {mobileTab === "calendar" && (
          <div id="tour-step-calendar" className="flex flex-col gap-3 scroll-mt-24 sm:scroll-mt-28">
            {/* Owner Value Callout: 15-Minute Profoto Buffer */}
            <div className="rounded-3xl border border-pink-200/90 bg-gradient-to-r from-[#fffdfb] via-[#fdf2f4] to-[#faebef] p-3.5 shadow-xs">
              <div className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#e0446e] text-white shadow-xs">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-xs text-[#2d1822]">
                      Protección Anti-Traslapes: Buffer Automático de 15 Minutos
                    </h4>
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[8px] font-extrabold text-emerald-800">
                      Profoto Pro-11
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#7b5965] leading-relaxed">
                    Entre cada sesión, el sistema aparta 15 minutos dedicados para calibrar flashes Profoto Pro-11, renovar el set y atender a los clientes con calma en Nogales, Sonora. ¡Tus fotógrafos nunca correrán con prisas!
                  </p>

                  {/* Interactive Buffer Timeline Diagram */}
                  <div className="mt-2.5 rounded-2xl border border-pink-100 bg-white/90 p-2.5 shadow-2xs font-mono text-[10px]">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#7b5965] block mb-1.5">
                      Flujo de Set con Protección Automática:
                    </span>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between rounded-lg bg-pink-50/70 p-1.5 text-[#5e3347]">
                        <span>11:00 AM – 12:00 PM</span>
                        <span className="font-sans font-bold">Sesión en Pareja (60 min)</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-1.5 text-amber-900 font-bold">
                        <span className="flex items-center gap-1">
                          <span>⚡ 12:00 PM – 12:15 PM</span>
                        </span>
                        <span className="text-[9px] font-extrabold bg-amber-200/90 text-amber-900 px-1.5 py-0.2 rounded">
                          BUFFER PROFOTO (15 min)
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-emerald-50/70 p-1.5 text-emerald-900">
                        <span>12:15 PM – 01:15 PM</span>
                        <span className="font-sans font-bold text-emerald-800">Próximo Horario Libre</span>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between border-t border-pink-100/70 pt-2 font-sans">
                      <span className="text-[10px] text-[#7b5965]">¿Qué pasa si intentan agendar a las 12:05 PM?</span>
                      <button
                        type="button"
                        onClick={handleTestBufferCollision}
                        className="rounded-lg bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 hover:bg-amber-200 active:scale-95 transition"
                      >
                        Probar Colisión (12:05)
                      </button>
                    </div>

                    {bufferTestResult && (
                      <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-2 text-[10px] text-amber-950 font-sans">
                        <div className="flex items-center justify-between font-bold">
                          <span>{bufferTestResult.message}</span>
                          <span className="rounded bg-rose-100 text-rose-800 px-1.5 py-0.2 text-[8px]">RECHAZADO</span>
                        </div>
                        <p className="mt-1 font-semibold text-emerald-800">
                          ✓ Alternativa sugerida: <strong>{bufferTestResult.suggestedSlot}</strong>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Package Selector */}
            <div className="rounded-3xl border border-pink-200/80 bg-[#fffdfb] p-3.5 shadow-sm">
              <label className="text-xs font-bold text-[#2d1822]">
                Selecciona tu Paquete Fotográfico:
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => {
                  setSelectedServiceId(e.target.value);
                  fetchScheduleData(selectedDate, e.target.value);
                }}
                className="mt-1.5 w-full rounded-2xl border border-pink-200 bg-pink-50/40 p-2.5 text-xs font-semibold text-[#2d1822] focus:outline-pink-400"
              >
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name} (${svc.price.toLocaleString("es-MX")} MXN • {svc.durationMinutes}m)
                  </option>
                ))}
              </select>

              {selectedServiceObj && (
                <div className="mt-2.5 rounded-2xl bg-[#faf3ec] p-2.5 text-xs text-[#5e3347]">
                  <p className="font-semibold">{selectedServiceObj.description}</p>
                  <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] font-bold text-[#c52752]">
                    <span>⏱ {selectedServiceObj.durationMinutes} minutos</span>
                    <span>💰 ${selectedServiceObj.price.toLocaleString("es-MX")} MXN</span>
                    <span>💳 Anticipo: ${selectedServiceObj.depositAmount.toLocaleString("es-MX")} MXN</span>
                  </div>
                </div>
              )}
            </div>

            {/* Date Picker Carousel (Horizontal Date Buttons) */}
            <div className="rounded-3xl border border-pink-200/80 bg-[#fffdfb] p-3.5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#2d1822] flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#e0446e]" /> Días Abiertos de Estudio:
                </span>
                <span className="text-[10px] font-semibold text-[#7b5965]">Mar–Sáb</span>
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {nextOpenDates.map((dateStr) => {
                  const isSelected = selectedDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => {
                        setSelectedDate(dateStr);
                        fetchScheduleData(dateStr, selectedServiceId);
                      }}
                      className={`flex shrink-0 flex-col items-center justify-center rounded-2xl px-3.5 py-2.5 text-xs transition active:scale-95 ${
                        isSelected
                          ? "bg-gradient-to-r from-[#e0446e] to-[#c52752] text-white shadow-md shadow-pink-500/20 font-bold"
                          : "border border-pink-200 bg-[#faf3ec]/60 text-[#5e3347] hover:bg-pink-50"
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-wide">
                        {formatPrettyDate(dateStr).split(",")[0]}
                      </span>
                      <span className="text-sm font-extrabold">{dateStr.slice(8)}</span>
                      <span className="text-[9px] opacity-80">{dateStr.slice(5, 7)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Real-time Time Slots Grid */}
            <div className="rounded-3xl border border-pink-200/80 bg-[#fffdfb] p-3.5 shadow-sm">
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <h3 className="text-xs font-bold text-[#2d1822]">
                    Horarios Disponibles para el {formatPrettyDate(selectedDate || firstOpenDate)}:
                  </h3>
                  <p className="text-[10px] text-[#7b5965]">
                    Incluye 15m de ajuste de luces Profoto entre sesiones
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fetchScheduleData(selectedDate, selectedServiceId)}
                  className="rounded-xl p-1.5 text-[#7b5965] hover:text-[#e0446e]"
                  title="Actualizar horarios"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>

              {dayAvailability && dayAvailability.availableSlots.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {dayAvailability.availableSlots.map((slot) => (
                    <button
                      key={slot.startTime}
                      type="button"
                      onClick={() => {
                        sendTextMessage(
                          `Hola Camila, aparta mi cita para ${selectedServiceObj?.name || "sesión"} el ${selectedDate} a las ${formatTime12h(slot.startTime)} a nombre de ${formName || "Fernanda Castillo"}, correo ${formEmail || "fernanda.castillo@gmail.com"}`,
                        );
                      }}
                      className="flex items-center justify-between rounded-2xl border border-pink-200/90 bg-[#faf3ec]/50 p-2.5 text-xs font-semibold text-[#2d1822] hover:border-pink-400 hover:bg-pink-50 active:scale-95 transition"
                    >
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#e0446e]" />
                        <span>{formatTime12h(slot.startTime)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] font-mono text-[#a0828c] hidden xs:inline">+15m buffer</span>
                        <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                          Libre
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-amber-50 p-3 text-center text-xs text-amber-800 border border-amber-200">
                  <p className="font-semibold">No hay horarios libres para esta fecha.</p>
                  <button
                    type="button"
                    onClick={() =>
                      sendTextMessage(
                        `Hola Camila, por favor anótame en lista de espera para el ${selectedDate} en cualquier horario disponible.`,
                      )
                    }
                    className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#e0446e] px-3 py-1 text-xs font-bold text-white shadow"
                  >
                    <BellRing className="h-3 w-3" /> Anotarme a Lista de Espera
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: BOOKINGS & WAITLIST MANAGEMENT */}
        {mobileTab === "bookings" && (
          <div id="tour-step-bookings" className="flex flex-col gap-3 scroll-mt-24 sm:scroll-mt-28">
            {/* Studio Owner Financial Executive Bar */}
            <div className="rounded-3xl border border-pink-200/90 bg-gradient-to-br from-[#fffdfb] via-[#fdf2f4] to-[#faebef] p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-[#e0446e]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2d1822]">
                    Panel Financiero del Estudio
                  </span>
                </div>
                <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-[#c52752]">
                  Nogales, Sonora
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                <div className="rounded-2xl bg-white/90 p-2 border border-pink-100 shadow-xs">
                  <span className="text-[10px] text-[#7b5965]">Ingresos Agendados</span>
                  <p className="text-sm font-extrabold text-[#c52752]">
                    ${totalScheduledRevenue.toLocaleString("es-MX")} MXN
                  </p>
                  <span className="text-[9px] text-[#8e7079]">{confirmedAppointments.length} sesiones</span>
                </div>
                <div className="rounded-2xl bg-white/90 p-2 border border-pink-100 shadow-xs">
                  <span className="text-[10px] text-[#7b5965]">Anticipos en Cuenta</span>
                  <p className="text-sm font-extrabold text-emerald-700">
                    ${totalDepositsSecured.toLocaleString("es-MX")} MXN
                  </p>
                  <span className="text-[9px] text-[#8e7079]">Garantía anti no-show</span>
                </div>
                <div className="rounded-2xl bg-white/90 p-2 border border-pink-100 shadow-xs">
                  <span className="text-[10px] text-[#7b5965]">Ticket Promedio</span>
                  <p className="text-sm font-extrabold text-[#2d1822]">
                    ${averageTicket.toLocaleString("es-MX")} MXN
                  </p>
                  <span className="text-[9px] text-[#8e7079]">+42% por add-ons</span>
                </div>
                <div className="rounded-2xl bg-white/90 p-2 border border-pink-100 shadow-xs">
                  <span className="text-[10px] text-[#7b5965]">Tiempo Ahorrado</span>
                  <p className="text-sm font-extrabold text-[#9e193e]">
                    18 hrs/sem
                  </p>
                  <span className="text-[9px] text-[#8e7079]">Cero WhatsApp manual</span>
                </div>
              </div>
            </div>

            {/* Header with Quick Action */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#2d1822]">Citas Confirmadas en Estudio</h2>
                <p className="text-[11px] text-[#7b5965]">
                  {confirmedAppointments.length} sesiones activas • Total: ${totalScheduledRevenue.toLocaleString("es-MX")} MXN
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingDialogOpen(true)}
                className="inline-flex items-center gap-1 rounded-2xl bg-gradient-to-r from-[#e0446e] to-[#c52752] px-3 py-1.5 text-xs font-bold text-white shadow active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" /> Nueva
              </button>
            </div>

            {/* List of Confirmed Appointments */}
            <div className="flex flex-col gap-2.5">
              {appointments.map((apt) => {
                const isCancelled = apt.status === "cancelled";
                return (
                  <div
                    key={apt.id}
                    className={`rounded-3xl border p-3.5 shadow-sm transition ${
                      isCancelled
                        ? "border-slate-200 bg-slate-50/70 opacity-60"
                        : "border-pink-200/90 bg-[#fffdfb]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-pink-100 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#2d1822]">
                            {apt.clientName}
                          </span>
                          <span className="rounded-full bg-pink-100 px-2 py-0.5 font-mono text-[10px] font-extrabold text-[#c52752]">
                            {apt.bookingRef}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#e0446e] mt-0.5">
                          {apt.serviceName}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isCancelled
                            ? "bg-slate-200 text-slate-700"
                            : apt.status === "rescheduled"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {apt.status === "confirmed"
                          ? "Confirmada"
                          : apt.status === "rescheduled"
                            ? "Reprogramada"
                            : "Cancelada"}
                      </span>
                    </div>

                    <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs text-[#5e3347]">
                      <div>
                        <p className="text-[10px] text-[#7b5965]">Fecha &amp; Hora:</p>
                        <p className="font-semibold text-[#2d1822]">
                          {formatPrettyDate(apt.date)}
                        </p>
                        <p className="font-mono text-[11px]">
                          {formatTime12h(apt.startTime)} – {formatTime12h(apt.endTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#7b5965]">Fotógrafo Asignado:</p>
                        <p className="font-semibold text-[#2d1822]">
                          {apt.photographerName || "Sofía Morales"}
                        </p>
                        <p className="text-[11px] font-bold text-[#c52752]">
                          ${apt.price.toLocaleString("es-MX")} MXN
                        </p>
                      </div>
                    </div>

                    {apt.notes && (
                      <p className="mt-2 rounded-xl bg-[#faf3ec] p-2 text-[11px] text-[#7b5965]">
                        <span className="font-bold">Notas:</span> {apt.notes}
                      </p>
                    )}

                    {!isCancelled && (
                      <div className="mt-3 flex items-center justify-end gap-2 border-t border-pink-50 pt-2">
                        <button
                          type="button"
                          onClick={() =>
                            sendTextMessage(
                              `¿Me puedes enviar la guía de preparación y vestuario para la cita ${apt.bookingRef}?`,
                            )
                          }
                          className="rounded-xl border border-pink-200 px-2.5 py-1 text-[11px] font-semibold text-[#7b5965] hover:bg-pink-50"
                        >
                          Guía &amp; Anticipo
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(apt.bookingRef)}
                          className="rounded-xl border border-rose-200 bg-rose-50/50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Live Cancellation & Recovery Demo Callout */}
            <div className="rounded-3xl border border-pink-200/90 bg-[#fffdfb] p-3.5 shadow-sm mt-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-sm">
                    🔄
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-[#2d1822]">
                      Demostración de Auto-Recuperación de Cancelaciones
                    </h4>
                    <p className="text-[11px] text-[#7b5965] mt-0.5 leading-relaxed">
                      Si un cliente cancela, observa cómo la lista de espera de abajo se activa de inmediato en verde (&apos;¡Horario Libre Detectado!&apos;), recuperando $2,800 MXN en un instante.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCancelBooking("JXS-2041")}
                  className="shrink-0 rounded-xl bg-gradient-to-r from-[#e0446e] to-[#c52752] px-2.5 py-1.5 text-[10px] font-bold text-white shadow active:scale-95 transition"
                >
                  Probar Cancelar JXS-2041
                </button>
              </div>
            </div>

            {/* Waitlist Rescue Success Banner */}
            {waitlistRescueMessage && (
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50/90 p-3 text-center text-xs font-bold text-emerald-950 shadow-sm animate-fade-in mt-2">
                {waitlistRescueMessage}
              </div>
            )}

            {/* Priority Waitlist Section */}
            <div className="rounded-3xl border border-pink-200/80 bg-[#fffdfb] p-3.5 shadow-sm mt-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-[#2d1822] flex items-center gap-1.5">
                  <BellRing className="h-3.5 w-3.5 text-[#e0446e]" /> Lista de Espera Prioritaria:
                </h3>
                <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-[#c52752]">
                  {waitlist.length} en espera
                </span>
              </div>

              {waitlist.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {waitlist.map((w) => (
                    <div
                      key={w.id}
                      className="rounded-2xl border border-pink-100 bg-[#fdf2f4]/60 p-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-[#2d1822]">{w.clientName}</span>
                        <span className="font-mono text-[10px] text-[#9e193e]">
                          {w.waitlistRef}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7b5965] mt-0.5">
                        {w.serviceName} • {formatPrettyDate(w.preferredDate)} ({w.preferredTimeWindow})
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span className="font-mono text-[#a0828c]">{w.clientPhone}</span>
                        <span
                          className={`font-bold ${
                            w.status === "slot_opened"
                              ? "text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded"
                              : w.status === "booked"
                                ? "text-emerald-800 bg-emerald-200/80 px-1.5 py-0.5 rounded"
                                : "text-[#c52752]"
                          }`}
                        >
                          {w.status === "slot_opened"
                            ? "¡Horario Libre Detectado!"
                            : w.status === "booked"
                              ? "✓ Cita Reasignada con Éxito"
                              : "Esperando Horario"}
                        </span>
                      </div>

                      {/* Interactive Reassignment Button for the Studio Owner */}
                      {w.status === "slot_opened" && (
                        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-pink-100/80 pt-2">
                          <span className="text-[10px] text-emerald-800 font-bold">
                            ✨ 11:00 AM disponible para reasignar
                          </span>
                          <button
                            type="button"
                            onClick={() => handleReassignWaitlist(w.waitlistRef)}
                            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 px-2.5 py-1 text-[10px] font-extrabold text-white shadow-xs hover:opacity-95 active:scale-95 transition"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Reasignar Cita a {w.clientName.split(" ")[0]} (+$2,800)</span>
                          </button>
                        </div>
                      )}

                      {w.status === "booked" && (
                        <div className="mt-2 rounded-xl bg-emerald-100/90 p-2 text-[10px] font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                          <span>🎉 Cita Rescatada y Confirmada. El estudio recuperó $2,800 MXN en automático.</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-xs text-[#7b5965] py-2">
                  No hay solicitudes en lista de espera actualmente.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: STUDIO PACKAGES, TEAM & BACKDROPS */}
        {mobileTab === "studio" && (
          <div id="tour-step-studio" className="flex flex-col gap-3 scroll-mt-24 sm:scroll-mt-28">
            {/* Studio Introduction */}
            <div className="rounded-3xl border border-pink-200/80 bg-[#fffdfb] p-4 shadow-sm">
              <h2 className="text-sm font-extrabold text-[#2d1822]">
                juntosxsiempre • Estudio Fotográfico
              </h2>
              <p className="text-xs text-[#7b5965] mt-1 leading-relaxed">
                Ubicados en Av. Álvaro Obregón 354, Col. Fundo Legal, 84000 Nogales, Sonora, México. Especialistas en
                retratos editoriales, sesiones de amor y pareja, y momentos inolvidables de familia y quinceañeras con luz natural y ciclorama.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-[#9e193e]">
                <span className="rounded-full bg-pink-100 px-2.5 py-1">📍 Nogales, Sonora</span>
                <span className="rounded-full bg-pink-100 px-2.5 py-1">⚡ Equipo Profoto Pro-11</span>
                <span className="rounded-full bg-pink-100 px-2.5 py-1">🎨 Fondos Artesanales</span>
              </div>
            </div>

            {/* Packages Catalog */}
            <div className="rounded-3xl border border-pink-200/80 bg-[#fffdfb] p-3.5 shadow-sm">
              <h3 className="text-xs font-bold text-[#2d1822] mb-2 flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-[#e0446e]" /> Paquetes de Sesiones:
              </h3>
              <div className="flex flex-col gap-2.5">
                {services.map((svc) => (
                  <div
                    key={svc.id}
                    className="rounded-2xl border border-pink-100 bg-[#faf3ec]/60 p-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-[#2d1822]">{svc.name}</h4>
                        <p className="text-[11px] text-[#7b5965] mt-0.5">{svc.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-extrabold text-[#c52752]">
                          ${svc.price.toLocaleString("es-MX")} MXN
                        </span>
                        <p className="text-[10px] text-[#7b5965]">{svc.durationMinutes} minutos</p>
                      </div>
                    </div>
                    <ul className="mt-2 flex flex-col gap-1 text-[11px] text-[#5e3347] border-t border-pink-100/60 pt-2">
                      {svc.includes.map((inc, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-[#e0446e] shrink-0" />
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedServiceId(svc.id);
                        setMobileTab("calendar");
                      }}
                      className="mt-2.5 w-full rounded-xl bg-gradient-to-r from-[#e0446e] to-[#c52752] py-1.5 text-center text-xs font-bold text-white shadow active:scale-95"
                    >
                      Ver Fechas Disponibles
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Studio Add-Ons Catalog */}
            <div className="rounded-3xl border border-pink-200/80 bg-[#fffdfb] p-3.5 shadow-sm">
              <h3 className="text-xs font-bold text-[#2d1822] mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#e0446e]" /> Complementos Opcionales (Add-Ons):
              </h3>
              <div className="flex flex-col gap-2">
                {addOns.map((add) => (
                  <div
                    key={add.id}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-pink-100 bg-[#fdf2f4]/50 p-2.5 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#2d1822]">{add.name}</p>
                      <p className="text-[10px] text-[#7b5965] mt-0.5">{add.description}</p>
                    </div>
                    <span className="shrink-0 font-extrabold text-[#c52752] text-xs">
                      +${add.price.toLocaleString("es-MX")} MXN
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Photographers Showcase */}
            <div className="rounded-3xl border border-pink-200/80 bg-[#fffdfb] p-3.5 shadow-sm">
              <h3 className="text-xs font-bold text-[#2d1822] mb-2 flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-[#e0446e]" /> Equipo de Fotógrafos:
              </h3>
              <div className="flex flex-col gap-2.5">
                {photographers.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-pink-100 bg-white p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-[#2d1822]">{p.name}</h4>
                      <span className="text-[10px] font-bold text-[#e0446e]">{p.role}</span>
                    </div>
                    <p className="text-[11px] text-[#7b5965] mt-1">{p.bio}</p>
                    <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                      {p.specialties.map((spec, i) => (
                        <span key={i} className="rounded-md bg-pink-50 px-2 py-0.5 text-[#9e193e] font-medium">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Studio Profitability & Margin Matrix for the Owner */}
            <div className="rounded-3xl border border-pink-200/90 bg-gradient-to-br from-[#fffdfb] via-[#fdf2f4] to-[#faebef] p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-[#e0446e]" />
                  <h4 className="font-bold text-xs text-[#2d1822]">
                    Matriz de Rentabilidad por Complemento (Margen Neto)
                  </h4>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800">
                  +78% Margen Promedio
                </span>
              </div>
              <p className="text-[11px] text-[#7b5965] leading-relaxed mb-3">
                Camila recomienda estos 5 add-ons en momentos clave de la conversación según el tipo de cliente. Aumentan drásticamente la ganancia neta por sesión sin elevar costos fijos:
              </p>
              <div className="flex flex-col gap-1.5 font-mono text-[10px]">
                <div className="flex items-center justify-between rounded-xl bg-white p-2 border border-pink-100">
                  <span className="font-semibold text-[#2d1822]">Maquillaje &amp; Peinado Pro</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#c52752] font-bold">+$1,200 MXN</span>
                    <span className="rounded bg-pink-100 text-[#9e193e] px-1.5 py-0.5 font-bold">70% Margen</span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white p-2 border border-pink-100">
                  <span className="font-semibold text-[#2d1822]">Video Reel 4K Vertical</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#c52752] font-bold">+$1,100 MXN</span>
                    <span className="rounded bg-pink-100 text-[#9e193e] px-1.5 py-0.5 font-bold">85% Margen</span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white p-2 border border-pink-100">
                  <span className="font-semibold text-[#2d1822]">5 Fotos Extra con Retoque</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#c52752] font-bold">+$950 MXN</span>
                    <span className="rounded bg-pink-100 text-[#9e193e] px-1.5 py-0.5 font-bold">92% Margen</span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white p-2 border border-pink-100">
                  <span className="font-semibold text-[#2d1822]">Entrega Express 24h</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#c52752] font-bold">+$650 MXN</span>
                    <span className="rounded bg-pink-100 text-[#9e193e] px-1.5 py-0.5 font-bold">95% Margen</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Backdrops Showcase */}
            <div className="rounded-3xl border border-pink-200/80 bg-[#fffdfb] p-3.5 shadow-sm">
              <h3 className="text-xs font-bold text-[#2d1822] mb-2 flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-[#e0446e]" /> Fondos &amp; Sets Disponibles:
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {backdrops.map((bd, i) => (
                  <div
                    key={i}
                    className="flex flex-col justify-between rounded-2xl border border-pink-100 bg-[#faf3ec]/60 p-2.5"
                  >
                    <span className="text-[10px] font-mono text-[#c98894]">Set #{i + 1}</span>
                    <span className="font-semibold text-[#2d1822] mt-1">{bd}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: STUDIO OWNER ROI & VALUE PITCH */}
        {mobileTab === "roi" && (
          <div id="tour-step-roi" className="scroll-mt-24 sm:scroll-mt-28">
            <OwnerPitchSection
              onRunUpsellDemo={() => {
                sendTextMessage(
                  "Quiero cotizar la Sesión Juntos x Siempre agregando Maquillaje y Peinado Profesional y Video Reel 4K Vertical.",
                );
                setMobileTab("chat");
              }}
              onRunBookingDemo={() => {
                handleTestBufferCollision();
                setMobileTab("calendar");
              }}
              onRunWaitlistRecoveryDemo={() => {
                handleCancelBooking("JXS-2041");
                setMobileTab("bookings");
              }}
              onRunPrepGuideDemo={() => {
                sendTextMessage(
                  "¿Me puedes enviar la guía de preparación de vestuario y el enlace de anticipo para la cita JXS-2055?",
                );
                setMobileTab("chat");
              }}
              onRunLateNightDemo={() => {
                sendTextMessage(
                  "Hola, buenas noches! Mi prometido y yo queremos una sesión de pareja para este sábado antes del atardecer. ¿Tienen algún espacio libre y cuánto cuesta?",
                );
                setMobileTab("chat");
              }}
              onOpenSmsWebhook={() => {
                setIsWebhookDialogOpen(true);
              }}
            />
          </div>
        )}
      </main>

      {/* --- Thumb-Optimized Mobile Bottom Dock (Fixed 100% Mobile Priority) --- */}
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-pink-200/80 bg-[#fffdfb]/95 backdrop-blur-xl mobile-safe-bottom">
        <div className="mx-auto flex max-w-md items-center justify-around px-1.5 py-2">
          <button
            type="button"
            onClick={() => setMobileTab("chat")}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-2xl transition active:scale-95 ${
              mobileTab === "chat"
                ? "text-[#e0446e] font-extrabold"
                : "text-[#7b5965] font-medium hover:text-[#2d1822]"
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                mobileTab === "chat" ? "bg-pink-100 shadow-xs" : ""
              }`}
            >
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="text-[10px]">Chat SMS</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab("calendar")}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-2xl transition active:scale-95 ${
              mobileTab === "calendar"
                ? "text-[#e0446e] font-extrabold"
                : "text-[#7b5965] font-medium hover:text-[#2d1822]"
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                mobileTab === "calendar" ? "bg-pink-100 shadow-xs" : ""
              }`}
            >
              <Calendar className="h-4 w-4" />
            </div>
            <span className="text-[10px]">Agenda</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab("bookings")}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-2xl transition active:scale-95 ${
              mobileTab === "bookings"
                ? "text-[#e0446e] font-extrabold"
                : "text-[#7b5965] font-medium hover:text-[#2d1822]"
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                mobileTab === "bookings" ? "bg-pink-100 shadow-xs" : ""
              }`}
            >
              <FileCheck2 className="h-4 w-4" />
            </div>
            <span className="text-[10px]">Citas</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab("studio")}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-2xl transition active:scale-95 ${
              mobileTab === "studio"
                ? "text-[#e0446e] font-extrabold"
                : "text-[#7b5965] font-medium hover:text-[#2d1822]"
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                mobileTab === "studio" ? "bg-pink-100 shadow-xs" : ""
              }`}
            >
              <Camera className="h-4 w-4" />
            </div>
            <span className="text-[10px]">Estudio</span>
          </button>

          {/* Tab 5: Owner Pitch & ROI */}
          <button
            type="button"
            onClick={() => setMobileTab("roi")}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-2xl transition active:scale-95 ${
              mobileTab === "roi"
                ? "text-[#e0446e] font-extrabold"
                : "text-[#7b5965] font-medium hover:text-[#2d1822]"
            }`}
          >
            <div
              className={`relative flex h-8 w-8 items-center justify-center rounded-xl ${
                mobileTab === "roi"
                  ? "bg-gradient-to-tr from-amber-100 to-pink-100 shadow-xs text-[#c52752]"
                  : ""
              }`}
            >
              <Sparkles className="h-4 w-4 text-amber-500 fill-amber-400" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#e0446e] text-[8px] font-black text-white">
                ★
              </span>
            </div>
            <span className="text-[10px]">Ventajas</span>
          </button>
        </div>
      </nav>

      {/* --- DIALOG 0: Owner Pitch & Studio Advantages --- */}
      <LightDismissDialog
        open={isOwnerPitchOpen}
        onClose={() => setIsOwnerPitchOpen(false)}
        title="Ventajas Exclusivas para el Dueño"
        subtitle="Por qué juntosxsiempre multiplica las ventas y la tranquilidad de tu estudio en Nogales, Sonora."
        maxWidthClass="max-w-xl"
      >
        <OwnerPitchSection
          onRunUpsellDemo={() => {
            setIsOwnerPitchOpen(false);
            sendTextMessage(
              "Quiero cotizar la Sesión Juntos x Siempre agregando Maquillaje y Peinado Profesional y Video Reel 4K Vertical.",
            );
            setMobileTab("chat");
          }}
          onRunBookingDemo={() => {
            setIsOwnerPitchOpen(false);
            handleTestBufferCollision();
            setMobileTab("calendar");
          }}
          onRunWaitlistRecoveryDemo={() => {
            setIsOwnerPitchOpen(false);
            handleCancelBooking("JXS-2041");
            setMobileTab("bookings");
          }}
          onRunPrepGuideDemo={() => {
            setIsOwnerPitchOpen(false);
            sendTextMessage(
              "¿Me puedes enviar la guía de preparación de vestuario y el enlace de anticipo para la cita JXS-2055?",
            );
            setMobileTab("chat");
          }}
          onRunLateNightDemo={() => {
            setIsOwnerPitchOpen(false);
            sendTextMessage(
              "Hola, buenas noches! Mi prometido y yo queremos una sesión de pareja para este sábado antes del atardecer. ¿Tienen algún espacio libre y cuánto cuesta?",
            );
            setMobileTab("chat");
          }}
          onOpenSmsWebhook={() => {
            setIsOwnerPitchOpen(false);
            setIsWebhookDialogOpen(true);
          }}
          onCloseModal={() => setIsOwnerPitchOpen(false)}
        />
      </LightDismissDialog>

      {/* --- DIALOG 1: LLM Routing & API Keys --- */}
      <LightDismissDialog
        open={isProviderDialogOpen}
        onClose={() => setIsProviderDialogOpen(false)}
        title="Enrutamiento de IA & Llaves de API"
        subtitle="Configura el modo de operación entre Google Gemini y OpenRouter con conmutación por falla automática."
      >
        <div className="flex flex-col gap-3 text-xs">
          <div>
            <label className="font-bold text-[#2d1822]">Modo de Enrutamiento:</label>
            <select
              value={providerMode}
              onChange={(e) => setProviderMode(e.target.value as ProviderMode)}
              className="mt-1 w-full rounded-2xl border border-pink-200 bg-pink-50/50 p-2.5 font-semibold text-[#2d1822] focus:outline-pink-400"
            >
              <option value="gemini-with-fallback">Gemini Primario ⇄ OpenRouter Fallback</option>
              <option value="openrouter-with-fallback">OpenRouter Primario ⇄ Gemini Fallback</option>
              <option value="gemini-only">Google Gemini Estricto</option>
              <option value="openrouter-only">OpenRouter Estricto</option>
            </select>
            <p className="mt-1 text-[11px] text-[#7b5965]">
              {PROVIDER_MODE_LABELS[providerMode]?.desc}
            </p>
          </div>

          <div className="rounded-2xl border border-pink-100 bg-[#faf3ec] p-3">
            <label className="font-bold text-[#2d1822]">Google Gemini API Key:</label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder={serverKeyStatus.geminiConfigured ? "• Configurada en servidor (.env.local)" : "Pega tu Gemini API Key"}
              className="mt-1 w-full rounded-xl border border-pink-200 bg-white p-2 font-mono text-xs text-[#2d1822]"
            />
          </div>

          <div className="rounded-2xl border border-pink-100 bg-[#faf3ec] p-3">
            <label className="font-bold text-[#2d1822]">OpenRouter API Key:</label>
            <input
              type="password"
              value={openrouterKey}
              onChange={(e) => setOpenrouterKey(e.target.value)}
              placeholder={serverKeyStatus.openrouterConfigured ? "• Configurada en servidor (.env.local)" : "Pega tu OpenRouter API Key"}
              className="mt-1 w-full rounded-xl border border-pink-200 bg-white p-2 font-mono text-xs text-[#2d1822]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-pink-100 bg-[#faf3ec] p-2.5">
              <label className="text-[11px] font-bold text-[#2d1822]">Modelo Gemini:</label>
              <input
                type="text"
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                placeholder="gemini-2.5-flash"
                className="mt-1 w-full rounded-xl border border-pink-200 bg-white p-1.5 font-mono text-[10px] text-[#2d1822]"
              />
            </div>
            <div className="rounded-2xl border border-pink-100 bg-[#faf3ec] p-2.5">
              <label className="text-[11px] font-bold text-[#2d1822]">Modelo OpenRouter:</label>
              <input
                type="text"
                value={openrouterModel}
                onChange={(e) => setOpenrouterModel(e.target.value)}
                placeholder="meta-llama/llama-3.3-70b-instruct"
                className="mt-1 w-full rounded-xl border border-pink-200 bg-white p-1.5 font-mono text-[10px] text-[#2d1822]"
              />
            </div>
          </div>

          {lastTelemetry && (
            <div className="rounded-2xl border border-pink-200 bg-pink-50/70 p-3 text-[11px] text-[#5e3347]">
              <p className="font-bold text-[#9e193e]">Última Telemetría de Ejecución:</p>
              <p>• Proveedor Activo: {lastTelemetry.activeProvider}</p>
              <p>• Latencia: {lastTelemetry.latencyMs} ms</p>
              {lastTelemetry.fallbackTriggered && (
                <p className="text-amber-700 font-bold">
                  ⚠️ Failover Activado: {lastTelemetry.fallbackReason}
                </p>
              )}
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsWebhookDialogOpen(true)}
              className="rounded-2xl border border-pink-200 px-3 py-2 text-xs font-semibold text-[#7b5965] hover:bg-pink-50"
            >
              Simular SMS Webhook
            </button>
            <button
              type="button"
              onClick={() => setIsProviderDialogOpen(false)}
              className="rounded-2xl bg-gradient-to-r from-[#e0446e] to-[#c52752] px-4 py-2 font-bold text-white shadow"
            >
              Guardar &amp; Cerrar
            </button>
          </div>
        </div>
      </LightDismissDialog>

      {/* --- DIALOG 2: Manual Booking Dialog --- */}
      <LightDismissDialog
        open={isBookingDialogOpen}
        onClose={() => setIsBookingDialogOpen(false)}
        title="Nueva Cita Manual en juntosxsiempre"
        subtitle="Registra directamente una cita en la agenda de Nogales, Sonora."
      >
        <form ref={bookingFormRef} onSubmit={handleManualBookingSubmit} className="flex flex-col gap-3 text-xs">
          {formError && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800">
              {formError}
            </div>
          )}

          <div>
            <label className="font-bold text-[#2d1822]">Nombre Completo del Cliente:</label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="ej. Mariana Rivera"
              className="studio-input mt-1 w-full rounded-2xl border border-pink-200 bg-pink-50/40 p-2.5 text-xs text-[#2d1822]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-[#2d1822]">Celular / WhatsApp:</label>
              <input
                type="text"
                required
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+52 55 4910 2831"
                className="studio-input mt-1 w-full rounded-2xl border border-pink-200 bg-pink-50/40 p-2.5 text-xs text-[#2d1822]"
              />
            </div>
            <div>
              <label className="font-bold text-[#2d1822]">Correo Electrónico:</label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="mariana@gmail.com"
                className="studio-input mt-1 w-full rounded-2xl border border-pink-200 bg-pink-50/40 p-2.5 text-xs text-[#2d1822]"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-[#2d1822]">Paquete Fotográfico:</label>
            <select
              value={formService}
              onChange={(e) => setFormService(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-pink-200 bg-pink-50/40 p-2.5 text-xs font-semibold text-[#2d1822]"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (${s.price.toLocaleString("es-MX")} MXN)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-[#2d1822]">Fecha (YYYY-MM-DD):</label>
              <input
                type="date"
                required
                value={formDate || selectedDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="studio-input mt-1 w-full rounded-2xl border border-pink-200 bg-pink-50/40 p-2.5 text-xs text-[#2d1822]"
              />
            </div>
            <div>
              <label className="font-bold text-[#2d1822]">Hora de Inicio:</label>
              <input
                type="text"
                required
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                placeholder="11:00"
                className="studio-input mt-1 w-full rounded-2xl border border-pink-200 bg-pink-50/40 p-2.5 text-xs text-[#2d1822]"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-[#2d1822]">Notas &amp; Preferencias:</label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Fondo rosa pastel, sesión de compromiso..."
              rows={2}
              className="mt-1 w-full rounded-2xl border border-pink-200 bg-pink-50/40 p-2.5 text-xs text-[#2d1822]"
            />
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsBookingDialogOpen(false)}
              className="rounded-2xl border border-pink-200 px-3 py-2 text-xs font-semibold text-[#7b5965]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-gradient-to-r from-[#e0446e] to-[#c52752] px-4 py-2 font-bold text-white shadow"
            >
              Confirmar Reserva
            </button>
          </div>
        </form>
      </LightDismissDialog>

      {/* --- DIALOG 3: SMS Webhook Simulator --- */}
      <LightDismissDialog
        open={isWebhookDialogOpen}
        onClose={() => setIsWebhookDialogOpen(false)}
        title="Simulador de Webhook SMS / Twilio"
        subtitle="Prueba cómo responde el endpoint /api/webhook/sms ante mensajes entrantes en formato TwiML XML o JSON."
      >
        <div className="flex flex-col gap-3 text-xs">
          <p className="text-[#7b5965]">
            Envía una petición POST simulada con payload de SMS entrante para verificar la generación de respuestas compatibles con Twilio.
          </p>
          <button
            type="button"
            onClick={handleTestSmsWebhook}
            disabled={isTestingWebhook}
            className="rounded-2xl bg-gradient-to-r from-[#e0446e] to-[#c52752] py-2.5 text-center font-bold text-white shadow"
          >
            {isTestingWebhook ? "Consultando Agente SMS..." : "Disparar Webhook de Prueba"}
          </button>

          {webhookTestOutput && (
            <div className="rounded-2xl border border-pink-200 bg-[#faf3ec] p-3">
              <span className="font-bold text-[#9e193e]">Respuesta del Servidor (TwiML XML):</span>
              <pre className="mt-1 max-h-48 overflow-auto font-mono text-[10px] text-[#2d1822]">
                {webhookTestOutput}
              </pre>
            </div>
          )}
        </div>
      </LightDismissDialog>

      {/* --- DIALOG 4: Demo Reset Dialog --- */}
      <LightDismissDialog
        open={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        title="Reiniciar Demo juntosxsiempre"
        subtitle="Restaura la agenda, clientes semilla y conversaciones al estado inicial del estudio."
      >
        <div className="flex flex-col gap-3 text-xs">
          <p className="text-[#7b5965]">
            Esto restablecerá las 4 citas iniciales en Nogales, Sonora, la lista de espera con Lucía Benítez y el historial de chat con Camila.
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => setIsResetDialogOpen(false)}
              className="rounded-2xl border border-pink-200 px-3 py-2 font-semibold text-[#7b5965]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleFullReset}
              disabled={isResetting}
              className="rounded-2xl bg-gradient-to-r from-[#e0446e] to-[#c52752] px-4 py-2 font-bold text-white shadow"
            >
              {isResetting ? "Restaurando..." : "Sí, Reiniciar Demo"}
            </button>
          </div>
        </div>
      </LightDismissDialog>

      {/* --- Guided Tour Overlay --- */}
      <GuidedTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        currentStepIndex={tourStepIndex}
        onStepChange={(idx) => setTourStepIndex(idx)}
        onSelectTab={(tab) => setMobileTab(tab)}
        steps={tourSteps}
      />
    </div>
  );
}
