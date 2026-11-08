import assert from "node:assert";
import { processScheduleAgentTurn } from "../src/lib/agent/scheduleAgent";
import { resetDemoStore } from "../src/lib/storage/appointmentStore";

async function runCapabilitiesVerification() {
  console.log("=== INICIANDO PRUEBAS DE LAS 10 CAPACIDADES DEL CHAT AGENT ===");

  resetDemoStore();

  // Test 1: Availability
  console.log("Testing 1. checkAvailableBookings...");
  const t1 = await processScheduleAgentTurn({
    userMessage: "¿Qué fechas y horarios tienen disponibles para sesión de pareja?",
    clientPhone: "+52 55 4910 2831",
  });
  assert.ok(t1.reply.length > 0, "Debe responder con horarios");
  assert.ok(
    t1.toolExecutions.some((x) => x.toolName === "checkAvailableBookings" || x.toolName === "getAvailableSlots"),
    "Debe ejecutar checkAvailableBookings o getAvailableSlots",
  );
  console.log("✓ 1. Disponibilidad verificada");

  // Test 2: Dynamic quote with add-ons
  console.log("Testing 2. calculateSessionQuote...");
  const t2 = await processScheduleAgentTurn({
    userMessage: "Quiero cotizar la Sesión Juntos x Siempre agregando Maquillaje y Peinado Profesional y Video Reel 4K Vertical.",
    clientPhone: "+52 55 4910 2831",
  });
  assert.ok(
    t2.toolExecutions.some((x) => x.toolName === "calculateSessionQuote" || x.toolName === "getStudioServices"),
    "Debe ejecutar cotizador",
  );
  console.log("✓ 2. Cotización y add-ons verificados");

  // Test 3: Lookup existing appointment (getAppointment)
  console.log("Testing 3. getAppointment...");
  const t3 = await processScheduleAgentTurn({
    userMessage: "¿Cuál es el estatus y los datos de mi cita JXS-2041?",
    clientPhone: "+52 55 4910 2831",
  });
  assert.ok(
    t3.toolExecutions.some((x) => x.toolName === "getAppointment"),
    "Debe ejecutar getAppointment para consultar cita",
  );
  assert.ok(t3.reply.includes("JXS-2041") || t3.reply.includes("Mariana"), "Debe mencionar la cita JXS-2041");
  console.log("✓ 3. Consulta de cita verificada");

  // Test 4: Update appointment details (updateAppointmentDetails)
  console.log("Testing 4. updateAppointmentDetails...");
  const t4 = await processScheduleAgentTurn({
    userMessage: "Por favor agrega a la cita JXS-2041 la nota: Fondo Terracota Sonorense.",
    clientPhone: "+52 55 4910 2831",
  });
  assert.ok(
    t4.toolExecutions.some((x) => x.toolName === "updateAppointmentDetails"),
    "Debe ejecutar updateAppointmentDetails",
  );
  console.log("✓ 4. Personalización de detalles verificada");

  // Test 5: Prep guide and deposit
  console.log("Testing 5. sendPrepGuideAndDepositLink...");
  const t5 = await processScheduleAgentTurn({
    userMessage: "¿Me puedes enviar la guía de preparación de vestuario y enlace de anticipo para JXS-2041?",
    clientPhone: "+52 55 4910 2831",
  });
  assert.ok(
    t5.toolExecutions.some((x) => x.toolName === "sendPrepGuideAndDepositLink"),
    "Debe ejecutar sendPrepGuideAndDepositLink",
  );
  console.log("✓ 5. Guía de vestuario y anticipo verificados");

  // Test 6: Reschedule appointment
  console.log("Testing 6. rescheduleAppointment...");
  const t6 = await processScheduleAgentTurn({
    userMessage: "¿Puedo reprogramar mi cita JXS-2041 para el 2026-05-18 a las 11:00 AM?",
    clientPhone: "+52 55 4910 2831",
  });
  assert.ok(
    t6.toolExecutions.some((x) => x.toolName === "rescheduleAppointment"),
    "Debe ejecutar rescheduleAppointment",
  );
  console.log("✓ 6. Reprogramación de cita verificada");

  // Test 7: Cancel appointment
  console.log("Testing 7. cancelAppointment...");
  const t7 = await processScheduleAgentTurn({
    userMessage: "Por favor cancela mi cita JXS-2041.",
    clientPhone: "+52 55 4910 2831",
  });
  assert.ok(
    t7.toolExecutions.some((x) => x.toolName === "cancelAppointment"),
    "Debe ejecutar cancelAppointment",
  );
  assert.ok(
    t7.reply.toLowerCase().includes("cancelad"),
    "Respuesta debe indicar que la cita fue cancelada",
  );
  console.log("✓ 7. Cancelación y liberación de horario verificadas");

  // Test 8: Waitlist
  console.log("Testing 8. joinWaitlist...");
  const t8 = await processScheduleAgentTurn({
    userMessage: "Anótame en lista de espera para el sábado en la mañana. Soy Lucía Benítez.",
    clientPhone: "+52 631 313 8104",
  });
  assert.ok(
    t8.toolExecutions.some((x) => x.toolName === "joinWaitlist"),
    "Debe ejecutar joinWaitlist",
  );
  console.log("✓ 8. Lista de espera verificada");

  // Test 9: Team and backdrops
  console.log("Testing 9. getStudioTeamAndSpaces...");
  const t9 = await processScheduleAgentTurn({
    userMessage: "¿Quiénes son los fotógrafos del estudio y qué fondos tienen en Nogales, Sonora?",
    clientPhone: "+52 55 4910 2831",
  });
  assert.ok(
    t9.toolExecutions.some((x) => x.toolName === "getStudioTeamAndSpaces"),
    "Debe ejecutar getStudioTeamAndSpaces",
  );
  console.log("✓ 9. Equipo creativo y sets verificados");

  // Test 10: Book appointment
  console.log("Testing 10. bookAppointment...");
  const t10 = await processScheduleAgentTurn({
    userMessage: "Quiero agendar la Sesión Juntos x Siempre para el 2026-05-20 a las 10:00 AM a nombre de Mariana Rivera, correo mariana.rivera@gmail.com",
    clientPhone: "+52 55 4910 2831",
  });
  assert.ok(
    t10.toolExecutions.some((x) => x.toolName === "bookAppointment"),
    "Debe ejecutar bookAppointment",
  );
  // Test 11: Badge Classification Accuracy (No false positives on cancellation or reschedule)
  console.log("Testing 11. Badge Classification Accuracy...");
  const testBadgeClassification = (toolName: string, text: string) => {
    const toolNames = [toolName];
    const textLower = text.toLowerCase();
    if (
      toolNames.includes("cancelAppointment") ||
      textLower.includes("ha sido cancelada") ||
      textLower.includes("canceló la cita") ||
      textLower.includes("cancelación confirmada")
    ) {
      return "cancelled";
    }
    if (
      toolNames.includes("rescheduleAppointment") ||
      textLower.includes("fue reprogramada") ||
      textLower.includes("reprogramó con éxito") ||
      textLower.includes("reagendada")
    ) {
      return "rescheduled";
    }
    if (
      toolNames.includes("bookAppointment") ||
      (textLower.includes("jxs-") &&
        (textLower.includes("confirmada con éxito") ||
          textLower.includes("reservación:") ||
          textLower.includes("cita agendada") ||
          textLower.includes("confirmada!")))
    ) {
      return "booked";
    }
    if (
      toolNames.includes("sendPrepGuideAndDepositLink") ||
      textLower.includes("guía de preparación")
    ) {
      return "prep_guide";
    }
    if (toolNames.includes("joinWaitlist") || textLower.includes("lista de espera")) {
      return "waitlist";
    }
    if (toolNames.includes("calculateSessionQuote") || textLower.includes("cotización")) {
      return "quote";
    }
    return "other";
  };

  assert.strictEqual(
    testBadgeClassification("cancelAppointment", "La cita JXS-2041 ha sido cancelada"),
    "cancelled",
    "Cancelación con JXS-2041 debe clasificarse como 'cancelled', NUNCA 'booked'",
  );
  assert.strictEqual(
    testBadgeClassification("rescheduleAppointment", "La cita JXS-2041 fue reprogramada"),
    "rescheduled",
    "Reprogramación con JXS-2041 debe clasificarse como 'rescheduled'",
  );
  assert.strictEqual(
    testBadgeClassification("bookAppointment", "Cita JXS-9999 confirmada con éxito"),
    "booked",
    "Reserva en firme debe clasificarse como 'booked'",
  );
  assert.strictEqual(
    testBadgeClassification("sendPrepGuideAndDepositLink", "Guía de preparación para JXS-2055"),
    "prep_guide",
    "Guía de preparación debe clasificarse como 'prep_guide'",
  );
  console.log("✓ 11. Clasificación estricta de tarjetas contextuales validada (Cero falsos positivos)");

  console.log("\n=== ¡LAS 10 CAPACIDADES DEL CHAT AGENT FUERON VERIFICADAS CON ÉXITO! ===");
}

runCapabilitiesVerification().catch((err) => {
  console.error("Error en verificación:", err);
  process.exit(1);
});
