"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  Code2,
  Cpu,
  DollarSign,
  KeyRound,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Wrench,
  XCircle,
  Zap,
} from "lucide-react";
import type {
  Appointment,
  ChatTurnMessage,
  ConversationSession,
  DayAvailability,
  ProviderMode,
  ProviderTelemetry,
  StudioService,
} from "@/lib/studio/types";
import { formatPrettyDate, formatTime12h } from "@/lib/calendar/dateUtils";
import { LightDismissDialog } from "./LightDismissDialog";

const PROVIDER_MODE_LABELS: Record<
  ProviderMode,
  { label: string; badge: string; desc: string }
> = {
  "gemini-with-fallback": {
    label: "Gemini → OpenRouter Fallback",
    badge: "Gemini Primary",
    desc: "Uses Google Gemini first; automatically fails over to OpenRouter on rate-limit or error.",
  },
  "openrouter-with-fallback": {
    label: "OpenRouter → Gemini Fallback",
    badge: "OpenRouter Primary",
    desc: "Uses OpenRouter first; automatically fails over to Google Gemini on error.",
  },
  "gemini-only": {
    label: "Google Gemini Only",
    badge: "Gemini Strict",
    desc: "Routes strictly through Google Gemini (@google/genai).",
  },
  "openrouter-only": {
    label: "OpenRouter Only",
    badge: "OpenRouter Strict",
    desc: "Routes strictly through OpenRouter API.",
  },
};

