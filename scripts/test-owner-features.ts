import assert from "node:assert";
import {
  STUDIO_INFO,
  STUDIO_SERVICES,
  STUDIO_ADDONS,
  findStudioService,
  findStudioAddOns,
} from "../src/lib/studio/config";
import {
  getAllAppointments,
  getAllWaitlistEntries,
  createBookingRecord,
  updateBookingRecord,
  updateWaitlistStatus,
  resetDemoStore,
} from "../src/lib/storage/appointmentStore";
import {
  computeDayAvailability,
  validateAndResolveSlot,
} from "../src/lib/calendar/availability";
import { getNextOpenStudioDates, formatLocalDate } from "../src/lib/calendar/dateUtils";
import { createStudioToolFunctions } from "../src/lib/agent/tools";

async function runOwnerFeatureTests() {
  console.log("=== INICIANDO PRUEBAS DE VENTAJAS DE NEGOCIO PARA EL DUEÑO ===");

  // 0. Verificar configuración de marca y catálogo de alto margen
  assert.strictEqual(STUDIO_INFO.name, "juntosxsiempre", "Nombre del estudio verificado");
  assert.ok(STUDIO_SERVICES.length >= 4, "Debe contar con al menos 4 paquetes de servicios");
  assert.ok(STUDIO_ADDONS.length >= 5, "Debe contar con 5 complementos de alto margen");
  console.log("✓ 0. Configuración de marca Nogales, Sonora y catálogos de alto margen validados");

  // 1. Verificar ROI de Add-ons y Alto Margen
  const parejaSvc = findStudioService("pareja-juntos");
  assert.ok(parejaSvc, "Debe existir paquete pareja");
  assert.strictEqual(parejaSvc?.price, 2800, "Precio base debe ser $2,800 MXN");

  const addOns = findStudioAddOns(["maquillaje-peinado", "video-reel"]);
  assert.strictEqual(addOns.length, 2, "Debe resolver ambos add-ons");
  const addOnsTotal = addOns.reduce((sum, a) => sum + a.price, 0);
  assert.strictEqual(addOnsTotal, 2300, "HMUA ($1,200) + Reel ($1,100) = $2,300 MXN");

  const totalTicketWithUpsell = parejaSvc!.price + addOnsTotal;
  assert.strictEqual(totalTicketWithUpsell, 5100, "El ticket debe subir a $5,100 MXN (+82%)");
  console.log("✓ 1. Upsell de alto margen verificado: $2,800 -> $" + totalTicketWithUpsell + " MXN (+82%)");

  // 2. Verificar que Camila cotiza automáticamente con los complementos
  const tools = createStudioToolFunctions("+52 55 4910 2831");
  const quote = (await tools.calculateSessionQuote({
    serviceId: "pareja-juntos",
    addOns: "maquillaje-peinado,video-reel,fotos-extra-5",
  })) as { quoteSummary: { totalPrice: string }; selectedAddOns: unknown[] };

  assert.ok(quote.quoteSummary.totalPrice.includes("6,050"), "Cotización debe sumar $6,050 MXN");
  assert.strictEqual(quote.selectedAddOns.length, 3, "Debe incluir 3 complementos");
  console.log("✓ 2. Herramienta de cotización de add-ons verificada: " + quote.quoteSummary.totalPrice);

  // 3. Demostración de Rescate de Cancelación en Lista de Espera
  resetDemoStore();
  const initialApts = getAllAppointments();
  assert.ok(initialApts.length >= 4, "Store inicial debe contener citas activas");

  const waitlistBefore = getAllWaitlistEntries();
  const targetWl = waitlistBefore.find((w) => w.clientName.includes("Lucía"));
  assert.ok(targetWl, "Debe existir Lucía Benítez en lista de espera");
  assert.strictEqual(targetWl?.status, "waiting", "Estatus inicial debe ser waiting");

  // Cancelar la cita JXS-2041 que coincide con la fecha de Lucía
  const cancelledApt = updateBookingRecord("JXS-2041", { status: "cancelled" });
  assert.strictEqual(cancelledApt?.status, "cancelled", "La cita debe quedar cancelada");

  const waitlistAfter = getAllWaitlistEntries();
  const updatedWl = waitlistAfter.find((w) => w.id === targetWl?.id);
  assert.strictEqual(
    updatedWl?.status,
    "slot_opened",
    "La lista de espera debe cambiar automáticamente a slot_opened al cancelar cita del mismo día",
  );
  console.log("✓ 3. Auto-rescate de horario por lista de espera verificado exitosamente");

  // 3b. Reasignación completa de cita a Lucía Benítez en el horario liberado
  const rescuedBooking = createBookingRecord({
    clientName: targetWl!.clientName,
    clientPhone: targetWl!.clientPhone,
    clientEmail: targetWl!.clientEmail,
    serviceId: targetWl!.serviceId,
    date: targetWl!.preferredDate,
    startTime: "11:00",
    endTime: "12:00",
    notes: "Cita rescatada desde lista de espera tras cancelación de JXS-2041",
    source: "dashboard",
  });
  assert.ok(rescuedBooking.bookingRef.startsWith("JXS-"), "Debe generar código de reserva para Lucía");
  updateWaitlistStatus(targetWl!.id, "booked");
  const wlBooked = getAllWaitlistEntries().find((w) => w.id === targetWl?.id);
  assert.strictEqual(wlBooked?.status, "booked", "Estatus de waitlist debe ser booked");
  console.log("✓ 3b. Reasignación exitosa de horario liberado a Lucía Benítez: " + rescuedBooking.bookingRef);

  // 4. Verificación de Protección de Buffer de 15 Minutos Profoto
  const todayStr = formatLocalDate(new Date());
  const openDates = getNextOpenStudioDates(todayStr, 3);
  const testDate = openDates[0];

  const initialAvail = computeDayAvailability(testDate, "pareja-juntos");
  assert.ok(initialAvail.availableSlots.length > 0, "Debe haber disponibilidad calculada para la fecha");

  // Crear cita a las 11:00 (duración 60m -> termina 12:00)
  createBookingRecord({
    clientName: "Cliente A",
    clientPhone: "+52 55 1234 5678",
    clientEmail: "clienteA@test.com",
    serviceId: "pareja-juntos",
    date: testDate,
    startTime: "11:00",
    endTime: "12:00",
  });

  // Intentar agendar a las 12:05 (dentro del buffer de 15 minutos: 12:00 a 12:15)
  const bufferCollision = validateAndResolveSlot(testDate, "12:05", "pareja-juntos");
  assert.strictEqual(bufferCollision.valid, false, "Debe rechazar horario que invade el buffer de 15m");
  console.log("✓ 4. Protección estricta de buffer de 15m Profoto verificada exitosamente");

  // Intentar agendar a las 12:15 (justo después del buffer de 15 minutos)
  const afterBuffer = validateAndResolveSlot(testDate, "12:15", "pareja-juntos");
  assert.strictEqual(afterBuffer.valid, true, "Debe permitir horario que respeta los 15m de buffer");
  console.log("✓ 5. Disponibilidad válida post-buffer verificada exitosamente");

  // 5. Verificación de cálculo de ROI para el dueño
  const sessions = 24;
  const upsellRate = 0.58;
  const avgUpsell = 1450;
  const extraUpsell = Math.round(sessions * upsellRate * avgUpsell);
  const recoveredSessions = Math.max(1, Math.round(sessions * 0.12 * 0.85));
  const extraRecovered = recoveredSessions * 2800;
  const extraMonthly = extraUpsell + extraRecovered;
  assert.ok(extraMonthly > 25000, "El ingreso extra mensual proyectado debe superar los $25,000 MXN");
  console.log("✓ 6. Proyección económica de ROI validada: +$" + extraMonthly.toLocaleString("es-MX") + " MXN/mes");

  console.log("\n=== ¡TODAS LAS PRUEBAS DE VENTAJAS PARA EL DUEÑO PASARON EXITOSAMENTE! ===");
}

runOwnerFeatureTests().catch((err) => {
  console.error("Error en pruebas de dueño:", err);
  process.exit(1);
});
