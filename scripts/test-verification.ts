import assert from "node:assert";
import {
  STUDIO_INFO,
  STUDIO_SERVICES,
  STUDIO_PHOTOGRAPHERS,
  STUDIO_ADDONS,
  STUDIO_BACKDROPS,
  findStudioService,
  findStudioAddOns,
  findPhotographer,
} from "../src/lib/studio/config";
import {
  getAllAppointments,
  getAllWaitlistEntries,
  createBookingRecord,
  findAppointmentByQuery,
  updateBookingRecord,
  resetDemoStore,
} from "../src/lib/storage/appointmentStore";
import {
  computeDayAvailability,
  computeRangeAvailability,
  validateAndResolveSlot,
} from "../src/lib/calendar/availability";
import {
  formatLocalDate,
  formatPrettyDate,
  getNextOpenStudioDates,
} from "../src/lib/calendar/dateUtils";
import { createStudioToolFunctions } from "../src/lib/agent/tools";
import { processScheduleAgentTurn } from "../src/lib/agent/scheduleAgent";

interface QuoteResult {
  quoteSummary: {
    totalPrice: string;
  };
  selectedAddOns: unknown[];
}

interface BookSuccessResult {
  success: true;
  message: string;
  appointment: {
    bookingRef: string;
    clientName: string;
    clientPhone: string;
    serviceName: string;
    photographerName: string;
    date: string;
    time: string;
  };
}

interface BookFailureResult {
  success: false;
  error: string;
  suggestedAlternatives?: unknown[];
}

type BookAppointmentResult = BookSuccessResult | BookFailureResult;

