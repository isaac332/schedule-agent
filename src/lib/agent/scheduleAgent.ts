import {
  ChatAgent,
  FallbackProvider,
  GeminiProvider,
  OpenRouterProvider,
  type ILLMProvider,
  type LLMProviderId,
  type StandardMessage,
} from "@llm-multi-provider/core";
import { STUDIO_HOURS, STUDIO_INFO, STUDIO_SERVICES, findStudioService } from "../studio/config";
import type {
  ProviderMode,
  ProviderTelemetry,
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
      `- ${s.name} (id: "${s.id}"): ${s.durationMinutes} mins | $${s.price} ($${s.depositAmount} deposit) | Max ${s.maxParticipants} person(s)`,
  ).join("\n  ");

  const hoursSummary = STUDIO_HOURS.map((h) =>
    h.isOpen
      ? `${h.dayName}: ${formatTime12h(h.openTime)} – ${formatTime12h(h.closeTime)}`
      : `${h.dayName}: Closed`,
  ).join(" | ");

  return `You are ${STUDIO_INFO.coordinatorName}, the AI Studio Booking Coordinator for ${STUDIO_INFO.name}.
You communicate with clients via SMS / text messaging to answer questions, check studio availability, and book, reschedule, or cancel photography appointments.

CURRENT DATE CONTEXT:
- Today's Date: ${todayStr} (${formatPrettyDate(todayStr)})
- Client's Phone Number: ${clientPhone}
- Upcoming Calendar Reference:
  - ${upcomingDays}

STUDIO DETAILS:
- Address: ${STUDIO_INFO.address}
- Parking: ${STUDIO_INFO.parkingInfo}
- Hours: ${hoursSummary}
- Buffer Between Shoots: ${STUDIO_INFO.bufferMinutes} minutes
- Cancellation Policy: ${STUDIO_INFO.cancellationPolicy}
- Turnaround Time: ${STUDIO_INFO.turnaroundPolicy}
- Wardrobe Advice: ${STUDIO_INFO.wardrobeTips}

PHOTOGRAPHY PACKAGES:
  ${servicesSummary}

STRICT OPERATING RULES:
1. ALWAYS use \`checkAvailableBookings\` or \`getAvailableSlots\` to retrieve real-time calendar availability before quoting any open appointment times. Never guess, invent, or assume availability.
2. Keep responses warm, concise, and SMS-friendly (2–4 short paragraphs max, using clear bullet points for time slots).
3. To complete a booking with \`bookAppointment\`, make sure you have:
   - Session type (\`serviceId\`)
   - Date (\`YYYY-MM-DD\`) and start time (\`HH:mm\`)
   - Client's full name (\`clientName\`) and email (\`clientEmail\`)
   - Client's phone number (\`clientPhone\` — default to ${clientPhone} if they are texting from it and haven't given another)
4. When a booking succeeds, always include the Booking Reference Code (e.g. \`LUM-xxxx\`), date/time, package name, and studio address.
5. For rescheduling or cancelling, use \`getAppointment\` first if the client didn't provide their \`LUM-xxxx\` booking reference.`;
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
        fallbackReason = "Gemini API key not set; automatically routed to OpenRouter.";
        activeName = "OpenRouter (Auto-Failover)";
      } else if (
        mode === "openrouter-with-fallback" &&
        !openrouterConfigured &&
        geminiConfigured
      ) {
        fallbackTriggered = true;
        fallbackReason = "OpenRouter API key not set; automatically routed to Google Gemini.";
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
 * Smart Local Deterministic Coordinator used when neither GEMINI_API_KEY nor OPENROUTER_API_KEY
 * is configured yet, ensuring the pilot works 100% interactively out of the box on local & Vercel.
 */
async function runSmartLocalDemoCoordinator(
  userMessage: string,
  history: StandardMessage[],
  clientPhone: string,
): Promise<{
  reply: string;
  toolExecutions: ToolExecutionRecord[];
}> {
  const toolsMap = createStudioToolFunctions(clientPhone);
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

  // 1. Check for Cancel intent
  const refMatch = userMessage.match(/\b(LUM-\d{4})\b/i);
  if (lower.includes("cancel")) {
    const query = refMatch ? refMatch[1].toUpperCase() : clientPhone;
    const lookup = await callTool("getAppointment", { query });
    if (lookup.found && lookup.appointments?.length > 0) {
      const target = lookup.appointments[0];
      const cancelled = await callTool("cancelAppointment", {
        bookingRef: target.bookingRef,
        reason: "Client requested cancellation via SMS",
      });
      if (cancelled.success) {
        return {
          reply: `Got it! I've cancelled your ${target.serviceName} appointment (${target.bookingRef}) scheduled for ${target.prettyDate} at ${target.timeLabel}. Your slot has been released. Let me know anytime you'd like to book a new shoot!`,
          toolExecutions,
        };
      }
    }
    return {
      reply: `I'd be happy to help cancel your session. Could you share your booking reference code (e.g., LUM-2041) or the phone number/email used when booking?`,
      toolExecutions,
    };
  }

  // 2. Check for Reschedule intent
  if (lower.includes("reschedule") || lower.includes("move my")) {
    const query = refMatch ? refMatch[1].toUpperCase() : "LUM-2041";
    const lookup = await callTool("getAppointment", { query });
    if (lookup.found && lookup.appointments?.length > 0) {
      const target = lookup.appointments[0];
      const newDate = openDates[1] || openDates[0];
      const timeMatch = userMessage.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
      const newStartTime = timeMatch ? timeMatch[1] : "15:00";

      const resched = await callTool("rescheduleAppointment", {
        bookingRef: target.bookingRef,
        newDate,
        newStartTime,
      });

      if (resched.success) {
        return {
          reply: `All set! Your ${resched.appointment.serviceName} (${resched.appointment.bookingRef}) has been moved to ${resched.appointment.prettyDate} at ${resched.appointment.time}. We'll see you at ${STUDIO_INFO.address}!`,
          toolExecutions,
        };
      }
    }
  }

  // 3. Check for Lookup / Status intent
  if (
    lower.includes("my booking") ||
    lower.includes("my appointment") ||
    lower.includes("check status") ||
    (refMatch && !lower.includes("book"))
  ) {
    const query = refMatch ? refMatch[1].toUpperCase() : "Elena";
    const lookup = await callTool("getAppointment", { query });
    if (lookup.found && lookup.appointments?.length > 0) {
      const apt = lookup.appointments[0];
      return {
        reply: `Here are the details for booking **${apt.bookingRef}**:\n• **Client**: ${apt.clientName}\n• **Package**: ${apt.serviceName}\n• **When**: ${apt.prettyDate} (${apt.timeLabel})\n• **Status**: ${apt.status.toUpperCase()}\n\nReply if you'd like to reschedule or cancel!`,
        toolExecutions,
      };
    }
  }

  // 4. Check for explicit booking confirmation details (email present or "book it" / "confirm")
  const emailMatch = userMessage.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const dateMatch = userMessage.match(/\b(202\d-\d{2}-\d{2})\b/);
  const timeMatch = userMessage.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{2}:\d{2})\b/i);

  if (emailMatch || (lower.includes("book") && timeMatch)) {
    const combinedContext = [...history.map((h) => String(h.content)), userMessage].join(" ");
    const service = findStudioService(combinedContext) || STUDIO_SERVICES[0];
    const targetDate = dateMatch ? dateMatch[1] : openDates[0];
    const targetTime = timeMatch ? timeMatch[1] : "11:00";

    // Extract name before email or after "for " / "name is "
    let clientName = "Jordan Taylor";
    const nameMatch =
      userMessage.match(/(?:name is|for|i'm|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i) ||
      userMessage.match(/^([A-Z][a-z]+\s+[A-Z][a-z]+)[,\s]/);
    if (nameMatch?.[1]) {
      clientName = nameMatch[1].trim();
    }

    const clientEmail = emailMatch ? emailMatch[1] : "jordan.taylor@example.com";

    const bookingResult = await callTool("bookAppointment", {
      clientName,
      clientPhone,
      clientEmail,
      serviceId: service.id,
      date: targetDate,
      startTime: targetTime,
      participants: service.id === "family-maternity" ? 4 : 1,
      notes: "Booked via SMS Schedule Agent",
    });

    if (bookingResult.success) {
      const apt = bookingResult.appointment;
      return {
        reply: `You're officially booked at ${STUDIO_INFO.name}! 📸\n\n• **Booking Ref**: ${apt.bookingRef}\n• **Session**: ${apt.serviceName}\n• **Date & Time**: ${apt.prettyDate} at ${apt.time}\n• **Client**: ${apt.clientName} (${apt.clientEmail})\n• **Location**: ${apt.studioAddress}\n\nWe've sent a calendar invite to ${apt.clientEmail}. Let me know if you need wardrobe tips or need to make any changes!`,
        toolExecutions,
      };
    } else {
      const alts = (bookingResult.suggestedAlternatives || [])
        .map((a: { label: string }) => `• ${a.label}`)
        .join("\n");
      return {
        reply: `That time wasn't open (${bookingResult.error}). Here are open slots on that day:\n${alts || "Please check our next open studio day."}\n\nWhich of these works best for you?`,
        toolExecutions,
      };
    }
  }

  // 5. Check for Pricing / Packages / FAQ
  if (
    lower.includes("price") ||
    lower.includes("pricing") ||
    lower.includes("package") ||
    lower.includes("service") ||
    lower.includes("cost") ||
    lower.includes("how much")
  ) {
    const catalog = await callTool("getStudioServices", { category: "all" });
    const list = (catalog.services || [])
      .map(
        (s: { name: string; durationMinutes: number; price: number }) =>
          `• **${s.name}** (${s.durationMinutes}m) — $${s.price}`,
      )
      .join("\n");
    return {
      reply: `Hi! I'm ${STUDIO_INFO.coordinatorName} at ${STUDIO_INFO.name}. Here are our photography packages:\n\n${list}\n\nWe're open Tue–Fri (9 AM–6 PM) and Sat (10 AM–5 PM). Which session type would you like to check availability for?`,
      toolExecutions,
    };
  }

  // 6. Default / Availability Intent: Check available bookings for requested service
  const matchedService = findStudioService(userMessage) || STUDIO_SERVICES[0];
  let targetStartDate = openDates[0];
  if (lower.includes("saturday") || lower.includes("weekend")) {
    const sat = openDates.find((d) => formatPrettyDate(d).toLowerCase().startsWith("sat"));
    if (sat) targetStartDate = sat;
  } else if (dateMatch) {
    targetStartDate = dateMatch[1];
  }

  let timePref = "any";
  if (lower.includes("morning")) timePref = "morning";
  else if (lower.includes("afternoon")) timePref = "afternoon";
  else if (lower.includes("evening") || lower.includes("late")) timePref = "late";

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
    reply: `Hi there! I retrieved our open calendar slots for the **${matchedService.name}** (${matchedService.durationMinutes} mins, $${matchedService.price}):\n\n${slotBullets}\n\nTo reserve your session, reply with your preferred **date & time**, **full name**, and **email address**!`,
    toolExecutions,
  };
}

