"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  BellRing,
  Bot,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Cpu,
  DollarSign,
  FileCheck2,
  KeyRound,
  Layers,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Users,
  Wrench,
  XCircle,
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
    badge: "Gemini Primary ⇄ OpenRouter",
    shortBadge: "Gemini ⇄ OR",
    desc: "Uses Google Gemini first; automatically fails over to OpenRouter on rate-limit or error.",
  },
  "openrouter-with-fallback": {
    label: "OpenRouter → Gemini Fallback",
    badge: "OpenRouter Primary ⇄ Gemini",
    shortBadge: "OR ⇄ Gemini",
    desc: "Uses OpenRouter first; automatically fails over to Google Gemini on error.",
  },
  "gemini-only": {
    label: "Google Gemini Only",
    badge: "Gemini Strict",
    shortBadge: "Gemini",
    desc: "Routes strictly through Google Gemini (@google/genai).",
  },
  "openrouter-only": {
    label: "OpenRouter Only",
    badge: "OpenRouter Strict",
    shortBadge: "OpenRouter",
    desc: "Routes strictly through OpenRouter API.",
  },
};

type MobileTab = "chat" | "calendar" | "bookings";
type StudioPanelTab = "all" | "calendar" | "bookings" | "team";

export function ScheduleAgentWorkspace() {
  const [services, setServices] = useState<StudioService[]>([]);
  const [addOns, setAddOns] = useState<StudioAddOn[]>([]);
  const [photographers, setPhotographers] = useState<StudioPhotographer[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("headshot-express");
  const [dayAvailability, setDayAvailability] = useState<DayAvailability | null>(null);
  const [weekAvailability, setWeekAvailability] = useState<DayAvailability[]>([]);
  const [nextOpenDates, setNextOpenDates] = useState<string[]>([]);

  // Responsive navigation states
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const [studioPanelTab, setStudioPanelTab] = useState<StudioPanelTab>("all");

  // Provider configuration state (seamless switch)
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
  const [clientPhone, setClientPhone] = useState<string>("(555) 019-2834");
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [llmHistory, setLlmHistory] = useState<ConversationSession["history"]>([]);
  const [messages, setMessages] = useState<ChatTurnMessage[]>([
    {
      id: "welcome-msg",
      role: "assistant",
      text: "Hi! 👋 I'm Maya, the AI Booking Coordinator at Lumina Portrait & Creative Studio.\n\nText me anytime to check available photo shoot bookings, calculate custom quotes with add-ons, or book/reschedule a session. How can I help you today?",
      timestamp: "initial",
    },
  ]);

  // Dialog states
  const [isProviderDialogOpen, setIsProviderDialogOpen] = useState(false);
  const [isWebhookDialogOpen, setIsWebhookDialogOpen] = useState(false);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [webhookTestOutput, setWebhookTestOutput] = useState<string>("");
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  // Manual booking form states
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("(555) 482-9104");
  const [formEmail, setFormEmail] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("11:00");
  const [formService, setFormService] = useState("headshot-express");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const bookingFormRef = useRef<HTMLFormElement>(null);
  const msgSeqRef = useRef<number>(1);
  const formIdPrefix = useId();

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
      setAppointments(data.appointments || []);
      setWaitlist(data.waitlist || []);
      setDayAvailability(data.selectedDateAvailability || null);
      setWeekAvailability(data.weekAvailability || []);
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
    fetch("/api/appointments?serviceId=headshot-express")
      .then((r) => r.json())
      .then((data) => {
        if (!active || !data) return;
        setServices(data.services || []);
        setAddOns(data.addOns || []);
        setPhotographers(data.photographers || []);
        setAppointments(data.appointments || []);
        setWaitlist(data.waitlist || []);
        setDayAvailability(data.selectedDateAvailability || null);
        setWeekAvailability(data.weekAvailability || []);
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

  // Initialize validate-input-after-interaction ARIA sync & WeakMap fallback on the booking form
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

    // On mobile, switch to the SMS chat view so the user sees the live response immediately
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
          sessionId: "web-pilot-session",
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
          text: `Connection error: ${errMsg}`,
          timestamp: `err-${msgSeqRef.current}`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleResetDemo = async () => {
    await fetch("/api/agent/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: "web-pilot-session", resetSession: true }),
    });
    await fetch("/api/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    });
    msgSeqRef.current += 1;
    setLlmHistory([]);
    setMessages([
      {
        id: `welcome-${msgSeqRef.current}`,
        role: "assistant",
        text: "Session & studio calendar reset to fresh demo state! How can I help schedule your shoot today?",
        timestamp: `reset-${msgSeqRef.current}`,
      },
    ]);
    fetchScheduleData();
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
      setFormError(data.error || "Could not create appointment.");
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
          From: "+15550199988",
          Body: `Hi! What headshot slots do you have open on ${nextOpenDates[0] || selectedDate}?`,
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
  const openedWaitlistCount = waitlist.filter((w) => w.status === "slot_opened").length;
  const hasAnyLiveKey =
    Boolean(geminiKey.trim()) ||
    Boolean(openrouterKey.trim()) ||
    serverKeyStatus.geminiConfigured ||
    serverKeyStatus.openrouterConfigured;

  const firstOpenDate = nextOpenDates[0] || selectedDate || "2026-10-29";
  const secondOpenDate = nextOpenDates[1] || firstOpenDate;

  const quickPrompts = [
    {
      icon: "✨",
      label: "Available Bookings",
      text: `Can you check what bookings are available for portraits this week?`,
    },
    {
      icon: "💰",
      label: "Quote + Add-Ons",
      text: "Can you calculate a quote for a Signature Portrait with Hair & Makeup and 24-Hour Rush Delivery?",
    },
    {
      icon: "📸",
      label: "Photographers & Spaces",
      text: "Who are your studio photographers and what backdrops do you have available?",
    },
    {
      icon: "⚡",
      label: "Instant Book",
      text: `Please book an Express Headshot on ${firstOpenDate} at 11:30 AM for Jordan Taylor, email jordan.taylor@studio.co`,
    },
    {
      icon: "💎",
      label: "Upgrade LUM-2041",
      text: "For my booking LUM-2041, can we add 5 Extra Retouched Digitals and request Elena Vance?",
    },
    {
      icon: "📋",
      label: "Prep & Deposit Link",
      text: "Can you send me the prep checklist and deposit link for booking LUM-2055?",
    },
    {
      icon: "🔔",
      label: "Join Waitlist",
      text: `Can you put me on the waitlist for an Express Headshot on ${firstOpenDate} morning? I'm Alex Kim, email alex@kim.co`,
    },
    {
      icon: "🗓️",
      label: "Reschedule LUM-2041",
      text: `Can I reschedule booking LUM-2041 to ${secondOpenDate} at 3:00 PM?`,
    },
  ];

  const selectedServiceObj =
    services.find((s) => s.id === selectedServiceId) || services[0];

  return (
    <div className="min-h-dvh bg-[#08090d] bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(245,158,11,0.10),transparent_70%)] pb-20 text-slate-100 lg:pb-8">
      {/* Sleek Mobile-First Top App Bar */}
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#0b0d14]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3.5 py-2.5 sm:px-6 sm:py-3">
          {/* Brand Identity */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 text-slate-950 shadow-lg shadow-amber-500/20 sm:h-10 sm:w-10">
              <Camera className="h-4 w-4 stroke-[2.25] sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="studio-hero-title whitespace-nowrap font-bold tracking-tight text-white">
                  Lumina Studio
                </h1>
                <span className="hidden rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-300 sm:inline-block">
                  AI SMS Coordinator
                </span>
              </div>
              <p className="hidden truncate text-[11px] text-slate-400 sm:block">
                Portrait &amp; Editorial Booking Agent • 11 Live Tools
              </p>
            </div>
          </div>

          {/* Right Action Controls — Compact on Mobile, Full on Desktop */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Desktop Inline Provider Selector */}
            <div className="hidden items-center gap-1.5 rounded-xl border border-white/10 bg-[#131724] px-2.5 py-1.5 md:flex">
              <Cpu className="h-3.5 w-3.5 text-amber-400" />
              <label htmlFor="provider-mode-select" className="sr-only">
                Select LLM Provider Mode
              </label>
              <select
                id="provider-mode-select"
                value={providerMode}
                onChange={(e) => setProviderMode(e.target.value as ProviderMode)}
                className="bg-transparent text-xs font-medium text-slate-100 focus:outline-none"
              >
                <option value="gemini-with-fallback" className="bg-[#131724]">
                  Gemini Primary ⇄ OpenRouter
                </option>
                <option value="openrouter-with-fallback" className="bg-[#131724]">
                  OpenRouter Primary ⇄ Gemini
                </option>
                <option value="gemini-only" className="bg-[#131724]">
                  Google Gemini Only
                </option>
                <option value="openrouter-only" className="bg-[#131724]">
                  OpenRouter Only
                </option>
              </select>
            </div>

            {/* LLM Routing / API Keys Pill Button */}
            <button
              type="button"
              onClick={() => setIsProviderDialogOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 text-xs font-medium text-slate-200 transition hover:bg-white/10 active:scale-[0.98]"
              title="Configure LLM Provider & API Keys"
            >
              <KeyRound className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[11px] font-semibold md:hidden">Models</span>
              <span className="hidden md:inline">Models &amp; Keys</span>
              <span
                className={`h-2 w-2 rounded-full ${
                  hasAnyLiveKey
                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                    : "bg-amber-400"
                }`}
              />
            </button>

            {/* Webhook Inspector Button */}
            <button
              type="button"
              onClick={() => setIsWebhookDialogOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 text-xs font-medium text-slate-200 transition hover:bg-white/10 active:scale-[0.98]"
              title="Twilio SMS Webhook Inspector"
            >
              <Code2 className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Webhook</span>
            </button>

            {/* New Booking CTA */}
            <button
              type="button"
              onClick={() => {
                setFormDate(selectedDate || firstOpenDate);
                setIsBookingDialogOpen(true);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/15 transition hover:from-amber-400 hover:to-orange-400 active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Book</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Responsive Workspace Grid */}
      <main className="mx-auto max-w-7xl px-3 pt-3 sm:px-6 sm:pt-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
          {/* =====================================================================
              LEFT COLUMN (5 cols on lg): iPhone-Style AI SMS Coordinator
              Visible on mobile when mobileTab === "chat", always visible on lg+
             ===================================================================== */}
          <section
            aria-label="Client SMS Text Simulator"
            className={`${
              mobileTab === "chat" ? "flex" : "hidden lg:flex"
            } flex-col lg:sticky lg:top-20 lg:col-span-5`}
          >
            <div className="flex h-[calc(100dvh-8.4rem)] min-h-[480px] flex-col overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0e111b] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] lg:h-[calc(100dvh-6.5rem)] lg:max-h-[820px]">
              {/* Phone Top Bezel & Coordinator Persona Header */}
              <div className="border-b border-white/[0.08] bg-gradient-to-b from-[#161b2c] to-[#121624] px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-indigo-500/20 ring-1 ring-amber-400/30">
                      <Sparkles className="h-4 w-4 text-amber-300" />
                      <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#121624] bg-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-xs font-bold text-white sm:text-sm">
                          Maya • Studio AI
                        </h2>
                        <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-300">
                          SMS Live
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                        <Phone className="h-2.5 w-2.5 text-amber-400/80" />
                        <span>Client:</span>
                        <input
                          type="tel"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          aria-label="Simulated Client Phone Number"
                          className="w-26 rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-slate-200 focus:ring-1 focus:ring-amber-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetDemo}
                    className="inline-flex h-8 items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 text-[11px] font-medium text-slate-300 transition hover:bg-white/10 active:scale-95"
                    title="Reset conversation and demo bookings"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Single-Row Horizontal Swipeable 1-Click Prompts Rail */}
                <div className="mt-2.5 border-t border-white/[0.06] pt-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold uppercase tracking-wider text-slate-400">
                      Try 1-Tap Client Texts
                    </span>
                    <span className="text-[10px] text-slate-500">Swipe →</span>
                  </div>
                  <div className="no-scrollbar mt-1.5 flex snap-x snap-mandatory items-center gap-1.5 overflow-x-auto pb-0.5">
                    {quickPrompts.map((qp) => (
                      <button
                        key={qp.label}
                        type="button"
                        disabled={isSending}
                        onClick={() => sendTextMessage(qp.text)}
                        className="inline-flex shrink-0 snap-start items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/[0.09] px-3 py-1.5 text-[11px] font-medium text-amber-100 transition hover:border-amber-400/50 hover:bg-amber-500/20 active:scale-95 disabled:opacity-40"
                      >
                        <span aria-hidden="true">{qp.icon}</span>
                        <span>{qp.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SMS Messages Scroll Area */}
              <div className="flex-1 space-y-3.5 overflow-y-auto px-3.5 py-4 sm:px-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    {/* Sender Micro-Label */}
                    <span className="mb-1 px-1 text-[10px] font-medium text-slate-500">
                      {msg.role === "user" ? `Client (${clientPhone})` : "Maya • Lumina Studio"}
                    </span>

                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                        msg.role === "user"
                          ? "rounded-br-xs bg-gradient-to-br from-amber-500 to-orange-600 font-medium text-slate-950"
                          : "rounded-bl-xs border border-white/[0.09] bg-[#161b2b] text-slate-100"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>

                    {/* Compact Collapsible Tool & Provider Telemetry Drawer */}
                    {msg.role === "assistant" &&
                      (msg.telemetry ||
                        (msg.toolExecutions && msg.toolExecutions.length > 0)) && (
                        <details className="group mt-1.5 w-full max-w-[90%] rounded-xl border border-white/[0.07] bg-[#0a0c14]/90 px-3 py-1.5 text-[11px] text-slate-400">
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 select-none">
                            <div className="flex flex-wrap items-center gap-2">
                              {msg.toolExecutions && msg.toolExecutions.length > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                                  <Wrench className="h-2.5 w-2.5" />
                                  {msg.toolExecutions.length} tool
                                  {msg.toolExecutions.length > 1 ? "s" : ""} run
                                </span>
                              )}
                              {msg.telemetry && (
                                <span className="inline-flex items-center gap-1 truncate text-[10px] font-medium text-indigo-300">
                                  <Bot className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{msg.telemetry.activeProvider}</span>
                                </span>
                              )}
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-slate-500">
                              {msg.telemetry ? `${msg.telemetry.latencyMs}ms` : "Inspect"}
                              <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
                            </span>
                          </summary>

                          <div className="mt-2 space-y-1.5 border-t border-white/[0.06] pt-2">
                            {msg.telemetry?.fallbackTriggered && (
                              <div className="rounded-lg bg-amber-500/10 px-2 py-1 text-[10px] text-amber-300">
                                ⚡ Failover active: {msg.telemetry.fallbackReason}
                              </div>
                            )}

                            {msg.toolExecutions?.map((t) => (
                              <div
                                key={t.id}
                                className="rounded-lg border border-white/5 bg-white/[0.02] p-2"
                              >
                                <div className="font-mono text-[10px] font-semibold text-emerald-300">
                                  {t.toolName}({Object.keys(t.args || {}).join(", ")})
                                </div>
                                <pre className="mt-1 max-h-32 overflow-auto rounded bg-black/50 p-1.5 font-mono text-[9px] text-slate-300">
                                  {JSON.stringify(
                                    { args: t.args, result: t.result },
                                    null,
                                    2,
                                  )}
                                </pre>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                  </div>
                ))}

                {isSending && (
                  <div className="flex items-center gap-2.5 rounded-2xl border border-white/5 bg-[#151928] px-3.5 py-2.5 text-xs text-slate-300">
                    <div className="h-2 w-2 animate-ping rounded-full bg-amber-400" />
                    <span>
                      Maya is checking studio availability (
                      {PROVIDER_MODE_LABELS[providerMode].shortBadge})...
                    </span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* SMS Input Composer */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendTextMessage();
                }}
                className="border-t border-white/[0.08] bg-[#121624] p-2.5 sm:p-3"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Text Maya (e.g. 'What portrait slots are open?')"
                    disabled={isSending}
                    className="h-10 flex-1 rounded-2xl border border-white/10 bg-[#090b12] px-3.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none sm:text-[13px]"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !inputMessage.trim()}
                    aria-label="Send SMS message"
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/15 transition hover:from-amber-400 hover:to-orange-400 active:scale-95 disabled:opacity-40"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* =====================================================================
              RIGHT COLUMN (7 cols on lg): Studio Command Center
              On mobile, switches cleanly between "calendar" and "bookings" tabs
             ===================================================================== */}
          <section
            aria-label="Studio Operations & Live Schedule"
            className={`${
              mobileTab === "chat" ? "hidden lg:flex" : "flex"
            } flex-col gap-4 lg:col-span-7`}
          >
            {/* Compact 4-Card KPI Strip (Semantic <article> cards per `card` guide) */}
            <div className="kpi-card-container grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
              <article className="rounded-2xl border border-white/[0.08] bg-[#10131f] p-3.5 shadow-sm">
                <header className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                  <span>Confirmed Shoots</span>
                  <Calendar className="h-3.5 w-3.5 text-amber-400" />
                </header>
                <p className="studio-kpi-value mt-1.5 font-bold text-white">
                  {confirmedAppointments.length}
                </p>
                <p className="mt-0.5 text-[10px] text-emerald-400">
                  Live SMS sync active
                </p>
              </article>

              <article className="rounded-2xl border border-white/[0.08] bg-[#10131f] p-3.5 shadow-sm">
                <header className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                  <span>Booked Revenue</span>
                  <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                </header>
                <p className="studio-kpi-value mt-1.5 font-bold text-white">
                  ${totalScheduledRevenue.toLocaleString()}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {services.length} packages + 5 add-ons
                </p>
              </article>

              <article className="rounded-2xl border border-white/[0.08] bg-[#10131f] p-3.5 shadow-sm">
                <header className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                  <span>Open Slots ({selectedDate.slice(5) || "Today"})</span>
                  <Clock className="h-3.5 w-3.5 text-cyan-400" />
                </header>
                <p className="studio-kpi-value mt-1.5 font-bold text-white">
                  {dayAvailability?.availableSlots.length ?? 0}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-slate-400">
                  {dayAvailability?.isOpen
                    ? dayAvailability.operatingHours
                    : "Studio Closed"}
                </p>
              </article>

              <article className="rounded-2xl border border-white/[0.08] bg-[#10131f] p-3.5 shadow-sm">
                <header className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                  <span>Waitlist Queue</span>
                  <BellRing className="h-3.5 w-3.5 text-amber-400" />
                </header>
                <p className="studio-kpi-value mt-1.5 font-bold text-white">
                  {waitlist.length}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-amber-300">
                  {openedWaitlistCount > 0
                    ? `${openedWaitlistCount} slot alert triggered!`
                    : "Auto-notifies on cancel"}
                </p>
              </article>
            </div>

            {/* Desktop Sub-Navigation Filter Pill Bar (keeps desktop uncluttered too) */}
            <div className="hidden items-center justify-between gap-2 rounded-2xl border border-white/[0.08] bg-[#10131f] p-1.5 lg:flex">
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: "all", label: "All Views", icon: Layers },
                    {
                      id: "calendar",
                      label: `Live Slots (${dayAvailability?.availableSlots.length ?? 0})`,
                      icon: Calendar,
                    },
                    {
                      id: "bookings",
                      label: `Bookings (${appointments.length})`,
                      icon: CheckCircle2,
                    },
                    {
                      id: "team",
                      label: `Waitlist & Team (${waitlist.length})`,
                      icon: Users,
                    },
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  const active = studioPanelTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStudioPanelTab(tab.id)}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                        active
                          ? "bg-amber-500 text-slate-950 shadow-sm"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <span className="hidden truncate pr-2 text-[11px] text-slate-400 xl:inline">
                {lastTelemetry
                  ? `${lastTelemetry.activeProvider} (${lastTelemetry.latencyMs}ms)`
                  : PROVIDER_MODE_LABELS[providerMode].badge}
              </span>
            </div>

            {/* =================================================================
                PANEL A: Interactive Day & Slot Availability Explorer
                Visible on mobile when mobileTab === "calendar",
                and on desktop when studioPanelTab is "all" or "calendar"
               ================================================================= */}
            <div
              className={`${
                mobileTab === "calendar" ? "block" : "hidden"
              } ${
                studioPanelTab === "all" || studioPanelTab === "calendar"
                  ? "lg:block"
                  : "lg:hidden"
              } rounded-3xl border border-white/[0.09] bg-[#10131f] p-4 shadow-lg sm:p-5`}
            >
              <div className="flex flex-col gap-3 border-b border-white/[0.08] pb-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white sm:text-base">
                      Live Studio Availability Explorer
                    </h2>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                      Real-Time
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Tap any open time slot to send an instant booking request via SMS
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="explorer-service-select" className="sr-only">
                    Select Photography Package
                  </label>
                  <select
                    id="explorer-service-select"
                    value={selectedServiceId}
                    onChange={(e) => {
                      const nextSvc = e.target.value;
                      setSelectedServiceId(nextSvc);
                      fetchScheduleData(selectedDate, nextSvc);
                    }}
                    className="h-9 w-full rounded-xl border border-white/10 bg-[#171c2d] px-3 text-xs font-medium text-slate-100 focus:border-amber-400 focus:outline-none sm:w-auto"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#171c2d]">
                        {s.shortName} ({s.durationMinutes}m • ${s.price})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Horizontal Touch-Friendly 7-Day Date Strip */}
              <div className="no-scrollbar mt-3.5 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-7 sm:gap-1.5">
                {weekAvailability.map((day) => {
                  const isSelected = day.date === selectedDate;
                  return (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => {
                        setSelectedDate(day.date);
                        fetchScheduleData(day.date, selectedServiceId);
                      }}
                      className={`flex min-w-[74px] shrink-0 snap-start flex-col items-center justify-center rounded-2xl border px-2.5 py-2.5 text-center transition active:scale-95 sm:min-w-0 ${
                        isSelected
                          ? "border-amber-400 bg-gradient-to-b from-amber-500/25 to-amber-500/10 text-white shadow-md shadow-amber-500/10"
                          : day.isOpen
                            ? "border-white/[0.08] bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]"
                            : "border-white/[0.04] bg-white/[0.01] text-slate-500"
                      }`}
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wider">
                        {day.dayName.slice(0, 3)}
                      </span>
                      <span className="mt-0.5 text-xs font-bold sm:text-sm">
                        {day.date.slice(5)}
                      </span>
                      <span
                        className={`mt-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                          !day.isOpen
                            ? "bg-slate-800/80 text-slate-400"
                            : day.availableSlots.length > 0
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {day.isOpen ? `${day.availableSlots.length} open` : "Closed"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Package Context Pill */}
              {selectedServiceObj && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-amber-300">
                      {selectedServiceObj.name}
                    </span>
                    <span className="text-slate-400">
                      • {selectedServiceObj.durationMinutes} mins • $
                      {selectedServiceObj.price} (${selectedServiceObj.depositAmount} deposit)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {formatPrettyDate(selectedDate || firstOpenDate)}
                  </span>
                </div>
              )}

              {/* Tactile Time Slots Grid */}
              <div className="slot-grid-container mt-3.5">
                {!dayAvailability?.isOpen ? (
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center text-xs text-slate-400">
                    Lumina Studio is closed on {dayAvailability?.dayName}s (
                    {selectedDate}). Tap any Tuesday–Saturday date card above to browse
                    open photo shoot slots.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {dayAvailability.allSlots.map((slot) => (
                      <button
                        key={slot.startTime}
                        type="button"
                        disabled={!slot.available || isSending}
                        onClick={() => {
                          const svc = services.find((s) => s.id === selectedServiceId);
                          sendTextMessage(
                            `Can I book the ${svc?.name || "Portrait Session"} on ${selectedDate} at ${formatTime12h(
                              slot.startTime,
                            )}? My name is Sam Morgan and my email is sam@morgan.co`,
                          );
                        }}
                        className={`group flex min-h-[56px] flex-col items-start justify-between rounded-2xl border px-3.5 py-2.5 text-left text-xs transition active:scale-[0.98] ${
                          slot.available
                            ? "border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-100 hover:border-emerald-400 hover:bg-emerald-500/20"
                            : "cursor-not-allowed border-white/[0.06] bg-white/[0.02] text-slate-500"
                        }`}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-[13px] font-bold">
                            {formatTime12h(slot.startTime)}
                          </span>
                          {slot.available ? (
                            <span className="h-2 w-2 rounded-full bg-emerald-400 transition group-hover:scale-125" />
                          ) : (
                            <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-slate-400">
                              {slot.conflictRef}
                            </span>
                          )}
                        </div>
                        <span className="mt-1 text-[10px] opacity-85">
                          {slot.available
                            ? "Open • Tap to SMS Book"
                            : "Reserved Session"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* =================================================================
                PANEL B: Studio Appointments Schedule (Responsive Table + Cards)
                Visible on mobile when mobileTab === "bookings",
                and on desktop when studioPanelTab is "all" or "bookings"
               ================================================================= */}
            <div
              className={`${
                mobileTab === "bookings" ? "block" : "hidden"
              } ${
                studioPanelTab === "all" || studioPanelTab === "bookings"
                  ? "lg:block"
                  : "lg:hidden"
              } rounded-3xl border border-white/[0.09] bg-[#10131f] p-4 shadow-lg sm:p-5`}
            >
              <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-white sm:text-base">
                    Studio Appointments Schedule
                  </h2>
                  <p className="text-xs text-slate-400">
                    Synced in real time with SMS bookings, upgrades, and cancellations
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-200">
                    {appointments.length} Bookings
                  </span>
                </div>
              </div>

              <div
                tabIndex={0}
                role="region"
                aria-labelledby="appointments-table-caption"
                className="table-wrapper"
              >
                <table className="studio-table text-left text-xs">
                  <caption id="appointments-table-caption" className="sr-only">
                    Upcoming photo studio appointments and client bookings
                  </caption>
                  <thead>
                    <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="px-3.5 py-3">Client / Ref</th>
                      <th className="px-3.5 py-3">Package &amp; Add-Ons</th>
                      <th className="px-3.5 py-3">Schedule</th>
                      <th className="px-3.5 py-3">Contact</th>
                      <th className="px-3.5 py-3">Status</th>
                      <th className="px-3.5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {appointments.map((apt) => (
                      <tr
                        key={apt.id}
                        className="transition hover:bg-white/[0.02]"
                      >
                        <th className="px-3.5 py-3 font-medium text-white">
                          <div className="flex items-center justify-between gap-2 sm:justify-start">
                            <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                              {apt.bookingRef}
                            </span>
                            <span className="font-semibold">{apt.clientName}</span>
                          </div>
                          {apt.photographerName && (
                            <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-slate-400">
                              <Camera className="h-3 w-3 text-amber-400" />
                              <span>{apt.photographerName}</span>
                            </div>
                          )}
                        </th>
                        <td className="px-3.5 py-3 text-slate-200">
                          <div>
                            <div className="font-medium">{apt.serviceName}</div>
                            <div className="text-[11px] text-slate-400">
                              {apt.durationMinutes}m • ${apt.price}
                            </div>
                            {apt.addOns && apt.addOns.length > 0 && (
                              <div className="mt-1 flex flex-wrap justify-end gap-1 sm:justify-start">
                                {apt.addOns.map((addonId) => {
                                  const foundAddon = addOns.find(
                                    (a) => a.id === addonId || a.name === addonId,
                                  );
                                  return (
                                    <span
                                      key={addonId}
                                      className="rounded-md bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-medium text-violet-300"
                                    >
                                      +{foundAddon ? foundAddon.name : addonId}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3.5 py-3 text-slate-200">
                          <div>
                            <div className="font-medium">
                              {formatPrettyDate(apt.date)}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {formatTime12h(apt.startTime)} –{" "}
                              {formatTime12h(apt.endTime)}
                            </div>
                          </div>
                        </td>
                        <td className="px-3.5 py-3 text-slate-300">
                          <div>
                            <div>{apt.clientPhone}</div>
                            <div className="truncate text-[11px] text-slate-400">
                              {apt.clientEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-3.5 py-3">
                          <div className="flex flex-col items-end gap-1 sm:items-start">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                apt.status === "confirmed"
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : apt.status === "rescheduled"
                                    ? "bg-cyan-500/15 text-cyan-300"
                                    : "bg-rose-500/15 text-rose-300"
                              }`}
                            >
                              {apt.status === "confirmed" && (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                              {apt.status === "cancelled" && (
                                <XCircle className="h-3 w-3" />
                              )}
                              {apt.status}
                            </span>
                            {apt.prepGuideSent && (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-medium text-amber-300">
                                <FileCheck2 className="h-2.5 w-2.5" />
                                Prep &amp; Deposit Sent
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3.5 py-3 text-right">
                          {apt.status !== "cancelled" && (
                            <div className="inline-flex items-center gap-1.5">
                              {!apt.prepGuideSent && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    sendTextMessage(
                                      `Can you send the prep checklist and deposit link for booking ${apt.bookingRef}?`,
                                    )
                                  }
                                  className="inline-flex items-center gap-1 rounded-xl border border-amber-500/25 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-medium text-amber-200 transition hover:bg-amber-500/20"
                                  title={`Send Prep Guide for ${apt.bookingRef}`}
                                >
                                  <FileCheck2 className="h-3 w-3" />
                                  <span>Prep</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleCancelBooking(apt.bookingRef)}
                                className="inline-flex items-center gap-1 rounded-xl border border-rose-500/25 bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-medium text-rose-300 transition hover:bg-rose-500/20"
                                title={`Cancel ${apt.bookingRef}`}
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Cancel</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* =================================================================
                PANEL C: Priority Waitlist & Studio Creative Team / Add-Ons
                Visible on mobile when mobileTab === "bookings",
                and on desktop when studioPanelTab is "all" or "team"
               ================================================================= */}
            <div
              className={`${
                mobileTab === "bookings" ? "grid" : "hidden"
              } ${
                studioPanelTab === "all" || studioPanelTab === "team"
                  ? "lg:grid"
                  : "lg:hidden"
              } grid-cols-1 gap-4 md:grid-cols-2`}
            >
              {/* Priority Waitlist Card */}
              <article className="rounded-3xl border border-white/[0.09] bg-[#10131f] p-4 shadow-lg sm:p-5">
                <header className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-amber-400" />
                    <h2 className="text-sm font-bold text-white">
                      Priority Waitlist Queue
                    </h2>
                  </div>
                  <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300">
                    {waitlist.length} Active
                  </span>
                </header>
                <p className="mb-3 text-xs text-slate-400">
                  Auto-alerts waitlisted clients when a booking on their requested date is cancelled.
                </p>
                <div className="space-y-2.5">
                  {waitlist.map((wl) => (
                    <div
                      key={wl.id}
                      className="flex items-center justify-between gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                            {wl.waitlistRef}
                          </span>
                          <span className="truncate font-semibold text-white">
                            {wl.clientName}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-[11px] text-slate-400">
                          {wl.serviceName} • {formatPrettyDate(wl.preferredDate)} (
                          {wl.preferredTimeWindow})
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${
                          wl.status === "slot_opened"
                            ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {wl.status === "slot_opened" ? "Slot Opened!" : "Waiting"}
                      </span>
                    </div>
                  ))}
                </div>
              </article>

              {/* Studio Creative Team & Add-On Upgrades Card */}
              <article className="rounded-3xl border border-white/[0.09] bg-[#10131f] p-4 shadow-lg sm:p-5">
                <header className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-amber-400" />
                    <h2 className="text-sm font-bold text-white">
                      Photographers &amp; Add-Ons
                    </h2>
                  </div>
                  <span className="rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-300">
                    3 Studios
                  </span>
                </header>
                <div className="space-y-2">
                  {photographers.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-white">
                          {p.name}{" "}
                          <span className="font-normal text-slate-400">
                            • {p.role}
                          </span>
                        </div>
                        <div className="truncate text-[10px] text-slate-400">
                          {p.specialties.join(" • ")}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-lg bg-white/5 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                        {p.assignedRoom.split("—")[0].trim()}
                      </span>
                    </div>
                  ))}
                  <div className="pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Tap an Add-On to Quote via SMS
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {addOns.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() =>
                          sendTextMessage(
                            `Can you give me a quote for a Signature Portrait with ${a.name}?`,
                          )
                        }
                        className="rounded-xl border border-violet-500/25 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-200 transition hover:bg-violet-500/20 active:scale-95"
                      >
                        {a.name} (+${a.price})
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>
      </main>

      {/* =====================================================================
          MOBILE BOTTOM NAVIGATION BAR (lg:hidden)
          Provides native app ergonomics on phones without vertical scroll fatigue
         ===================================================================== */}
      <nav
        aria-label="Mobile Workspace Navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0b0d14]/95 px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setMobileTab("chat")}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl py-2 text-xs font-semibold transition active:scale-95 ${
              mobileTab === "chat"
                ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="relative">
              <MessageSquare className="h-4 w-4" />
              <span className="absolute -top-1 -right-2 h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <span className="text-[11px]">SMS Agent</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab("calendar")}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl py-2 text-xs font-semibold transition active:scale-95 ${
              mobileTab === "calendar"
                ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="relative">
              <Calendar className="h-4 w-4" />
              <span className=" -top-1.5 -right-3.5 absolute rounded-full bg-emerald-500/20 px-1 text-[9px] font-bold text-emerald-300">
                {dayAvailability?.availableSlots.length ?? 0}
              </span>
            </div>
            <span className="text-[11px]">Live Slots</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab("bookings")}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl py-2 text-xs font-semibold transition active:scale-95 ${
              mobileTab === "bookings"
                ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="relative">
              <Users className="h-4 w-4" />
              <span className="-top-1.5 -right-3.5 absolute rounded-full bg-amber-500/20 px-1 text-[9px] font-bold text-amber-300">
                {confirmedAppointments.length}
              </span>
            </div>
            <span className="text-[11px]">Bookings &amp; Team</span>
          </button>
        </div>
      </nav>

      {/* DIALOG 1: Seamless Multi-LLM Provider & API Key Switcher */}
      <LightDismissDialog
        open={isProviderDialogOpen}
        onClose={() => setIsProviderDialogOpen(false)}
        title="Multi-LLM Routing & Model Overrides"
        subtitle="Seamlessly switch between Google Gemini and OpenRouter with automatic failover."
      >
        <div className="space-y-4 text-xs">
          <div>
            <label
              htmlFor="dialog-provider-mode"
              className="block font-medium text-slate-200"
            >
              Active Routing Strategy
            </label>
            <select
              id="dialog-provider-mode"
              value={providerMode}
              onChange={(e) => setProviderMode(e.target.value as ProviderMode)}
              className="mt-1.5 h-10 w-full rounded-xl border border-white/15 bg-[#171b2b] px-3 text-xs text-white focus:border-amber-400 focus:outline-none"
            >
              {Object.entries(PROVIDER_MODE_LABELS).map(([key, info]) => (
                <option key={key} value={key} className="bg-[#171b2b]">
                  {info.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-slate-400">
              {PROVIDER_MODE_LABELS[providerMode].desc}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Google Gemini</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    geminiKey || serverKeyStatus.geminiConfigured
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {geminiKey
                    ? "Runtime Key"
                    : serverKeyStatus.geminiConfigured
                      ? "Env Key Active"
                      : "Not Set"}
                </span>
              </div>
              <label
                htmlFor="gemini-api-key-input"
                className="mt-2 block text-[11px] text-slate-400"
              >
                GEMINI_API_KEY (Optional runtime override)
              </label>
              <input
                id="gemini-api-key-input"
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="mt-1 h-9 w-full rounded-xl border border-white/10 bg-[#0c0e17] px-2.5 text-xs text-white"
              />
              <label
                htmlFor="gemini-model-input"
                className="mt-2 block text-[11px] text-slate-400"
              >
                Model Override (default: gemini-3.1-flash-lite-preview)
              </label>
              <input
                id="gemini-model-input"
                type="text"
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                placeholder="gemini-2.5-flash"
                className="mt-1 h-9 w-full rounded-xl border border-white/10 bg-[#0c0e17] px-2.5 text-xs text-white"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">OpenRouter</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    openrouterKey || serverKeyStatus.openrouterConfigured
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {openrouterKey
                    ? "Runtime Key"
                    : serverKeyStatus.openrouterConfigured
                      ? "Env Key Active"
                      : "Not Set"}
                </span>
              </div>
              <label
                htmlFor="openrouter-api-key-input"
                className="mt-2 block text-[11px] text-slate-400"
              >
                OPENROUTER_API_KEY (Optional runtime override)
              </label>
              <input
                id="openrouter-api-key-input"
                type="password"
                value={openrouterKey}
                onChange={(e) => setOpenrouterKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="mt-1 h-9 w-full rounded-xl border border-white/10 bg-[#0c0e17] px-2.5 text-xs text-white"
              />
              <label
                htmlFor="openrouter-model-input"
                className="mt-2 block text-[11px] text-slate-400"
              >
                Model Override (e.g. openai/gpt-4o-mini)
              </label>
              <input
                id="openrouter-model-input"
                type="text"
                value={openrouterModel}
                onChange={(e) => setOpenrouterModel(e.target.value)}
                placeholder="openai/gpt-4o-mini"
                className="mt-1 h-9 w-full rounded-xl border border-white/10 bg-[#0c0e17] px-2.5 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsProviderDialogOpen(false)}
              className="h-10 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 text-xs font-bold text-slate-950 sm:w-auto"
            >
              Save &amp; Apply Routing
            </button>
          </div>
        </div>
      </LightDismissDialog>

      {/* DIALOG 2: Inbound SMS Webhook Inspector */}
      <LightDismissDialog
        open={isWebhookDialogOpen}
        onClose={() => setIsWebhookDialogOpen(false)}
        title="Twilio / SMS Webhook Integration"
        subtitle="Connect your Vercel deployment directly to Twilio or any SMS gateway."
        maxWidthClass="max-w-xl"
      >
        <div className="space-y-4 text-xs">
          <div className="rounded-2xl border border-white/10 bg-[#0c0e17] p-3.5">
            <p className="font-semibold text-amber-300">
              Webhook Endpoint URL (POST):
            </p>
            <code className="mt-1.5 block overflow-x-auto rounded-lg bg-black/50 px-2.5 py-2 font-mono text-[11px] text-emerald-300">
              https://schedule-agent-gold.vercel.app/api/webhook/sms
            </code>
            <p className="mt-2 text-[11px] text-slate-400">
              Accepts standard Twilio{" "}
              <code className="text-slate-200">
                application/x-www-form-urlencoded
              </code>{" "}
              (<code className="text-slate-200">From</code> &amp;{" "}
              <code className="text-slate-200">Body</code>) and returns TwiML XML, or{" "}
              <code className="text-slate-200">application/json</code>.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-slate-200">
              Live TwiML Webhook Response Test:
            </span>
            <button
              type="button"
              disabled={isTestingWebhook}
              onClick={handleTestSmsWebhook}
              className="h-9 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 text-xs font-bold text-slate-950 disabled:opacity-50"
            >
              {isTestingWebhook
                ? "Testing /api/webhook/sms..."
                : "Simulate Twilio POST"}
            </button>
          </div>

          {webhookTestOutput && (
            <pre className="max-h-48 overflow-auto rounded-2xl border border-white/10 bg-black/60 p-3 font-mono text-[11px] text-cyan-300">
              {webhookTestOutput}
            </pre>
          )}
        </div>
      </LightDismissDialog>

      {/* DIALOG 3: Manual Studio Booking Modal (validate-input-after-interaction) */}
      <LightDismissDialog
        open={isBookingDialogOpen}
        onClose={() => setIsBookingDialogOpen(false)}
        title="Create Studio Appointment"
        subtitle="Add a manual client booking directly onto the studio calendar."
      >
        <form
          ref={bookingFormRef}
          onSubmit={handleManualBookingSubmit}
          className="space-y-3.5 text-xs"
        >
          <div className="field">
            <label
              htmlFor={`${formIdPrefix}-name`}
              className="block font-medium text-slate-200"
            >
              Client Full Name
            </label>
            <span id={`${formIdPrefix}-name-hint`} className="field-hint">
              Enter first and last name (at least 2 characters)
            </span>
            <input
              id={`${formIdPrefix}-name`}
              type="text"
              required
              minLength={2}
              autoComplete="name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              aria-describedby={`${formIdPrefix}-name-hint`}
              aria-errormessage={`${formIdPrefix}-name-err`}
              className="studio-input h-10 w-full rounded-xl border border-white/15 bg-[#0c0e17] px-3 text-xs text-white focus:outline-none"
            />
            <div id={`${formIdPrefix}-name-err`} className="error-msg">
              <span aria-hidden="true">❌ </span>Please enter the client&apos;s full name.
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="field">
              <label
                htmlFor={`${formIdPrefix}-email`}
                className="block font-medium text-slate-200"
              >
                Email Address
              </label>
              <span id={`${formIdPrefix}-email-hint`} className="field-hint">
                Format: client@example.com
              </span>
              <input
                id={`${formIdPrefix}-email`}
                type="email"
                required
                autoComplete="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                aria-describedby={`${formIdPrefix}-email-hint`}
                aria-errormessage={`${formIdPrefix}-email-err`}
                className="studio-input h-10 w-full rounded-xl border border-white/15 bg-[#0c0e17] px-3 text-xs text-white focus:outline-none"
              />
              <div id={`${formIdPrefix}-email-err`} className="error-msg">
                <span aria-hidden="true">❌ </span>Please enter a valid email address.
              </div>
            </div>

            <div className="field">
              <label
                htmlFor={`${formIdPrefix}-phone`}
                className="block font-medium text-slate-200"
              >
                Phone Number
              </label>
              <span id={`${formIdPrefix}-phone-hint`} className="field-hint">
                Format: (555) 234-5678
              </span>
              <input
                id={`${formIdPrefix}-phone`}
                type="tel"
                required
                pattern="[\d\s\-\+\(\)]{7,20}"
                autoComplete="tel"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                aria-describedby={`${formIdPrefix}-phone-hint`}
                aria-errormessage={`${formIdPrefix}-phone-err`}
                className="studio-input h-10 w-full rounded-xl border border-white/15 bg-[#0c0e17] px-3 text-xs text-white focus:outline-none"
              />
              <div id={`${formIdPrefix}-phone-err`} className="error-msg">
                <span aria-hidden="true">❌ </span>Please enter a valid phone number.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label
                htmlFor={`${formIdPrefix}-service`}
                className="block font-medium text-slate-200"
              >
                Package
              </label>
              <select
                id={`${formIdPrefix}-service`}
                value={formService}
                onChange={(e) => setFormService(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-white/15 bg-[#0c0e17] px-2.5 text-xs text-white"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#0c0e17]">
                    {s.shortName} (${s.price})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor={`${formIdPrefix}-date`}
                className="block font-medium text-slate-200"
              >
                Shoot Date
              </label>
              <input
                id={`${formIdPrefix}-date`}
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-white/15 bg-[#0c0e17] px-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label
                htmlFor={`${formIdPrefix}-time`}
                className="block font-medium text-slate-200"
              >
                Start Time
              </label>
              <input
                id={`${formIdPrefix}-time`}
                type="time"
                required
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-white/15 bg-[#0c0e17] px-2.5 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor={`${formIdPrefix}-notes`}
              className="block font-medium text-slate-200"
            >
              Session Notes (Optional)
            </label>
            <input
              id={`${formIdPrefix}-notes`}
              type="text"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Backdrop preferences, wardrobe notes..."
              className="mt-1 h-10 w-full rounded-xl border border-white/15 bg-[#0c0e17] px-3 text-xs text-white"
            />
          </div>

          {formError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-rose-300">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsBookingDialogOpen(false)}
              className="h-10 rounded-xl border border-white/10 px-4 text-xs text-slate-300 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 text-xs font-bold text-slate-950"
            >
              Confirm Studio Booking
            </button>
          </div>
        </form>
      </LightDismissDialog>
    </div>
  );
}
