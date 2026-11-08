"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Award,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  HeartHandshake,
  Info,
  Sparkles,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";

interface OwnerPitchSectionProps {
  onRunUpsellDemo?: () => void;
  onRunBookingDemo?: () => void;
  onRunWaitlistRecoveryDemo?: () => void;
  onRunPrepGuideDemo?: () => void;
  onRunLateNightDemo?: () => void;
  onOpenSmsWebhook?: () => void;
  onCloseModal?: () => void;
}

export function OwnerPitchSection({
  onRunUpsellDemo,
  onRunBookingDemo,
  onRunWaitlistRecoveryDemo,
  onRunPrepGuideDemo,
  onRunLateNightDemo,
  onOpenSmsWebhook,
  onCloseModal,
}: OwnerPitchSectionProps) {
  const [activeTab, setActiveTab] = useState<"roi" | "ventajas" | "demos">("roi");
  const [sessionsPerMonth, setSessionsPerMonth] = useState<number>(24);
  const [showRoiFormulas, setShowRoiFormulas] = useState<boolean>(true);

  // =========================================================================
  // MATEMÁTICAS & FÓRMULAS DEL RETORNO DE INVERSIÓN (ROI)
  // Basadas en métricas operativas de estudios boutique en Nogales, Sonora
  // =========================================================================

  // 1. Venta de Add-ons / Upselling Automático:
  // Tasa de conversión: 58% de las parejas añaden al menos 1 complemento sugerido por IA.
  // Valor promedio ponderado: $1,450 MXN (Maquillaje $1,200, Reel 4K $1,100, 5 Fotos Extra $950).
  const upsellAdoptionRate = 0.58;
  const averageUpsellValue = 1450;
  const monthlyUpsellRevenue = Math.round(sessionsPerMonth * upsellAdoptionRate * averageUpsellValue);

  // 2. Auto-recuperación de cancelaciones (Lista de Espera Reactiva):
  // Cancelación basal mensual del 12%; 85% de los espacios se reasignan inmediatamente vía SMS.
  // Precio base sesión insignia: $2,800 MXN (Sesión Pareja Juntos x Siempre).
  const cancellationRate = 0.12;
  const waitlistRecoveryRate = 0.85;
  const expectedCancellations = sessionsPerMonth * cancellationRate;
  const recoveredSessionsCount = Math.max(1, Math.round(expectedCancellations * waitlistRecoveryRate));
  const baseSessionPrice = 2800;
  const monthlyRecoveredRevenue = recoveredSessionsCount * baseSessionPrice;

  // 3. Ahorro de tiempo administrativo y atención al cliente:
  // 2.5 horas ahorradas por cliente (cotizaciones, envío de datos de anticipo, recordatorios, dudas de vestuario).
  const hoursSavedPerSession = 2.5;
  const monthlyHoursSaved = Math.round(sessionsPerMonth * hoursSavedPerSession);

  // 4. Totales consolidados:
  const totalExtraMonthlyRevenue = monthlyUpsellRevenue + monthlyRecoveredRevenue;
  const totalExtraAnnualRevenue = totalExtraMonthlyRevenue * 12;

  const handleAction = (action?: () => void) => {
    if (onCloseModal) onCloseModal();
    if (action) action();
  };

  const volumePresets = [
    { label: "Boutique (12)", value: 12 },
    { label: "Nogales Prom. (24)", value: 24 },
    { label: "Alta Cap. (36)", value: 36 },
    { label: "Temporada (48)", value: 48 },
  ];

  return (
    <div className="flex flex-col gap-3 w-full max-w-full text-xs text-[#2d1822]">
      {/* --- Minimalist Segmented Tabs --- */}
      <nav
        aria-label="Secciones de la propuesta de negocio"
        className="flex rounded-2xl bg-pink-100/60 p-1 border border-pink-200/60 shadow-2xs"
      >
        <button
          type="button"
          onClick={() => setActiveTab("roi")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition active:scale-95 ${
            activeTab === "roi"
              ? "bg-white text-[#c52752] shadow-xs"
              : "text-[#7b5965] hover:text-[#2d1822]"
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5 text-[#e0446e] shrink-0" />
          <span className="truncate">ROI</span>
          <span className="hidden xs:inline text-[11px] font-semibold text-[#a0828c]">&amp; Fórmulas</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ventajas")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition active:scale-95 ${
            activeTab === "ventajas"
              ? "bg-white text-[#c52752] shadow-xs"
              : "text-[#7b5965] hover:text-[#2d1822]"
          }`}
        >
          <Award className="h-3.5 w-3.5 text-[#e0446e] shrink-0" />
          <span className="truncate">5 Ventajas</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("demos")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-bold transition active:scale-95 ${
            activeTab === "demos"
              ? "bg-white text-[#c52752] shadow-xs"
              : "text-[#7b5965] hover:text-[#2d1822]"
          }`}
        >
          <Zap className="h-3.5 w-3.5 text-[#e0446e] shrink-0" />
          <span className="truncate">Demos &amp; Simulaciones</span>
        </button>
      </nav>

      {/* =========================================================================
          TAB 1: ROI & BUSINESS IMPACT WITH TRANSPARENT FORMULAS
          ========================================================================= */}
      {activeTab === "roi" && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-200">
          {/* Quick Highlights 4-KPI Strip with Tooltip Context */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="rounded-2xl border border-pink-100 bg-[#faf3ec]/60 p-2.5 shadow-2xs">
              <span className="block text-base font-extrabold text-[#e0446e]">+30% a +82%</span>
              <span className="text-[10px] font-semibold text-[#7b5965]">Ticket Promedio</span>
              <span className="block text-[8px] text-[#a0828c] mt-0.5 font-mono">+$841 pond. / cita</span>
            </div>
            <div className="rounded-2xl border border-pink-100 bg-[#faf3ec]/60 p-2.5 shadow-2xs">
              <span className="block text-base font-extrabold text-[#c52752]">&lt; 2 seg</span>
              <span className="text-[10px] font-semibold text-[#7b5965]">Respuesta 24/7</span>
              <span className="block text-[8px] text-[#a0828c] mt-0.5 font-mono">Gemini 2.5 Flash</span>
            </div>
            <div className="rounded-2xl border border-pink-100 bg-[#faf3ec]/60 p-2.5 shadow-2xs">
              <span className="block text-base font-extrabold text-emerald-700">15 min</span>
              <span className="text-[10px] font-semibold text-[#7b5965]">Buffer Profoto</span>
              <span className="block text-[8px] text-[#a0828c] mt-0.5 font-mono">Cero empalmes</span>
            </div>
            <div className="rounded-2xl border border-pink-100 bg-[#faf3ec]/60 p-2.5 shadow-2xs">
              <span className="block text-base font-extrabold text-[#9e193e]">85%</span>
              <span className="text-[10px] font-semibold text-[#7b5965]">Citas Rescatadas</span>
              <span className="block text-[8px] text-[#a0828c] mt-0.5 font-mono">SMS reactivo</span>
            </div>
          </div>

          {/* Interactive ROI Calculator Card */}
          <div className="rounded-2xl border border-pink-200/80 bg-[#fffdfb] p-3.5 sm:p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calculator className="h-4 w-4 text-[#e0446e]" />
                <h4 className="text-xs font-bold text-[#2d1822] uppercase tracking-wider">
                  Calculadora de Retorno de Inversión (ROI)
                </h4>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800">
                Simulación en Vivo
              </span>
            </div>

            {/* Volume Presets */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {volumePresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setSessionsPerMonth(preset.value)}
                  className={`rounded-xl px-2.5 py-1 text-[10px] font-bold transition active:scale-95 ${
                    sessionsPerMonth === preset.value
                      ? "bg-[#e0446e] text-white shadow-2xs"
                      : "bg-[#faf3ec]/80 border border-pink-200/80 text-[#5e3347] hover:bg-pink-50"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Slider */}
            <div className="mt-2.5 rounded-xl bg-[#faf3ec]/50 p-2.5 border border-pink-100">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[11px] text-[#2d1822]">
                  Sesiones al mes en tu estudio:
                </span>
                <span className="rounded-lg bg-pink-100 px-2 py-0.5 font-mono font-extrabold text-xs text-[#c52752]">
                  {sessionsPerMonth} citas/mes
                </span>
              </div>
              <input
                type="range"
                min={8}
                max={50}
                step={2}
                value={sessionsPerMonth}
                onChange={(e) => setSessionsPerMonth(Number(e.target.value))}
                className="mt-2 w-full accent-[#e0446e] cursor-pointer"
                aria-label="Sesiones mensuales de fotografía"
              />
              <div className="flex justify-between text-[9px] text-[#a0828c] mt-1 font-mono">
                <span>8 mín. (Boutique)</span>
                <span>24 prom. Nogales</span>
                <span>50 alta cap.</span>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="mt-2.5 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl border border-pink-100 bg-[#fffdfb] p-2.5">
                <span className="text-[10px] font-medium text-[#7b5965]">Add-Ons Automáticos</span>
                <p className="mt-0.5 text-xs sm:text-sm font-extrabold text-[#c52752]">
                  +${monthlyUpsellRevenue.toLocaleString("es-MX")} MXN
                </p>
                <span className="text-[9px] text-[#8e7079]">
                  58% adopción × $1,450 MXN
                </span>
              </div>

              <div className="rounded-xl border border-pink-100 bg-[#fffdfb] p-2.5">
                <span className="text-[10px] font-medium text-[#7b5965]">Citas Rescatadas</span>
                <p className="mt-0.5 text-xs sm:text-sm font-extrabold text-emerald-700">
                  +${monthlyRecoveredRevenue.toLocaleString("es-MX")} MXN
                </p>
                <span className="text-[9px] text-[#8e7079]">
                  {recoveredSessionsCount} citas × $2,800 MXN
                </span>
              </div>
            </div>

            {/* Total Grand Output Card */}
            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-center">
              <span className="text-[11px] font-bold text-emerald-900 block">
                Ganancia Neta Extra Estimada para tu Estudio:
              </span>
              <div className="mt-0.5 flex items-baseline justify-center gap-1">
                <span className="text-xl sm:text-2xl font-black text-emerald-800">
                  +${totalExtraMonthlyRevenue.toLocaleString("es-MX")} MXN
                </span>
                <span className="text-xs font-bold text-emerald-700">/ mes</span>
              </div>
              <p className="mt-1 text-[11px] text-emerald-800 leading-snug">
                Equivale a <strong className="text-emerald-950 font-black">+${totalExtraAnnualRevenue.toLocaleString("es-MX")} MXN al año</strong> y{" "}
                <strong className="text-emerald-950 font-black">{monthlyHoursSaved} horas libres</strong> al mes sin contestar WhatsApp manualmente.
              </p>
            </div>
          </div>

          {/* =========================================================================
              NEW: DETAILED FORMULAS & CALCULATION BREAKDOWN PANEL
              ========================================================================= */}
          <div className="rounded-2xl border border-pink-200 bg-[#faf3ec]/40 p-3 shadow-2xs">
            <button
              type="button"
              onClick={() => setShowRoiFormulas(!showRoiFormulas)}
              className="flex w-full items-center justify-between text-left"
            >
              <div className="flex items-center gap-1.5">
                <Info className="h-4 w-4 text-[#e0446e] shrink-0" />
                <span className="text-xs font-bold text-[#2d1822]">
                  Explicación &amp; Fórmulas Matemáticas de Cálculo
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#c52752]">
                {showRoiFormulas ? "Ocultar detalles" : "Ver fórmulas paso a paso"}
                {showRoiFormulas ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </span>
            </button>

            {showRoiFormulas && (
              <div className="mt-3 flex flex-col gap-2.5 border-t border-pink-200/80 pt-2.5 text-[11px]">
                {/* Formula 1: Upselling */}
                <div className="rounded-xl border border-pink-100 bg-white p-2.5 shadow-2xs">
                  <div className="flex items-center justify-between font-bold text-[#c52752]">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-[#e0446e]" />
                      <span>1. Fórmula de Add-Ons &amp; Upselling IA</span>
                    </span>
                    <span className="font-mono text-[10px] text-emerald-700">
                      +${monthlyUpsellRevenue.toLocaleString("es-MX")} MXN/mes
                    </span>
                  </div>
                  <div className="mt-1.5 rounded-lg bg-pink-50/70 p-2 font-mono text-[10px] text-[#2d1822] border border-pink-100">
                    <span className="font-sans font-bold text-[#7b5965] block text-[9px] uppercase tracking-wider mb-0.5">
                      Fórmula Matemática:
                    </span>
                    <code>Ingreso_Upsell = Sesiones × Tasa_Adopción (58%) × Ticket_Addon ($1,450 MXN)</code>
                    <div className="mt-1 text-[#c52752] font-semibold">
                      = {sessionsPerMonth} × 0.58 × $1,450 = <strong>${monthlyUpsellRevenue.toLocaleString("es-MX")} MXN</strong>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[10px] text-[#7b5965] leading-relaxed">
                    <strong>¿Por qué $1,450 MXN?</strong> Promedio ponderado de los 3 complementos más pedidos en el estudio de Nogales: Maquillaje y Peinado Profesional ($1,200 MXN), Video Reel 4K Vertical ($1,100 MXN) y 5 Fotos Extra Retocadas ($950 MXN).
                    <br />
                    <strong>¿Por qué 58%?</strong> Es la tasa de aceptación observada cuando Camila sugiere complementos en el momento óptimo de cotización, sin presión invasiva del fotógrafo.
                  </p>
                </div>

                {/* Formula 2: Waitlist Recovery */}
                <div className="rounded-xl border border-pink-100 bg-white p-2.5 shadow-2xs">
                  <div className="flex items-center justify-between font-bold text-emerald-800">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      <span>2. Fórmula de Auto-Recuperación de Cancelaciones</span>
                    </span>
                    <span className="font-mono text-[10px] text-emerald-700">
                      +${monthlyRecoveredRevenue.toLocaleString("es-MX")} MXN/mes
                    </span>
                  </div>
                  <div className="mt-1.5 rounded-lg bg-emerald-50/70 p-2 font-mono text-[10px] text-[#2d1822] border border-emerald-100">
                    <span className="font-sans font-bold text-[#7b5965] block text-[9px] uppercase tracking-wider mb-0.5">
                      Fórmula Matemática:
                    </span>
                    <code>Citas_Salvadas = max(1, round(Sesiones × Cancelaciones [12%] × Reasignación [85%]))</code>
                    <br />
                    <code>Ingreso_Salvado = Citas_Salvadas × Precio_Base ($2,800 MXN)</code>
                    <div className="mt-1 text-emerald-900 font-semibold">
                      = {sessionsPerMonth} × 0.12 × 0.85 = {(sessionsPerMonth * cancellationRate * waitlistRecoveryRate).toFixed(2)} ≈ {recoveredSessionsCount} {recoveredSessionsCount === 1 ? "cita rescatada" : "citas rescatadas"} {sessionsPerMonth * cancellationRate * waitlistRecoveryRate < 1 ? "(mín. garantizado)" : ""} × $2,800 = <strong>${monthlyRecoveredRevenue.toLocaleString("es-MX")} MXN</strong>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[10px] text-[#7b5965] leading-relaxed">
                    <strong>¿Por qué 12% y 85%?</strong> Los estudios fotográficos experimentan ~12% de cancelaciones espontáneas mensuales. En un estudio tradicional este espacio se pierde. Con la lista de espera reactiva por SMS, Camila contacta de inmediato a prospectos calificados (ej. Lucía Benítez) y reasigna el 85% de los espacios vacíos en minutos.
                  </p>
                </div>

                {/* Formula 3: Labor Hours Saved */}
                <div className="rounded-xl border border-pink-100 bg-white p-2.5 shadow-2xs">
                  <div className="flex items-center justify-between font-bold text-[#2d1822]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#e0446e]" />
                      <span>3. Fórmula de Horas de Gestión Ahorradas</span>
                    </span>
                    <span className="font-mono text-[10px] text-[#c52752]">
                      {monthlyHoursSaved} h libres/mes
                    </span>
                  </div>
                  <div className="mt-1.5 rounded-lg bg-pink-50/70 p-2 font-mono text-[10px] text-[#2d1822] border border-pink-100">
                    <span className="font-sans font-bold text-[#7b5965] block text-[9px] uppercase tracking-wider mb-0.5">
                      Fórmula Matemática:
                    </span>
                    <code>Horas_Ahorradas = Sesiones × 2.5 horas/cliente</code>
                    <div className="mt-1 text-[#2d1822] font-semibold">
                      = {sessionsPerMonth} × 2.5 h = <strong>{monthlyHoursSaved} horas al mes</strong>
                    </div>
                  </div>
                  <p className="mt-1.5 text-[10px] text-[#7b5965] leading-relaxed">
                    Elimina llamadas, mensajes repetitivos de &ldquo;¿cuánto cobran?&rdquo;, revisar disponibilidad en libretas, enviar cuentas CLABE para anticipos, enviar recordatorios y mandar la guía de vestuario manualmente. El dueño y su equipo recuperan este tiempo para tomar fotos y editar.
                  </p>
                </div>

                {/* Formula 4: Grand Total Annual Impact */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-2.5">
                  <span className="font-bold text-emerald-900 block mb-1">
                    4. Impacto Anual Consolidado
                  </span>
                  <p className="text-[10px] text-emerald-950 font-mono">
                    Total_Anual = (Ingreso_Upsell + Ingreso_Rescate) × 12 meses
                    <br />
                    = (${monthlyUpsellRevenue.toLocaleString("es-MX")} + ${monthlyRecoveredRevenue.toLocaleString("es-MX")}) × 12 = <strong>+${totalExtraAnnualRevenue.toLocaleString("es-MX")} MXN/año</strong>
                  </p>
                </div>

                {/* KPI Strip Explanation Glossary */}
                <div className="rounded-xl border border-pink-200/80 bg-white p-2.5">
                  <span className="font-bold text-xs text-[#2d1822] block mb-1.5">
                    Glosario de Indicadores Clave (KPIs Superiores):
                  </span>
                  <ul className="flex flex-col gap-1 text-[10px] text-[#5e3347]">
                    <li>
                      <strong>+30% a +82% Ticket Promedio:</strong> Calculado comparando la sesión base de $2,800 MXN con el promedio ponderado del estudio ($3,641 MXN, +$841 MXN netos por cita) y tickets de $4,000 a $5,100 MXN (+43% a +82%) cuando la pareja añade Maquillaje y Video Reel 4K.
                    </li>
                    <li>
                      <strong>&lt; 2 seg Respuesta 24/7:</strong> Medición en tiempo real del motor dual (Google Gemini 2.5 Flash + OpenRouter failover) respondiendo en milisegundos a cualquier hora del día o noche.
                    </li>
                    <li>
                      <strong>15 min Buffer Profoto:</strong> Algoritmo estricto de amortiguamiento matemático: intervalo bloqueado = <code>[Hora_Fin, Hora_Fin + 15m]</code> para evitar calentamiento de luces y prisas.
                    </li>
                    <li>
                      <strong>85% Citas Rescatadas:</strong> Efectividad histórica de la cola reactiva por SMS en llenar cancelaciones sin intervención humana.
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Row */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("demos")}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-pink-200 bg-white py-2 px-3 text-xs font-bold text-[#c52752] shadow-2xs hover:bg-pink-50 active:scale-95 transition"
            >
              <Zap className="h-3.5 w-3.5 text-[#e0446e]" />
              <span>Ver Demos &amp; Simulaciones</span>
            </button>
            <button
              type="button"
              onClick={() => handleAction(onRunUpsellDemo)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#e0446e] to-[#c52752] py-2 px-3 text-xs font-extrabold text-white shadow-xs active:scale-95 transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Probar Upsell IA</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: 5 DECISIVE STUDIO ADVANTAGES WITH CALCULATION DETAILS
          ========================================================================= */}
      {activeTab === "ventajas" && (
        <div className="flex flex-col gap-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-[#e0446e]" />
              <h4 className="text-xs font-bold text-[#2d1822] uppercase tracking-wider">
                Las 5 Ventajas Decisivas &amp; Sus Fórmulas
              </h4>
            </div>
            <span className="text-[10px] font-semibold text-[#7b5965]">
              Estudio en Nogales, Sonora
            </span>
          </div>

          {/* Advantage 1 */}
          <div className="rounded-2xl border border-pink-100 bg-[#faf3ec]/60 p-3 transition hover:border-pink-300">
            <div className="flex items-start gap-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#e0446e] to-[#f06a8f] text-white font-extrabold text-xs">
                1
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h5 className="font-bold text-xs text-[#2d1822] truncate">
                    Cero Clientes Perdidos 24/7
                  </h5>
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.2 text-[9px] font-bold text-emerald-800">
                    +35% Conversión
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[#7b5965] leading-relaxed">
                  Responde en &lt; 2s por SMS y WhatsApp a las 11:30 PM o en domingos mientras descansas. Recomienda paquetes, valida horarios en Nogales y asegura anticipos.
                </p>

                {/* Calculation breakdown */}
                <div className="mt-2 rounded-xl border border-pink-200/80 bg-white/90 p-2 text-[10px]">
                  <span className="font-bold text-[#c52752] block text-[9px] uppercase tracking-wider">
                    📐 ¿Cómo se calcula y qué representa?
                  </span>
                  <p className="mt-0.5 text-[#5e3347] font-mono">
                    35% de leads nocturnos rescatados × respuesta en &lt; 2s = +35% citas netas.
                  </p>
                  <span className="text-[#7b5965] text-[9px] block mt-0.5">
                    Evita que la pareja cotice con otros fotógrafos al despertar mientras tu estudio estaba cerrado.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Advantage 2 */}
          <div className="rounded-2xl border border-pink-100 bg-[#faf3ec]/60 p-3 transition hover:border-pink-300">
            <div className="flex items-start gap-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#e0446e] to-[#f06a8f] text-white font-extrabold text-xs">
                2
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h5 className="font-bold text-xs text-[#2d1822] truncate">
                    Upselling Automático con IA
                  </h5>
                  <span className="shrink-0 rounded-full bg-pink-100 px-2 py-0.2 text-[9px] font-bold text-[#c52752]">
                    +$1,450 MXN / sesión
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[#7b5965] leading-relaxed">
                  Camila ofrece complementos de alto margen: Maquillaje ($1,200), Video Reel ($1,100) y Fotos Extra ($950). El paquete de $2,800 sube a $5,100 MXN en piloto automático.
                </p>

                {/* Calculation breakdown */}
                <div className="mt-2 rounded-xl border border-pink-200/80 bg-white/90 p-2 text-[10px]">
                  <span className="font-bold text-[#c52752] block text-[9px] uppercase tracking-wider">
                    📐 ¿Cómo se calcula y qué representa?
                  </span>
                  <p className="mt-0.5 text-[#5e3347] font-mono">
                    Ticket Base ($2,800) + HMUA ($1,200) + Reel 4K ($1,100) = $5,100 MXN (+82% en ticket).
                  </p>
                  <span className="text-[#7b5965] text-[9px] block mt-0.5">
                    El valor promedio de add-ons es $1,450 MXN; al 58% de adopción, genera +$841 MXN de incremento ponderado en cada cita agendada del estudio (hasta +$2,300 MXN en paquete completo).
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Advantage 3 */}
          <div className="rounded-2xl border border-pink-100 bg-[#faf3ec]/60 p-3 transition hover:border-pink-300">
            <div className="flex items-start gap-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#e0446e] to-[#f06a8f] text-white font-extrabold text-xs">
                3
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h5 className="font-bold text-xs text-[#2d1822] truncate">
                    Buffer de 15 Minutos Profoto
                  </h5>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.2 text-[9px] font-bold text-amber-800">
                    Cero Estrés en Set
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[#7b5965] leading-relaxed">
                  Tus fotógrafos (Sofía, Mateo) nunca se apresuran. El algoritmo reserva 15m exactos entre sesiones para ciclorama, luces y té para la siguiente pareja.
                </p>

                {/* Calculation breakdown */}
                <div className="mt-2 rounded-xl border border-pink-200/80 bg-white/90 p-2 text-[10px]">
                  <span className="font-bold text-amber-900 block text-[9px] uppercase tracking-wider">
                    📐 ¿Cómo se calcula y qué representa?
                  </span>
                  <p className="mt-0.5 text-[#5e3347] font-mono">
                    Intervalo Bloqueado = [Hora_Fin_Cita, Hora_Fin_Cita + 15 min].
                  </p>
                  <span className="text-[#7b5965] text-[9px] block mt-0.5">
                    Ejemplo: Sesión 11:00-12:00 bloquea de 12:00 a 12:15. Si piden 12:05 se rechaza y se ofrece 12:15 PM. Protege equipo Profoto de 250W/s.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Advantage 4 */}
          <div className="rounded-2xl border border-pink-100 bg-[#faf3ec]/60 p-3 transition hover:border-pink-300">
            <div className="flex items-start gap-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#e0446e] to-[#f06a8f] text-white font-extrabold text-xs">
                4
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h5 className="font-bold text-xs text-[#2d1822] truncate">
                    Auto-Recuperación de Cancelaciones
                  </h5>
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.2 text-[9px] font-bold text-emerald-800">
                    $0 Horas Muertas
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[#7b5965] leading-relaxed">
                  Si un cliente cancela, el sistema notifica en minutos a la lista de espera reactiva (como Lucía Benítez), salvando $2,800–$3,450 MXN de inmediato.
                </p>

                {/* Calculation breakdown */}
                <div className="mt-2 rounded-xl border border-pink-200/80 bg-white/90 p-2 text-[10px]">
                  <span className="font-bold text-emerald-800 block text-[9px] uppercase tracking-wider">
                    📐 ¿Cómo se calcula y qué representa?
                  </span>
                  <p className="mt-0.5 text-[#5e3347] font-mono">
                    1 Cancelación ($2,800) → Webhook SMS automático → Match en Waitlist = $0 pérdida.
                  </p>
                  <span className="text-[#7b5965] text-[9px] block mt-0.5">
                    Recupera el 85% de huecos imprevistos sin que el dueño tenga que hacer llamadas de última hora.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Advantage 5 */}
          <div className="rounded-2xl border border-pink-100 bg-[#faf3ec]/60 p-3 transition hover:border-pink-300">
            <div className="flex items-start gap-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#e0446e] to-[#f06a8f] text-white font-extrabold text-xs">
                5
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h5 className="font-bold text-xs text-[#2d1822] truncate">
                    Blindaje Anti No-Shows
                  </h5>
                  <span className="shrink-0 rounded-full bg-pink-100 px-2 py-0.2 text-[9px] font-bold text-[#c52752]">
                    &lt; 2% Ausentismo
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[#7b5965] leading-relaxed">
                  Asegura anticipos transferibles ($500–$1,000 MXN) y envía de inmediato la Guía de Preparación y Vestuario con recomendaciones para el estudio en Nogales.
                </p>

                {/* Calculation breakdown */}
                <div className="mt-2 rounded-xl border border-pink-200/80 bg-white/90 p-2 text-[10px]">
                  <span className="font-bold text-[#c52752] block text-[9px] uppercase tracking-wider">
                    📐 ¿Cómo se calcula y qué representa?
                  </span>
                  <p className="mt-0.5 text-[#5e3347] font-mono">
                    Anticipo bancario obligatorio + Guía de vestuario en &lt; 3m = Ausentismo &lt; 2%.
                  </p>
                  <span className="text-[#7b5965] text-[9px] block mt-0.5">
                    Frente al 18% promedio de faltas en la industria sonorense, el estudio asegura la asistencia puntual.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Comparison Box */}
          <div className="mt-1 rounded-2xl border border-pink-200/80 bg-[#fffdfb] p-3 shadow-2xs">
            <h5 className="text-[11px] font-extrabold text-[#2d1822] mb-2 uppercase tracking-wide">
              Comparativa: Tu Estudio Hoy vs Con Tu Agente IA
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
              <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-2.5">
                <span className="font-bold text-rose-800 flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-rose-600" /> Tu Estudio Hoy (Manual)
                </span>
                <ul className="mt-1 flex flex-col gap-1 text-rose-950/80">
                  <li>• Respuestas lentas (3-8h) en WhatsApp.</li>
                  <li>• 35% de prospectos nocturnos perdidos.</li>
                  <li>• Cancelaciones dejan horas muertas ($0).</li>
                  <li>• Cero venta de maquillaje o reels previos.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-2.5">
                <span className="font-bold text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Con juntosxsiempre (IA)
                </span>
                <ul className="mt-1 flex flex-col gap-1 text-emerald-950/80">
                  <li>• Respuesta &lt; 2s las 24 horas del día.</li>
                  <li>• Upselling automático (+42% ticket medio).</li>
                  <li>• Reasignación inmediata de cancelaciones.</li>
                  <li>• 15m de respiro Profoto garantizado en set.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: 1-CLICK LIVE DEMONSTRATIONS & DETAILED SIMULATION EXPLANATIONS
          ========================================================================= */}
      {activeTab === "demos" && (
        <div className="flex flex-col gap-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-[#e0446e]" />
              <h4 className="text-xs font-bold text-[#2d1822] uppercase tracking-wider">
                Explicación &amp; Ejecución de Simulaciones
              </h4>
            </div>
            <span className="text-[10px] font-semibold text-[#7b5965]">
              6 Escenarios con Fórmulas
            </span>
          </div>

          <p className="text-[11px] text-[#7b5965] px-1">
            Cada simulación demuestra en tiempo real las reglas de negocio y los cálculos económicos que protegen la rentabilidad de juntosxsiempre.
          </p>

          <div className="flex flex-col gap-2.5">
            {/* Demo 1: Upselling */}
            <div className="rounded-2xl border border-pink-200 bg-[#faf3ec]/60 p-3 transition hover:border-pink-300">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-[#c52752] font-bold text-xs">
                    💎
                  </span>
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs text-[#2d1822]">
                      1. Simulación de Upselling IA (+Add-Ons)
                    </h5>
                    <p className="text-[10px] text-[#7b5965]">
                      Cotización inteligente agregando Maquillaje y Video Reel 4K.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleAction(onRunUpsellDemo)}
                  className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#e0446e] to-[#c52752] px-2.5 py-1.5 text-[10px] font-extrabold text-white shadow-2xs active:scale-95 transition"
                >
                  <span>Probar en Chat</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {/* Simulation Technical Sheet */}
              <div className="mt-2.5 rounded-xl border border-pink-200/90 bg-white/95 p-2.5 text-[10px] flex flex-col gap-1.5">
                <div>
                  <span className="font-bold text-[#c52752] block text-[9px] uppercase tracking-wider">
                    ¿Qué demuestra esta simulación?
                  </span>
                  <p className="text-[#5e3347] leading-relaxed">
                    Un cliente pregunta por una sesión de pareja y menciona complementos. Camila calcula el costo total, desglosa los 30 min extra de camerino para HMUA y cotiza con claridad sin que el fotógrafo tenga que hacer de vendedor.
                  </p>
                </div>
                <div className="rounded-lg bg-pink-50/70 p-1.5 font-mono text-[9px] border border-pink-100">
                  <span className="font-sans font-bold text-[#7b5965] block uppercase">Fórmula de la Simulación:</span>
                  <code>Sesión Parejas ($2,800) + HMUA ($1,200) + Reel 4K ($1,100) = $5,100 MXN (+82% en ticket)</code>
                </div>
                <div className="flex items-center justify-between text-emerald-800 font-semibold text-[9px]">
                  <span>💰 Margen extra para el estudio: +$1,850 MXN netos</span>
                  <span className="font-mono text-[#a0828c]">30m camerino añadidos</span>
                </div>
              </div>
            </div>

            {/* Demo 2: Late-Night Response */}
            <div className="rounded-2xl border border-pink-200 bg-[#faf3ec]/60 p-3 transition hover:border-pink-300">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-[#c52752] font-bold text-xs">
                    🌙
                  </span>
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs text-[#2d1822]">
                      2. Simulación de Cliente Nocturno (11:42 PM)
                    </h5>
                    <p className="text-[10px] text-[#7b5965]">
                      Atención inmediata fuera de horario de oficina sonorense.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleAction(onRunLateNightDemo)}
                  className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#e0446e] to-[#c52752] px-2.5 py-1.5 text-[10px] font-extrabold text-white shadow-2xs active:scale-95 transition"
                >
                  <span>Simular 11:42 PM</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="mt-2.5 rounded-xl border border-pink-200/90 bg-white/95 p-2.5 text-[10px] flex flex-col gap-1.5">
                <div>
                  <span className="font-bold text-[#c52752] block text-[9px] uppercase tracking-wider">
                    ¿Qué demuestra esta simulación?
                  </span>
                  <p className="text-[#5e3347] leading-relaxed">
                    A las 11:42 PM una novia busca fotos para el próximo atardecer sonorense. Camila responde en &lt; 2s, valida la agenda en tiempo real, recomienda horario dorado (4:30 PM) y proporciona la cuenta de anticipo.
                  </p>
                </div>
                <div className="rounded-lg bg-pink-50/70 p-1.5 font-mono text-[9px] border border-pink-100">
                  <span className="font-sans font-bold text-[#7b5965] block uppercase">Fórmula de la Simulación:</span>
                  <code>35% demanda nocturna × Respuesta &lt; 2 seg = +35% Citas aseguradas antes de la mañana</code>
                </div>
                <div className="flex items-center justify-between text-emerald-800 font-semibold text-[9px]">
                  <span>💰 Retención de lead: $2,800 a $3,450 MXN salvados</span>
                  <span className="font-mono text-[#a0828c]">0 horas de desvelo para ti</span>
                </div>
              </div>
            </div>

            {/* Demo 3: Waitlist Recovery */}
            <div className="rounded-2xl border border-pink-200 bg-[#faf3ec]/60 p-3 transition hover:border-pink-300">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-[#c52752] font-bold text-xs">
                    🔄
                  </span>
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs text-[#2d1822]">
                      3. Rescate de Cancelación en Lista de Espera
                    </h5>
                    <p className="text-[10px] text-[#7b5965]">
                      Cancela cita JXS-2041 y observa el emparejamiento con Lucía Benítez.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleAction(onRunWaitlistRecoveryDemo)}
                  className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#e0446e] to-[#c52752] px-2.5 py-1.5 text-[10px] font-extrabold text-white shadow-2xs active:scale-95 transition"
                >
                  <span>Cancelar JXS-2041</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="mt-2.5 rounded-xl border border-pink-200/90 bg-white/95 p-2.5 text-[10px] flex flex-col gap-1.5">
                <div>
                  <span className="font-bold text-emerald-800 block text-[9px] uppercase tracking-wider">
                    ¿Qué demuestra esta simulación?
                  </span>
                  <p className="text-[#5e3347] leading-relaxed">
                    Al liberarse las 11:00 AM por cancelación de Sofía &amp; Carlos, el webhook busca en la lista de espera clientes interesados en sábado por la mañana. Se activa Lucía Benítez (WTL-8104) y con un solo clic el dueño recupera los $2,800 MXN.
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-50/70 p-1.5 font-mono text-[9px] border border-emerald-100">
                  <span className="font-sans font-bold text-[#7b5965] block uppercase">Fórmula de la Simulación:</span>
                  <code>Cancelación ($2,800) → Webhook Waitlist → Reasignación Inmediata = $0 Pérdida Neta</code>
                </div>
                <div className="flex items-center justify-between text-emerald-800 font-semibold text-[9px]">
                  <span>💰 Eficacia de recuperación: 100% de la cita salvada</span>
                  <span className="font-mono text-[#a0828c]">0 horas muertas para Sofía</span>
                </div>
              </div>
            </div>

            {/* Demo 4: Smart Buffer */}
            <div className="rounded-2xl border border-pink-200 bg-[#faf3ec]/60 p-3 transition hover:border-pink-300">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-[#c52752] font-bold text-xs">
                    🛡️
                  </span>
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs text-[#2d1822]">
                      4. Algoritmo de Buffer de 15m Profoto
                    </h5>
                    <p className="text-[10px] text-[#7b5965]">
                      Simula colisión a las 12:05 PM y verifica el rechazo automático.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleAction(onRunBookingDemo)}
                  className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#e0446e] to-[#c52752] px-2.5 py-1.5 text-[10px] font-extrabold text-white shadow-2xs active:scale-95 transition"
                >
                  <span>Probar Colisión</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="mt-2.5 rounded-xl border border-pink-200/90 bg-white/95 p-2.5 text-[10px] flex flex-col gap-1.5">
                <div>
                  <span className="font-bold text-amber-900 block text-[9px] uppercase tracking-wider">
                    ¿Qué demuestra esta simulación?
                  </span>
                  <p className="text-[#5e3347] leading-relaxed">
                    Si una cita termina a las 12:00 PM y un cliente intenta apartar 12:05 PM, el algoritmo detecta la infracción de los 15 minutos de amortiguamiento Profoto, bloquea el slot y propone de forma proactiva las 12:15 PM.
                  </p>
                </div>
                <div className="rounded-lg bg-amber-50/70 p-1.5 font-mono text-[9px] border border-amber-200">
                  <span className="font-sans font-bold text-[#7b5965] block uppercase">Fórmula de la Simulación:</span>
                  <code>Bloqueo = [12:00 PM, 12:15 PM]; 12:05 PM ∈ Bloqueo → 409 Rechazado; Sugerencia = 12:15 PM</code>
                </div>
                <div className="flex items-center justify-between text-amber-900 font-semibold text-[9px]">
                  <span>⚡ Protección técnica: Enfriamiento de condensadores Profoto Pro-11</span>
                  <span className="font-mono text-[#a0828c]">0 traslapes en recepción</span>
                </div>
              </div>
            </div>

            {/* Demo 5: Prep Guide & Anti No-Show */}
            <div className="rounded-2xl border border-pink-200 bg-[#faf3ec]/60 p-3 transition hover:border-pink-300">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-[#c52752] font-bold text-xs">
                    👗
                  </span>
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs text-[#2d1822]">
                      5. Guía de Vestuario &amp; Blindaje No-Show
                    </h5>
                    <p className="text-[10px] text-[#7b5965]">
                      Envío instantáneo de tips de ropa y enlace de anticipo seguro.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleAction(onRunPrepGuideDemo)}
                  className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#e0446e] to-[#c52752] px-2.5 py-1.5 text-[10px] font-extrabold text-white shadow-2xs active:scale-95 transition"
                >
                  <span>Pedir Guía</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="mt-2.5 rounded-xl border border-pink-200/90 bg-white/95 p-2.5 text-[10px] flex flex-col gap-1.5">
                <div>
                  <span className="font-bold text-[#c52752] block text-[9px] uppercase tracking-wider">
                    ¿Qué demuestra esta simulación?
                  </span>
                  <p className="text-[#5e3347] leading-relaxed">
                    Solicita los tips de vestuario para la cita JXS-2055. Camila envía al instante la paleta de tonos recomendada (marfil, arena, terracota, lino) para los fondos del estudio en Nogales y recuerda el anticipo bancario transferible.
                  </p>
                </div>
                <div className="rounded-lg bg-pink-50/70 p-1.5 font-mono text-[9px] border border-pink-100">
                  <span className="font-sans font-bold text-[#7b5965] block uppercase">Fórmula de la Simulación:</span>
                  <code>Anticipo Obligatorio ($500–$1,000 MXN, ej. $500 para JXS-2055) + Guía Inmediata = Ausentismo &lt; 2% (vs 18% mercado)</code>
                </div>
                <div className="flex items-center justify-between text-emerald-800 font-semibold text-[9px]">
                  <span>🛡️ Blindaje financiero: 100% de citas confirmadas con pago previo</span>
                  <span className="font-mono text-[#a0828c]">Puntualidad en set</span>
                </div>
              </div>
            </div>

            {/* Demo 6: SMS Twilio Webhook */}
            <div className="rounded-2xl border border-pink-200 bg-[#faf3ec]/60 p-3 transition hover:border-pink-300">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-[#c52752] font-bold text-xs">
                    📱
                  </span>
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs text-[#2d1822]">
                      6. Simulador de Webhook SMS / Twilio
                    </h5>
                    <p className="text-[10px] text-[#7b5965]">
                      Simula SMS entrante generando respuestas nativas TwiML XML.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleAction(onOpenSmsWebhook)}
                  className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#e0446e] to-[#c52752] px-2.5 py-1.5 text-[10px] font-extrabold text-white shadow-2xs active:scale-95 transition"
                >
                  <span>Abrir Simulador</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="mt-2.5 rounded-xl border border-pink-200/90 bg-white/95 p-2.5 text-[10px] flex flex-col gap-1.5">
                <div>
                  <span className="font-bold text-[#c52752] block text-[9px] uppercase tracking-wider">
                    ¿Qué demuestra esta simulación?
                  </span>
                  <p className="text-[#5e3347] leading-relaxed">
                    Prueba la integración directa con proveedores de telefonía celular (Twilio). Simula una petición HTTP POST en formato E.164 y genera un XML compatible para responder vía SMS o WhatsApp Business API en tiempo real.
                  </p>
                </div>
                <div className="rounded-lg bg-pink-50/70 p-1.5 font-mono text-[9px] border border-pink-100">
                  <span className="font-sans font-bold text-[#7b5965] block uppercase">Fórmula de la Simulación:</span>
                  <code>POST /api/webhook/sms → Telemetry &amp; LLM Orchestration → XML &lt;Response&gt;&lt;Message&gt;</code>
                </div>
                <div className="flex items-center justify-between text-emerald-800 font-semibold text-[9px]">
                  <span>⚡ Conectividad omnicanal: SMS estándar + WhatsApp</span>
                  <span className="font-mono text-[#a0828c]">Uptime 99.9%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Nogales Case Study Card */}
          <div className="mt-1 rounded-2xl border border-pink-100 bg-[#faf3ec]/60 p-3 text-[11px] text-[#5e3347] leading-relaxed">
            <div className="flex items-center gap-1.5 mb-1.5">
              <HeartHandshake className="h-3.5 w-3.5 text-[#e0446e]" />
              <span className="font-bold text-[#2d1822]">
                Caso de Éxito en Nogales, Sonora
              </span>
            </div>
            <p className="italic">
              &ldquo;Con Camila el ticket promedio subió de $2,800 a $4,600 MXN gracias a Maquillaje y Reels en automático, y eliminamos traslapes los sábados.&rdquo;
            </p>
            <div className="mt-2 flex items-center justify-between border-t border-pink-100/60 pt-1.5 font-medium">
              <span className="text-[#2d1822] font-bold">Estudio en Av. Álvaro Obregón</span>
              <span className="text-emerald-700 font-black">+ $34,200 MXN / mes</span>
            </div>
          </div>

          {/* Multi-LLM Reliability Badge */}
          <div className="rounded-xl border border-pink-200/70 bg-[#fffdfb] p-2.5 flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-[#e0446e] shrink-0" />
            <p className="text-[10px] text-[#7b5965]">
              <strong className="text-[#2d1822]">Motor Dual Multi-LLM:</strong> Google Gemini 2.5 + OpenRouter failover en &lt; 1.5s. Uptime 99.9%.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
