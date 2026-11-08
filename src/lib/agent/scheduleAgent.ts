import {
  ChatAgent,
  FallbackProvider,
  GeminiProvider,
  OpenRouterProvider,
  type ILLMProvider,
  type LLMProviderId,
  type StandardMessage,
} from "@llm-multi-provider/core";
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
import type {
  ProviderMode,
  ProviderTelemetry,
  ScenarioConfig,
  ToolExecutionRecord,
} from "../studio/types";
import {
  addDays,
  formatLocalDate,
  formatPrettyDate,
  formatTime12h,
  getNextOpenStudioDates,
} from "../calendar/dateUtils";
import { STUDIO_TOOLS, createStudioToolFunctions } from "./tools";

export interface RuntimeProviderConfig {
  mode?: ProviderMode;
  geminiApiKey?: string;
  openrouterApiKey?: string;
  geminiModel?: string;
  openrouterModel?: string;
}

export function buildSystemPrompt(clientPhone: string): string {
  const todayStr = formatLocalDate(new Date());
  const upcomingDays = Array.from({ length: 10 }, (_, idx) => {
    const d = addDays(todayStr, idx);
    return `${d} (${formatPrettyDate(d)})`;
  }).join("\n  - ");

  const servicesSummary = STUDIO_SERVICES.map(
    (s) =>
      `- ${s.name} (id: "${s.id}"): ${s.durationMinutes} mins | $${s.price.toLocaleString("es-MX")} MXN ($${s.depositAmount.toLocaleString("es-MX")} anticipo) | Máx ${s.maxParticipants} persona(s)`,
  ).join("\n  ");

  const addOnsSummary = STUDIO_ADDONS.map(
    (a) =>
      `- ${a.name} (id: "${a.id}"): +$${a.price.toLocaleString("es-MX")} MXN${a.extraMinutes > 0 ? ` (+${a.extraMinutes}m)` : ""} — ${a.description}`,
  ).join("\n  ");

  const photographersSummary = STUDIO_PHOTOGRAPHERS.map(
    (p) => `- ${p.name} (${p.role}, ${p.assignedRoom}): Especialidades: ${p.specialties.join(", ")}`,
  ).join("\n  ");

  const hoursSummary = STUDIO_HOURS.map((h) =>
    h.isOpen
      ? `${h.dayName}: ${formatTime12h(h.openTime)} – ${formatTime12h(h.closeTime)}`
      : `${h.dayName}: Cerrado`,
  ).join(" | ");

  return `Eres ${STUDIO_INFO.coordinatorName}, la Coordinadora de Citas con Inteligencia Artificial del estudio fotográfico mexicano "${STUDIO_INFO.name}".
Te comunicas con los clientes por WhatsApp y SMS de manera cálida, profesional, atenta y con hospitalidad mexicana para resolver dudas, revisar disponibilidad de agenda en tiempo real, cotizar paquetes con complementos, coordinar con fotógrafos y sets, enviar guías de preparación/vestuario con enlaces de anticipo, gestionar la lista de espera prioritaria y agendar, reprogramar o cancelar sesiones. Hablas español mexicano por defecto, pero si el cliente escribe en inglés, responde en inglés con la misma calidez y precisión.

CONTEXTO DE FECHA ACTUAL:
- Fecha de hoy: ${todayStr} (${formatPrettyDate(todayStr)})
- Teléfono del cliente: ${clientPhone}
- Próximos días de estudio:
  - ${upcomingDays}

DETALLES DEL ESTUDIO JUNTOSXSIEMPRE:
- Nombre: ${STUDIO_INFO.name}
- Lema: ${STUDIO_INFO.tagline}
- Dirección: ${STUDIO_INFO.address}
- Estacionamiento: ${STUDIO_INFO.parkingInfo}
- Horarios de servicio: ${hoursSummary}
- Tiempo de transición/buffer entre sesiones: ${STUDIO_INFO.bufferMinutes} minutos
- Política de cancelación: ${STUDIO_INFO.cancellationPolicy}
- Tiempos de entrega: ${STUDIO_INFO.turnaroundPolicy}
- Consejos de vestuario: ${STUDIO_INFO.wardrobeTips}

PAQUETES FOTOGRÁFICOS:
  ${servicesSummary}

COMPLEMENTOS OPCIONALES (ADD-ONS):
  ${addOnsSummary}

EQUIPO DE FOTÓGRAFOS Y SETS:
  ${photographersSummary}

FONDOS DISPONIBLES:
  - ${STUDIO_BACKDROPS.join("\n  - ")}

REGLAS ESTRICTAS DE OPERACIÓN:
1. SIEMPRE usa \`checkAvailableBookings\` o \`getAvailableSlots\` para consultar la agenda en tiempo real antes de proponer fechas u horarios libres. NUNCA inventes o asumas disponibilidad.
2. Usa \`calculateSessionQuote\` cada vez que un cliente pida una cotización con complementos (maquillaje, fotos extra, entrega express 24h, video reel, vestuario) o personas adicionales.
3. Usa \`getStudioTeamAndSpaces\` cuando pregunten por los fotógrafos (Sofía, Mateo, Valentina), sets en Nogales, Sonora, equipo Profoto o fondos disponibles.
4. Usa \`updateAppointmentDetails\` cuando el cliente quiera agregar un complemento, cambiar de fotógrafo, agregar notas o participantes a una cita ya existente.
5. Usa \`sendPrepGuideAndDepositLink\` cuando soliciten la guía de preparación de vestuario, información del estacionamiento o enlace para pagar su anticipo.
6. Usa \`joinWaitlist\` si el horario o fecha que el cliente busca ya está reservado.
7. Mantén mensajes cálidos, claros y concisos (2 a 4 párrafos cortos o viñetas amigables para lectura rápida en celular).
8. Para confirmar una cita con \`bookAppointment\`, asegúrate de tener:
   - Paquete (\`serviceId\`)
   - Fecha (\`YYYY-MM-DD\`) y hora (\`HH:mm\`)
   - Nombre completo (\`clientName\`) y correo (\`clientEmail\`)
   - Teléfono (\`clientPhone\` — si no especifica otro, usa ${clientPhone})
9. Cuando una reserva se confirme, proporciona siempre el Código de Reservación (ej. \`JXS-xxxx\`), fecha y hora, nombre de la sesión y dirección del estudio.
10. Para reprogramar, actualizar o cancelar, si el cliente no proporciona su código de reservación, consulta primero con \`getAppointment\`.`;
}

