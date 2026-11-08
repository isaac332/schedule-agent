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
  Copy,
  Cpu,
  HeartHandshake,
  Info,
  Sparkles,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import type { CustomAddOnConfig } from "@/lib/studio/types";

interface OwnerPitchSectionProps {
  onRunUpsellDemo?: () => void;
  onRunBookingDemo?: () => void;
  onRunWaitlistRecoveryDemo?: () => void;
  onRunPrepGuideDemo?: () => void;
  onRunLateNightDemo?: () => void;
  onOpenSmsWebhook?: () => void;
  onOpenScenarioBuilder?: (initialValues?: { basePrice?: number; addOns?: CustomAddOnConfig[] }) => void;
  onCloseModal?: () => void;
}

export function OwnerPitchSection({
  onRunUpsellDemo,
  onRunBookingDemo,
  onRunWaitlistRecoveryDemo,
  onRunPrepGuideDemo,
  onRunLateNightDemo,
  onOpenSmsWebhook,
  onOpenScenarioBuilder,
  onCloseModal,
}: OwnerPitchSectionProps) {
  const [activeTab, setActiveTab] = useState<"roi" | "ventajas" | "demos">("roi");
  const [sessionsPerMonth, setSessionsPerMonth] = useState<number>(24);
  const [showRoiFormulas, setShowRoiFormulas] = useState<boolean>(true);

  // =========================================================================
  // PROPOSAL 3: CUSTOM FINANCIAL ROI SANDBOX STATE
  // Permite al dueño calibrar su precio base, complementos y cancelaciones
  // =========================================================================
  const [customBasePrice, setCustomBasePrice] = useState<number>(2800);
  const [customAddOns, setCustomAddOns] = useState<CustomAddOnConfig[]>([
    {
      id: "maquillaje-peinado",
      name: "Maquillaje y Peinado Profesional (HMUA)",
      price: 1200,
      enabled: true,
      extraMinutes: 30,
    },
    {
      id: "video-reel",
      name: "Video Reel 4K Vertical Detrás de Cámaras",
      price: 1100,
      enabled: true,
      extraMinutes: 0,
    },
    {
      id: "fotos-extra-5",
      name: "5 Fotos Extra con Retoque Fino de Revista",
      price: 950,
      enabled: true,
      extraMinutes: 0,
    },
    {
      id: "cuadro-recuerdo",
      name: "Cuadro Fine-Art / Impresiones de Recuerdo",
      price: 750,
      enabled: false,
      extraMinutes: 0,
    },
    {
      id: "entrega-express",
      name: "Entrega Express 24 Horas",
      price: 850,
      enabled: false,
      extraMinutes: 0,
    },
  ]);
  const [cancellationsPerMonth, setCancellationsPerMonth] = useState<number>(3);
  const [upsellAdoptionRate, setUpsellAdoptionRate] = useState<number>(0.58);
  const [copiedToast, setCopiedToast] = useState<string>("");

  // 1. Venta de Add-ons / Upselling Automático:
  const activeAddOns = customAddOns.filter((a) => a.enabled);
  const averageUpsellValue =
    activeAddOns.length > 0
      ? Math.round(
          (activeAddOns.reduce((sum, a) => sum + a.price, 0) / activeAddOns.length) *
            (activeAddOns.length > 1 ? 1.25 : 1),
        )
      : 0;
  const monthlyUpsellRevenue = Math.round(
    sessionsPerMonth * upsellAdoptionRate * averageUpsellValue,
  );

  // 2. Auto-recuperación de cancelaciones (Lista de Espera Reactiva):
  const waitlistRecoveryRate = 0.85;
  const recoveredSessionsCount =
    cancellationsPerMonth > 0 ? Math.max(1, Math.round(cancellationsPerMonth * waitlistRecoveryRate)) : 0;
  const monthlyRecoveredRevenue = recoveredSessionsCount * customBasePrice;

  // 3. Ahorro de tiempo administrativo y atención al cliente:
  const hoursSavedPerSession = 2.5;
  const monthlyHoursSaved = Math.round(sessionsPerMonth * hoursSavedPerSession);

  // 4. Totales consolidados:
  const totalExtraMonthlyRevenue = monthlyUpsellRevenue + monthlyRecoveredRevenue;
  const totalExtraAnnualRevenue = totalExtraMonthlyRevenue * 12;

  const averageTicketBefore = customBasePrice;
  const averageTicketAfter =
    customBasePrice + Math.round(upsellAdoptionRate * averageUpsellValue);
  const ticketIncreasePercent =
    activeAddOns.length > 0 && averageTicketBefore > 0
      ? Math.round(((averageTicketAfter - averageTicketBefore) / averageTicketBefore) * 100)
      : 0;

  const handleAction = (action?: () => void) => {
    if (onCloseModal) onCloseModal();
    if (action) action();
  };

  const handleToggleAddOn = (id: string) => {
    setCustomAddOns((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
    );
  };

  const handleUpdateAddOnPrice = (id: string, newPrice: number) => {
    const val = Number.isNaN(newPrice) ? 0 : Math.max(0, Math.min(25000, newPrice));
    setCustomAddOns((prev) =>
      prev.map((a) => (a.id === id ? { ...a, price: val } : a)),
    );
  };

  const handleBlurAddOnPrice = (id: string) => {
    setCustomAddOns((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, price: Math.max(100, Math.min(25000, a.price || 100)) } : a,
      ),
    );
  };

  const fallbackCopy = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (success) {
        setCopiedToast("✨ ¡Proyección para tu estudio copiada al portapapeles!");
        setTimeout(() => setCopiedToast(""), 4000);
      }
    } catch {
      setCopiedToast("📋 Selecciona y copia el resumen del certificado.");
      setTimeout(() => setCopiedToast(""), 4000);
    }
  };

  const handleCopyProjection = () => {
    const summary = `PROYECCIÓN DE RETORNO DE INVERSIÓN (ROI) • JUNTOSXSIEMPRE
Estudio Fotográfico en Nogales, Sonora, México
--------------------------------------------------------
• Sesiones mensuales: ${sessionsPerMonth} citas/mes
• Precio base sesión: $${customBasePrice.toLocaleString("es-MX")} MXN
• Complementos activos (${activeAddOns.length}): ${activeAddOns.map((a) => `${a.name} ($${a.price.toLocaleString("es-MX")} MXN)`).join(", ") || "Ninguno"}
• Ticket promedio de add-ons: $${averageUpsellValue.toLocaleString("es-MX")} MXN (adopción: ${(upsellAdoptionRate * 100).toFixed(0)}%)
• Cancelaciones mensuales estimadas: ${cancellationsPerMonth} citas/mes (85% recuperadas: ${recoveredSessionsCount} citas)
--------------------------------------------------------
💰 RESULTADOS ECONÓMICOS PROYECTADOS:
• Ingreso mensual por Upselling IA: +$${monthlyUpsellRevenue.toLocaleString("es-MX")} MXN/mes
• Ingreso mensual por Citas Rescatadas: +$${monthlyRecoveredRevenue.toLocaleString("es-MX")} MXN/mes
• GANANCIA NETA EXTRA MENSUAL: +$${totalExtraMonthlyRevenue.toLocaleString("es-MX")} MXN/mes
• GANANCIA NETA EXTRA ANUAL: +$${totalExtraAnnualRevenue.toLocaleString("es-MX")} MXN/año
• Tiempo de gestión ahorrado: ${monthlyHoursSaved} horas libres/mes
--------------------------------------------------------
Certificado con Inteligencia Artificial Camila • juntosxsiempre Nogales`;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(summary)
          .then(() => {
            setCopiedToast("✨ ¡Proyección para tu estudio copiada al portapapeles!");
            setTimeout(() => setCopiedToast(""), 4000);
          })
          .catch(() => fallbackCopy(summary));
      } else {
        fallbackCopy(summary);
      }
    } catch {
      fallbackCopy(summary);
    }
  };

  const volumePresets = [
    { label: "Boutique (12)", value: 12 },
    { label: "Nogales Prom. (24)", value: 24 },
    { label: "Alta Cap. (36)", value: 36 },
    { label: "Temporada (48)", value: 48 },
  ];

  const basePricePresets = [1800, 2400, 2800, 3200, 4200];

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
          <span className="truncate">Sandbox ROI</span>
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
          <span className="truncate">Demos &amp; Simulador</span>
        </button>
      </nav>

      {/* =========================================================================
          TAB 1: CUSTOM FINANCIAL ROI SANDBOX (PROPOSAL 3)
          ========================================================================= */}
      {activeTab === "roi" && (
        <div className="flex flex-col gap-3 animate-in fade-in duration-200">
          {/* Quick Highlights 4-KPI Strip with Tooltip Context */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="rounded-2xl border border-pink-100 bg-[#faf3ec]/60 p-2.5 shadow-2xs">
              <span className="block text-base font-extrabold text-[#e0446e]">+{ticketIncreasePercent}%</span>
              <span className="text-[10px] font-semibold text-[#7b5965]">Ticket Promedio</span>
              <span className="block text-[8px] text-[#a0828c] mt-0.5 font-mono">
                +${Math.round(upsellAdoptionRate * averageUpsellValue)} pond./cita
              </span>
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

          {/* Interactive Custom ROI Sandbox Card */}
          <div className="rounded-2xl border border-pink-200/80 bg-[#fffdfb] p-3.5 sm:p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calculator className="h-4 w-4 text-[#e0446e]" />
                <h4 className="text-xs font-bold text-[#2d1822] uppercase tracking-wider">
                  Sandbox Financiero ROI (A Tu Medida)
                </h4>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800">
                Recalculación en Vivo
              </span>
            </div>

            {/* Parameter 1: Base Session Price */}
            <div className="mt-3 rounded-xl bg-[#faf3ec]/50 p-2.5 border border-pink-100">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[11px] text-[#2d1822]">
                  1. Precio Base de tu Sesión Insignia:
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-mono text-[#7b5965]">$</span>
                  <input
                    type="number"
                    step={100}
                    min={1500}
                    max={5000}
                    value={customBasePrice}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!Number.isNaN(val)) setCustomBasePrice(val);
                    }}
                    onBlur={() =>
                      setCustomBasePrice((prev) => Math.max(1500, Math.min(5000, prev || 2800)))
                    }
                    className="w-20 rounded-lg bg-pink-100 px-2 py-1 text-center font-mono font-extrabold text-xs text-[#c52752] border border-pink-200 focus:outline-hidden min-h-[40px]"
                    aria-label="Precio base numérico para ROI"
                  />
                  <span className="text-[9px] font-mono text-[#a0828c]">MXN</span>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {basePricePresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCustomBasePrice(preset)}
                    className={`rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition active:scale-95 min-h-[38px] flex items-center justify-center ${
                      customBasePrice === preset
                        ? "bg-[#e0446e] text-white shadow-xs"
                        : "bg-white border border-pink-200 text-[#5e3347] hover:bg-pink-100"
                    }`}
                  >
                    ${preset.toLocaleString("es-MX")}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min={1500}
                max={5000}
                step={100}
                value={customBasePrice}
                onChange={(e) => setCustomBasePrice(Number(e.target.value))}
                className="mt-2.5 w-full accent-[#e0446e] cursor-pointer"
                aria-label="Precio base de sesión para ROI"
              />
              <div className="flex justify-between text-[8px] text-[#a0828c] mt-0.5 font-mono">
                <span>$1,500 MXN</span>
                <span>$2,800 Promedio Nogales</span>
                <span>$5,000 MXN</span>
              </div>
            </div>

            {/* Parameter 2: Monthly Sessions Volume */}
            <div className="mt-2.5 rounded-xl bg-[#faf3ec]/50 p-2.5 border border-pink-100">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[11px] text-[#2d1822]">
                  2. Citas agendadas al mes en tu estudio:
                </span>
                <span className="rounded-lg bg-pink-100 px-2 py-0.5 font-mono font-extrabold text-xs text-[#c52752]">
                  {sessionsPerMonth} citas/mes
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {volumePresets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setSessionsPerMonth(preset.value)}
                    className={`rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition active:scale-95 min-h-[38px] flex items-center justify-center ${
                      sessionsPerMonth === preset.value
                        ? "bg-[#e0446e] text-white shadow-xs"
                        : "bg-white border border-pink-200 text-[#5e3347] hover:bg-pink-100"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min={8}
                max={50}
                step={2}
                value={sessionsPerMonth}
                onChange={(e) => setSessionsPerMonth(Number(e.target.value))}
                className="mt-2.5 w-full accent-[#e0446e] cursor-pointer"
                aria-label="Sesiones mensuales de fotografía"
              />
            </div>

            {/* Parameter 3: Add-Ons Customization */}
            <div className="mt-2.5 rounded-xl bg-[#faf3ec]/50 p-2.5 border border-pink-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-[11px] text-[#2d1822]">
                  3. Selecciona qué Add-Ons ofreces y sus precios:
                </span>
                <span className="text-[10px] font-bold text-emerald-800">
                  {activeAddOns.length} activos
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {customAddOns.map((addon) => (
                  <div
                    key={addon.id}
                    className={`flex items-center justify-between gap-2 rounded-xl p-2 border transition ${
                      addon.enabled ? "bg-white border-pink-200" : "bg-pink-50/30 border-pink-100 opacity-60"
                    }`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={addon.enabled}
                        onChange={() => handleToggleAddOn(addon.id)}
                        className="h-4 w-4 rounded accent-[#e0446e] cursor-pointer shrink-0"
                      />
                      <span className="text-xs font-semibold text-[#2d1822] truncate">
                        {addon.name}
                      </span>
                    </label>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-[#7b5965] font-mono">$</span>
                      <input
                        type="number"
                        step={50}
                        min={100}
                        max={10000}
                        value={addon.price || ""}
                        disabled={!addon.enabled}
                        onChange={(e) => handleUpdateAddOnPrice(addon.id, Number(e.target.value))}
                        onBlur={() => handleBlurAddOnPrice(addon.id)}
                        className="w-20 rounded-lg border border-pink-200 bg-white px-2 py-1 text-center font-mono font-bold text-xs text-[#c52752] focus:border-[#e0446e] focus:outline-hidden disabled:bg-gray-100 min-h-[44px]"
                        aria-label={`Precio de ${addon.name}`}
                      />
                      <span className="text-[9px] font-mono text-[#a0828c]">MXN</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Parameter 4: Cancellations / Month */}
            <div className="mt-2.5 rounded-xl bg-[#faf3ec]/50 p-2.5 border border-pink-100">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[11px] text-[#2d1822]">
                  4. Cancelaciones imprevistas estimadas al mes:
                </span>
                <span className="rounded-lg bg-pink-100 px-2 py-0.5 font-mono font-extrabold text-xs text-[#c52752]">
                  {cancellationsPerMonth} citas perdidas/mes
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={cancellationsPerMonth}
                onChange={(e) => setCancellationsPerMonth(Number(e.target.value))}
                className="mt-2 w-full accent-[#e0446e] cursor-pointer"
                aria-label="Cancelaciones estimadas al mes"
              />
              <div className="flex justify-between text-[8px] text-[#a0828c] mt-0.5 font-mono">
                <span>1 cita</span>
                <span>{recoveredSessionsCount} citas rescatadas (85% efectividad)</span>
                <span>10 citas</span>
              </div>
            </div>

            {/* Parameter 5: Upsell Adoption Rate */}
            <div className="mt-2.5 rounded-xl bg-[#faf3ec]/50 p-2.5 border border-pink-100">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[11px] text-[#2d1822]">
                  5. Tasa de adopción de complementos con IA:
                </span>
                <span className="rounded-lg bg-pink-100 px-2 py-0.5 font-mono font-extrabold text-xs text-[#c52752]">
                  {(upsellAdoptionRate * 100).toFixed(0)}% de clientes
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  { label: "Conservador (40%)", value: 0.4 },
                  { label: "Nogales Prom. (58%)", value: 0.58 },
                  { label: "Agresivo (75%)", value: 0.75 },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setUpsellAdoptionRate(item.value)}
                    className={`rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition active:scale-95 min-h-[38px] flex items-center justify-center ${
                      upsellAdoptionRate === item.value
                        ? "bg-[#e0446e] text-white shadow-xs"
                        : "bg-white border border-pink-200 text-[#5e3347] hover:bg-pink-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl border border-pink-100 bg-[#fffdfb] p-2.5">
                <span className="text-[10px] font-medium text-[#7b5965]">Add-Ons Automáticos</span>
                <p className="mt-0.5 text-xs sm:text-sm font-extrabold text-[#c52752]">
                  +${monthlyUpsellRevenue.toLocaleString("es-MX")} MXN
                </p>
                <span className="text-[9px] text-[#8e7079]">
                  {(upsellAdoptionRate * 100).toFixed(0)}% adopción × ${averageUpsellValue.toLocaleString("es-MX")}
                </span>
              </div>

              <div className="rounded-xl border border-pink-100 bg-[#fffdfb] p-2.5">
                <span className="text-[10px] font-medium text-[#7b5965]">Citas Rescatadas</span>
                <p className="mt-0.5 text-xs sm:text-sm font-extrabold text-emerald-700">
                  +${monthlyRecoveredRevenue.toLocaleString("es-MX")} MXN
                </p>
                <span className="text-[9px] text-[#8e7079]">
                  {recoveredSessionsCount} citas × ${customBasePrice.toLocaleString("es-MX")}
                </span>
              </div>
            </div>

            {/* Total Grand Output Card */}
            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-center">
              <span className="text-[11px] font-bold text-emerald-900 block">
                Ganancia Neta Extra Calculada para Tu Estudio:
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
              PERSONALIZED STUDIO WATERMARK CERTIFICATE CARD (PROPOSAL 3)
              ========================================================================= */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-[#e0446e]/40 bg-gradient-to-br from-[#fffdfb] via-[#fdf6f0] to-[#faebef] p-3.5 sm:p-4 shadow-sm">
            {/* Studio Background Watermark Seal */}
            <div className="pointer-events-none absolute -right-4 -bottom-4 opacity-5 text-[#e0446e] select-none font-serif text-8xl font-black rotate-12" aria-hidden="true">
              JXS
            </div>

            <div className="flex items-start justify-between gap-2 border-b border-pink-200/70 pb-2.5">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-tr from-[#e0446e] to-[#c52752] text-white text-[9px] font-bold shadow-2xs">
                    ★
                  </span>
                  <span className="font-mono text-[9px] font-extrabold uppercase tracking-widest text-[#9e193e]">
                    Certificado de Proyección ROI
                  </span>
                </div>
                <h5 className="mt-0.5 text-xs font-black text-[#2d1822]">
                  Proyección a la medida para tu estudio en Nogales, Sonora
                </h5>
                <span className="text-[10px] text-[#7b5965] block">
                  Av. Álvaro Obregón 354 • juntosxsiempre
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyProjection}
                className="inline-flex items-center gap-1 rounded-xl border border-pink-200 bg-white px-3 py-2 text-[10px] font-bold text-[#c52752] shadow-2xs hover:bg-pink-50 active:scale-95 transition min-h-[44px]"
                title="Copiar proyección al portapapeles"
              >
                <Copy className="h-3.5 w-3.5 text-[#e0446e]" />
                <span>Copiar</span>
              </button>
            </div>

            {/* Watermark Parameters Badge Grid */}
            <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center text-[10px]">
              <div className="rounded-xl bg-white/90 p-2 border border-pink-100 shadow-2xs">
                <span className="text-[#7b5965] block text-[9px]">Base por Cita</span>
                <span className="font-extrabold text-[#c52752] font-mono">${customBasePrice.toLocaleString("es-MX")}</span>
              </div>
              <div className="rounded-xl bg-white/90 p-2 border border-pink-100 shadow-2xs">
                <span className="text-[#7b5965] block text-[9px]">Citas / Mes</span>
                <span className="font-extrabold text-[#2d1822] font-mono">{sessionsPerMonth} citas</span>
              </div>
              <div className="rounded-xl bg-white/90 p-2 border border-pink-100 shadow-2xs">
                <span className="text-[#7b5965] block text-[9px]">Add-Ons Activos</span>
                <span className="font-extrabold text-[#2d1822] font-mono">{activeAddOns.length} selecc.</span>
              </div>
              <div className="rounded-xl bg-white/90 p-2 border border-pink-100 shadow-2xs">
                <span className="text-[#7b5965] block text-[9px]">Citas Salvadas</span>
                <span className="font-extrabold text-emerald-700 font-mono">{recoveredSessionsCount} citas/mes</span>
              </div>
            </div>

            {/* Big Impact Highlight */}
            <div className="mt-2.5 rounded-xl bg-gradient-to-r from-emerald-100/90 to-teal-50/90 border border-emerald-300/80 p-2.5 text-center">
              <span className="text-[10px] font-bold text-emerald-950 uppercase tracking-wider block">
                Retorno Anual Neto Garantizado:
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-900 mt-0.5 font-mono">
                +${totalExtraAnnualRevenue.toLocaleString("es-MX")} MXN / año
              </div>
              <p className="mt-0.5 text-[10px] text-emerald-800">
                (+$${totalExtraMonthlyRevenue.toLocaleString("es-MX")} MXN/mes netos adicionales + {monthlyHoursSaved}h libres)
              </p>
            </div>

            {/* Actions: Connect Sandbox to Scenario Builder */}
            <div className="mt-3 flex gap-2 flex-wrap">
              {onOpenScenarioBuilder && (
                <button
                  type="button"
                  onClick={() => {
                    if (onCloseModal) onCloseModal();
                    onOpenScenarioBuilder({
                      basePrice: customBasePrice,
                      addOns: customAddOns,
                    });
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#e0446e] to-[#c52752] py-2.5 px-3 text-xs font-black text-white shadow-xs active:scale-95 transition min-h-[44px]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>🎯 Probar estos números en Escenario en Vivo</span>
                </button>
              )}
            </div>

            {copiedToast && (
              <div className="mt-2 rounded-lg bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 text-center animate-in fade-in duration-200">
                {copiedToast}
              </div>
            )}
          </div>

          {/* =========================================================================
              FORMULAS & CALCULATION BREAKDOWN PANEL
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
                  Fórmulas Matemáticas con Tus Números Actuales
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#c52752]">
                {showRoiFormulas ? "Ocultar fórmulas" : "Ver fórmulas paso a paso"}
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
                      Fórmula con tus datos:
                    </span>
                    <code>Ingreso = {sessionsPerMonth} citas × {(upsellAdoptionRate * 100).toFixed(0)}% adopción × ${averageUpsellValue.toLocaleString("es-MX")} MXN ticket addon</code>
                    <div className="mt-1 text-[#c52752] font-semibold">
                      = <strong>${monthlyUpsellRevenue.toLocaleString("es-MX")} MXN al mes</strong>
                    </div>
                  </div>
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
                      Fórmula con tus datos:
                    </span>
                    <code>Citas_Salvadas = {cancellationsPerMonth} cancelaciones × 85% rescate = {recoveredSessionsCount} citas</code>
                    <br />
                    <code>Ingreso = {recoveredSessionsCount} citas × ${customBasePrice.toLocaleString("es-MX")} MXN precio base</code>
                    <div className="mt-1 text-emerald-900 font-semibold">
                      = <strong>${monthlyRecoveredRevenue.toLocaleString("es-MX")} MXN al mes</strong>
                    </div>
                  </div>
                </div>

                {/* Formula 3: Labor Hours Saved */}
                <div className="rounded-xl border border-pink-100 bg-white p-2.5 shadow-2xs">
                  <div className="flex items-center justify-between font-bold text-[#2d1822]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#e0446e]" />
                      <span>3. Horas de Gestión Ahorradas</span>
                    </span>
                    <span className="font-mono text-[10px] text-[#c52752]">
                      {monthlyHoursSaved} h libres/mes
                    </span>
                  </div>
                  <div className="mt-1.5 rounded-lg bg-pink-50/70 p-2 font-mono text-[10px] text-[#2d1822] border border-pink-100">
                    <code>{sessionsPerMonth} sesiones × 2.5 horas/cliente = <strong>{monthlyHoursSaved} horas libres al mes</strong></code>
                  </div>
                </div>

                {/* Formula 4: Grand Total Annual Impact */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-2.5">
                  <span className="font-bold text-emerald-900 block mb-1">
                    4. Impacto Anual Consolidado
                  </span>
                  <p className="text-[10px] text-emerald-950 font-mono">
                    Total_Anual = (${monthlyUpsellRevenue.toLocaleString("es-MX")} + ${monthlyRecoveredRevenue.toLocaleString("es-MX")}) × 12 = <strong>+${totalExtraAnnualRevenue.toLocaleString("es-MX")} MXN/año</strong>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Row */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("demos")}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-pink-200 bg-white py-2 px-3 text-xs font-bold text-[#c52752] shadow-2xs hover:bg-pink-50 active:scale-95 transition min-h-[44px]"
            >
              <Zap className="h-3.5 w-3.5 text-[#e0446e]" />
              <span>Ver Simulaciones</span>
            </button>
            {onOpenScenarioBuilder && (
              <button
                type="button"
                onClick={() => {
                  if (onCloseModal) onCloseModal();
                  onOpenScenarioBuilder({
                    basePrice: customBasePrice,
                    addOns: customAddOns,
                  });
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#e0446e] to-[#c52752] py-2 px-3 text-xs font-extrabold text-white shadow-xs active:scale-95 transition min-h-[44px]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Constructor 3 Pasos</span>
              </button>
            )}
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
            {/* Featured Proposal 1: 3-Step Live Scenario Builder Card */}
            {onOpenScenarioBuilder && (
              <div className="rounded-2xl border-2 border-[#e0446e]/60 bg-gradient-to-r from-pink-50 via-[#fffdfb] to-rose-50 p-3.5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#e0446e] to-[#c52752] text-white font-black text-sm shadow-xs">
                      🎯
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs text-[#2d1822]">
                          Constructor de Escenarios en Vivo (3 Pasos)
                        </span>
                        <span className="rounded-full bg-pink-100 px-2 py-0.2 text-[9px] font-bold text-[#c52752]">
                          Propuesta 1 + 3
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#5e3347] leading-relaxed">
                        Elige situación, ajusta tus precios de Nogales y lanza a Camila con tu objetivo IA preferido.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onCloseModal) onCloseModal();
                      onOpenScenarioBuilder({
                        basePrice: customBasePrice,
                        addOns: customAddOns,
                      });
                    }}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#e0446e] to-[#c52752] px-3 py-2 text-xs font-black text-white shadow-xs active:scale-95 transition min-h-[44px]"
                  >
                    <span>Configurar y Lanzar</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

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
