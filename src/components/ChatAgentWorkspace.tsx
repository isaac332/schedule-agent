"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  Eye,
  EyeOff,
  Key,
  Layers,
  Palette,
  Phone,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  Wrench,
  X,
  XCircle,
} from "lucide-react";
import type {
  ChatTurnMessage,
  ConversationSession,
  ProviderMode,
  ProviderTelemetry,
  ToolExecutionRecord,
} from "@/lib/studio/types";
import { STUDIO_ADDONS, STUDIO_SERVICES } from "@/lib/studio/config";

// ============================================================================
// Agent Capabilities Definition (All 10 capabilities covering all 12 tools)
// ============================================================================
interface AgentCapability {
  id: string;
  icon: string;
  title: string;
  shortLabel: string;
  toolName: string;
  description: string;
  samplePrompt: string;
  tag: string;
}

const AGENT_CAPABILITIES: AgentCapability[] = [
  {
    id: "availability",
    icon: "📅",
    title: "Consulta de Disponibilidad en Tiempo Real",
    shortLabel: "Disponibilidad",
    toolName: "checkAvailableBookings / getAvailableSlots",
    description:
      "Calcula horarios libres considerando la duración del paquete y 15 minutos de buffer Profoto para calibración de luces con filtros mañana/tarde.",
    samplePrompt:
      "¿Qué fechas y horarios tienen disponibles este fin de semana para sesión de pareja?",
    tag: "Agenda & Calendario",
  },
  {
    id: "quote-upsell",
    icon: "💎",
    title: "Cotización Dinámica & Venta de Add-ons",
    shortLabel: "Cotizar con Add-ons",
    toolName: "calculateSessionQuote / getStudioServices",
    description:
      "Cotiza paquetes base y calcula el ticket total con complementos de alto margen (maquillaje HMUA, video reel 4K, fotos extra, impresiones).",
    samplePrompt:
      "Quiero cotizar la Sesión Juntos x Siempre agregando Maquillaje y Peinado Profesional y Video Reel 4K Vertical.",
    tag: "Precios & Cotizador",
  },
  {
    id: "booking",
    icon: "⚡",
    title: "Reservación en Firme & Asignación de Set",
    shortLabel: "Reservar Cita",
    toolName: "bookAppointment",
    description:
      "Genera la clave de reservación (JXS-XXXX), asigna fotógrafo disponible (Sofía Valenzuela o Mateo Rivas) y bloquea el tiempo en agenda.",
    samplePrompt:
      "Deseo agendar la Sesión Juntos x Siempre para el sábado 17 de mayo a las 11:30 AM a nombre de Mariana Rivera, correo mariana.rivera@gmail.com",
    tag: "Reserva Autónoma",
  },
  {
    id: "lookup",
    icon: "🔍",
    title: "Consulta de Estatus de Reservación",
    shortLabel: "Consultar Cita",
    toolName: "getAppointment",
    description:
      "Busca y consulta reservaciones existentes en el estudio por código de referencia (ej. JXS-2041), número de celular, nombre o correo.",
    samplePrompt:
      "¿Cuál es el estatus y los detalles de mi reservación JXS-2041?",
    tag: "Gestión de Citas",
  },
  {
    id: "customize",
    icon: "🎨",
    title: "Personalización de Cita & Fondo Artesanal",
    shortLabel: "Personalizar Cita",
    toolName: "updateAppointmentDetails",
    description:
      "Actualiza notas, solicitud de fondo artesanal de Nogales, fotógrafo preferido o complementos sin modificar la fecha/hora agendada.",
    samplePrompt:
      "Quiero agregar el complemento de Video Reel y especificar el fondo 'Atardecer Sonorense Terracota' en mi cita JXS-2041.",
    tag: "Personalización",
  },
  {
    id: "prep-guide",
    icon: "👗",
    title: "Guía de Vestuario & Enlace de Anticipo",
    shortLabel: "Guía & Anticipo",
    toolName: "sendPrepGuideAndDepositLink",
    description:
      "Genera recomendaciones de vestuario con paleta para fondos de Nogales, estacionamiento y provee el enlace de anticipo bancario transferible.",
    samplePrompt:
      "¿Me puedes enviar la guía de preparación de vestuario y el enlace de anticipo para la cita JXS-2041?",
    tag: "Blindaje Anti No-Show",
  },
  {
    id: "waitlist",
    icon: "🔔",
    title: "Lista de Espera con Auto-Rescate",
    shortLabel: "Lista de Espera",
    toolName: "joinWaitlist",
    description:
      "Registra clientes en espera si un horario deseado está ocupado, listo para ser notificado automáticamente si alguien cancela.",
    samplePrompt:
      "Por favor anótame en lista de espera para el sábado por la mañana para sesión de pareja. Soy Lucía Benítez, correo lucia.benitez@outlook.com",
    tag: "Cero Fugas",
  },
  {
    id: "reschedule",
    icon: "🗓️",
    title: "Reprogramación Inteligente de Citas",
    shortLabel: "Reagendar Cita",
    toolName: "rescheduleAppointment",
    description:
      "Valida la nueva fecha y hora con buffers de iluminación y actualiza la reservación existente sin colisiones ni solapamientos.",
    samplePrompt:
      "¿Puedo reprogramar mi cita JXS-2041 para el próximo martes a las 3:00 PM?",
    tag: "Reprogramación",
  },
  {
    id: "cancel",
    icon: "🔄",
    title: "Cancelación & Auto-Rescate de Horario",
    shortLabel: "Cancelar Cita",
    toolName: "cancelAppointment",
    description:
      "Cancela la reservación, libera el horario en el calendario de estudio y activa la reasignación inmediata a la lista de espera.",
    samplePrompt:
      "Por favor cancela mi cita JXS-2041 para liberar el espacio.",
    tag: "Liberación & Rescate",
  },
  {
    id: "team-spaces",
    icon: "📸",
    title: "Equipo Creativo & Fondos de Estudio",
    shortLabel: "Fotógrafos & Sets",
    toolName: "getStudioTeamAndSpaces",
    description:
      "Detalles del equipo en Nogales, Sonora (Sofía Valenzuela, Mateo Rivas), equipo Profoto Pro-11 y catálogo de fondos artesanales.",
    samplePrompt:
      "¿Quiénes son los fotógrafos del estudio y qué fondos artesanales tienen disponibles en Nogales, Sonora?",
    tag: "Catálogo & Sets",
  },
];