export function ScheduleAgentWorkspace() {
  const [services, setServices] = useState<StudioService[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("headshot-express");
  const [dayAvailability, setDayAvailability] = useState<DayAvailability | null>(null);
  const [weekAvailability, setWeekAvailability] = useState<DayAvailability[]>([]);
  const [nextOpenDates, setNextOpenDates] = useState<string[]>([]);

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
      text: "Hi! 👋 I'm Maya, the AI Booking Coordinator at Lumina Portrait & Creative Studio.\n\nText me anytime to check open photo shoot slots, see package pricing, or book/reschedule an appointment. How can I help you today?",
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
      setAppointments(data.appointments || []);
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
        setAppointments(data.appointments || []);
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
  const hasAnyLiveKey =
    Boolean(geminiKey.trim()) ||
    Boolean(openrouterKey.trim()) ||
    serverKeyStatus.geminiConfigured ||
    serverKeyStatus.openrouterConfigured;

  const firstOpenDate = nextOpenDates[0] || selectedDate || "2026-10-29";
  const secondOpenDate = nextOpenDates[1] || firstOpenDate;

  const quickPrompts = [
    {
      label: "Pricing & Packages",
      text: "Hi! What photography packages and prices do you offer?",
    },
    {
      label: "Check Open Slots",
      text: `What times do you have available for an Express Headshot on ${firstOpenDate}?`,
    },
    {
      label: "Instant Book Test",
      text: `Please book an Express Headshot on ${firstOpenDate} at 11:30 AM for Jordan Taylor, email jordan.taylor@studio.co`,
    },
    {
      label: "Lookup LUM-2041",
      text: "Can you check the status of my booking LUM-2041?",
    },
    {
      label: "Reschedule LUM-2041",
      text: `Can I reschedule booking LUM-2041 to ${secondOpenDate} at 3:00 PM?`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0c0e17]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white sm:text-lg">
                  Lumina Studio
                </h1>
                <span className="rounded-full border border-indigo-500/30 bg-indigo-500/15 px-2.5 py-0.5 text-[11px] font-medium text-indigo-300">
                  AI SMS Schedule Agent
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-LLM Appointment Coordinator (`@llm-multi-provider/core`) • Vercel Ready
              </p>
            </div>
          </div>

          {/* Seamless Provider Switcher & Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#141724] px-3 py-1.5">
              <Cpu className="h-4 w-4 text-indigo-400" />
              <label htmlFor="provider-mode-select" className="sr-only">
                Select LLM Provider Mode
              </label>
              <select
                id="provider-mode-select"
                value={providerMode}
                onChange={(e) => setProviderMode(e.target.value as ProviderMode)}
                className="bg-transparent text-xs font-medium text-slate-100 focus:outline-none"
              >
                <option value="gemini-with-fallback" className="bg-[#141724]">
                  Gemini Primary ⇄ OpenRouter Fallback
                </option>
                <option value="openrouter-with-fallback" className="bg-[#141724]">
                  OpenRouter Primary ⇄ Gemini Fallback
                </option>
                <option value="gemini-only" className="bg-[#141724]">
                  Google Gemini Only
                </option>
                <option value="openrouter-only" className="bg-[#141724]">
                  OpenRouter Only
                </option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsProviderDialogOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
            >
              <KeyRound className="h-3.5 w-3.5 text-amber-400" />
              <span>API Keys</span>
              <span
                className={`ml-1 h-2 w-2 rounded-full ${
                  hasAnyLiveKey ? "bg-emerald-400" : "bg-amber-400"
                }`}
                title={
                  hasAnyLiveKey
                    ? "Live LLM API key configured"
                    : "Using built-in Smart Demo Engine (add key for live LLM)"
                }
              />
            </button>

            <button
              type="button"
              onClick={() => setIsWebhookDialogOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
            >
              <Code2 className="h-3.5 w-3.5 text-cyan-400" />
              <span>SMS Webhook</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFormDate(selectedDate || firstOpenDate);
                setIsBookingDialogOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Booking</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12">
        {/* LEFT COLUMN: Client Text / SMS Simulator (5 cols) */}
        <section className="flex flex-col gap-4 lg:col-span-5">
          <div className="flex h-[680px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111420] shadow-xl">
            {/* Simulator Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-[#161a29] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Client SMS Text Simulator
                  </h2>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Phone className="h-3 w-3" />
                    <span>From:</span>
                    <input
                      type="text"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      aria-label="Simulated Client Phone Number"
                      className="w-28 rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetDemo}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 transition hover:bg-white/10"
                title="Reset conversation and seed appointments"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Quick Scenario Prompts */}
            <div className="border-b border-white/5 bg-[#121522] px-3 py-2">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                1-Click Client Texts:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((qp) => (
                  <button
                    key={qp.label}
                    type="button"
                    disabled={isSending}
                    onClick={() => sendTextMessage(qp.text)}
                    className="rounded-lg border border-indigo-500/25 bg-indigo-500/10 px-2 py-1 text-[11px] font-medium text-indigo-200 transition hover:bg-indigo-500/20 disabled:opacity-50"
                  >
                    {qp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SMS Conversation Thread */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "rounded-br-xs bg-indigo-600 text-white"
                        : "rounded-bl-xs border border-white/10 bg-[#1a1f30] text-slate-100"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>

                  {/* Provider & Tool Execution Telemetry Pill */}
                  {msg.role === "assistant" &&
                    (msg.telemetry ||
                      (msg.toolExecutions && msg.toolExecutions.length > 0)) && (
                      <div className="mt-1.5 w-full max-w-[92%] space-y-1.5 rounded-xl border border-white/10 bg-[#0d101a] p-2.5 text-[11px]">
                        {msg.telemetry && (
                          <div className="flex flex-wrap items-center justify-between gap-2 text-slate-400">
                            <span className="inline-flex items-center gap-1 font-medium text-indigo-300">
                              <Bot className="h-3 w-3" />
                              {msg.telemetry.activeProvider}
                            </span>
                            <span>{msg.telemetry.latencyMs}ms</span>
                          </div>
                        )}

                        {msg.telemetry?.fallbackTriggered && (
                          <div className="rounded bg-amber-500/10 px-2 py-1 text-[10px] text-amber-300">
                            ⚡ Failover active: {msg.telemetry.fallbackReason}
                          </div>
                        )}

                        {msg.toolExecutions && msg.toolExecutions.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                              <Wrench className="h-3 w-3" />
                              <span>
                                Agent Tools Executed ({msg.toolExecutions.length})
                              </span>
                            </div>
                            {msg.toolExecutions.map((t) => (
                              <details
                                key={t.id}
                                className="group rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5"
                              >
                                <summary className="cursor-pointer list-none font-mono text-[11px] text-emerald-300">
                                  <span className="font-semibold">{t.toolName}</span>(
                                  {Object.keys(t.args || {}).join(", ")})
                                </summary>
                                <pre className="mt-1.5 max-h-36 overflow-auto rounded bg-black/40 p-2 font-mono text-[10px] text-slate-300">
                                  {JSON.stringify(
                                    { args: t.args, result: t.result },
                                    null,
                                    2,
                                  )}
                                </pre>
                              </details>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                </div>
              ))}

              {isSending && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="h-2 w-2 animate-ping rounded-full bg-indigo-400" />
                  <span>
                    Maya is checking studio availability (
                    {PROVIDER_MODE_LABELS[providerMode].badge})...
                  </span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* SMS Composer Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendTextMessage();
              }}
              className="border-t border-white/10 bg-[#151826] p-3"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Send a text as a studio client..."
                  disabled={isSending}
                  className="flex-1 rounded-xl border border-white/10 bg-[#0d101a] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSending || !inputMessage.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* RIGHT COLUMN: Live Studio Calendar & Appointments Dashboard (7 cols) */}
        <section className="flex flex-col gap-6 lg:col-span-7">
          {/* KPI Metrics Row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-[#111420] p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Confirmed Shoots</span>
                <Calendar className="h-4 w-4 text-indigo-400" />
              </div>
              <p className="mt-2 text-2xl font-bold text-white">
                {confirmedAppointments.length}
              </p>
              <p className="mt-0.5 text-[11px] text-emerald-400">
                Live synced with SMS agent
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#111420] p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Booked Revenue</span>
                <DollarSign className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="mt-2 text-2xl font-bold text-white">
                ${totalScheduledRevenue.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Across {services.length} studio packages
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#111420] p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Open Slots ({selectedDate.slice(5)})</span>
                <Clock className="h-4 w-4 text-cyan-400" />
              </div>
              <p className="mt-2 text-2xl font-bold text-white">
                {dayAvailability?.availableSlots.length ?? 0}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {dayAvailability?.isOpen
                  ? dayAvailability.operatingHours
                  : "Studio Closed"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#111420] p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>LLM Provider Mode</span>
                <Zap className="h-4 w-4 text-amber-400" />
              </div>
              <p className="mt-2 truncate text-sm font-bold text-white">
                {PROVIDER_MODE_LABELS[providerMode].badge}
              </p>
              <p className="mt-1 truncate text-[11px] text-indigo-300">
                {lastTelemetry
                  ? lastTelemetry.activeProvider
                  : PROVIDER_MODE_LABELS[providerMode].label}
              </p>
            </div>
          </div>

          {/* Interactive Day & Slot Availability Explorer */}
          <div className="rounded-2xl border border-white/10 bg-[#111420] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Studio Slot Availability Explorer
                </h2>
                <p className="text-xs text-slate-400">
                  Click any open time slot to simulate a client booking text or reserve it
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="explorer-service-select" className="sr-only">
                  Package for slot calculation
                </label>
                <select
                  id="explorer-service-select"
                  value={selectedServiceId}
                  onChange={(e) => {
                    const nextSvc = e.target.value;
                    setSelectedServiceId(nextSvc);
                    fetchScheduleData(selectedDate, nextSvc);
                  }}
                  className="rounded-xl border border-white/10 bg-[#171b2b] px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#171b2b]">
                      {s.shortName} ({s.durationMinutes}m • ${s.price})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 7-Day Date Strip */}
            <div className="mt-4 grid grid-cols-7 gap-1.5">
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
                    className={`flex flex-col items-center rounded-xl border p-2 text-center transition ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-600/20 text-white"
                        : day.isOpen
                          ? "border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/10"
                          : "border-white/5 bg-white/[0.01] text-slate-500"
                    }`}
                  >
                    <span className="text-[10px] font-medium uppercase">
                      {day.dayName.slice(0, 3)}
                    </span>
                    <span className="mt-0.5 text-xs font-bold">
                      {day.date.slice(5)}
                    </span>
                    <span
                      className={`mt-1 rounded-full px-1.5 py-0.2 text-[9px] font-medium ${
                        !day.isOpen
                          ? "bg-slate-800 text-slate-400"
                          : day.availableSlots.length > 0
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {day.isOpen ? `${day.availableSlots.length} open` : "Closed"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Time Slots Grid for Selected Date */}
            <div className="mt-4">
              {!dayAvailability?.isOpen ? (
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center text-xs text-slate-400">
                  Lumina Studio is closed on {dayAvailability?.dayName}s (
                  {selectedDate}). Select Tuesday–Saturday above to view open photo
                  shoot slots.
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
                      className={`flex flex-col items-start justify-between rounded-xl border px-3 py-2 text-left text-xs transition ${
                        slot.available
                          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100 hover:border-emerald-400 hover:bg-emerald-500/20"
                          : "cursor-not-allowed border-amber-500/20 bg-amber-500/5 text-slate-400"
                      }`}
                    >
                      <span className="font-semibold">
                        {formatTime12h(slot.startTime)}
                      </span>
                      <span className="mt-0.5 text-[10px] opacity-80">
                        {slot.available
                          ? "Available • Click to book"
                          : `Booked (${slot.conflictRef})`}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Responsive Studio Appointments Table (responsive-table guide) */}
          <div className="rounded-2xl border border-white/10 bg-[#111420] p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Studio Appointments Schedule
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time bookings created via SMS agent or studio dashboard
                </p>
              </div>
              <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                {appointments.length} Total Records
              </span>
            </div>

            <div
              tabIndex={0}
              role="region"
              aria-labelledby="appointments-table-caption"
              className="table-wrapper"
            >
              <table className="studio-table text-left text-xs">
                <caption
                  id="appointments-table-caption"
                  className="sr-only"
                >
                  Upcoming photo studio appointments and client bookings
                </caption>
                <thead>
                  <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="px-3.5 py-3">Client / Ref</th>
                    <th className="px-3.5 py-3">Session Package</th>
                    <th className="px-3.5 py-3">Date &amp; Time</th>
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
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-indigo-300">
                            {apt.bookingRef}
                          </span>
                          <span>{apt.clientName}</span>
                        </div>
                      </th>
                      <td className="px-3.5 py-3 text-slate-200">
                        <div>{apt.serviceName}</div>
                        <div className="text-[11px] text-slate-400">
                          {apt.durationMinutes}m • ${apt.price}
                        </div>
                      </td>
                      <td className="px-3.5 py-3 text-slate-200">
                        <div className="font-medium">
                          {formatPrettyDate(apt.date)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {formatTime12h(apt.startTime)} –{" "}
                          {formatTime12h(apt.endTime)}
                        </div>
                      </td>
                      <td className="px-3.5 py-3 text-slate-300">
                        <div>{apt.clientPhone}</div>
                        <div className="truncate text-[11px] text-slate-400">
                          {apt.clientEmail}
                        </div>
                      </td>
                      <td className="px-3.5 py-3">
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
                      </td>
                      <td className="px-3.5 py-3 text-right">
                        {apt.status !== "cancelled" && (
                          <button
                            type="button"
                            onClick={() => handleCancelBooking(apt.bookingRef)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-500/25 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-300 transition hover:bg-rose-500/20"
                            title={`Cancel ${apt.bookingRef}`}
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* DIALOG 1: Seamless Multi-LLM Provider & API Key Switcher */}
      <LightDismissDialog
        open={isProviderDialogOpen}
        onClose={() => setIsProviderDialogOpen(false)}
        title="Multi-LLM Provider Routing & API Keys"
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
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#171b2b] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
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
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Google Gemini</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
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
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0e17] px-2.5 py-1.5 text-xs text-white"
              />
              <label
                htmlFor="gemini-model-input"
                className="mt-2 block text-[11px] text-slate-400"
              >
                Model Override (default: gemini-3.5-flash-lite)
              </label>
              <input
                id="gemini-model-input"
                type="text"
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                placeholder="gemini-2.5-flash"
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0e17] px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">OpenRouter</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
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
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0e17] px-2.5 py-1.5 text-xs text-white"
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
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0c0e17] px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsProviderDialogOpen(false)}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
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
          <div className="rounded-xl border border-white/10 bg-[#0c0e17] p-3">
            <p className="font-semibold text-indigo-300">
              Webhook Endpoint URL (POST):
            </p>
            <code className="mt-1 block rounded bg-black/50 px-2.5 py-1.5 font-mono text-[11px] text-emerald-300">
              https://your-vercel-domain.vercel.app/api/webhook/sms
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

          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-200">
              Live TwiML Webhook Response Test:
            </span>
            <button
              type="button"
              disabled={isTestingWebhook}
              onClick={handleTestSmsWebhook}
              className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {isTestingWebhook
                ? "Testing /api/webhook/sms..."
                : "Simulate Twilio POST"}
            </button>
          </div>

          {webhookTestOutput && (
            <pre className="max-h-48 overflow-auto rounded-xl border border-white/10 bg-black/60 p-3 font-mono text-[11px] text-cyan-300">
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
              className="studio-input w-full rounded-xl border border-white/15 bg-[#0c0e17] px-3 py-2 text-xs text-white focus:outline-none"
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
                className="studio-input w-full rounded-xl border border-white/15 bg-[#0c0e17] px-3 py-2 text-xs text-white focus:outline-none"
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
                className="studio-input w-full rounded-xl border border-white/15 bg-[#0c0e17] px-3 py-2 text-xs text-white focus:outline-none"
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
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#0c0e17] px-2.5 py-2 text-xs text-white"
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
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#0c0e17] px-2.5 py-2 text-xs text-white"
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
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#0c0e17] px-2.5 py-2 text-xs text-white"
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
              className="mt-1 w-full rounded-xl border border-white/15 bg-[#0c0e17] px-3 py-2 text-xs text-white"
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
              className="rounded-xl border border-white/10 px-4 py-2 text-xs text-slate-300 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              Confirm Studio Booking
            </button>
          </div>
        </form>
      </LightDismissDialog>
    </div>
  );
}
