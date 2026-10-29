import { processScheduleAgentTurn } from "@/lib/agent/scheduleAgent";
import { getOrCreateSession, saveSession } from "@/lib/storage/appointmentStore";
import type { ProviderMode } from "@/lib/studio/types";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let fromPhone = "(555) 019-2834";
    let messageBody = "";
    let providerMode: ProviderMode | undefined;
    let wantsXml = false;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      fromPhone = String(formData.get("From") || formData.get("from") || fromPhone);
      messageBody = String(formData.get("Body") || formData.get("body") || "");
      wantsXml = true;
    } else {
      const json = (await request.json()) as {
        From?: string;
        from?: string;
        Body?: string;
        body?: string;
        providerMode?: ProviderMode;
        format?: "twiml" | "json";
      };
      fromPhone = json.From || json.from || fromPhone;
      messageBody = json.Body || json.body || "";
      providerMode = json.providerMode;
      wantsXml = json.format === "twiml";
    }

    if (!messageBody.trim()) {
      return Response.json(
        { error: "Inbound SMS Body cannot be empty." },
        { status: 400 },
      );
    }

    const sessionId = `sms-${fromPhone.replace(/\D/g, "") || "default"}`;
    const session = getOrCreateSession(sessionId, fromPhone);

    const turnResult = await processScheduleAgentTurn({
      userMessage: messageBody,
      history: session.history,
      clientPhone: fromPhone,
      providerConfig: providerMode ? { mode: providerMode } : undefined,
    });

    session.history = turnResult.updatedHistory;
    saveSession(session);

    if (wantsXml) {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(
        turnResult.reply,
      )}</Message></Response>`;
      return new Response(twiml, {
        status: 200,
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }

    return Response.json({
      from: fromPhone,
      inboundText: messageBody,
      reply: turnResult.reply,
      toolExecutions: turnResult.toolExecutions,
      telemetry: turnResult.telemetry,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return Response.json(
      { error: `SMS webhook processing failed: ${msg}` },
      { status: 500 },
    );
  }
}
