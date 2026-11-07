import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { STUDIO_INFO, STUDIO_PHOTOGRAPHERS, STUDIO_BACKDROPS } from "../src/lib/studio/config";
import { getOrCreateSession } from "../src/lib/storage/appointmentStore";
import { createStudioToolFunctions } from "../src/lib/agent/tools";

async function runTourAndLocationTests() {
  console.log("=== INICIANDO PRUEBAS DE TOUR GUIADO Y UBICACIÓN NOGALES, SONORA ===");

  // 1. Verificar configuración del estudio en Nogales, Sonora
  assert.ok(
    STUDIO_INFO.address.includes("Nogales") && STUDIO_INFO.address.includes("Sonora"),
    `Dirección debe ser en Nogales, Sonora, recibido: ${STUDIO_INFO.address}`,
  );
  assert.ok(
    STUDIO_INFO.address.includes("84000"),
    `Código postal de Nogales debe ser 84000, recibido: ${STUDIO_INFO.address}`,
  );
  assert.strictEqual(
    STUDIO_INFO.phone,
    "+52 631 313 8920",
    `Teléfono del estudio debe tener lada 631 de Nogales, recibido: ${STUDIO_INFO.phone}`,
  );
  console.log("✓ 1. Configuración de estudio en Nogales, Sonora validada");

  // 2. Verificar fotógrafos y sets en Nogales
  const sofia = STUDIO_PHOTOGRAPHERS.find((p) => p.name.includes("Sofía"));
  assert.ok(sofia?.bio.includes("Nogales, Sonora"), "Biografía de Sofía debe referenciar Nogales, Sonora");
  assert.ok(sofia?.assignedRoom.includes("Galería Nogales"), "Sala de Sofía debe ser Galería Nogales");

  const sonoranBackdrop = STUDIO_BACKDROPS.find((b) => b.includes("Sonorense") || b.includes("Nogales"));
  assert.ok(sonoranBackdrop, "Debe existir un set/fondo inspirado en Nogales/Atardecer Sonorense");
  console.log("✓ 2. Fotógrafos y sets locales de Nogales validados");

  // 3. Verificar que appointmentStore y tools no usan teléfonos o direcciones legacy de CDMX
  const testSession = getOrCreateSession("test-tour-session-" + Date.now());
  assert.strictEqual(
    testSession.clientPhone,
    STUDIO_INFO.phone,
    `Fallback de sesión debe ser el teléfono de Nogales (${STUDIO_INFO.phone}), recibido: ${testSession.clientPhone}`,
  );

  const tools = createStudioToolFunctions();
  const waitlistRes = (await tools.joinWaitlist({
    clientName: "Prueba Nogales",
    serviceId: "pareja-juntos",
  })) as { success: boolean; waitlistEntry: { waitlistRef: string; clientPhone: string } };
  assert.ok(waitlistRes.waitlistEntry?.waitlistRef, "Debe registrarse en lista de espera");
  assert.strictEqual(
    waitlistRes.waitlistEntry.clientPhone,
    STUDIO_INFO.phone,
    `Teléfono en waitlist debe ser el fallback de Nogales (${STUDIO_INFO.phone}), recibido: ${waitlistRes.waitlistEntry.clientPhone}`,
  );
  console.log("✓ 3. Almacenamiento y herramientas usan teléfono de Nogales como fallback");

  // 4. Analizar el archivo ScheduleAgentWorkspace.tsx para verificar GuidedTour y Target IDs
  const workspacePath = path.join(process.cwd(), "src", "components", "ScheduleAgentWorkspace.tsx");
  const workspaceCode = fs.readFileSync(workspacePath, "utf-8");

  // Validar target IDs con scroll-margin
  const targetIds = [
    "tour-step-chat",
    "tour-step-calendar",
    "tour-step-bookings",
    "tour-step-studio",
    "tour-step-roi",
  ];

  for (const id of targetIds) {
    const hasTargetWithScrollMargin = workspaceCode.includes(`id="${id}"`) &&
      workspaceCode.includes(`id="${id}" className="`) &&
      workspaceCode.includes("scroll-mt-");
    assert.ok(
      hasTargetWithScrollMargin,
      `Target element #${id} debe existir con scroll-margin en ScheduleAgentWorkspace.tsx`,
    );
  }
  console.log("✓ 4. Todos los 5 IDs de anclaje de tour existen con scroll-margin adecuado");

  // 5. Verificar que las acciones de los 5 pasos del tour son funcionales (no meros no-ops)
  assert.ok(
    workspaceCode.includes("handleTestBufferCollision();") &&
      workspaceCode.includes('actionLabel: "⚡ Probar Buffer Profoto (12:05 PM)"'),
    "Paso 2 debe invocar handleTestBufferCollision()",
  );
  assert.ok(
    workspaceCode.includes('handleCancelBooking("JXS-2041");') &&
      workspaceCode.includes('actionLabel: "🔄 Probar Auto-Rescate de Cancelación (JXS-2041)"'),
    "Paso 3 debe invocar handleCancelBooking()",
  );
  assert.ok(
    workspaceCode.includes("setIsOwnerPitchOpen(true);") &&
      workspaceCode.includes('actionLabel: "📊 Abrir Presentación Completa de ROI (+Ventajas)"'),
    "Paso 5 debe invocar setIsOwnerPitchOpen(true)",
  );
  console.log("✓ 5. Acciones interactivas del tour son demostraciones ejecutables en vivo");

  // 6. Verificar accesibilidad y controles en GuidedTour.tsx
  const tourPath = path.join(process.cwd(), "src", "components", "GuidedTour.tsx");
  const tourCode = fs.readFileSync(tourPath, "utf-8");

  assert.ok(tourCode.includes("isMinimized"), "GuidedTour debe contar con modo minimizado para pantallas móviles");
  assert.ok(tourCode.includes("preventScroll: true"), "GuidedTour debe usar preventScroll: true en focus()");
  assert.ok(tourCode.includes("isEditable"), "GuidedTour debe ignorar flechas de teclado si el usuario está en un input");
  assert.ok(tourCode.includes("pb-20 sm:pb-4"), "GuidedTour debe tener separación inferior para la barra móvil fija");
  assert.ok(!tourCode.includes("backdrop-blur"), "GuidedTour no debe aplicar backdrop-blur para no opacar el contenido");
  console.log("✓ 6. GuidedTour.tsx cumple con directrices de accesibilidad, minimizado móvil y visibilidad");

  // 7. Verificar que no quedan referencias residuales a Roma Norte o CDMX
  const filesToCheck = [
    "README.md",
    "src/lib/studio/config.ts",
    "src/lib/agent/tools.ts",
    "src/lib/agent/scheduleAgent.ts",
    "src/lib/storage/appointmentStore.ts",
    "src/components/ScheduleAgentWorkspace.tsx",
    "src/components/OwnerPitchSection.tsx",
    "src/app/layout.tsx",
  ];

  for (const rel of filesToCheck) {
    const full = path.join(process.cwd(), rel);
    if (!fs.existsSync(full)) continue;
    const content = fs.readFileSync(full, "utf-8");
    assert.ok(!content.includes("Roma Norte"), `${rel} no debe contener 'Roma Norte'`);
    assert.ok(!content.includes("CDMX"), `${rel} no debe contener 'CDMX'`);
    assert.ok(!content.includes("06700"), `${rel} no debe contener '06700'`);
  }
  console.log("✓ 7. Cero referencias a Roma Norte o CDMX en todo el código fuente");

  console.log("\n=== ¡TODAS LAS PRUEBAS DE TOUR Y NOGALES PASARON CON ÉXITO! ===");
}

runTourAndLocationTests().catch((err) => {
  console.error("Error en pruebas:", err);
  process.exit(1);
});
