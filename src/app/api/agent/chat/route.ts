import { connection } from "next/server";
import {
  processScheduleAgentTurn,
  resolveProviderSetup,
  type RuntimeProviderConfig,
} from "@/lib/agent/scheduleAgent";
import {
  getAllAppointments,
  getOrCreateSession,
  saveSession,
  syncStoreFromClient,
} from "@/lib/storage/appointmentStore";
import { STUDIO_HOURS, STUDIO_INFO, STUDIO_SERVICES } from "@/lib/studio/config";
import type { Appointment, ChatTurnMessage, ConversationSession } from "@/lib/studio/types";

export async function GET() {
  await connection();
  const setup = resolveProviderSetup();

  return Response.json({
    studio: STUDIO_INFO,
    services: STUDIO_SERVICES,
    hours: STUDIO_HOURS,
    providerStatus: {
      defaultMode: setup.configuredMode,
      geminiConfigured: setup.geminiConfigured,
      openrouterConfigured: setup.openrouterConfigured,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      sessionId?: string;
      clientPhone?: string;
      message?: string;
      providerConfig?: RuntimeProviderConfig;
      resetSession?: boolean;
      clientAppointments?: Appointment[];
      clientHistory?: ConversationSession["history"];
    };

    const sessionId = body.sessionId || "default-web-sms-session";
    const clientPhone = body.clientPhone || "(555) 019-2834";

    if (!body.resetSession) {
      syncStoreFromClient({
        appointments: body.clientAppointments,
        sessionId,
        clientPhone,
        history: body.clientHistory,
      });
    }

    const session = getOrCreateSession(sessionId, clientPhone);

    if (body.resetSession) {
      session.history = [];
      session.uiMessages = [];
      saveSession(session);
      return Response.json({
        reset: true,
        session,
        history: [],
        appointments: getAllAppointments(),
      });
    }

    const userMessage = (body.message || "").trim();
    if (!userMessage) {
      return Response.json(
        { error: "Message text is required." },
        { status: 400 },
      );
    }

    const userTurnMsg: ChatTurnMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      text: userMessage,
      timestamp: new Date().toISOString(),
    };

    const result = await processScheduleAgentTurn({
      userMessage,
      history: session.history,
      clientPhone,
      providerConfig: body.providerConfig,
    });

    const assistantTurnMsg: ChatTurnMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: "assistant",
      text: result.reply,
      timestamp: new Date().toISOString(),
      toolExecutions: result.toolExecutions,
      telemetry: result.telemetry,
    };

    session.history = result.updatedHistory;
    session.uiMessages = [...session.uiMessages, userTurnMsg, assistantTurnMsg];
    saveSession(session);

    return Response.json({
      reply: result.reply,
      message: assistantTurnMsg,
      toolExecutions: result.toolExecutions,
      telemetry: result.telemetry,
      history: session.history,
      appointments: getAllAppointments(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return Response.json(
      { error: `Failed to process schedule agent message: ${msg}` },
      { status: 500 },
    );
  }
}
