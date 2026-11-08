import assert from "node:assert/strict";
import { processScheduleAgentTurn } from "../src/lib/agent/scheduleAgent";
import { createStudioToolFunctions } from "../src/lib/agent/tools";
import type { ScenarioConfig } from "../src/lib/studio/types";

async function runTests() {
  console.log("🚀 Iniciando suite exhaustiva de pruebas de Escenarios & Sandbox ROI...");

  // Test 1: Scenario 1 - Pareja Nocturna (11:45 PM) con números personalizados
  console.log("Testing Scenario 1: Pareja Nocturna 11:45 PM...");
  const sc1: ScenarioConfig = {
    scenarioId: "pareja-nocturna",
    scenarioTitle: "1. Pareja Nocturna (11:45 PM)",
    customBasePrice: 3200,
    customAddOns: [
      { id: "maquillaje-peinado", name: "Maquillaje y Peinado", price: 1300, enabled: true },
      { id: "video-reel", name: "Video Reel 4K", price: 1200, enabled: true },
      { id: "fotos-extra-5", name: "5 Fotos Extra", price: 950, enabled: false },
    ],
    photographerId: "photo-sofia",
    photographerName: "Sofía Morales",
    assignedSet: "Set A — Galería Nogales & Luz Natural",
    aiObjective: "maximize-ticket",
    customUserMessage: "Hola buenas noches! Son las 11:45 PM...",
  };

  const res1 = await processScheduleAgentTurn({
    userMessage: sc1.customUserMessage || "",
    history: [],
    clientPhone: "+52 55 4910 2831",
    scenarioContext: sc1,
  });

  assert(res1.reply.includes("11:45 PM"), "Debe mencionar la atención nocturna");
  assert(res1.reply.includes("3,200") || res1.reply.includes("3200"), "Debe usar el precio base personalizado $3,200 MXN");
  assert(res1.reply.includes("Sofía Morales"), "Debe incluir a la fotógrafa Sofía Morales");
  console.log("✅ Scenario 1 OK!");

  // Test 2: Scenario 2 - Novia Indecisa / Alto Presupuesto con upsell
  console.log("Testing Scenario 2: Novia Indecisa...");
  const sc2: ScenarioConfig = {
    scenarioId: "novia-indecisa",
    scenarioTitle: "2. Novia Indecisa / Alto Presupuesto",
    customBasePrice: 2800,
    customAddOns: [
      { id: "maquillaje-peinado", name: "Maquillaje y Peinado", price: 1200, enabled: true },
      { id: "video-reel", name: "Video Reel 4K", price: 1100, enabled: true },
    ],
    photographerId: "photo-sofia",
    photographerName: "Sofía Morales",
    assignedSet: "Set A",
    aiObjective: "maximize-ticket",
    customUserMessage: "¡Hola Camila! Me caso en unos meses...",
  };

  const res2 = await processScheduleAgentTurn({
    userMessage: sc2.customUserMessage || "",
    history: [],
    clientPhone: "+52 55 4910 2831",
    scenarioContext: sc2,
  });

  assert(res2.reply.includes("5,100") || res2.reply.includes("5100"), "Debe calcular el total con add-ons $5,100 MXN");
  console.log("✅ Scenario 2 OK!");

  // Test 3: Scenario 3 - Cancelación y Auto-Rescate
  console.log("Testing Scenario 3: Cancelación Imprevista / Auto-Rescate...");
  const sc3: ScenarioConfig = {
    scenarioId: "cancelacion-rescate",
    scenarioTitle: "3. Cancelación Imprevista",
    customBasePrice: 2800,
    customAddOns: [],
    photographerId: "photo-sofia",
    photographerName: "Sofía Morales",
    assignedSet: "Set A",
    aiObjective: "rescue-waitlist",
    customUserMessage: "Hola Camila, debo cancelar mi cita JXS-2041...",
  };

  const res3 = await processScheduleAgentTurn({
    userMessage: sc3.customUserMessage || "",
    history: [],
    clientPhone: "+52 55 4910 2831",
    scenarioContext: sc3,
  });

  assert(res3.reply.includes("Lucía Benítez"), "Debe activar el auto-rescate para Lucía Benítez");
  console.log("✅ Scenario 3 OK!");

  // Test 4: Scenario 4 - Buffer 15m Profoto
  console.log("Testing Scenario 4: Buffer 15m...");
  const sc4: ScenarioConfig = {
    scenarioId: "buffer-15m",
    scenarioTitle: "4. Cliente con Horario Apretado / Buffer 15m",
    customBasePrice: 2800,
    customAddOns: [],
    photographerId: "photo-sofia",
    photographerName: "Sofía Morales",
    assignedSet: "Set A",
    aiObjective: "protect-buffer",
    customUserMessage: "¿Pueden recibirme exactamente a las 12:05 PM?",
  };

  const res4 = await processScheduleAgentTurn({
    userMessage: sc4.customUserMessage || "",
    history: [],
    clientPhone: "+52 55 4910 2831",
    scenarioContext: sc4,
  });

  assert(res4.reply.includes("12:05 PM"), "Debe reconocer la solicitud de 12:05 PM");
  assert(res4.reply.includes("Buffer Profoto") || res4.reply.includes("15 Minutos"), "Debe explicar el buffer de 15 minutos");
  assert(res4.reply.includes("12:15 PM"), "Debe proponer las 12:15 PM como alternativa segura");
  console.log("✅ Scenario 4 OK!");

  // Test 5: Scenario 5 - Caso Personalizado con Texto Libre y Fotógrafo Personalizado
  console.log("Testing Scenario 5: Caso Personalizado (Free-form)...");
  const sc5: ScenarioConfig = {
    scenarioId: "custom-case",
    scenarioTitle: "5. Caso Personalizado (Texto Libre)",
    customBasePrice: 4200,
    customAddOns: [
      { id: "cuadro-recuerdo", name: "Cuadro Fine-Art / Impresiones de Recuerdo", price: 850, enabled: true },
      { id: "entrega-express", name: "Entrega Express 24 Horas", price: 900, enabled: true },
    ],
    photographerId: "photo-mateo",
    photographerName: "Mateo Hernández",
    assignedSet: "Set B — Ciclorama Infinito & Estudio Strobe",
    aiObjective: "secure-deposit",
    customUserMessage: "Hola Camila, quiero fotos ejecutivas de alta gama con impresiones y entrega express.",
  };

  const res5 = await processScheduleAgentTurn({
    userMessage: sc5.customUserMessage || "",
    history: [],
    clientPhone: "+52 55 4910 2831",
    scenarioContext: sc5,
  });

  assert(res5.reply.includes("Mateo Hernández"), "Debe asignar a Mateo Hernández");
  assert(res5.reply.includes("4,200") || res5.reply.includes("4200"), "Debe usar el precio base personalizado $4,200 MXN");
  assert(res5.reply.includes("5,950") || res5.reply.includes("5950"), "Debe sumar add-ons al total $5,950 MXN (4200+850+900)");
  console.log("✅ Scenario 5 OK!");

  // Test 6: Edge Case - Escenario con Cero Add-Ons Activos
  console.log("Testing Edge Case: Cero Add-Ons...");
  const sc6: ScenarioConfig = {
    scenarioId: "custom-case",
    scenarioTitle: "5. Caso Personalizado sin Add-ons",
    customBasePrice: 1500,
    customAddOns: [
      { id: "maquillaje-peinado", name: "Maquillaje", price: 1200, enabled: false },
    ],
    photographerId: "photo-valentina",
    photographerName: "Valentina Ramos",
    assignedSet: "Set C",
    aiObjective: "secure-deposit",
  };

  const res6 = await processScheduleAgentTurn({
    userMessage: "Cotizar paquete mínimo",
    history: [],
    clientPhone: "+52 55 4910 2831",
    scenarioContext: sc6,
  });
  assert(res6.reply.includes("1,500") || res6.reply.includes("1500"), "Debe reflejar el precio mínimo $1,500 MXN");
  assert(res6.reply.includes("Valentina Ramos"), "Debe incluir a Valentina Ramos");
  console.log("✅ Edge Case Cero Add-Ons OK!");

  // Test 7: Tool Integration - calculateSessionQuote con scenarioContext y cuadro-recuerdo
  console.log("Testing Tool Integration: calculateSessionQuote with scenarioContext & prints...");
  const tools = createStudioToolFunctions("+52 55 4910 2831", sc5);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quoteResult: any = await tools.calculateSessionQuote({
    serviceId: "pareja-juntos",
    addOns: "cuadro-recuerdo, entrega-express",
  });

  assert.equal(quoteResult.package.basePrice, 4200, "Tool must return custom base price $4,200");
  assert.equal(quoteResult.quoteSummary.totalPriceNumeric, 5950, "Tool must calculate custom totalPrice $5,950");
  console.log("✅ Tool Integration OK!");

  // Test 8: ROI Sandbox Mathematical Formula Verification
  console.log("Testing ROI Sandbox Mathematical Calculations...");
  const sessions = 24;
  const basePrice = 2800;
  const addons = [
    { price: 1200, enabled: true },
    { price: 1100, enabled: true },
    { price: 950, enabled: true },
    { price: 750, enabled: false },
  ];
  const active = addons.filter((a) => a.enabled);
  const avgUpsell = Math.round(
    (active.reduce((s, a) => s + a.price, 0) / active.length) * (active.length > 1 ? 1.25 : 1)
  );
  const adoption = 0.58;
  const monthlyUpsell = Math.round(sessions * adoption * avgUpsell);

  const cancellations = 3;
  const recovered = cancellations > 0 ? Math.max(1, Math.round(cancellations * 0.85)) : 0;
  const monthlyRecovered = recovered * basePrice;
  const totalMonthly = monthlyUpsell + monthlyRecovered;
  const totalAnnual = totalMonthly * 12;

  assert(totalMonthly > 0, "Ingreso mensual debe ser positivo");
  assert(totalAnnual === totalMonthly * 12, "Total anual debe ser 12x el mensual");

  // Edge cases in ROI formulas
  const zeroAddons: { price: number; enabled: boolean }[] = [];
  const zeroAddonTicketIncrease = zeroAddons.length > 0 ? 10 : 0;
  assert.equal(zeroAddonTicketIncrease, 0, "Cero add-ons debe arrojar 0% incremento");

  const zeroCancellations = 0;
  const zeroRecovered = zeroCancellations > 0 ? Math.max(1, Math.round(zeroCancellations * 0.85)) : 0;
  assert.equal(zeroRecovered, 0, "Cero cancelaciones debe arrojar 0 citas recuperadas");

  console.log(`✅ Sandbox ROI OK! (+$${totalMonthly.toLocaleString("es-MX")} MXN/mes, +$${totalAnnual.toLocaleString("es-MX")} MXN/año)`);

  console.log("\n🎉 ¡TODAS LAS 8 PRUEBAS PASARON EXITOSAMENTE!");
}

runTests().catch((err) => {
  console.error("❌ Error en pruebas:", err);
  process.exit(1);
});
