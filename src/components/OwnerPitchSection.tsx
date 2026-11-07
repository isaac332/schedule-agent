"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Cpu,
  HeartHandshake,
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

  // ROI calculations based on boutique photo studio metrics in Nogales, Sonora, México
  const upsellAdoptionRate = 0.58; // 58% of clients add at least 1 high-margin add-on
  const averageUpsellValue = 1450; // Weighted average of HMUA ($1,200), Reel 4K ($1,100), and Extra Retouched Photos ($950)
  const monthlyUpsellRevenue = Math.round(sessionsPerMonth * upsellAdoptionRate * averageUpsellValue);

  // Cancellation recovery: ~12% monthly baseline cancellations, 85% rebooked immediately via reactive SMS waitlist
  const recoveredSessionsCount = Math.max(1, Math.round(sessionsPerMonth * 0.12 * 0.85));
  const monthlyRecoveredRevenue = recoveredSessionsCount * 2800; // Base session price for Pareja Juntos

  // Labor savings: 2.5 hours per client consultation/scheduling avoided
  const monthlyHoursSaved = Math.round(sessionsPerMonth * 2.5);
  const totalExtraMonthlyRevenue = monthlyUpsellRevenue + monthlyRecoveredRevenue;
  const totalExtraAnnualRevenue = totalExtraMonthlyRevenue * 12;

  const handleAction = (action?: () => void) => {
    if (onCloseModal) onCloseModal();
    if (action) action();
  };

  const volumePresets = [
    { label: "Boutique (12)", value: 12 },
    { label: "Nogales (24)", value: 24 },
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
          <span className="hidden xs:inline text-[11px] font-semibold text-[#a0828c]">&amp; Impacto</span>
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
          <span className="truncate">Demos</span>
          <span className="hidden xs:inline text-[11px] font-semibold text-[#a0828c]">en Vivo</span>
        </button>
      </nav>

      {/* =========================================================================
          TAB 1: ROI & BUSINESS IMPACT
          ========================================================================= */}
      {activeTab === "roi" && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-200">
          {/* Quick Highlights 4-KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="rounded-2xl border border-pink-100 bg-[#faf3ec]/60 p-2.5 shadow-2xs">
              <span className="block text-base font-extrabold text-[#e0446e]">+42%</span>
              <span className="text-[10px] font-semibold text-[#7b5965]">Ticket Promedio</span>
            </div>
            <div className="rounded-2xl border border-pink-100 bg-[#faf3ec]/60 p-2.5 shadow-2xs">
              <span className="block text-base font-extrabold text-[#c52752]">&lt; 2 seg</span>
              <span className="text-[10px] font-semibold text-[#7b5965]">Respuesta 24/7</span>
            </div>
            <div className="rounded-2xl border border-pink-100 bg-[#faf3ec]/60 p-2.5 shadow-2xs">
              <span className="block text-base font-extrabold text-emerald-700">15 min</span>
              <span className="text-[10px] font-semibold text-[#7b5965]">Buffer Profoto</span>
            </div>
            <div className="rounded-2xl border border-pink-100 bg-[#faf3ec]/60 p-2.5 shadow-2xs">
              <span className="block text-base font-extrabold text-[#9e193e]">90%</span>
              <span className="text-[10px] font-semibold text-[#7b5965]">Citas Rescatadas</span>
            </div>
          </div>

          {/* Interactive ROI Calculator Card */}
          <div className="rounded-2xl border border-pink-200/80 bg-[#fffdfb] p-3.5 sm:p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-[#e0446e]" />
                <h4 className="text-xs font-bold text-[#2d1822] uppercase tracking-wider">
                  Calculadora de Retorno de Inversión
                </h4>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800">
                Estimación en Vivo
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
                <span>8 mín.</span>
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
                <span className="text-[9px] text-[#8e7079]">Maquillaje &amp; Video 4K</span>
              </div>

              <div className="rounded-xl border border-pink-100 bg-[#fffdfb] p-2.5">
                <span className="text-[10px] font-medium text-[#7b5965]">Citas Rescatadas</span>
                <p className="mt-0.5 text-xs sm:text-sm font-extrabold text-emerald-700">
                  +${monthlyRecoveredRevenue.toLocaleString("es-MX")} MXN
                </p>
                <span className="text-[9px] text-[#8e7079]">{recoveredSessionsCount} citas salvadas</span>
              </div>
            </div>

            {/* Total Grand Output Card */}
            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-center">
              <span className="text-[11px] font-bold text-emerald-900 block">
                Ganancia Neta Extra Estimada:
              </span>
              <div className="mt-0.5 flex items-baseline justify-center gap-1">
                <span className="text-xl sm:text-2xl font-black text-emerald-800">
                  +${totalExtraMonthlyRevenue.toLocaleString("es-MX")} MXN
                </span>
                <span className="text-xs font-bold text-emerald-700">/ mes</span>
              </div>
              <p className="mt-1 text-[11px] text-emerald-800">
                Equivale a <strong className="text-emerald-950 font-black">+${totalExtraAnnualRevenue.toLocaleString("es-MX")} MXN al año</strong> y {monthlyHoursSaved}h ahorradas en mensajes.
              </p>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("demos")}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-pink-200 bg-white py-2 px-3 text-xs font-bold text-[#c52752] shadow-2xs hover:bg-pink-50 active:scale-95 transition"
            >
              <Zap className="h-3.5 w-3.5 text-[#e0446e]" />
              <span>Ver Demos en Vivo</span>
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
          TAB 2: 5 DECISIVE STUDIO ADVANTAGES
          ========================================================================= */}
      {activeTab === "ventajas" && (
        <div className="flex flex-col gap-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-[#e0446e]" />
              <h4 className="text-xs font-bold text-[#2d1822] uppercase tracking-wider">
                Las 5 Ventajas Decisivas
              </h4>
            </div>
            <span className="text-[10px] font-semibold text-[#7b5965]">
              Estudio Fotográfico Premium
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
                  Responde en &lt; 2s por SMS y WhatsApp a las 11:30 PM o en domingos mientras descansas. Recomienda paquetes y asegura citas con anticipo.
                </p>
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
                  <XCircle className="h-3 w-3 text-rose-600" /> Tu Estudio Hoy
                </span>
                <ul className="mt-1 flex flex-col gap-1 text-rose-950/80">
                  <li>• Respuestas lentas (3-8h) en WhatsApp.</li>
                  <li>• Prospectos nocturnos perdidos.</li>
                  <li>• Cancelaciones dejan horas muertas.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-2.5">
                <span className="font-bold text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Con juntosxsiempre
                </span>
                <ul className="mt-1 flex flex-col gap-1 text-emerald-950/80">
                  <li>• Respuesta &lt; 2s las 24 horas del día.</li>
                  <li>• Upselling automático (+42% ticket).</li>
                  <li>• Reasignación inmediata de cancelaciones.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: 1-CLICK LIVE DEMONSTRATIONS FOR THE STUDIO OWNER
          ========================================================================= */}
      {activeTab === "demos" && (
        <div className="flex flex-col gap-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-[#e0446e]" />
              <h4 className="text-xs font-bold text-[#2d1822] uppercase tracking-wider">
                Demostraciones en Vivo (1 Clic)
              </h4>
            </div>
            <span className="text-[10px] font-semibold text-[#7b5965]">
              Prueba los 6 escenarios
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {/* Demo 1: Upselling */}
            <button
              type="button"
              onClick={() => handleAction(onRunUpsellDemo)}
              className="group flex items-center justify-between rounded-2xl border border-pink-200 bg-[#faf3ec]/60 p-2.5 text-left transition hover:border-pink-300 hover:bg-pink-50 active:scale-95"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-[#c52752] font-bold text-xs">
                  💎
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-[#2d1822] group-hover:text-[#c52752] truncate">
                    1. Ver a Camila Vendiendo Add-Ons (+Upsell)
                  </p>
                  <p className="text-[10px] text-[#7b5965] truncate">
                    Cotiza sesión agregando Maquillaje y Reel 4K ($5,100 MXN).
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#c52752] transition group-hover:translate-x-1" />
            </button>

            {/* Demo 2: Late-Night Response */}
            <button
              type="button"
              onClick={() => handleAction(onRunLateNightDemo)}
              className="group flex items-center justify-between rounded-2xl border border-pink-200 bg-[#faf3ec]/60 p-2.5 text-left transition hover:border-pink-300 hover:bg-pink-50 active:scale-95"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-[#c52752] font-bold text-xs">
                  🌙
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-[#2d1822] group-hover:text-[#c52752] truncate">
                    2. Simular Cliente Nocturno a las 11:42 PM
                  </p>
                  <p className="text-[10px] text-[#7b5965] truncate">
                    Camila responde en menos de 2s y asegura cita con anticipo.
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#c52752] transition group-hover:translate-x-1" />
            </button>

            {/* Demo 3: Waitlist Recovery */}
            <button
              type="button"
              onClick={() => handleAction(onRunWaitlistRecoveryDemo)}
              className="group flex items-center justify-between rounded-2xl border border-pink-200 bg-[#faf3ec]/60 p-2.5 text-left transition hover:border-pink-300 hover:bg-pink-50 active:scale-95"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-[#c52752] font-bold text-xs">
                  🔄
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-[#2d1822] group-hover:text-[#c52752] truncate">
                    3. Rescate de Cancelación en Lista de Espera
                  </p>
                  <p className="text-[10px] text-[#7b5965] truncate">
                    Cancela cita JXS-2041 y observa a Lucía Benítez activarse.
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#c52752] transition group-hover:translate-x-1" />
            </button>

            {/* Demo 4: Smart Buffer */}
            <button
              type="button"
              onClick={() => handleAction(onRunBookingDemo)}
              className="group flex items-center justify-between rounded-2xl border border-pink-200 bg-[#faf3ec]/60 p-2.5 text-left transition hover:border-pink-300 hover:bg-pink-50 active:scale-95"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-[#c52752] font-bold text-xs">
                  🛡️
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-[#2d1822] group-hover:text-[#c52752] truncate">
                    4. Algoritmo de Buffer de 15m Profoto
                  </p>
                  <p className="text-[10px] text-[#7b5965] truncate">
                    Protege tiempos entre sesiones para calibrar ciclorama y luces.
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#c52752] transition group-hover:translate-x-1" />
            </button>

            {/* Demo 5: Prep Guide & Anti No-Show */}
            <button
              type="button"
              onClick={() => handleAction(onRunPrepGuideDemo)}
              className="group flex items-center justify-between rounded-2xl border border-pink-200 bg-[#faf3ec]/60 p-2.5 text-left transition hover:border-pink-300 hover:bg-pink-50 active:scale-95"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-[#c52752] font-bold text-xs">
                  👗
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-[#2d1822] group-hover:text-[#c52752] truncate">
                    5. Guía de Vestuario &amp; Blindaje No-Show
                  </p>
                  <p className="text-[10px] text-[#7b5965] truncate">
                    Envío automático de tips de ropa y enlace de anticipo.
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#c52752] transition group-hover:translate-x-1" />
            </button>

            {/* Demo 6: SMS Twilio Webhook */}
            <button
              type="button"
              onClick={() => handleAction(onOpenSmsWebhook)}
              className="group flex items-center justify-between rounded-2xl border border-pink-200 bg-[#faf3ec]/60 p-2.5 text-left transition hover:border-pink-300 hover:bg-pink-50 active:scale-95"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-[#c52752] font-bold text-xs">
                  📱
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-[#2d1822] group-hover:text-[#c52752] truncate">
                    6. Probar Webhook SMS / Twilio en Vivo
                  </p>
                  <p className="text-[10px] text-[#7b5965] truncate">
                    Simula SMS entrante generando respuestas TwiML XML.
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#c52752] transition group-hover:translate-x-1" />
            </button>
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