// Presets for client phone testing
interface ClientPreset {
  name: string;
  phone: string;
  email: string;
  context: string;
}

const CLIENT_PHONE_PRESETS: ClientPreset[] = [
  {
    name: "Mariana Rivera",
    phone: "+52 55 4910 2831",
    email: "mariana.rivera@gmail.com",
    context: "Tiene cita confirmada JXS-2041 para Sesión Juntos x Siempre.",
  },
  {
    name: "Lucía Benítez",
    phone: "+52 631 313 8104",
    email: "lucia.benitez@outlook.com",
    context: "Cliente de Nogales; interesada en lista de espera y cancelaciones.",
  },
  {
    name: "Carlos Mendoza",
    phone: "+52 631 112 4589",
    email: "carlos.mendoza@empresa.com",
    context: "Consulta para retrato corporativo y sesiones ejecutivas.",
  },
];

const PROVIDER_MODE_OPTIONS: { value: ProviderMode; label: string; desc: string }[] = [
  {
    value: "gemini-with-fallback",
    label: "Gemini ⇄ OpenRouter Fallback",
    desc: "Usa Google Gemini primero; conmuta a OpenRouter o fallback demo en caso de límite o error.",
  },
  {
    value: "openrouter-with-fallback",
    label: "OpenRouter ⇄ Gemini Fallback",
    desc: "Usa OpenRouter primero; conmuta a Google Gemini en caso de error.",
  },
  {
    value: "gemini-only",
    label: "Google Gemini Estricto",
    desc: "Enruta exclusivamente a través de la API oficial de Google Gemini.",
  },
  {
    value: "openrouter-only",
    label: "OpenRouter Estricto",
    desc: "Enruta exclusivamente a través de la API de OpenRouter.",
  },
];

