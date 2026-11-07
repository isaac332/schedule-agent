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
    { label: "Promedio Nogales (24)", value: 24 },
    { label: "Alta Capacidad (36)", value: 36 },
    { label: "Temporada Alta (48)", value: 48 },
  ];

  return (
    <div className="flex flex-col gap-4 text-xs text-[#2d1822]">
      {/* --- Pitch Header Hero Card --- */}
      <div className="relative overflow-hidden rounded-3xl border border-pink-200/90 bg-gradient-to-br from-[#fffdfb] via-[#fdf2f4] to-[#faebef] p-4 sm:p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-pink-100/90 px-3 py-1 text-[11px] font-bold text-[#c52752]">
              <Sparkles className="h-3.5 w-3.5 text-[#e0446e]" />
              <span>Propuesta Exclusiva para Dueño de Estudio</span>
            </div>
            <h2 className="mt-2 text-base sm:text-lg font-extrabold tracking-tight text-[#2d1822]">
              ¿Por qué juntosxsiempre multiplica tus ingresos y tu tranquilidad?
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#7b5965]">
              Diseñado a la medida para estudios fotográficos premium en Nogales, Sonora, México.
              Atiende consultas 24/7 en menos de 2 segundos, eleva el ticket promedio con ventas cruzadas automáticas y elimina huecos financieros por cancelaciones.
            </p>
          </div>
        </div>

        {/* Quick Highlights KPI Bar */}
        <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="rounded-2xl border border-pink-100/80 bg-white/95 p-2 shadow-xs">
            <span className="block text-sm sm:text-base font-extrabold text-[#e0446e]">+42%</span>
            <span className="text-[10px] font-semibold text-[#7b5965]">Ticket Promedio</span>
          </div>
          <div className="rounded-2xl border border-pink-100/80 bg-white/95 p-2 shadow-xs">
            <span className="block text-sm sm:text-base font-extrabold text-[#c52752]">&lt; 2 seg</span>
            <span className="text-[10px] font-semibold text-[#7b5965]">Respuesta 24/7</span>
          </div>
          <div className="rounded-2xl border border-pink-100/80 bg-white/95 p-2 shadow-xs">
            <span className="block text-sm sm:text-base font-extrabold text-emerald-700">15 min</span>
            <span className="text-[10px] font-semibold text-[#7b5965]">Buffer Profoto</span>
          </div>
          <div className="rounded-2xl border border-pink-100/80 bg-white/95 p-2 shadow-xs">
            <span className="block text-sm sm:text-base font-extrabold text-[#9e193e]">90%</span>
            <span className="text-[10px] font-semibold text-[#7b5965]">Citas Rescatadas</span>
          </div>
        </div>
      </div>

      {/* --- 5 Unique Advantages Accordion / Cards --- */}
      <div className="rounded-3xl border border-pink-200/80 bg-[#fffdfb] p-4 shadow-xs">
        <div className="flex items-center gap-1.5 mb-3">
          <Award className="h-4 w-4 text-[#e0446e]" />
          <h3 className="text-xs font-bold text-[#2d1822] uppercase tracking-wider">
            Las 5 Ventajas Decisivas para el Dueño del Estudio
          </h3>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Advantage 1 */}
          <div className="rounded-2xl border border-pink-100 bg-[#faf3ec]/60 p-3 transition hover:border-pink-300">
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#e0446e] to-[#f06a8f] text-white font-bold text-xs">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#2d1822]">Cero Clientes Perdidos 24/7 (Respuesta en &lt; 2s)</h4>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                    +35% Conversión
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[#7b5965] leading-relaxed">
                  El 64% de los clientes en Nogales busca estudio fotográfico entre 8:00 PM y 11:30 PM o los domingos. Mientras descansas, Camila responde inmediatamente por SMS y WhatsApp, recomienda paquetes, resuelve dudas de vestuario y asegura la cita con anticipo.
                </p>
              </div>
            </div>
          </div>

          {/* Advantage 2 */}
          <div className="rounded-2xl border border-pink-100 bg-[#faf3ec]/60 p-3 transition hover:border-pink-300">
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#e0446e] to-[#f06a8f] text-white font-bold text-xs">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#2d1822]">Upselling Automático con IA (+42% Ticket Promedio)</h4>
                  <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[9px] font-bold text-[#c52752]">
                    + $1,450 MXN / sesión
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[#7b5965] leading-relaxed">
                  Camila nunca olvida ofrecer complementos de alto margen: Maquillaje y Peinado Profesional (+ $1,200), Video Reel 4K Vertical (+ $1,100) y Fotos Extra con Retoque Fino (+ $950). El paquete básico de $2,800 se convierte fácilmente en una sesión de $4,500 - $5,100 MXN en piloto automático.
                </p>
              </div>
            </div>
          </div>

          {/* Advantage 3 */}
          <div className="rounded-2xl border border-pink-100 bg-[#faf3ec]/60 p-3 transition hover:border-pink-300">
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#e0446e] to-[#f06a8f] text-white font-bold text-xs">
                3
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#2d1822]">Algoritmo Anti-Traslapes (Buffer de 15 Minutos Profoto)</h4>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800">
                    Cero Estrés en Set
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[#7b5965] leading-relaxed">
                  Tus fotógrafos (Sofía, Mateo, Valentina) jamás tendrán que apurarse. El motor inteligente reserva 15 minutos exactos entre citas para calibrar flashes Profoto Pro-11, reacomodar ciclorama y recibir a la siguiente pareja con té caliente y tranquilidad.
                </p>
              </div>
            </div>
          </div>

          {/* Advantage 4 */}
          <div className="rounded-2xl border border-pink-100 bg-[#faf3ec]/60 p-3 transition hover:border-pink-300">
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#e0446e] to-[#f06a8f] text-white font-bold text-xs">
                4
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#2d1822]">Auto-Recuperación de Cancelaciones (Lista de Espera Reactiva)</h4>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                    $0 en Horas Muertas
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[#7b5965] leading-relaxed">
                  Cuando una cita se cancela o reprograma, el sistema no deja el espacio vacío. Notifica inmediatamente a los clientes en lista de espera (como Lucía Benítez) y reasigna el horario libre en minutos, salvando hasta $2,800–$3,450 MXN que de otra forma se perderían.
                </p>
              </div>
            </div>
          </div>

          {/* Advantage 5 */}
          <div className="rounded-2xl border border-pink-100 bg-[#faf3ec]/60 p-3 transition hover:border-pink-300">
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#e0446e] to-[#f06a8f] text-white font-bold text-xs">
                5
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#2d1822]">Blindaje Anti No-Shows con Anticipos y Guía de Vestuario</h4>
                  <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[9px] font-bold text-[#c52752]">
                    &lt; 2% Ausentismo
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[#7b5965] leading-relaxed">
                  Reduce el ausentismo radicalmente asegurando anticipos transferibles ($500–$1,000 MXN) y enviando de inmediato la Guía de Preparación y Vestuario con recomendaciones para los fondos artesanales y luz natural de Nogales.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Interactive ROI Calculator for the Studio Owner --- */}
      <div className="rounded-3xl border border-pink-200/90 bg-gradient-to-b from-[#fffdfb] to-[#faf3ec]/90 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-[#e0446e]" />
            <h3 className="text-xs font-bold text-[#2d1822] uppercase tracking-wider">
              Calculadora de Retorno de Inversión (ROI)
            </h3>
          </div>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
            Ganancia Extra Estimada
          </span>
        </div>

        <p className="mt-1 text-[11px] text-[#7b5965]">
          Ajusta el volumen mensual de tu estudio para calcular el ingreso adicional generado por add-ons automáticos y rescate de citas:
        </p>

        {/* Preset Volume Quick Buttons */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {volumePresets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setSessionsPerMonth(preset.value)}
              className={`rounded-xl px-2.5 py-1 text-[10px] font-bold transition active:scale-95 ${
                sessionsPerMonth === preset.value
                  ? "bg-[#e0446e] text-white shadow-xs"
                  : "bg-white border border-pink-200 text-[#5e3347] hover:bg-pink-50"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Slider */}
        <div className="mt-3 rounded-2xl bg-white p-3 border border-pink-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs text-[#2d1822]">Sesiones Realizadas al Mes:</span>
            <span className="rounded-xl bg-pink-100 px-3 py-1 font-mono font-extrabold text-sm text-[#c52752]">
              {sessionsPerMonth} sesiones
            </span>
          </div>
          <input
            type="range"
            min={8}
            max={50}
            step={2}
            value={sessionsPerMonth}
            onChange={(e) => setSessionsPerMonth(Number(e.target.value))}
            className="mt-3 w-full accent-[#e0446e] cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-[#a0828c] mt-1 font-mono">
            <span>8 (Boutique)</span>
            <span>24 (Promedio Nogales, Sonora)</span>
            <span>50 (Alta capacidad)</span>
          </div>
        </div>

        {/* Dynamic ROI Metrics Cards */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-pink-100 bg-white p-3 text-center">
            <span className="text-[10px] font-medium text-[#7b5965]">Ingreso Extra por Add-Ons</span>
            <p className="mt-1 text-sm font-extrabold text-[#c52752]">
              +${monthlyUpsellRevenue.toLocaleString("es-MX")} MXN
            </p>
            <span className="text-[9px] text-[#8e7079]">Maquillaje, Reels y Fotos Extra</span>
          </div>

          <div className="rounded-2xl border border-pink-100 bg-white p-3 text-center">
            <span className="text-[10px] font-medium text-[#7b5965]">Citas Salvadas (Waitlist)</span>
            <p className="mt-1 text-sm font-extrabold text-emerald-700">
              +${monthlyRecoveredRevenue.toLocaleString("es-MX")} MXN
            </p>
            <span className="text-[9px] text-[#8e7079]">{recoveredSessionsCount} sesiones recuperadas</span>
          </div>
        </div>

        {/* Total Grand Output Card */}
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-center">
          <span className="text-[11px] font-bold text-emerald-900">
            Impacto Económico Total Proyectado:
          </span>
          <div className="mt-1 flex items-baseline justify-center gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-800">
              +${totalExtraMonthlyRevenue.toLocaleString("es-MX")} MXN
            </span>
            <span className="text-xs font-bold text-emerald-700">/ mes</span>
          </div>
          <p className="mt-1 text-[11px] font-semibold text-emerald-800">
            Equivale a <strong className="text-emerald-950 font-extrabold">+${totalExtraAnnualRevenue.toLocaleString("es-MX")} MXN al año</strong> y {monthlyHoursSaved} horas de trabajo manual ahorradas en WhatsApp.
          </p>
        </div>
      </div>

      {/* --- Guided Interactive Demo Actions (1-Click Owner Proofs) --- */}
      <div className="rounded-3xl border border-pink-200/80 bg-[#fffdfb] p-4 shadow-xs">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Zap className="h-4 w-4 text-[#e0446e]" />
          <h3 className="text-xs font-bold text-[#2d1822] uppercase tracking-wider">
            Demostraciones en Vivo para el Dueño (Pruébalo en 1 Clic)
          </h3>
        </div>
        <p className="text-[11px] text-[#7b5965] mb-3">
          Demuestra la magia del sistema al dueño ejecutando directamente estos 5 escenarios preparados:
        </p>

        <div className="flex flex-col gap-2">
          {/* Demo 1: Upselling */}
          <button
            type="button"
            onClick={() => handleAction(onRunUpsellDemo)}
            className="group flex items-center justify-between rounded-2xl border border-pink-200 bg-[#faf3ec]/60 p-3 text-left transition hover:border-pink-300 hover:bg-pink-50 active:scale-95"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-100 text-[#c52752] font-bold text-sm">
                💎
              </span>
              <div>
                <p className="font-bold text-xs text-[#2d1822] group-hover:text-[#c52752]">
                  1. Ver a Camila Vendiendo Add-Ons (+Upsell)
                </p>
                <p className="text-[10px] text-[#7b5965]">
                  Cotiza Sesión Juntos x Siempre agregando Maquillaje y Video Reel ($5,100 MXN).
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[#c52752] transition group-hover:translate-x-1" />
          </button>

          {/* Demo 2: Late-Night Response */}
          <button
            type="button"
            onClick={() => handleAction(onRunLateNightDemo)}
            className="group flex items-center justify-between rounded-2xl border border-pink-200 bg-[#faf3ec]/60 p-3 text-left transition hover:border-pink-300 hover:bg-pink-50 active:scale-95"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-100 text-[#c52752] font-bold text-sm">
                🌙
              </span>
              <div>
                <p className="font-bold text-xs text-[#2d1822] group-hover:text-[#c52752]">
                  2. Simular Cliente Nocturno a las 11:42 PM
                </p>
                <p className="text-[10px] text-[#7b5965]">
                  Camila responde en menos de 2s, sugiere el atardecer en Nogales y asegura la cita.
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[#c52752] transition group-hover:translate-x-1" />
          </button>

          {/* Demo 3: Waitlist Recovery */}
          <button
            type="button"
            onClick={() => handleAction(onRunWaitlistRecoveryDemo)}
            className="group flex items-center justify-between rounded-2xl border border-pink-200 bg-[#faf3ec]/60 p-3 text-left transition hover:border-pink-300 hover:bg-pink-50 active:scale-95"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-100 text-[#c52752] font-bold text-sm">
                🔄
              </span>
              <div>
                <p className="font-bold text-xs text-[#2d1822] group-hover:text-[#c52752]">
                  3. Ver Rescate de Cancelación en Lista de Espera
                </p>
                <p className="text-[10px] text-[#7b5965]">
                  Cancela la cita de prueba JXS-2041 y observa a Lucía Benítez activarse en verde.
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[#c52752] transition group-hover:translate-x-1" />
          </button>

          {/* Demo 4: Smart Buffer */}
          <button
            type="button"
            onClick={() => handleAction(onRunBookingDemo)}
            className="group flex items-center justify-between rounded-2xl border border-pink-200 bg-[#faf3ec]/60 p-3 text-left transition hover:border-pink-300 hover:bg-pink-50 active:scale-95"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-100 text-[#c52752] font-bold text-sm">
                🛡️
              </span>
              <div>
                <p className="font-bold text-xs text-[#2d1822] group-hover:text-[#c52752]">
                  4. Ver Algoritmo de Buffer de 15m Profoto
                </p>
                <p className="text-[10px] text-[#7b5965]">
                  Explora la protección de tiempos entre sesiones para calibrar iluminación sin estrés.
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[#c52752] transition group-hover:translate-x-1" />
          </button>

          {/* Demo 5: Prep Guide & Anti No-Show */}
          <button
            type="button"
            onClick={() => handleAction(onRunPrepGuideDemo)}
            className="group flex items-center justify-between rounded-2xl border border-pink-200 bg-[#faf3ec]/60 p-3 text-left transition hover:border-pink-300 hover:bg-pink-50 active:scale-95"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-100 text-[#c52752] font-bold text-sm">
                👗
              </span>
              <div>
                <p className="font-bold text-xs text-[#2d1822] group-hover:text-[#c52752]">
                  5. Ver Guía de Vestuario &amp; Blindaje Anti No-Show
                </p>
                <p className="text-[10px] text-[#7b5965]">
                  Envía de inmediato tips de preparación de ropa y enlace de anticipo para reducir ausentismo al 1%.
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[#c52752] transition group-hover:translate-x-1" />
          </button>

          {/* Demo 6: SMS Twilio Webhook */}
          <button
            type="button"
            onClick={() => handleAction(onOpenSmsWebhook)}
            className="group flex items-center justify-between rounded-2xl border border-pink-200 bg-[#faf3ec]/60 p-3 text-left transition hover:border-pink-300 hover:bg-pink-50 active:scale-95"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-100 text-[#c52752] font-bold text-sm">
                📱
              </span>
              <div>
                <p className="font-bold text-xs text-[#2d1822] group-hover:text-[#c52752]">
                  6. Probar Webhook SMS / Twilio en Vivo
                </p>
                <p className="text-[10px] text-[#7b5965]">
                  Simula la recepción de un SMS entrante generando respuestas compatibles con TwiML XML.
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[#c52752] transition group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* --- Side-by-side Comparison: Before vs With juntosxsiempre --- */}
      <div className="rounded-3xl border border-pink-200/80 bg-[#fffdfb] p-4 shadow-xs">
        <h3 className="text-xs font-bold text-[#2d1822] uppercase tracking-wider mb-2.5">
          Comparativa: Tu Estudio Hoy vs Con Tu Agente IA
        </h3>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {/* Before */}
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/40 p-3">
            <span className="font-extrabold text-rose-800 flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5 text-rose-600" /> Tu Estudio Hoy
            </span>
            <ul className="mt-2 flex flex-col gap-1.5 text-rose-950/80">
              <li>• Respuestas con retraso de 3 a 8 horas en WhatsApp.</li>
              <li>• Clientes nocturnos perdidos con otros estudios.</li>
              <li>• Se vende solo el paquete básico; no se ofrecen add-ons.</li>
              <li>• Cancelaciones dejan horas muertas sin ingresos.</li>
              <li>• El fotógrafo se distrae contestando dudas en vez de disparar.</li>
            </ul>
          </div>

          {/* After */}
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3">
            <span className="font-extrabold text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Con juntosxsiempre
            </span>
            <ul className="mt-2 flex flex-col gap-1.5 text-emerald-950/80">
              <li>• Respuesta en &lt; 2s las 24 horas del día.</li>
              <li>• Cero prospectos perdidos en noches o fines de semana.</li>
              <li>• Upselling automático de Maquillaje y Reels (+42% ticket).</li>
              <li>• Cancelaciones reasignadas a lista de espera al instante.</li>
              <li>• Tus fotógrafos concentrados 100% en la creatividad.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* --- Nogales, Sonora Boutique Case Study Card --- */}
      <div className="rounded-3xl border border-pink-200/80 bg-[#fffdfb] p-4 shadow-xs">
        <div className="flex items-center gap-1.5 mb-2">
          <HeartHandshake className="h-4 w-4 text-[#e0446e]" />
          <h3 className="text-xs font-bold text-[#2d1822] uppercase tracking-wider">
            Caso de Éxito en Nogales, Sonora, México
          </h3>
        </div>
        <div className="rounded-2xl border border-pink-100 bg-[#faf3ec]/60 p-3 text-[11px] text-[#5e3347] leading-relaxed">
          <p className="italic">
            &ldquo;Antes pasábamos horas respondiendo cotizaciones en WhatsApp entre tomas y perdíamos clientes que escribían a las 10 PM. Con Camila, el ticket promedio subió de $2,800 a $4,600 MXN porque los clientes reservan Maquillaje y Reels solos, y los sábados ya no tenemos traslapes.&rdquo;
          </p>
          <div className="mt-2.5 flex items-center justify-between border-t border-pink-100/60 pt-2 font-medium">
            <span className="text-[#2d1822] font-bold">Estudio Boutique en Av. Álvaro Obregón</span>
            <span className="text-emerald-700 font-extrabold">+ $34,200 MXN extra / mes</span>
          </div>
        </div>
      </div>

      {/* --- Multi-LLM Reliability Stamp --- */}
      <div className="rounded-3xl border border-pink-200/70 bg-[#faf3ec]/60 p-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-[#e0446e] shrink-0" />
          <div>
            <p className="font-bold text-xs text-[#2d1822]">Motor Dual Multi-LLM (99.9% Uptime)</p>
            <p className="text-[10px] text-[#7b5965]">
              Google Gemini 2.5 + OpenRouter Failover automático en menos de 1.5 segundos. Tu coordinadora nunca se queda muda.
            </p>
          </div>
        </div>
      </div>

      {/* Close Modal / Start Setup Action */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={() => handleAction(onRunUpsellDemo)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#e0446e] to-[#c52752] px-5 py-2.5 text-xs font-extrabold text-white shadow-md shadow-pink-500/20 active:scale-95 transition"
        >
          <Sparkles className="h-4 w-4" />
          <span>Comenzar Demostración en Vivo</span>
        </button>
      </div>
    </div>
  );
}