export function resolveProviderSetup(config?: RuntimeProviderConfig): {
  provider: ILLMProvider;
  configuredMode: ProviderMode;
  primaryId: LLMProviderId;
  geminiConfigured: boolean;
  openrouterConfigured: boolean;
  getFallbackStatus: () => { triggered: boolean; reason?: string; activeName: string };
} {
  const geminiKey = (config?.geminiApiKey || process.env.GEMINI_API_KEY || "").trim();
  const openrouterKey = (config?.openrouterApiKey || process.env.OPENROUTER_API_KEY || "").trim();

  const geminiConfigured = Boolean(
    geminiKey && geminiKey !== "your_gemini_api_key_here",
  );
  const openrouterConfigured = Boolean(
    openrouterKey && openrouterKey !== "your_openrouter_api_key_here",
  );

  const envDefault = (process.env.DEFAULT_LLM_PROVIDER || "").toLowerCase().trim();
  let defaultMode: ProviderMode = "gemini-with-fallback";
  if (envDefault === "openrouter") {
    defaultMode = "openrouter-with-fallback";
  } else if (!envDefault && openrouterConfigured && !geminiConfigured) {
    defaultMode = "openrouter-with-fallback";
  }

  const mode: ProviderMode = config?.mode || defaultMode;

  const geminiModelChoice = (config?.geminiModel || process.env.GEMINI_MODEL || "").trim();
  const openrouterModelChoice = (config?.openrouterModel || process.env.OPENROUTER_MODEL || "").trim();

  const geminiProvider = new GeminiProvider(
    geminiConfigured ? geminiKey : "",
    geminiModelChoice
      ? { mainModel: geminiModelChoice, fastModel: geminiModelChoice }
      : undefined,
  );

  const openrouterProvider = new OpenRouterProvider(
    openrouterConfigured ? openrouterKey : "",
    openrouterModelChoice
      ? {
          mainModel: openrouterModelChoice,
          fastModel: openrouterModelChoice,
          plannerModel: openrouterModelChoice,
        }
      : undefined,
  );

  let fallbackTriggered = false;
  let fallbackReason: string | undefined;

  const primaryId: LLMProviderId =
    mode === "openrouter-with-fallback" || mode === "openrouter-only"
      ? "openrouter"
      : "gemini";

  let provider: ILLMProvider;

  if (mode === "gemini-only") {
    provider = geminiProvider;
  } else if (mode === "openrouter-only") {
    provider = openrouterProvider;
  } else if (mode === "openrouter-with-fallback") {
    provider = new FallbackProvider(openrouterProvider, geminiProvider, {
      onFallback: (err) => {
        fallbackTriggered = true;
        fallbackReason = err instanceof Error ? err.message : String(err);
      },
    });
  } else {
    provider = new FallbackProvider(geminiProvider, openrouterProvider, {
      onFallback: (err) => {
        fallbackTriggered = true;
        fallbackReason = err instanceof Error ? err.message : String(err);
      },
    });
  }

  return {
    provider,
    configuredMode: mode,
    primaryId,
    geminiConfigured,
    openrouterConfigured,
    getFallbackStatus: () => {
      let activeName = primaryId === "gemini" ? "Google Gemini" : "OpenRouter";
      if (fallbackTriggered) {
        activeName = primaryId === "gemini" ? "OpenRouter (Failover)" : "Google Gemini (Failover)";
      } else if (
        mode === "gemini-with-fallback" &&
        !geminiConfigured &&
        openrouterConfigured
      ) {
        fallbackTriggered = true;
        fallbackReason = "Gemini API key no configurada; enrutado automáticamente a OpenRouter.";
        activeName = "OpenRouter (Auto-Failover)";
      } else if (
        mode === "openrouter-with-fallback" &&
        !openrouterConfigured &&
        geminiConfigured
      ) {
        fallbackTriggered = true;
        fallbackReason = "OpenRouter API key no configurada; enrutado automáticamente a Google Gemini.";
        activeName = "Google Gemini (Auto-Failover)";
      }
      return {
        triggered: fallbackTriggered,
        reason: fallbackReason,
        activeName,
      };
    },
  };
}