export function ChatAgentWorkspace() {
  // Client selection & Phone State
  const [selectedClient, setSelectedClient] = useState<ClientPreset>(CLIENT_PHONE_PRESETS[0]);
  const [clientPhone, setClientPhone] = useState<string>(CLIENT_PHONE_PRESETS[0].phone);

  // Chat message & history state
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [llmHistory, setLlmHistory] = useState<ConversationSession["history"]>([]);
  const [lastTelemetry, setLastTelemetry] = useState<ProviderTelemetry | null>(null);

  // Provider configuration state
  const [providerMode, setProviderMode] = useState<ProviderMode>("gemini-with-fallback");
  const [geminiApiKey, setGeminiApiKey] = useState<string>("");
  const [openrouterApiKey, setOpenrouterApiKey] = useState<string>("");
  const [showApiKeys, setShowApiKeys] = useState<boolean>(false);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState<boolean>(false);

  // UI state
  const [isCapabilitiesOpen, setIsCapabilitiesOpen] = useState<boolean>(false);
  const [isResetMenuOpen, setIsResetMenuOpen] = useState<boolean>(false);
  const [statusToast, setStatusToast] = useState<string>("");
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [activeToolTab, setActiveToolTab] = useState<Record<string, "args" | "result">>({});
  const [activeFeaturesSection, setActiveFeaturesSection] = useState<"packages" | "addons" | "capabilities">("packages");
  const [showFeaturesPanel, setShowFeaturesPanel] = useState<boolean>(true);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgSeqRef = useRef<number>(1);

  // Initial welcome message generator
  const createWelcomeMessage = useCallback((clientName?: string): ChatTurnMessage => {
    return {
      id: `welcome-${Date.now()}`,
      role: "assistant",
      text: `¡Hola ${clientName ? clientName.split(" ")[0] : ""}! 🌸 Soy Camila, Coordinadora de Citas de **juntosxsiempre**, estudio fotográfico en Nogales, Sonora, México.\n\nEstoy aquí para asistirte con:\n• 📅 **Disponibilidad:** Consulta de fechas con 15 min de buffer Profoto\n• 💎 **Cotizaciones:** Paquetes y complementos (HMUA, Video Reel, fotos extra)\n• ⚡ **Reservas:** Apartado en firme con asignación de fotógrafo\n• 🔍 **Gestión:** Consulta, personalización, reprogramación o cancelación de citas\n• 👗 **Guía:** Blindaje anti no-show con vestuario y anticipo transferible\n\n¿En qué podemos inspirarte hoy?`,
      timestamp: "initial",
    };
  }, []);

  const [messages, setMessages] = useState<ChatTurnMessage[]>([
    createWelcomeMessage(CLIENT_PHONE_PRESETS[0].name),
  ]);

  // Auto-scroll on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Show temporary toast message
  const showToast = (msg: string, durationMs = 3500) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(""), durationMs);
  };

  // Toggle tool executions dropdown
  const toggleToolExpand = (msgId: string) => {
    setExpandedTools((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  // Switch between client presets cleanly without session contamination
  const handleSelectClientPreset = (preset: ClientPreset) => {
    setSelectedClient(preset);
    setClientPhone(preset.phone);
    setLlmHistory([]);
    setLastTelemetry(null);
    setMessages([createWelcomeMessage(preset.name)]);
    showToast(`Sesión cambiada a ${preset.name} (${preset.phone})`);
  };

  // Send message handler
  const sendTextMessage = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride ?? inputMessage).trim();
      if (!text || isSending) return;

      msgSeqRef.current += 1;
      const seq = msgSeqRef.current;

      const optimisticUserMsg: ChatTurnMessage = {
        id: `user-${seq}`,
        role: "user",
        text,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticUserMsg]);
      if (!textOverride) {
        setInputMessage("");
      }
      setIsSending(true);

      try {
        const cleanSessionPhone = clientPhone.replace(/\D/g, "") || "default";
        const res = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: `session-${cleanSessionPhone}`,
            clientPhone,
            message: text,
            clientHistory: llmHistory.length > 0 ? llmHistory : undefined,
            providerConfig: {
              mode: providerMode,
              geminiApiKey: geminiApiKey || undefined,
              openrouterApiKey: openrouterApiKey || undefined,
            },
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || data.error) {
          const errorMessage = data.error || `Error del servidor (${res.status})`;
          msgSeqRef.current += 1;
          setMessages((prev) => [
            ...prev,
            {
              id: `err-${msgSeqRef.current}`,
              role: "assistant",
              text: `⚠️ Hubo un problema al procesar tu solicitud: ${errorMessage}. Por favor intenta de nuevo.`,
              timestamp: new Date().toISOString(),
            },
          ]);
          return;
        }

        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
        if (Array.isArray(data.history)) {
          setLlmHistory(data.history);
        }
        if (data.telemetry) {
          setLastTelemetry(data.telemetry);
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        msgSeqRef.current += 1;
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${msgSeqRef.current}`,
            role: "assistant",
            text: `⚠️ Error de red o comunicación: ${errMsg}. Por favor revisa tu conexión e intenta de nuevo.`,
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [clientPhone, geminiApiKey, inputMessage, isSending, llmHistory, openrouterApiKey, providerMode],
  );

  // Reset conversation handler
  const handleResetConversation = async () => {
    setIsResetMenuOpen(false);
    try {
      const cleanSessionPhone = clientPhone.replace(/\D/g, "") || "default";
      await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: `session-${cleanSessionPhone}`,
          clientPhone,
          resetSession: true,
        }),
      });

      setLlmHistory([]);
      setLastTelemetry(null);
      setMessages([createWelcomeMessage(selectedClient.name)]);
      showToast("Conversación reiniciada con éxito.");
    } catch {
      showToast("Error al reiniciar la conversación.");
    }
  };

  // Full demo reset handler (resets appointments store, waitlist and conversations)
  const handleResetFullStudioDemo = async () => {
    setIsResetMenuOpen(false);
    try {
      await fetch("/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: "pareja-juntos" }),
      });

      setLlmHistory([]);
      setLastTelemetry(null);
      setMessages([createWelcomeMessage(selectedClient.name)]);
      showToast("¡Estudio reiniciado a su estado inicial de demostración!");
    } catch {
      showToast("Error al reiniciar la base de datos del estudio.");
    }
  };

  // Trigger capability directly
  const handleSelectCapability = (cap: AgentCapability) => {
    setIsCapabilitiesOpen(false);
    sendTextMessage(cap.samplePrompt);
  };

  // Helper to render contextual badge based on ACTUAL tool executions or priority keywords
  const renderContextualCard = (msg: ChatTurnMessage) => {
    if (msg.role !== "assistant") return null;

    const toolNames = (msg.toolExecutions || []).map((t) => t.toolName);
    const textLower = msg.text.toLowerCase();

    // 1. Cancellation (Highest Priority to avoid false-positive booking badge)
    if (
      toolNames.includes("cancelAppointment") ||
      textLower.includes("ha sido cancelada") ||
      textLower.includes("canceló la cita") ||
      textLower.includes("cancelación confirmada")
    ) {
      return (
        <div className="mt-2.5 rounded-xl border border-rose-300 bg-gradient-to-br from-rose-50/95 via-white to-pink-50/80 p-2.5 text-[10px] text-[#2d1822] shadow-2xs">
          <div className="flex items-center justify-between border-b border-rose-200 pb-1 font-bold text-rose-900">
            <span className="flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5 text-rose-600" />
              <span>Cita Cancelada &amp; Horario Liberado</span>
            </span>
            <span className="rounded-full bg-rose-100 px-1.5 py-0.2 text-[9px] font-extrabold text-rose-800">
              Liberada
            </span>
          </div>
          <p className="mt-1 text-[9px] text-[#5e3347]">
            ✓ El espacio se liberó en la agenda de Nogales y se activó la alerta de auto-rescate para clientes en lista de espera.
          </p>
        </div>
      );
    }

    // 2. Rescheduling
    if (
      toolNames.includes("rescheduleAppointment") ||
      textLower.includes("fue reprogramada") ||
      textLower.includes("reprogramó con éxito") ||
      textLower.includes("reagendada")
    ) {
      return (
        <div className="mt-2.5 rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50/95 via-white to-pink-50/80 p-2.5 text-[10px] text-[#2d1822] shadow-2xs">
          <div className="flex items-center justify-between border-b border-amber-200 pb-1 font-bold text-amber-900">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span>Cita Reprogramada con Buffer Protegido</span>
            </span>
            <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[9px] font-extrabold text-amber-800">
              Reprogramada
            </span>
          </div>
          <p className="mt-1 text-[9px] text-[#5e3347]">
            ✓ Nuevo horario asignado en calendario validando 15 min de buffer Profoto para calibración de flashes.
          </p>
        </div>
      );
    }

    // 3. New Booking
    if (
      toolNames.includes("bookAppointment") ||
      (textLower.includes("jxs-") &&
        (textLower.includes("confirmada con éxito") ||
          textLower.includes("reservación:") ||
          textLower.includes("cita agendada") ||
          textLower.includes("confirmada!")))
    ) {
      return (
        <div className="mt-2.5 rounded-xl border border-emerald-300 bg-gradient-to-br from-emerald-50/95 via-white to-pink-50/70 p-2.5 text-[10px] text-[#2d1822] shadow-2xs">
          <div className="flex items-center justify-between border-b border-emerald-200 pb-1 font-bold text-emerald-900">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Cita Agendada en Firme (Buffer Protegido)</span>
            </span>
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-800">
              Confirmada
            </span>
          </div>
          <p className="mt-1 text-[9px] text-[#5e3347]">
            ✓ Clave JXS asignada, fotógrafo reservado y 15m de calibración de iluminación bloqueados.
          </p>
        </div>
      );
    }

    // 4. Prep Guide & Deposit
    if (
      toolNames.includes("sendPrepGuideAndDepositLink") ||
      textLower.includes("guía de preparación") ||
      textLower.includes("guia de preparación") ||
      (textLower.includes("anticipo") && textLower.includes("pay.juntosxsiempre"))
    ) {
      return (
        <div className="mt-2.5 rounded-xl border border-pink-300 bg-gradient-to-br from-pink-50/95 via-white to-amber-50/70 p-2.5 text-[10px] text-[#2d1822] shadow-2xs">
          <div className="flex items-center justify-between border-b border-pink-200 pb-1 font-bold text-[#c52752]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#e0446e]" />
              <span>Blindaje Anti No-Show &amp; Guía de Set</span>
            </span>
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-800">
              Anticipo &amp; Paleta
            </span>
          </div>
          <p className="mt-1 text-[9px] text-[#5e3347]">
            ✓ Paleta de colorimetría para fondos de Nogales + enlace seguro para anticipo bancario transferible.
          </p>
        </div>
      );
    }

    // 5. Waitlist Registration
    if (
      toolNames.includes("joinWaitlist") ||
      textLower.includes("lista de espera") ||
      textLower.includes("wtl-")
    ) {
      return (
        <div className="mt-2.5 rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50/95 via-white to-pink-50/70 p-2.5 text-[10px] text-[#2d1822] shadow-2xs">
          <div className="flex items-center justify-between border-b border-amber-200 pb-1 font-bold text-amber-900">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span>Lista de Espera Activa (Cero Fugas)</span>
            </span>
            <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[9px] font-extrabold text-amber-800">
              Prioritaria
            </span>
          </div>
          <p className="mt-1 text-[9px] text-[#5e3347]">
            ✓ Cliente registrado con prioridad; si otro cliente cancela, el sistema notificará inmediatamente.
          </p>
        </div>
      );
    }

    // 6. Appointment Lookup / Consult
    if (
      toolNames.includes("getAppointment") ||
      (textLower.includes("jxs-") && textLower.includes("reservación encontrada"))
    ) {
      return (
        <div className="mt-2.5 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/95 via-white to-pink-50/70 p-2.5 text-[10px] text-[#2d1822] shadow-2xs">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-1 font-bold text-indigo-900">
            <span className="flex items-center gap-1">
              <Search className="h-3.5 w-3.5 text-indigo-600" />
              <span>Expediente de Cita Encontrado</span>
            </span>
            <span className="rounded-full bg-indigo-100 px-1.5 py-0.2 text-[9px] font-extrabold text-indigo-800">
              Consultada
            </span>
          </div>
          <p className="mt-1 text-[9px] text-[#5e3347]">
            ✓ Detalles de reservación verificados en vivo contra el almacén del estudio.
          </p>
        </div>
      );
    }

    // 7. Update Appointment Details
    if (
      toolNames.includes("updateAppointmentDetails") ||
      textLower.includes("actualizaron los detalles de la reservación")
    ) {
      return (
        <div className="mt-2.5 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/95 via-white to-pink-50/70 p-2.5 text-[10px] text-[#2d1822] shadow-2xs">
          <div className="flex items-center justify-between border-b border-purple-100 pb-1 font-bold text-purple-900">
            <span className="flex items-center gap-1">
              <Palette className="h-3.5 w-3.5 text-purple-600" />
              <span>Personalización de Set &amp; Complementos</span>
            </span>
            <span className="rounded-full bg-purple-100 px-1.5 py-0.2 text-[9px] font-extrabold text-purple-800">
              Actualizada
            </span>
          </div>
          <p className="mt-1 text-[9px] text-[#5e3347]">
            ✓ Selección de fondo artesanal y add-ons agregados a la orden de trabajo del fotógrafo.
          </p>
        </div>
      );
    }

    // 8. Dynamic Quote / Upsell
    if (
      toolNames.includes("calculateSessionQuote") ||
      textLower.includes("cotización") ||
      textLower.includes("maquillaje") ||
      textLower.includes("reel") ||
      textLower.includes("fotos extra")
    ) {
      return (
        <div className="mt-2.5 rounded-xl border border-pink-200 bg-gradient-to-br from-pink-50/95 via-white to-rose-50/70 p-2.5 text-[10px] text-[#2d1822] shadow-2xs">
          <div className="flex items-center justify-between border-b border-pink-100 pb-1 font-bold text-[#c52752]">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-[#e0446e]" />
              <span>Cotización con Complementos Sugeridos</span>
            </span>
            <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-800">
              Cotización Lista
            </span>
          </div>
          <p className="mt-1 text-[9px] text-[#5e3347]">
            ✓ Paquete base + complementos de alto margen calculados con desglose de anticipo y saldo restante.
          </p>
        </div>
      );
    }

    // 9. Availability Check
    if (
      toolNames.includes("checkAvailableBookings") ||
      toolNames.includes("getAvailableSlots") ||
      textLower.includes("horarios disponibles") ||
      textLower.includes("fechas y horarios")
    ) {
      return (
        <div className="mt-2.5 rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50/95 via-white to-pink-50/70 p-2.5 text-[10px] text-[#2d1822] shadow-2xs">
          <div className="flex items-center justify-between border-b border-sky-100 pb-1 font-bold text-sky-900">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-sky-600" />
              <span>Disponibilidad en Vivo Verificada</span>
            </span>
            <span className="rounded-full bg-sky-100 px-1.5 py-0.2 text-[9px] font-extrabold text-sky-800">
              Buffer Profoto OK
            </span>
          </div>
          <p className="mt-1 text-[9px] text-[#5e3347]">
            ✓ Espacios filtrados considerando tiempos de paquete y 15 min de calibración de iluminación.
          </p>
        </div>
      );
    }

    // 10. Studio Team & Sets
    if (
      toolNames.includes("getStudioTeamAndSpaces") ||
      textLower.includes("sofía valenzuela") ||
      textLower.includes("mateo rivas") ||
      textLower.includes("fondos artesanales")
    ) {
      return (
        <div className="mt-2.5 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/95 via-white to-pink-50/70 p-2.5 text-[10px] text-[#2d1822] shadow-2xs">
          <div className="flex items-center justify-between border-b border-purple-100 pb-1 font-bold text-purple-900">
            <span className="flex items-center gap-1">
              <Camera className="h-3.5 w-3.5 text-purple-600" />
              <span>Equipo Creativo &amp; Sets de Nogales</span>
            </span>
            <span className="rounded-full bg-purple-100 px-1.5 py-0.2 text-[9px] font-extrabold text-purple-800">
              Nogales, Son.
            </span>
          </div>
          <p className="mt-1 text-[9px] text-[#5e3347]">
            ✓ Fotógrafos especializados, generadores Profoto Pro-11 y ciclorama climatizado de 6 metros.
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[#fbf7f4] text-[#2d1822]">
      {/* Toast Notification */}
      {statusToast && (
        <div className="fixed top-4 inset-x-4 z-50 mx-auto max-w-sm rounded-2xl border border-pink-300 bg-white/95 px-4 py-2.5 text-center text-xs font-semibold text-[#9e193e] shadow-lg animate-in fade-in slide-in-from-top-2">
          {statusToast}
        </div>
      )}

      {/* --- Focused Header (Simple, Fast, Zero Noise) --- */}
      <header className="sticky top-0 z-30 border-b border-pink-200/80 bg-[#fffdfb]/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-3.5 py-2.5">
          {/* Brand Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#e0446e] via-[#f06a8f] to-[#f8cfda] text-white shadow-xs">
              <Camera className="h-4.5 w-4.5 stroke-[2.2]" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white ring-2 ring-white">
                ✓
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-extrabold tracking-tight text-[#2d1822]">
                  juntosxsiempre
                </h1>
                <span className="rounded-full bg-pink-100 px-1.5 py-0.2 text-[9px] font-bold text-[#c52752]">
                  Nogales, Son.
                </span>
              </div>
              <p className="text-[10px] font-medium text-[#7b5965] flex items-center gap-1">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Camila • Agente IA 24/7 (10 Capacidades)</span>
              </p>
            </div>
          </div>

          {/* Quick Header Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Capabilities Cheatsheet Trigger */}
            <button
              type="button"
              onClick={() => setIsCapabilitiesOpen(true)}
              className="inline-flex items-center gap-1 rounded-xl border border-pink-200 bg-white/90 px-2.5 py-1.5 text-xs font-bold text-[#c52752] shadow-2xs hover:bg-pink-50 hover:border-pink-300 active:scale-95 transition"
              title="Ver las 10 capacidades que puede ejecutar el agente"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#e0446e]" />
              <span className="hidden sm:inline">Capacidades</span>
              <span className="sm:hidden">Guía</span>
            </button>

            {/* AI Provider Config Dialog Trigger */}
            <button
              type="button"
              onClick={() => setIsProviderModalOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-pink-200 bg-white text-[#7b5965] hover:text-[#e0446e] hover:border-pink-300 active:scale-95 transition"
              title="Configuración de IA y Proveedores"
              aria-label="Configurar proveedor IA"
            >
              <Cpu className="h-3.5 w-3.5" />
            </button>

            {/* Reset Menu Popover Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsResetMenuOpen((v) => !v)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-pink-200 bg-white text-[#7b5965] hover:text-[#e0446e] hover:border-pink-300 active:scale-95 transition"
                title="Opciones de reinicio"
                aria-label="Opciones de reinicio"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>

              {isResetMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-56 rounded-2xl border border-pink-200 bg-white p-1.5 shadow-xl z-50 text-xs animate-in fade-in slide-in-from-top-1">
                  <button
                    type="button"
                    onClick={handleResetConversation}
                    className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-left font-medium text-[#2d1822] hover:bg-pink-50 transition"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-[#e0446e]" />
                    <div>
                      <div className="font-bold">Reiniciar Conversación</div>
                      <div className="text-[10px] text-[#7b5965]">Borra mensajes de esta sesión</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetFullStudioDemo}
                    className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-left font-medium text-rose-700 hover:bg-rose-50 transition mt-0.5 border-t border-pink-100/60 pt-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                    <div>
                      <div className="font-bold">Reiniciar Demo Completo</div>
                      <div className="text-[10px] text-rose-500">Restaura citas y lista de espera</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Clear Link to the Full Studio Schedule & Calendar */}
            <Link
              href="/schedule"
              className="inline-flex items-center gap-1.5 rounded-xl border border-pink-300 bg-gradient-to-r from-pink-50 via-rose-50 to-pink-100 px-3 py-1.5 text-xs font-bold text-[#9e193e] shadow-2xs hover:border-pink-400 active:scale-95 transition"
              title="Ver disponibilidad y calendario de horarios"
            >
              <Calendar className="h-3.5 w-3.5 text-[#e0446e]" />
              <span className="hidden xs:inline">Ver Disponibilidad</span>
              <span className="xs:hidden">Horarios</span>
              <ArrowRight className="h-3 w-3 text-[#c52752]" />
            </Link>
          </div>
        </div>
      </header>

      {/* --- Available Features Showcase (Integrated Directly in Page) --- */}
      <section className="border-b border-pink-200/70 bg-[#fffdfb]/80 px-3 py-2">
        <div className="mx-auto max-w-3xl">
          {/* Top Bar with Category Selector & Toggle */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-[#9e193e] flex items-center gap-1 mr-1">
                <Sparkles className="h-3 w-3 text-[#e0446e]" />
                Funciones:
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveFeaturesSection("packages");
                  setShowFeaturesPanel(true);
                }}
                className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition shrink-0 ${
                  activeFeaturesSection === "packages" && showFeaturesPanel
                    ? "bg-[#e0446e] text-white shadow-2xs"
                    : "bg-pink-50/80 text-[#7b5965] hover:bg-pink-100/70"
                }`}
              >
                📸 Paquetes ({STUDIO_SERVICES.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveFeaturesSection("addons");
                  setShowFeaturesPanel(true);
                }}
                className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition shrink-0 ${
                  activeFeaturesSection === "addons" && showFeaturesPanel
                    ? "bg-[#e0446e] text-white shadow-2xs"
                    : "bg-pink-50/80 text-[#7b5965] hover:bg-pink-100/70"
                }`}
              >
                💎 Add-ons ({STUDIO_ADDONS.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveFeaturesSection("capabilities");
                  setShowFeaturesPanel(true);
                }}
                className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition shrink-0 ${
                  activeFeaturesSection === "capabilities" && showFeaturesPanel
                    ? "bg-[#e0446e] text-white shadow-2xs"
                    : "bg-pink-50/80 text-[#7b5965] hover:bg-pink-100/70"
                }`}
              >
                ⚡ Capacidades ({AGENT_CAPABILITIES.length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowFeaturesPanel((prev) => !prev)}
              className="text-[10px] font-bold text-[#c52752] hover:underline shrink-0"
            >
              {showFeaturesPanel ? "Ocultar ▲" : "Mostrar ▼"}
            </button>
          </div>

          {/* Collapsible Features Showcase Body */}
          {showFeaturesPanel && (
            <div className="animate-in fade-in duration-200">
              {/* Category 1: Studio Packages */}
              {activeFeaturesSection === "packages" && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {STUDIO_SERVICES.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="min-w-[210px] max-w-[230px] shrink-0 rounded-2xl border border-pink-200/90 bg-white p-2.5 text-xs shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[#2d1822] text-[11px] truncate">
                            {pkg.name}
                          </span>
                        </div>
                        <p className="text-[10px] font-semibold text-[#c52752] mt-0.5">
                          ${pkg.price.toLocaleString("es-MX")} MXN • {pkg.durationMinutes} min
                        </p>
                        <p className="text-[9px] text-[#7b5965] line-clamp-2 mt-1 leading-tight">
                          {pkg.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          sendTextMessage(
                            `Hola Camila, me interesa la ${pkg.name}. ¿Qué incluye exactamente y qué fechas tienen disponibles?`
                          )
                        }
                        disabled={isSending}
                        className="mt-2 w-full rounded-xl bg-pink-50 border border-pink-200 py-1 text-center text-[10px] font-bold text-[#9e193e] hover:bg-pink-100 active:scale-95 disabled:opacity-40 transition"
                      >
                        Consultar en Chat 💬
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Category 2: Studio Add-ons */}
              {activeFeaturesSection === "addons" && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {STUDIO_ADDONS.map((addon) => (
                    <div
                      key={addon.id}
                      className="min-w-[200px] max-w-[220px] shrink-0 rounded-2xl border border-pink-200/90 bg-white p-2.5 text-xs shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        <span className="font-extrabold text-[#2d1822] text-[11px] truncate block">
                          {addon.name}
                        </span>
                        <p className="text-[10px] font-semibold text-[#c52752] mt-0.5">
                          +${addon.price.toLocaleString("es-MX")} MXN
                        </p>
                        <p className="text-[9px] text-[#7b5965] line-clamp-2 mt-1 leading-tight">
                          {addon.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          sendTextMessage(
                            `Quiero agregar el complemento de ${addon.name} ($${addon.price} MXN) a mi cotización de sesión fotográfica.`
                          )
                        }
                        disabled={isSending}
                        className="mt-2 w-full rounded-xl bg-pink-50 border border-pink-200 py-1 text-center text-[10px] font-bold text-[#9e193e] hover:bg-pink-100 active:scale-95 disabled:opacity-40 transition"
                      >
                        Agregar a Cotización 💬
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Category 3: Agent Capabilities */}
              {activeFeaturesSection === "capabilities" && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {AGENT_CAPABILITIES.map((cap) => (
                    <button
                      key={cap.id}
                      type="button"
                      onClick={() => sendTextMessage(cap.samplePrompt)}
                      disabled={isSending}
                      className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-pink-200/90 bg-white px-2.5 py-1 text-[11px] font-medium text-[#5e3347] shadow-2xs hover:border-pink-300 hover:bg-pink-50 active:scale-95 disabled:opacity-40 transition"
                      title={cap.title}
                    >
                      <span>{cap.icon}</span>
                      <span>{cap.shortLabel}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* --- Main Chat Stage --- */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-3 py-3">
        {/* Messages Container */}
        <div className="flex-1 flex flex-col gap-3 min-h-[380px] rounded-3xl border border-pink-200/80 bg-white/95 p-3.5 sm:p-4 shadow-sm overflow-y-auto">
          {messages.map((msg) => {
            const isAssistant = msg.role === "assistant";
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isAssistant ? "items-start" : "items-end"}`}
              >
                {/* Bubble */}
                <div
                  className={`max-w-[90%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                    isAssistant
                      ? "rounded-tl-sm border border-pink-100 bg-[#fbf7f4] text-[#2d1822]"
                      : "rounded-tr-sm bg-gradient-to-r from-[#e0446e] to-[#c52752] text-white"
                  }`}
                >
                  {isAssistant && (
                    <div className="mb-1 flex items-center justify-between gap-2 border-b border-pink-100/60 pb-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-[#e0446e]">
                        <Bot className="h-3 w-3" />
                        <span>Camila • juntosxsiempre</span>
                      </div>
                      <span className="text-[9px] text-[#7b5965] font-mono">
                        Nogales, Son.
                      </span>
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Contextual Card based on verified tool executions & actions */}
                  {renderContextualCard(msg)}
                </div>

                {/* Inspectable Tool Executions Drawer (Inputs AND Outputs) */}
                {msg.toolExecutions && msg.toolExecutions.length > 0 && (
                  <div className="mt-1.5 max-w-[90%] sm:max-w-[80%] rounded-xl border border-pink-200/80 bg-pink-50/50 p-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => toggleToolExpand(msg.id)}
                      className="w-full flex items-center justify-between font-bold text-[#9e193e] hover:text-[#c52752] transition text-left"
                    >
                      <div className="flex items-center gap-1.5">
                        <Wrench className="h-3 w-3 text-[#e0446e]" />
                        <span>
                          {msg.toolExecutions.length} herramienta(s) IA ejecutada(s)
                        </span>
                      </div>
                      {expandedTools[msg.id] ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>

                    {expandedTools[msg.id] && (
                      <div className="mt-2 flex flex-col gap-2 border-t border-pink-200/60 pt-2 animate-in fade-in duration-200">
                        {msg.toolExecutions.map((tx: ToolExecutionRecord) => {
                          const tab = activeToolTab[tx.id] || "args";
                          return (
                            <div
                              key={tx.id}
                              className="rounded-lg bg-white/95 p-2.5 border border-pink-100 text-[10px]"
                            >
                              <div className="flex items-center justify-between font-mono font-bold text-[#c52752]">
                                <span className="flex items-center gap-1">
                                  <span>🔧</span>
                                  <span>{tx.toolName}</span>
                                </span>
                                <span className="text-[8px] text-[#7b5965] font-sans">
                                  {new Date(tx.timestamp).toLocaleTimeString("es-MX", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })}
                                </span>
                              </div>

                              {/* Tab Selector: Arguments (Input) vs Result (Output) */}
                              <div className="mt-1.5 flex items-center gap-1 border-b border-pink-100 pb-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveToolTab((prev) => ({ ...prev, [tx.id]: "args" }))
                                  }
                                  className={`rounded-md px-1.5 py-0.5 text-[8px] font-bold transition ${
                                    tab === "args"
                                      ? "bg-pink-100 text-[#9e193e]"
                                      : "text-[#7b5965] hover:text-[#2d1822]"
                                  }`}
                                >
                                  Argumentos (Input)
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveToolTab((prev) => ({ ...prev, [tx.id]: "result" }))
                                  }
                                  className={`rounded-md px-1.5 py-0.5 text-[8px] font-bold transition ${
                                    tab === "result"
                                      ? "bg-pink-100 text-[#9e193e]"
                                      : "text-[#7b5965] hover:text-[#2d1822]"
                                  }`}
                                >
                                  Respuesta (Output)
                                </button>
                              </div>

                              <div className="mt-1">
                                {tab === "args" ? (
                                  <pre className="max-h-40 overflow-y-auto overflow-x-auto rounded bg-pink-50/60 p-1.5 font-mono text-[9px] text-[#2d1822]">
                                    {JSON.stringify(tx.args, null, 2)}
                                  </pre>
                                ) : (
                                  <pre className="max-h-48 overflow-y-auto overflow-x-auto rounded bg-pink-50/60 p-1.5 font-mono text-[9px] text-[#2d1822]">
                                    {JSON.stringify(tx.result, null, 2)}
                                  </pre>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Assistant Typing Indicator */}
          {isSending && (
            <div className="flex items-center gap-2 self-start rounded-2xl rounded-tl-sm border border-pink-100 bg-[#fbf7f4] px-4 py-2.5 text-xs text-[#7b5965]">
              <span className="h-2 w-2 rounded-full bg-[#e0446e] animate-ping" />
              <span>Camila está consultando la agenda del estudio...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Telemetry Bar & Client Profile Switcher */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-[#7b5965]">
          {/* SMS Simulator Client Profile Switcher */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <User className="h-3.5 w-3.5 text-[#e0446e] shrink-0" />
            <span className="font-semibold text-[#5e3347]">Cliente SMS:</span>
            <div className="flex items-center gap-1 text-[9px]">
              {CLIENT_PHONE_PRESETS.map((p) => {
                const isSelected = clientPhone === p.phone;
                return (
                  <button
                    key={p.phone}
                    type="button"
                    onClick={() => handleSelectClientPreset(p)}
                    className={`rounded-md px-1.5 py-0.5 font-semibold transition ${
                      isSelected
                        ? "bg-pink-200 text-[#9e193e]"
                        : "bg-white/80 border border-pink-200 text-[#7b5965] hover:bg-pink-100"
                    }`}
                    title={p.context}
                  >
                    {p.name.split(" ")[0]}
                  </button>
                );
              })}
            </div>

            {/* Custom Phone Input */}
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3 text-[#7b5965] shrink-0 ml-1" />
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-32 rounded-lg border border-pink-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-[#2d1822] focus:outline-pink-400"
                title="Edita el número telefónico para simular un nuevo cliente"
              />
            </div>
          </div>

          {/* Provider Telemetry Status */}
          {lastTelemetry && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#7b5965]">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{lastTelemetry.activeProvider}</span>
              <span>•</span>
              <span className="font-bold text-[#c52752]">
                {(lastTelemetry.latencyMs / 1000).toFixed(2)}s
              </span>
              {lastTelemetry.usingDemoFallback && (
                <span className="rounded bg-amber-100 px-1 py-0.2 text-[8px] font-bold text-amber-800">
                  Demo
                </span>
              )}
            </div>
          )}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendTextMessage();
          }}
          className="mt-2 flex items-center gap-2 rounded-2xl border border-pink-200/90 bg-white p-1.5 shadow-md shadow-pink-500/5"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Escribe a Camila (ej. ¿Qué fechas tienen disponibles?)..."
            disabled={isSending}
            className="flex-1 bg-transparent px-3 py-2 text-xs text-[#2d1822] placeholder:text-[#a0828c] focus:outline-none"
          />
          {inputMessage.trim() && (
            <button
              type="button"
              onClick={() => setInputMessage("")}
              className="text-[#7b5965] hover:text-[#2d1822] p-1"
              title="Borrar texto"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="submit"
            disabled={isSending || !inputMessage.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#e0446e] to-[#c52752] text-white shadow transition hover:opacity-95 active:scale-95 disabled:opacity-40"
            aria-label="Enviar mensaje"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </main>

      {/* --- Capabilities Guide Modal / Cheatsheet --- */}
      {isCapabilitiesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 animate-in fade-in duration-200">
          <div className="relative flex max-h-[90dvh] w-full max-w-xl flex-col rounded-3xl border border-pink-200 bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-pink-100 bg-gradient-to-r from-pink-50/80 to-white px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#e0446e] text-white">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-[#2d1822]">
                    10 Capacidades del Agente Camila
                  </h3>
                  <p className="text-[10px] text-[#7b5965]">
                    juntosxsiempre • Nogales, Sonora • Cobertura 100% de Herramientas de Estudio
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCapabilitiesOpen(false)}
                className="rounded-xl p-1.5 text-[#7b5965] hover:bg-pink-100/70 hover:text-[#2d1822] transition"
                aria-label="Cerrar ventana"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* List of Capabilities */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {AGENT_CAPABILITIES.map((cap) => (
                <div
                  key={cap.id}
                  className="rounded-2xl border border-pink-100 bg-[#fbf7f4] p-3 text-xs transition hover:border-pink-300 hover:shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-[#2d1822]">
                      <span className="text-base">{cap.icon}</span>
                      <span>{cap.title}</span>
                    </div>
                    <span className="shrink-0 rounded-full bg-pink-100 px-2 py-0.5 text-[9px] font-extrabold text-[#9e193e]">
                      {cap.tag}
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] text-[#5e3347] leading-relaxed">
                    {cap.description}
                  </p>

                  <div className="mt-1.5 flex items-center gap-1 font-mono text-[9px] text-[#7b5965]">
                    <span className="font-semibold text-[#c52752]">Tool:</span>
                    <code>{cap.toolName}</code>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-pink-200/50 pt-2">
                    <p className="text-[10px] italic text-[#7b5965] truncate flex-1">
                      &quot;{cap.samplePrompt}&quot;
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSelectCapability(cap)}
                      className="shrink-0 rounded-xl bg-gradient-to-r from-[#e0446e] to-[#c52752] px-2.5 py-1 text-[10px] font-bold text-white shadow-2xs hover:opacity-95 active:scale-95 transition"
                    >
                      Probar en Chat →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer with link to studio */}
            <div className="border-t border-pink-100 bg-pink-50/50 px-4 py-2.5 flex items-center justify-between text-xs">
              <span className="text-[10px] text-[#7b5965]">
                ¿Deseas consultar el calendario visual o los horarios disponibles?
              </span>
              <Link
                href="/schedule"
                onClick={() => setIsCapabilitiesOpen(false)}
                className="font-bold text-[#c52752] hover:underline flex items-center gap-1"
              >
                <span>Ver Disponibilidad &amp; Agenda</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* --- Provider Configuration Modal --- */}
      {isProviderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 animate-in fade-in duration-200">
          <div className="relative flex max-h-[90dvh] w-full max-w-lg flex-col rounded-3xl border border-pink-200 bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-pink-100 bg-gradient-to-r from-pink-50/80 to-white px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#e0446e] text-white">
                  <Cpu className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-[#2d1822]">
                    Configuración de Modelo &amp; Proveedor IA
                  </h3>
                  <p className="text-[10px] text-[#7b5965]">
                    Modo de ejecución, API keys opcionales y comportamiento de fallback
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProviderModalOpen(false)}
                className="rounded-xl p-1.5 text-[#7b5965] hover:bg-pink-100/70 hover:text-[#2d1822] transition"
                aria-label="Cerrar ventana"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Provider Mode Selection */}
              <div>
                <label className="block font-bold text-[#2d1822] mb-1.5">
                  Modo de Enrutamiento del Agente:
                </label>
                <div className="space-y-2">
                  {PROVIDER_MODE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-2.5 rounded-xl border p-2.5 cursor-pointer transition ${
                        providerMode === opt.value
                          ? "border-[#e0446e] bg-pink-50/70"
                          : "border-pink-100 bg-[#fbf7f4] hover:bg-pink-50/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="providerMode"
                        value={opt.value}
                        checked={providerMode === opt.value}
                        onChange={() => setProviderMode(opt.value)}
                        className="mt-0.5 text-[#e0446e] focus:ring-[#e0446e]"
                      />
                      <div>
                        <div className="font-bold text-[#2d1822]">{opt.label}</div>
                        <div className="text-[10px] text-[#7b5965]">{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* API Keys Configuration */}
              <div className="rounded-2xl border border-pink-100 bg-[#fbf7f4] p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2d1822] flex items-center gap-1">
                    <Key className="h-3.5 w-3.5 text-[#e0446e]" />
                    <span>Claves de API (Opcional)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowApiKeys((v) => !v)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-[#c52752] hover:underline"
                  >
                    {showApiKeys ? (
                      <>
                        <EyeOff className="h-3 w-3" />
                        <span>Ocultar</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3" />
                        <span>Mostrar</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-[#7b5965]">
                  Si no especificas una clave, el sistema utiliza respuestas de demostración deterministas con soporte completo de las herramientas del estudio.
                </p>

                {/* Gemini API Key */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#5e3347] mb-1">
                    Google Gemini API Key:
                  </label>
                  <input
                    type={showApiKeys ? "text" : "password"}
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full rounded-xl border border-pink-200 bg-white px-3 py-1.5 font-mono text-xs text-[#2d1822] focus:outline-pink-400"
                  />
                </div>

                {/* OpenRouter API Key */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#5e3347] mb-1">
                    OpenRouter API Key:
                  </label>
                  <input
                    type={showApiKeys ? "text" : "password"}
                    value={openrouterApiKey}
                    onChange={(e) => setOpenrouterApiKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="w-full rounded-xl border border-pink-200 bg-white px-3 py-1.5 font-mono text-xs text-[#2d1822] focus:outline-pink-400"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-pink-100 bg-pink-50/50 px-4 py-2.5 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsProviderModalOpen(false);
                  showToast("Configuración de IA guardada.");
                }}
                className="rounded-xl bg-gradient-to-r from-[#e0446e] to-[#c52752] px-4 py-1.5 font-bold text-white shadow-2xs hover:opacity-95 active:scale-95 transition"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