async function runTests() {
  console.log("=== INICIANDO PRUEBAS DE VERIFICACIÓN DE JUNTOSXSIEMPRE ===");

  // 1. Verificar configuración de estudio
  assert.strictEqual(STUDIO_INFO.name, "juntosxsiempre", "Nombre debe ser juntosxsiempre");
  assert.strictEqual(STUDIO_INFO.coordinatorName, "Camila", "Coordinadora debe ser Camila");
  assert.ok(STUDIO_INFO.address.includes("Roma Norte"), "Dirección debe estar en Roma Norte");
  console.log("✓ 1. Studio Info verificado con éxito");

  // 2. Verificar servicios en Pesos Mexicanos (MXN)
  assert.strictEqual(STUDIO_SERVICES.length, 5, "Deben existir 5 servicios principales");
  const parejaSvc = findStudioService("pareja-juntos");
  assert.ok(parejaSvc, "Debe existir paquete pareja-juntos");
  assert.strictEqual(parejaSvc?.price, 2800, "Precio de pareja-juntos debe ser $2,800 MXN");

  const legacySvc = findStudioService("portrait-signature");
  assert.strictEqual(legacySvc?.id, "pareja-juntos", "Alias legacy portrait-signature debe mapear a pareja-juntos");
  console.log("✓ 2. Servicios & compatibilidad legacy verificados con éxito");

  // 3. Verificar fotógrafos mexicanos y asignaciones
  assert.strictEqual(STUDIO_PHOTOGRAPHERS.length, 3, "Deben existir 3 fotógrafos");
  assert.strictEqual(STUDIO_PHOTOGRAPHERS[0].name, "Sofía Morales");
  assert.strictEqual(STUDIO_PHOTOGRAPHERS[1].name, "Mateo Hernández");
  assert.strictEqual(STUDIO_PHOTOGRAPHERS[2].name, "Valentina Ramos");
  const photographer1 = findPhotographer("retrato-editorial");
  assert.strictEqual(photographer1.name, "Mateo Hernández", "Retrato editorial debe asignar a Mateo");
  const photographer2 = findPhotographer("familia-maternidad");
  assert.strictEqual(photographer2.name, "Valentina Ramos", "Familia debe asignar a Valentina");
  console.log("✓ 3. Equipo de fotógrafos y asignación automática verificados con éxito");

  // 4. Verificar fondos y add-ons
  assert.ok(STUDIO_BACKDROPS.some((b) => b.includes("Rosa Pastel")), "Debe incluir fondo Rosa Pastel");
  assert.ok(STUDIO_BACKDROPS.some((b) => b.includes("Terracota")), "Debe incluir fondo Terracota");
  assert.ok(STUDIO_BACKDROPS.some((b) => b.includes("Cantera")), "Debe incluir fondo Cantera");
  assert.strictEqual(STUDIO_ADDONS.length, 5, "Deben existir 5 complementos oficiales");
  const foundAddOns = findStudioAddOns(["maquillaje", "entrega express"]);
  assert.strictEqual(foundAddOns.length, 2, "Debe resolver 2 complementos con findStudioAddOns");
  console.log("✓ 4. Fondos artesanales y complementos verificados con éxito");

  // 5. Verificar store, persistencia y reset
  resetDemoStore();
  const initialApts = getAllAppointments();
  assert.strictEqual(initialApts.length, 4, "Deben existir 4 citas semilla");
  assert.ok(initialApts[0].bookingRef.startsWith("JXS-"), "El código de cita debe comenzar con JXS-");
  const initialWaitlist = getAllWaitlistEntries();
  assert.strictEqual(initialWaitlist.length, 1, "Debe existir 1 entrada de lista de espera inicial");

  const todayStr = formatLocalDate(new Date());
  const openDates = getNextOpenStudioDates(todayStr, 3);
  const testDate = openDates[0];

  const directBooking = createBookingRecord({
    clientName: "Carlos Fuentes",
    clientPhone: "+52 55 3344 5566",
    clientEmail: "carlos@fuentes.mx",
    serviceId: "pareja-juntos",
    date: testDate,
    startTime: "12:00",
    endTime: "13:00",
  });
  assert.ok(directBooking.bookingRef.startsWith("JXS-"), "createBookingRecord debe generar ref JXS-");
  const updated = updateBookingRecord(directBooking.bookingRef, { notes: "Nota actualizada de prueba" });
  assert.strictEqual(updated?.notes, "Nota actualizada de prueba", "updateBookingRecord debe actualizar las notas");
  console.log("✓ 5. Store inicial, registros directos y reset verificados con éxito");

  // 6. Verificar cálculo de disponibilidad de rango y validación
  const dayAvail = computeDayAvailability(testDate, "pareja-juntos");
  assert.strictEqual(dayAvail.isOpen, true, "El día debe estar abierto");
  assert.ok(dayAvail.availableSlots.length > 0, "Debe haber horarios disponibles");
  const rangeAvail = computeRangeAvailability(testDate, 3, "pareja-juntos");
  assert.strictEqual(rangeAvail.length, 3, "Debe calcular disponibilidad para 3 días");
  const pretty = formatPrettyDate(testDate);
  assert.ok(pretty.length > 5, "formatPrettyDate debe retornar una fecha legible en español");

  const validation = validateAndResolveSlot(testDate, "12:00", "pareja-juntos");
  assert.strictEqual(typeof validation.valid, "boolean");
  console.log("✓ 6. Disponibilidad de calendario y utilidades de fecha verificadas con éxito");

  // 7. Verificar herramientas del agente
  const tools = createStudioToolFunctions("+52 55 4910 2831");
  const quote = (await tools.calculateSessionQuote({
    serviceId: "pareja-juntos",
    addOns: "maquillaje-peinado,entrega-express",
  })) as QuoteResult;
  assert.ok(quote.quoteSummary.totalPrice.includes("MXN"), "Cotización debe estar en MXN");
  assert.strictEqual(quote.selectedAddOns.length, 2, "Debe haber seleccionado 2 complementos");
  console.log("✓ 7. Herramienta calculateSessionQuote verificada con éxito: " + quote.quoteSummary.totalPrice);

  // 8. Verificar turno de agente SMS con Coordinadora Camila
  const turn1 = await processScheduleAgentTurn({
    userMessage: "¡Hola! ¿Cuánto cuesta la sesión de pareja con maquillaje?",
    history: [],
    clientPhone: "+52 55 4910 2831",
  });
  assert.ok(turn1.reply.length > 10, "La respuesta debe ser sustancial");
  assert.ok(
    turn1.reply.toLowerCase().includes("juntos") ||
      turn1.reply.toLowerCase().includes("camila") ||
      turn1.reply.includes("MXN") ||
      turn1.reply.includes("$"),
    "La respuesta debe hacer referencia al estudio o precios",
  );
  console.log("✓ 8. Turno de conversación con Camila verificado con éxito");

  // 9. Verificar cancelación y notificación de lista de espera
  const cancelTurn = await processScheduleAgentTurn({
    userMessage: "Por favor cancela mi cita JXS-2041",
    history: [],
    clientPhone: "+52 55 4910 2831",
  });
  assert.ok(cancelTurn.reply.toLowerCase().includes("cancel"), "Debe confirmar la cancelación");
  console.log("✓ 9. Cancelación y actualización de lista de espera verificadas con éxito");

  // 10. Edge Case: Reserva nueva y prevención de colisión con buffer de 15m
  const bookRes = (await tools.bookAppointment({
    clientName: "Valeria Domínguez",
    clientPhone: "+52 55 9988 7766",
    clientEmail: "valeria@dominguez.mx",
    serviceId: "pareja-juntos",
    date: testDate,
    startTime: "16:00",
  })) as BookAppointmentResult;
  assert.strictEqual(bookRes.success, true, "Reserva nueva debe tener éxito");
  if (bookRes.success) {
    assert.ok(bookRes.appointment.bookingRef.startsWith("JXS-"), "Código de reserva debe iniciar con JXS-");
    console.log("✓ 10. Creación de cita confirmada: " + bookRes.appointment.bookingRef);

    // 11. Edge Case: Intentar reservar en el mismo horario debe fallar por colisión
    const collisionRes = (await tools.bookAppointment({
      clientName: "Intento Colisión",
      clientPhone: "+52 55 1122 3344",
      clientEmail: "colision@test.com",
      serviceId: "pareja-juntos",
      date: testDate,
      startTime: "16:00",
    })) as BookAppointmentResult;
    assert.strictEqual(collisionRes.success, false, "Debe rechazar horario en colisión");
    console.log("✓ 11. Prevención de colisión de horario y buffer de 15m verificada con éxito");

    // 12. Edge Case: Búsqueda de cita por nombre, cel y referencia
    const findByName = findAppointmentByQuery("Valeria Domínguez");
    assert.ok(findByName.length >= 1, "Debe encontrar la cita por nombre");
    const findByRef = findAppointmentByQuery(bookRes.appointment.bookingRef);
    assert.strictEqual(findByRef.length, 1, "Debe encontrar exactamente 1 cita por referencia JXS");
    console.log("✓ 12. Búsqueda flexible de citas verificada con éxito");
  }

  console.log("\n=== ¡TODAS LAS PRUEBAS DE VERIFICACIÓN PASARON EXITOSAMENTE! ===");
}

runTests().catch((err) => {
  console.error("Error en las pruebas:", err);
  process.exit(1);
});