export async function processScheduleAgentTurn(params: {
  userMessage: string;
  history: StandardMessage[];
  clientPhone: string;
  providerConfig?: RuntimeProviderConfig;
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
      const toolsMap = createStudioToolFunctions(params.clientPhone);
      const systemPrompt = buildSystemPrompt(params.clientPhone);

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

      // Check if ChatAgent caught an internal error and returned "Error processing chat message: ..."
      if (reply.startsWith("Error processing chat message:")) {
        throw new Error(reply);
      }

      // Extract tool executions in sequence from activityLog
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
          activeProvider: "Smart Local Coordinator (Offline Failover)",
          fallbackTriggered: true,
          fallbackReason: `Live provider error: ${errMsg}`,
          latencyMs: Date.now() - startTime,
          usingDemoFallback: true,
          geminiConfigured: setup.geminiConfigured,
          openrouterConfigured: setup.openrouterConfigured,
        },
      };
    }
  }

  // Neither API key configured yet — use Smart Local Coordinator seamlessly
  const demoResult = await runSmartLocalDemoCoordinator(
    params.userMessage,
    params.history,
    params.clientPhone,
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
      activeProvider: "Smart Local Coordinator (Add API Key for Live LLM)",
      fallbackTriggered: false,
      fallbackReason:
        "No GEMINI_API_KEY or OPENROUTER_API_KEY detected; running built-in deterministic studio tool engine.",
      latencyMs: Date.now() - startTime,
      usingDemoFallback: true,
      geminiConfigured: setup.geminiConfigured,
      openrouterConfigured: setup.openrouterConfigured,
    },
  };
}
