"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  BellRing,
  Bot,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
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
  Sparkles,
  Wrench,
} from "lucide-react";
import type {
  Appointment,
  ChatTurnMessage,
  ConversationSession,
  DayAvailability,
  ProviderMode,
  ProviderTelemetry,
  StudioAddOn,
  StudioPhotographer,
  StudioService,
  WaitlistEntry,
} from "@/lib/studio/types";
import { formatPrettyDate, formatTime12h } from "@/lib/calendar/dateUtils";
import { LightDismissDialog } from "./LightDismissDialog";

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

type MobileTab = "chat" | "calendar" | "bookings" | "studio";

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
      text: "¡Hola! 🌸 Soy Camila, Coordinadora de Citas de **juntosxsiempre**, estudio fotográfico en Roma Norte, CDMX.\n\nEscríbeme por aquí para consultar fechas y horarios disponibles, cotizar paquetes con maquillaje o reels de video, y reservar tu sesión. ¿En qué podemos inspirarte hoy?",
      timestamp: "initial",
    },
  ]);

  // Dialog states
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);
  const [isWebhookDialogOpen, setIsWebhookDialogOpen] = useState(false);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
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
          text: "¡Hola! 🌸 Soy Camila, Coordinadora de Citas de **juntosxsiempre**, estudio fotográfico en Roma Norte, CDMX.\n\nEscríbeme por aquí para consultar fechas y horarios disponibles, cotizar paquetes con maquillaje o reels de video, y reservar tu sesión. ¿En qué podemos inspirarte hoy?",
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
    await fetch("/api/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "status",
        bookingRef,
        status: "cancelled",
      }),
    });
    fetchScheduleData(selectedDate, selectedServiceId);
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
  const firstOpenDate = nextOpenDates[0] || selectedDate || "2026-11-10";
  const secondOpenDate = nextOpenDates[1] || firstOpenDate;

  const quickPrompts = [
    {
      icon: "🌸",
      label: "Disponibilidad",
      text: "¿Qué fechas y horarios tienen disponibles para sesión de pareja en juntosxsiempre?",
    },
    {
      icon: "✨",
      label: "Cotizar con Maquillaje",
      text: "Quiero cotizar la Sesión Juntos x Siempre agregando Maquillaje y Peinado Profesional y Entrega Express 24h.",
    },
    {
      icon: "📸",
      label: "Fotógrafos & Sets",
      text: "¿Quiénes son los fotógrafos del estudio y qué fondos tienen disponibles en Roma Norte?",
    },
    {
      icon: "⚡",
      label: "Agendar Cita",
      text: `Deseo agendar la Sesión Juntos x Siempre para el ${firstOpenDate} a las 11:30 AM a nombre de Mariana Rivera, correo mariana.rivera@gmail.com`,
    },
    {
      icon: "💎",
      label: "Mejorar Cita JXS-2041",
      text: "Para mi reservación JXS-2041, ¿podemos agregar 5 Fotos Extra con Retoque Fino y solicitar a Sofía Morales?",
    },
    {
      icon: "📋",
      label: "Guía de Vestuario",
      text: "¿Me puedes enviar la guía de preparación de vestuario y el enlace de anticipo para la cita JXS-2055?",
    },
    {
      icon: "🔔",
      label: "Lista de Espera",
      text: `Por favor anótame en lista de espera para el ${firstOpenDate} por la mañana para sesión de pareja. Soy Lucía Benítez, correo lucia.benitez@outlook.com`,
    },
    {
      icon: "🗓️",
      label: "Reprogramar JXS-2041",
      text: `¿Puedo reprogramar mi cita JXS-2041 para el ${secondOpenDate} a las 3:00 PM?`,
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
        <div className="mx-auto flex max-w-md items-center justify-between px-3.5 py-2.5">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#e0446e] via-[#f06a8f] to-[#f8cfda] text-white shadow-md shadow-pink-500/25">
              <Camera className="h-5 w-5 stroke-[2.2]" />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white ring-2 ring-white">
                ✓
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-extrabold tracking-tight text-[#2d1822]">
                  juntosxsiempre
                </h1>
                <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-[#c52752]">
                  CDMX
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#7b5965] flex items-center gap-1">
                <MapPin className="h-3 w-3 text-[#e0446e]" /> Roma Norte • Estudio Fotográfico
              </p>
            </div>
          </div>

          {/* Action Pills */}
          <div className="flex items-center gap-1.5">
            {/* Quick Provider Pill */}
            <button
              type="button"
              onClick={() => setIsProviderDialogOpen(true)}
              className="inline-flex items-center gap-1 rounded-xl border border-pink-200 bg-pink-50/70 px-2.5 py-1.5 text-xs font-semibold text-[#9e193e] active:scale-95 transition"
              title="Configuración de IA & API Keys"
            >
              <Cpu className="h-3.5 w-3.5 text-[#e0446e]" />
              <span>{PROVIDER_MODE_LABELS[providerMode]?.shortBadge}</span>
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
              <p className="text-sm font-bold text-[#2d1822]">Roma Norte</p>
              <p className="text-[9px] text-[#8e7079]">Valet parking</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Main Mobile Viewports (Switched via Bottom Nav) --- */}
      <main className="mx-auto max-w-md px-3 pt-2 pb-12">
        {/* TAB 1: SMS / CHAT COORDINATOR (CAMILA) */}
        {mobileTab === "chat" && (
          <div className="flex flex-col gap-3">
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
          <div className="flex flex-col gap-3">
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
                    Incluye 15m de ajuste y ambientación entre sesiones
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
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                        Libre
                      </span>
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
          <div className="flex flex-col gap-3">
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
                              : "text-[#c52752]"
                          }`}
                        >
                          {w.status === "slot_opened"
                            ? "¡Horario Libre Detectado!"
                            : "Esperando Horario"}
                        </span>
                      </div>
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
          <div className="flex flex-col gap-3">
            {/* Studio Introduction */}
            <div className="rounded-3xl border border-pink-200/80 bg-[#fffdfb] p-4 shadow-sm">
              <h2 className="text-sm font-extrabold text-[#2d1822]">
                juntosxsiempre • Estudio Fotográfico
              </h2>
              <p className="text-xs text-[#7b5965] mt-1 leading-relaxed">
                Ubicados en Álvaro Obregón 168, Roma Norte, Ciudad de México. Especialistas en
                retratos editoriales, sesiones de amor y pareja, y momentos inolvidables de familia y quinceañeras con luz natural y ciclorama.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-[#9e193e]">
                <span className="rounded-full bg-pink-100 px-2.5 py-1">📍 Roma Norte, CDMX</span>
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
      </main>

      {/* --- Thumb-Optimized Mobile Bottom Dock (Fixed 100% Mobile Priority) --- */}
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-pink-200/80 bg-[#fffdfb]/95 backdrop-blur-xl mobile-safe-bottom">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
          <button
            type="button"
            onClick={() => setMobileTab("chat")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition active:scale-95 ${
              mobileTab === "chat"
                ? "text-[#e0446e] font-extrabold"
                : "text-[#7b5965] font-medium hover:text-[#2d1822]"
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                mobileTab === "chat" ? "bg-pink-100 shadow-sm" : ""
              }`}
            >
              <MessageSquare className="h-4 w-4" />
            </div>
            <span className="text-[10px]">Chat SMS</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab("calendar")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition active:scale-95 ${
              mobileTab === "calendar"
                ? "text-[#e0446e] font-extrabold"
                : "text-[#7b5965] font-medium hover:text-[#2d1822]"
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                mobileTab === "calendar" ? "bg-pink-100 shadow-sm" : ""
              }`}
            >
              <Calendar className="h-4 w-4" />
            </div>
            <span className="text-[10px]">Agenda</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab("bookings")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition active:scale-95 ${
              mobileTab === "bookings"
                ? "text-[#e0446e] font-extrabold"
                : "text-[#7b5965] font-medium hover:text-[#2d1822]"
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                mobileTab === "bookings" ? "bg-pink-100 shadow-sm" : ""
              }`}
            >
              <FileCheck2 className="h-4 w-4" />
            </div>
            <span className="text-[10px]">Citas</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab("studio")}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition active:scale-95 ${
              mobileTab === "studio"
                ? "text-[#e0446e] font-extrabold"
                : "text-[#7b5965] font-medium hover:text-[#2d1822]"
            }`}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                mobileTab === "studio" ? "bg-pink-100 shadow-sm" : ""
              }`}
            >
              <Camera className="h-4 w-4" />
            </div>
            <span className="text-[10px]">Estudio</span>
          </button>
        </div>
      </nav>

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
        subtitle="Registra directamente una cita en la agenda de Roma Norte."
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
            Esto restablecerá las 4 citas iniciales en Roma Norte, la lista de espera con Lucía Benítez y el historial de chat con Camila.
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
    </div>
  );
}