/**
 * Coordinador inteligente local determinístico para juntosxsiempre cuando no hay
 * API keys configuradas, permitiendo que la app funcione 100% interactiva de inmediato.
 */
async function runSmartLocalDemoCoordinator(
  userMessage: string,
  history: StandardMessage[],
  clientPhone: string,
  scenarioContext?: ScenarioConfig,
): Promise<{
  reply: string;
  toolExecutions: ToolExecutionRecord[];
}> {
  const toolsMap = createStudioToolFunctions(clientPhone, scenarioContext);
  const toolExecutions: ToolExecutionRecord[] = [];
  const lower = userMessage.toLowerCase();
  const todayStr = formatLocalDate(new Date());
  const openDates = getNextOpenStudioDates(todayStr, 5);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const callTool = async (name: string, args: Record<string, unknown>): Promise<Record<string, any>> => {
    const fn = toolsMap[name];
    const result = await fn(args);
    toolExecutions.push({
      id: `tool-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      toolName: name,
      args,
      result,
      timestamp: new Date().toISOString(),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result as Record<string, any>;
  };

  const refMatch = userMessage.match(/\b(JXS-\d{4}|LUM-\d{4})\b/i);

  // 0. Si se está ejecutando un escenario personalizado desde el Constructor de Escenarios
  if (scenarioContext) {
    const sc = scenarioContext;
    const basePrice = sc.customBasePrice || 2800;
    const enabledAddOns = (sc.customAddOns || []).filter((a) => a.enabled);
    const addOnsTotal = enabledAddOns.reduce((sum, a) => sum + a.price, 0);
    const grandTotal = basePrice + addOnsTotal;
    const deposit = Math.round(basePrice * 0.3);
    const balance = grandTotal - deposit;
    const photogName = sc.photographerName || "Sofía Morales";
    const assignedSet = sc.assignedSet || "Set A — Galería Nogales & Luz Natural";

    if (sc.scenarioId === "cancelacion-rescate") {
      const targetRef = refMatch ? refMatch[1].toUpperCase() : "JXS-2041";
      await callTool("cancelAppointment", {
        bookingRef: targetRef,
        reason: "Cancelación de emergencia en el Escenario del Dueño",
      });
      return {
        reply: `¡Hola! He procesado de inmediato la cancelación de la cita **${targetRef}** (Sábado 11:00 AM) para liberar el espacio en el estudio.\n\n🔄 **Auto-Rescate de Horario Activado:**\nIdentifiqué a **Lucía Benítez** (WTL-8104) en la Lista de Espera Reactiva que solicitó exactamente sábado por la mañana. Se le notificó por SMS para confirmar de inmediato.\n\n💰 **Impacto:** Horario salvado ($${basePrice.toLocaleString("es-MX")} MXN recuperados, $0 tiempo muerto para ${photogName}).`,
        toolExecutions,
      };
    }

    if (sc.scenarioId === "buffer-15m") {
      await callTool("checkAvailableBookings", {
        date: openDates[0],
        daysCount: 1,
        timeOfDay: "afternoon",
      });
      return {
        reply: `¡Hola! Con mucho gusto te atenderíamos, pero a las **12:05 PM** tenemos activo nuestro **Buffer Profoto de 15 Minutos** 🛡️.\n\nEn **juntosxsiempre** reservamos 15 minutos exactos entre sesiones para que las lámparas Profoto Pro-11 enfríen sus condensadores, higienizar el ciclorama y recibirte con café o té sin prisas.\n\n✨ **Horario Seguro Disponible:** Te puedo agendar perfectamente a las **12:15 PM** con **${photogName}** en **${assignedSet}**.\n\n¿Te aparto las 12:15 PM para iniciar puntuales?`,
        toolExecutions,
      };
    }

    if (sc.scenarioId === "pareja-nocturna") {
      await callTool("calculateSessionQuote", {
        serviceId: "pareja-juntos",
        addOns: enabledAddOns.map((a) => a.id).join(","),
        participants: 2,
      });
      await callTool("checkAvailableBookings", {
        date: openDates[0],
        daysCount: 2,
        timeOfDay: "late",
      });
      const addOnList = enabledAddOns
        .map((a) => `• +$${a.price.toLocaleString("es-MX")} MXN — **${a.name}**`)
        .join("\n");

      return {
        reply: `¡Hola! 🌙 Qué gusto saludarte a las 11:45 PM. ¡En **juntosxsiempre** estamos listos para atenderte las 24 horas y que no te quedes sin tu fecha!\n\nPara este sábado al atardecer sonorense (4:30 PM) tenemos el horario dorado ideal en **${assignedSet}** con **${photogName}**.\n\n📊 **Cotización a Tu Medida:**\n• **Sesión de Pareja Base**: $${basePrice.toLocaleString("es-MX")} MXN (60 min)\n${addOnList || "• Sin complementos adicionales"}\n\n🌸 **Total Estimado**: **$${grandTotal.toLocaleString("es-MX")} MXN**\n• **Anticipo para congelar horario**: $${deposit.toLocaleString("es-MX")} MXN (100% transferible)\n• **Saldo en el estudio**: $${balance.toLocaleString("es-MX")} MXN\n\n¿Te aparto de una vez las 4:30 PM de este sábado antes de que se ocupe? Solo confírmame los nombres de ambos. 📸`,
        toolExecutions,
      };
    }

    if (sc.scenarioId === "novia-indecisa") {
      await callTool("calculateSessionQuote", {
        serviceId: "pareja-juntos",
        addOns: enabledAddOns.map((a) => a.id).join(","),
        participants: 2,
      });
      const addOnList = enabledAddOns
        .map((a) => `• **${a.name}** (+$${a.price.toLocaleString("es-MX")} MXN)`)
        .join("\n");

      return {
        reply: `¡Felicidades por su compromiso! 💍🌸 Para una sesión previa inolvidable con estilo de portada de revista, **${photogName}** en **${assignedSet}** es la mejor elección en Nogales.\n\n💎 **Paquete Premium Recomendado:**\n• **Sesión Juntos x Siempre**: $${basePrice.toLocaleString("es-MX")} MXN (60 min de shooting)\n${addOnList}\n\n✨ **Ticket Total**: **$${grandTotal.toLocaleString("es-MX")} MXN** (Anticipo de $${deposit.toLocaleString("es-MX")} MXN).\n\nCon el maquillaje en camerino llegas relajada 30 min antes y el Reel 4K te dejará contenido cinematográfico para compartir el mismo día. ¿Les gustaría apartar para el próximo sábado al atardecer?`,
        toolExecutions,
      };
    }

    // Caso personalizado (custom-case)
    await callTool("calculateSessionQuote", {
      serviceId: "pareja-juntos",
      addOns: enabledAddOns.map((a) => a.id).join(","),
      participants: 2,
    });
    const customAddOnText =
      enabledAddOns.length > 0
        ? enabledAddOns.map((a) => `• +$${a.price.toLocaleString("es-MX")} MXN — ${a.name}`).join("\n")
        : "• Complementos: Sin complementos adicionales";

    return {
      reply: `¡Hola! Con mucho gusto te atiendo en **juntosxsiempre** en Nogales, Sonora.\n\nPara lo que necesitas, te recomiendo a **${photogName}** en **${assignedSet}**.\n\n📋 **Propuesta Personalizada:**\n• **Inversión Base**: $${basePrice.toLocaleString("es-MX")} MXN\n${customAddOnText}\n\n🌸 **Inversión Total**: **$${grandTotal.toLocaleString("es-MX")} MXN** (Anticipo: $${deposit.toLocaleString("es-MX")} MXN 100% transferible).\n\n¿Para qué día de la semana te gustaría que revisemos los horarios disponibles?`,
      toolExecutions,
    };
  }

  // 1. Cancelación
  if (lower.includes("cancel") || lower.includes("cancelar") || lower.includes("cancelacion")) {
    const query = refMatch ? refMatch[1].toUpperCase() : clientPhone;
    const lookup = await callTool("getAppointment", { query });
    if (lookup.found && lookup.appointments?.length > 0) {
      const target = lookup.appointments[0];
      const cancelled = await callTool("cancelAppointment", {
        bookingRef: target.bookingRef,
        reason: "Cliente solicitó cancelación vía mensaje",
      });
      if (cancelled.success) {
        const waitlistNote =
          cancelled.waitlistAutoNotified?.length > 0
            ? `\n\n🔔 Notificamos automáticamente a ${cancelled.waitlistAutoNotified.length} persona(s) en lista de espera (${cancelled.waitlistAutoNotified.map((w: { clientName: string }) => w.clientName).join(", ")}) que este horario quedó libre.`
            : "";
        return {
          reply: `¡Entendido! He cancelado tu cita para ${target.serviceName} (${target.bookingRef}) programada para el ${target.prettyDate} a las ${target.timeLabel}. Tu espacio ha sido liberado.${waitlistNote} ¡Con gusto te ayudamos a reagendar cuando desees!`,
          toolExecutions,
        };
      }
    }
    return {
      reply: `Con gusto te apoyo a cancelar tu sesión. ¿Me compartes tu código de reservación (ej. JXS-2041) o el número celular o correo con el que agendaste?`,
      toolExecutions,
    };
  }

  // 2. Reprogramación
  if (lower.includes("reschedule") || lower.includes("reprogramar") || lower.includes("cambiar fecha") || lower.includes("mover")) {
    const query = refMatch ? refMatch[1].toUpperCase() : "JXS-2041";
    const lookup = await callTool("getAppointment", { query });
    if (lookup.found && lookup.appointments?.length > 0) {
      const target = lookup.appointments[0];
      const newDate = openDates[1] || openDates[0];
      const timeMatch = userMessage.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i);
      const newStartTime = timeMatch ? timeMatch[1] : "15:00";

      const resched = await callTool("rescheduleAppointment", {
        bookingRef: target.bookingRef,
        newDate,
        newStartTime,
      });

      if (resched.success) {
        return {
          reply: `¡Listo! Tu ${resched.appointment.serviceName} (${resched.appointment.bookingRef}) quedó reprogramada para el ${resched.appointment.prettyDate} a las ${resched.appointment.time}. ¡Nos vemos en ${STUDIO_INFO.address}!`,
          toolExecutions,
        };
      }
    }
  }

  // 2b. Guía de preparación y enlace de anticipo
  if (
    lower.includes("prep") ||
    lower.includes("guia") ||
    lower.includes("guía") ||
    lower.includes("ropa") ||
    lower.includes("vestuario") ||
    lower.includes("anticipo") ||
    lower.includes("deposito") ||
    lower.includes("depósito") ||
    lower.includes("checklist")
  ) {
    const targetRef = refMatch ? refMatch[1].toUpperCase() : "JXS-2055";
    const prep = await callTool("sendPrepGuideAndDepositLink", { bookingRef: targetRef });
    if (prep.success) {
      const checklistBullets = (prep.prepChecklist || [])
        .slice(0, 3)
        .map((c: string) => `• ${c}`)
        .join("\n");
      return {
        reply: `¡Te envié la **Guía de Preparación & Enlace de Anticipo** para **${prep.bookingRef}** (${prep.clientName})! 📋🌸\n\n**Recomendaciones para tu sesión:**\n${checklistBullets}\n\n💳 **Enlace de Anticipo (${prep.depositAmount}):** ${prep.depositPaymentUrl}`,
        toolExecutions,
      };
    }
  }

  // 2c. Actualizar detalles de cita (complementos, fotógrafo, notas)
  if (
    refMatch &&
    (lower.includes("agregar") ||
      lower.includes("upgrade") ||
      lower.includes("maquillaje") ||
      lower.includes("peinado") ||
      lower.includes("fondo") ||
      lower.includes("fotografo") ||
      lower.includes("fotógrafo") ||
      lower.includes("reel") ||
      lower.includes("sofia") ||
      lower.includes("mateo"))
  ) {
    const bookingRef = refMatch[1].toUpperCase();
    const matchedAddOns = findStudioAddOns(userMessage).map((a) => a.id).join(",");
    const matchedPhotog = findPhotographer(userMessage);
    const updated = await callTool("updateAppointmentDetails", {
      bookingRef,
      addOns: matchedAddOns || undefined,
      photographerName: matchedPhotog?.name,
      notes: userMessage,
    });
    if (updated.success && updated.appointment) {
      const apt = updated.appointment;
      return {
        reply: `¡Actualizamos tu reservación **${apt.bookingRef}** (${apt.serviceName})! ✨\n• **Fotógrafo**: ${apt.photographerName}\n• **Complementos**: ${(apt.addOns || []).join(", ") || "Ninguno"}\n• **Total Actualizado**: $${apt.price.toLocaleString("es-MX")} MXN\n• **Notas**: ${apt.notes}`,
        toolExecutions,
      };
    }
  }

  // 2d. Cotización personalizada + Complementos
  if (
    lower.includes("cotizar") ||
    lower.includes("cotizacion") ||
    lower.includes("cotización") ||
    lower.includes("quote") ||
    lower.includes("cuanto cuesta") ||
    lower.includes("cuánto cuesta") ||
    lower.includes("maquillaje") ||
    lower.includes("reel") ||
    lower.includes("complemento") ||
    lower.includes("addon")
  ) {
    const svc = findStudioService(userMessage) || STUDIO_SERVICES[0];
    const addOns = findStudioAddOns(userMessage);
    const addOnsStr =
      addOns.length > 0 ? addOns.map((a) => a.id).join(",") : "maquillaje-peinado,entrega-express";
    const quoteRes = await callTool("calculateSessionQuote", {
      serviceId: svc.id,
      addOns: addOnsStr,
      participants: svc.maxParticipants,
    });
    if (quoteRes.quoteSummary) {
      const addonLines = (quoteRes.selectedAddOns || [])
        .map((a: { name: string; price: number }) => `• +$${a.price.toLocaleString("es-MX")} MXN — ${a.name}`)
        .join("\n");
      return {
        reply: `Aquí tienes tu cotización personalizada para **${quoteRes.package.name}** en juntosxsiempre:\n\n• **Paquete Base**: $${quoteRes.package.basePrice.toLocaleString("es-MX")} MXN (${quoteRes.package.baseDurationMinutes} mins)\n${addonLines}\n\n🌸 **Total Estimado**: **${quoteRes.quoteSummary.totalPrice}** (${quoteRes.quoteSummary.estimatedTotalTimeMinutes} mins totales)\n• **Anticipo para reservar**: ${quoteRes.quoteSummary.depositRequiredToBook}\n• **Saldo en el estudio**: ${quoteRes.quoteSummary.remainingBalanceAtSession}\n\n¿Te gustaría que te muestre los horarios disponibles para esta sesión?`,
        toolExecutions,
      };
    }
  }

  // 2e. Equipo de fotógrafos, sets, cámaras o fondos
  if (
    lower.includes("fotografo") ||
    lower.includes("fotógrafo") ||
    lower.includes("equipo") ||
    lower.includes("quien toma") ||
    lower.includes("quién toma") ||
    lower.includes("sets") ||
    lower.includes("fondos") ||
    lower.includes("backdrops") ||
    lower.includes("sofia") ||
    lower.includes("sofía") ||
    lower.includes("mateo") ||
    lower.includes("valentina")
  ) {
    const teamData = await callTool("getStudioTeamAndSpaces", {});
    const photogBullets = (teamData.photographers || [])
      .map(
        (p: { name: string; role: string; assignedRoom: string; specialties: string[] }) =>
          `• **${p.name}** (${p.role} • ${p.assignedRoom})\n  *Especialidades: ${p.specialties.join(", ")}*`,
      )
      .join("\n");
    const backdropSample = (teamData.backdropsAvailable || []).slice(0, 4).join(", ");
    return {
      reply: `¡Conoce a nuestro equipo creativo y sets en **${STUDIO_INFO.name}**! 📸✨\n\n${photogBullets}\n\n🎨 **Fondos Disponibles**: ${backdropSample}\n\n¡Puedes solicitar a tu fotógrafo de preferencia al agendar tu cita!`,
      toolExecutions,
    };
  }

  // 2f. Lista de espera prioritaria
  if (
    lower.includes("espera") ||
    lower.includes("waitlist") ||
    lower.includes("avisame") ||
    lower.includes("avísame") ||
    lower.includes("si se abre") ||
    lower.includes("si se cancela")
  ) {
    const svc = findStudioService(userMessage) || STUDIO_SERVICES[0];
    const emailMatchWl = userMessage.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const dateMatchWl = userMessage.match(/\b(202\d-\d{2}-\d{2})\b/);
    let clientName = "Lucía Morales";
    const nameMatch =
      userMessage.match(/(?:nombre es|soy|me llamo|para)\s+([A-ZÁÉÍÓÚa-záéíóú]+(?:\s+[A-ZÁÉÍÓÚa-záéíóú]+)?)/i);
    if (nameMatch?.[1]) {
      clientName = nameMatch[1].trim();
    }
    const wlRes = await callTool("joinWaitlist", {
      clientName,
      clientPhone,
      clientEmail: emailMatchWl ? emailMatchWl[1] : "lucia@ejemplo.mx",
      serviceId: svc.id,
      preferredDate: dateMatchWl ? dateMatchWl[1] : openDates[0],
      preferredTimeWindow: lower.includes("mañana")
        ? "Mañana (9 AM - 12 PM)"
        : lower.includes("tarde")
          ? "Tarde (12 PM - 4 PM)"
          : "Cualquier horario disponible",
      notes: "Solicitud vía SMS / WhatsApp juntosxsiempre",
    });
    if (wlRes.success) {
      const w = wlRes.waitlistEntry;
      return {
        reply: `¡Ya estás en nuestra Lista de Espera Prioritaria! 🔔🌸\n\n• **Ref de Espera**: ${w.waitlistRef}\n• **Sesión**: ${w.serviceName}\n• **Fecha Preferida**: ${formatPrettyDate(w.preferredDate)} (${w.preferredTimeWindow})\n• **Cliente**: ${w.clientName}\n\nSi se abre un espacio para el ${formatPrettyDate(w.preferredDate)}, te enviaremos de inmediato un mensaje para confirmarlo en 1 tap.`,
        toolExecutions,
      };
    }
  }

  // 3. Consulta de estatus de cita
  if (
    lower.includes("mi cita") ||
    lower.includes("mi reservacion") ||
    lower.includes("mi reservación") ||
    lower.includes("consultar") ||
    (refMatch && !lower.includes("agendar") && !lower.includes("reservar"))
  ) {
    const query = refMatch ? refMatch[1].toUpperCase() : "Mariana";
    const lookup = await callTool("getAppointment", { query });
    if (lookup.found && lookup.appointments?.length > 0) {
      const apt = lookup.appointments[0];
      return {
        reply: `Aquí están los detalles de tu reservación **${apt.bookingRef}** en juntosxsiempre:\n• **Cliente**: ${apt.clientName}\n• **Sesión**: ${apt.serviceName}\n• **Fecha**: ${apt.prettyDate} (${apt.timeLabel})\n• **Fotógrafo**: ${apt.photographerName}\n• **Estatus**: ${apt.status.toUpperCase()}\n\n¡Respóndeme si necesitas reprogramar, agregar complementos o cancelar!`,
        toolExecutions,
      };
    }
  }

  // 4. Agendar y confirmar reserva
  const emailMatch = userMessage.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const dateMatch = userMessage.match(/\b(202\d-\d{2}-\d{2})\b/);
  const timeMatch = userMessage.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{2}:\d{2})\b/i);

  if (emailMatch || (lower.includes("agendar") && (timeMatch || dateMatch)) || lower.includes("reservar")) {
    const combinedContext = [...history.map((h) => String(h.content)), userMessage].join(" ");
    const service = findStudioService(combinedContext) || STUDIO_SERVICES[0];
    const targetDate = dateMatch ? dateMatch[1] : openDates[0];
    const targetTime = timeMatch ? timeMatch[1] : "11:30";

    let clientName = "Fernanda Castillo";
    const nameMatch =
      userMessage.match(/(?:nombre es|me llamo|soy|para)\s+([A-ZÁÉÍÓÚa-záéíóú]+(?:\s+[A-ZÁÉÍÓÚa-záéíóú]+)?)/i) ||
      userMessage.match(/^([A-ZÁÉÍÓÚa-záéíóú]+\s+[A-ZÁÉÍÓÚa-záéíóú]+)[,\s]/);
    if (nameMatch?.[1]) {
      clientName = nameMatch[1].trim();
    }

    const clientEmail = emailMatch ? emailMatch[1] : "fernanda.castillo@gmail.com";

    const bookingResult = await callTool("bookAppointment", {
      clientName,
      clientPhone,
      clientEmail,
      serviceId: service.id,
      date: targetDate,
      startTime: targetTime,
      participants: service.maxParticipants,
      notes: "Agendado vía Coordinadora SMS juntosxsiempre",
    });

    if (bookingResult.success) {
      const apt = bookingResult.appointment;
      return {
        reply: `¡Tu cita en **${STUDIO_INFO.name}** está oficialmente confirmada! 📸🌸\n\n• **Código de Reserva**: ${apt.bookingRef}\n• **Sesión**: ${apt.serviceName}\n• **Fecha y Horario**: ${apt.prettyDate} a las ${apt.time}\n• **Cliente**: ${apt.clientName} (${apt.clientEmail})\n• **Fotógrafo**: ${apt.photographerName}\n• **Ubicación**: ${apt.studioAddress}\n\nTe enviamos un correo con los detalles y el enlace para tu anticipo de ${apt.depositRequired}. ¡Cualquier duda sobre tu vestuario o llegada, aquí estoy para ayudarte!`,
        toolExecutions,
      };
    } else {
      const alts = (bookingResult.suggestedAlternatives || [])
        .map((a: { label: string }) => `• ${a.label}`)
        .join("\n");
      return {
        reply: `Ese horario no estaba disponible (${bookingResult.error}). Te comparto los espacios abiertos para ese día:\n${alts || "Por favor consulta nuestro siguiente día de apertura."}\n\n¿Cuál de estos te acomoda mejor?`,
        toolExecutions,
      };
    }
  }

  // 5. Precios / Paquetes / Información general
  if (
    lower.includes("precio") ||
    lower.includes("paquete") ||
    lower.includes("servicio") ||
    lower.includes("costo") ||
    lower.includes("planes") ||
    lower.includes("price") ||
    lower.includes("packages")
  ) {
    const catalog = await callTool("getStudioServices", { category: "all" });
    const list = (catalog.services || [])
      .map(
        (s: { name: string; durationMinutes: number; price: number }) =>
          `• **${s.name}** (${s.durationMinutes}m) — $${s.price.toLocaleString("es-MX")} MXN`,
      )
      .join("\n");
    return {
      reply: `¡Hola! Soy ${STUDIO_INFO.coordinatorName} de **${STUDIO_INFO.name}** en Nogales, Sonora, México. Te comparto nuestros paquetes fotográficos:\n\n${list}\n\nAbrimos de martes a viernes (9:00 AM–6:00 PM) y sábados (10:00 AM–5:00 PM). ¿Para qué tipo de sesión te gustaría consultar fechas disponibles?`,
      toolExecutions,
    };
  }

  // 6. Disponibilidad por defecto (consulta de horarios para el paquete seleccionado o solicitado)
  const matchedService = findStudioService(userMessage) || STUDIO_SERVICES[0];
  let targetStartDate = openDates[0];
  if (lower.includes("sabado") || lower.includes("sábado") || lower.includes("fin de semana")) {
    const sat = openDates.find((d) => formatPrettyDate(d).toLowerCase().startsWith("sáb"));
    if (sat) targetStartDate = sat;
  } else if (dateMatch) {
    targetStartDate = dateMatch[1];
  }

  let timePref = "any";
  if (lower.includes("mañana") || lower.includes("morning")) timePref = "morning";
  else if (lower.includes("tarde") || lower.includes("afternoon")) timePref = "afternoon";

  const slotsData = await callTool("checkAvailableBookings", {
    date: targetStartDate,
    daysCount: 3,
    serviceId: matchedService.id,
    timeOfDay: timePref,
  });

  const openDaysWithSlots = (slotsData.days || slotsData.checkedRange || []).filter(
    (d: { isOpen: boolean; availableCount: number }) => d.isOpen && d.availableCount > 0,
  );

  const slotBullets = openDaysWithSlots
    .slice(0, 2)
    .map(
      (d: {
        prettyDate: string;
        date: string;
        availableSlots: { startTime: string; label: string }[];
      }) => {
        const sample = d.availableSlots
          .slice(0, 4)
          .map((s) => formatTime12h(s.startTime))
          .join(", ");
        return `• **${d.prettyDate} (${d.date})**: ${sample}`;
      },
    )
    .join("\n");

  return {
    reply: `¡Hola! Con gusto te comparto los horarios abiertos para la **${matchedService.name}** (${matchedService.durationMinutes} mins, $${matchedService.price.toLocaleString("es-MX")} MXN):\n\n${slotBullets}\n\nPara apartar tu fecha, respóndeme con el **día y hora deseados**, tu **nombre completo** y **correo electrónico**. ¡Te reservo al momento! 🌸`,
    toolExecutions,
  };
}

export async function processScheduleAgentTurn(params: {
  userMessage: string;
  history: StandardMessage[];
  clientPhone: string;
  providerConfig?: RuntimeProviderConfig;
  scenarioContext?: ScenarioConfig;
}): Promise<{
  reply: string;
  updatedHistory: StandardMessage[];
  toolExecutions: ToolExecutionRecord[];
  telemetry: ProviderTelemetry;
}> {
  const startTime = Date.now();
  const setup = resolveProviderSetup(params.providerConfig);
  const canUseLiveLLM = setup.provider.validateConfig();

  if (canUseLiveLLM) {
    try {
      const toolsMap = createStudioToolFunctions(params.clientPhone, params.scenarioContext);
      let systemPrompt = buildSystemPrompt(params.clientPhone);

      if (params.scenarioContext) {
        const sc = params.scenarioContext;
        const activeAddonNames = (sc.customAddOns || [])
          .filter((a) => a.enabled)
          .map((a) => `${a.name} ($${a.price.toLocaleString("es-MX")} MXN)`)
          .join(", ");

        systemPrompt += `\n\n🎯 SIMULACIÓN ACTIVA DEL DUEÑO DEL ESTUDIO EN NOGALES:
El dueño de juntosxsiempre está ejecutando el escenario interactivo "${sc.scenarioTitle}".
- Precio Base Personalizado por el Dueño: $${sc.customBasePrice.toLocaleString("es-MX")} MXN
- Complementos Ofrecidos: ${activeAddonNames || "Ninguno"}
- Fotógrafo y Set Asignado: ${sc.photographerName} (${sc.assignedSet})
- Objetivo de la IA: ${sc.aiObjective}
REGLA PRIORITARIA: Usa estos números y detalles exactos al cotizar o responder al cliente en este turno, manteniendo siempre la calidez, profesionalismo y precisión.`;
      }

      const agent = new ChatAgent(
        setup.provider,
        toolsMap,
        0.3,
        STUDIO_TOOLS,
        systemPrompt,
      );
      agent.setToolsEnabled(true);
      agent.loadHistory(params.history);

      const reply = await agent.sendMessage(params.userMessage, {
        reasoning: { effort: "low" },
        maxOutputTokens: 2048,
      });
      const activityLog = agent.getActivityLog();
      const updatedHistory = await agent.getChatHistory();

      if (reply.startsWith("Error processing chat message:")) {
        throw new Error(reply);
      }

      const toolExecutions: ToolExecutionRecord[] = [];
      let lastStartArgs: Record<string, unknown> = {};

      for (const entry of activityLog) {
        if (entry.action === "execute_function_chat_start") {
          const c = entry.content as { function_name: string; raw_args: Record<string, unknown> };
          lastStartArgs = c.raw_args || {};
        } else if (entry.action === "execute_function_chat_success") {
          const c = entry.content as { function_name: string; result: unknown };
          toolExecutions.push({
            id: `${entry.turn_id}-${toolExecutions.length}`,
            toolName: c.function_name,
            args: lastStartArgs,
            result: c.result,
            timestamp: entry.timestamp,
          });
          lastStartArgs = {};
        }
      }

      const fbStatus = setup.getFallbackStatus();

      return {
        reply,
        updatedHistory,
        toolExecutions,
        telemetry: {
          configuredMode: setup.configuredMode,
          primaryProvider: setup.primaryId,
          activeProvider: fbStatus.activeName,
          fallbackTriggered: fbStatus.triggered,
          fallbackReason: fbStatus.reason,
          latencyMs: Date.now() - startTime,
          usingDemoFallback: false,
          geminiConfigured: setup.geminiConfigured,
          openrouterConfigured: setup.openrouterConfigured,
        },
      };
    } catch (llmErr: unknown) {
      const errMsg = llmErr instanceof Error ? llmErr.message : String(llmErr);
      console.warn("[ScheduleAgent] Live LLM call failed, falling back to Smart Local Coordinator:", errMsg);

      const demoResult = await runSmartLocalDemoCoordinator(
        params.userMessage,
        params.history,
        params.clientPhone,
        params.scenarioContext,
      );

      const nextHistory: StandardMessage[] = [
        ...params.history,
        { role: "user", content: params.userMessage },
        { role: "model", content: demoResult.reply },
      ];

      return {
        reply: demoResult.reply,
        updatedHistory: nextHistory,
        toolExecutions: demoResult.toolExecutions,
        telemetry: {
          configuredMode: setup.configuredMode,
          primaryProvider: setup.primaryId,
          activeProvider: "Coordinador Local Inteligente (Failover Offline)",
          fallbackTriggered: true,
          fallbackReason: `Error en proveedor en vivo: ${errMsg}`,
          latencyMs: Date.now() - startTime,
          usingDemoFallback: true,
          geminiConfigured: setup.geminiConfigured,
          openrouterConfigured: setup.openrouterConfigured,
        },
      };
    }
  }

  // Sin llaves de API configuradas: usa el Coordinador Inteligente Local Determinístico
  const demoResult = await runSmartLocalDemoCoordinator(
    params.userMessage,
    params.history,
    params.clientPhone,
    params.scenarioContext,
  );

  const nextHistory: StandardMessage[] = [
    ...params.history,
    { role: "user", content: params.userMessage },
    { role: "model", content: demoResult.reply },
  ];

  return {
    reply: demoResult.reply,
    updatedHistory: nextHistory,
    toolExecutions: demoResult.toolExecutions,
    telemetry: {
      configuredMode: setup.configuredMode,
      primaryProvider: setup.primaryId,
      activeProvider: "Coordinador Local Inteligente (Motor juntosxsiempre)",
      fallbackTriggered: false,
      fallbackReason:
        "No se detectó GEMINI_API_KEY ni OPENROUTER_API_KEY; ejecutando el motor determinístico de citas de juntosxsiempre.",
      latencyMs: Date.now() - startTime,
      usingDemoFallback: true,
      geminiConfigured: setup.geminiConfigured,
      openrouterConfigured: setup.openrouterConfigured,
    },
  };
}
