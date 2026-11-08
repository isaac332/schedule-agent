"use client";

import React, { useId, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Moon,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  UserCheck,
  X,
  Zap,
} from "lucide-react";
import type {
  AIObjectiveId,
  CustomAddOnConfig,
  ScenarioConfig,
  ScenarioId,
} from "@/lib/studio/types";
import { STUDIO_PHOTOGRAPHERS } from "@/lib/studio/config";

const DEFAULT_ADDONS: CustomAddOnConfig[] = [
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
];

interface ScenarioOption {
  id: ScenarioId;
  title: string;
  tag: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
  defaultMessage: string;
  recommendedObjective: AIObjectiveId;
}

const SCENARIOS: ScenarioOption[] = [
  {
    id: "pareja-nocturna",
    title: "1. Pareja Nocturna (11:45 PM)",
    tag: "24/7 & Cero Fugas",
    icon: Moon,
    desc: "Consulta nocturna para sesión al atardecer sonorense. Camila atiende en < 2s mientras descansas y asegura la fecha con anticipo.",
    defaultMessage:
      "¡Hola buenas noches! Son las 11:45 PM y mi novio y yo queremos una sesión en pareja este fin de semana antes del atardecer. ¿Qué disponibilidad tienen y cuánto cuesta con maquillaje y reel de video?",
    recommendedObjective: "maximize-ticket",
  },
  {
    id: "novia-indecisa",
    title: "2. Novia Indecisa / Alto Presupuesto",
    tag: "Upsell Inteligente",
    icon: Sparkles,
    desc: "Presupuesto abierto para fotos de compromiso/boda. Camila sugiere complementos de alto margen de forma empática sin sonar invasiva.",
    defaultMessage:
      "¡Hola Camila! Me caso en unos meses y queremos una sesión de pareja inolvidable en su estudio de Nogales. Me encanta la fotografía de Sofía en Set A. ¿Qué complementos nos recomiendas para que quede como portada de revista?",
    recommendedObjective: "maximize-ticket",
  },
  {
    id: "cancelacion-rescate",
    title: "3. Cancelación Imprevista / Auto-Rescate",
    tag: "100% Cita Rescatada",
    icon: RotateCcw,
    desc: "Una pareja cancela el sábado a las 11:00 AM; el sistema activa inmediatamente a Lucía Benítez de la lista de espera reactiva.",
    defaultMessage:
      "Hola Camila, lamentablemente se nos presentó una urgencia familiar y debemos cancelar nuestra cita JXS-2041 de este sábado a las 11:00 AM.",
    recommendedObjective: "rescue-waitlist",
  },
  {
    id: "buffer-15m",
    title: "4. Cliente con Horario Apretado / Buffer 15m",
    tag: "Blindaje Profoto",
    icon: ShieldAlert,
    desc: "Cliente pide reservar a las 12:05 PM pegado a la cita anterior. El algoritmo defiende los 15m de enfriamiento de flashes y reubica a las 12:15 PM.",
    defaultMessage:
      "Hola! Tengo un compromiso apretado y necesito una sesión de fotos este sábado a las 12:05 PM justo cuando termina la sesión anterior. ¿Pueden recibirme exactamente a las 12:05 PM?",
    recommendedObjective: "protect-buffer",
  },
  {
    id: "custom-case",
    title: "5. Caso Personalizado (Texto Libre)",
    tag: "Tu Caso Real",
    icon: Zap,
    desc: "Escribe tu propia situación o pregunta de cliente para probar en vivo la respuesta de Camila con los números de tu estudio.",
    defaultMessage:
      "Hola Camila, quiero cotizar una sesión con vestuarios y maquillaje para mis fotos ejecutivas con Mateo Hernández.",
    recommendedObjective: "secure-deposit",
  },
];

interface AIObjectiveOption {
  id: AIObjectiveId;
  title: string;
  badge: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const OBJECTIVES: AIObjectiveOption[] = [
  {
    id: "maximize-ticket",
    title: "Maximizar Ticket / Upsell Inteligente",
    badge: "+30% a +82% en Ticket",
    desc: "Recomienda add-ons complementarios (HMUA, Reel 4K, Fotos Extra) en el momento óptimo de cotización.",
    icon: Sparkles,
  },
  {
    id: "protect-buffer",
    title: "Proteger Buffer de Fotógrafo (15m Profoto)",
    badge: "15 min Amortiguamiento",
    desc: "Bloquea estrictamente el intervalo [Fin, Fin + 15m] para enfriar luces y evitar prisas entre clientes.",
    icon: ShieldAlert,
  },
  {
    id: "rescue-waitlist",
    title: "Rescatar Cita / Lista de Espera Reactiva",
    badge: "85% Citas Salvadas",
    desc: "Ante cancelaciones espontáneas, contacta al instante por SMS a prospectos en espera para llenar el hueco.",
    icon: RotateCcw,
  },
  {
    id: "secure-deposit",
    title: "Asegurar Anticipo & Blindaje Anti No-Show",
    badge: "< 2% Ausentismo",
    desc: "Envía enlace de anticipo bancario transferible y Guía de Vestuario personalizada para tu set.",
    icon: UserCheck,
  },
];

interface ScenarioBuilderSheetProps {
  open: boolean;
  onClose: () => void;
  onLaunchScenario: (config: ScenarioConfig) => void;
  initialBasePrice?: number;
  initialAddOns?: CustomAddOnConfig[];
  onOpenRoiSandbox?: () => void;
}

export function ScenarioBuilderSheet({
  open,
  onClose,
  onLaunchScenario,
  initialBasePrice = 2800,
  initialAddOns,
  onOpenRoiSandbox,
}: ScenarioBuilderSheetProps) {
  const titleId = useId();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Scenario selection
  const [selectedScenarioId, setSelectedScenarioId] = useState<ScenarioId>("pareja-nocturna");
  const [customMessage, setCustomMessage] = useState<string>("");

  // Step 2: Custom studio numbers
  const [basePrice, setBasePrice] = useState<number>(initialBasePrice);
  const [addOns, setAddOns] = useState<CustomAddOnConfig[]>(initialAddOns || DEFAULT_ADDONS);
  const [selectedPhotographerId, setSelectedPhotographerId] = useState<string>("photo-sofia");

  // Step 3: AI Objective
  const [selectedObjective, setSelectedObjective] = useState<AIObjectiveId>("maximize-ticket");

  if (!open) return null;

  const currentScenario = SCENARIOS.find((s) => s.id === selectedScenarioId) || SCENARIOS[0];
  const selectedPhotographer =
    STUDIO_PHOTOGRAPHERS.find((p) => p.id === selectedPhotographerId) || STUDIO_PHOTOGRAPHERS[0];

  const activeAddOns = addOns.filter((a) => a.enabled);
  const addOnsTotal = activeAddOns.reduce((sum, a) => sum + a.price, 0);
  const potentialTicket = basePrice + addOnsTotal;
  const netMarginEstimate = Math.round(potentialTicket * 0.72); // ~72% margen operativo típico

  const handleSelectScenario = (scenario: ScenarioOption) => {
    setSelectedScenarioId(scenario.id);
    setSelectedObjective(scenario.recommendedObjective);
    if (!customMessage && scenario.id === "custom-case") {
      setCustomMessage(scenario.defaultMessage);
    }
  };

  const handleToggleAddOn = (id: string) => {
    setAddOns((prev) =>
      prev.map((addon) => (addon.id === id ? { ...addon, enabled: !addon.enabled } : addon)),
    );
  };

  const handleUpdateAddOnPrice = (id: string, newPrice: number) => {
    const val = Number.isNaN(newPrice) ? 0 : Math.max(0, Math.min(25000, newPrice));
    setAddOns((prev) =>
      prev.map((addon) => (addon.id === id ? { ...addon, price: val } : addon)),
    );
  };

  const handleBlurAddOnPrice = (id: string) => {
    setAddOns((prev) =>
      prev.map((addon) =>
        addon.id === id
          ? { ...addon, price: Math.max(100, Math.min(25000, addon.price || 100)) }
          : addon,
      ),
    );
  };

  const handleLaunch = () => {
    let messageToSend =
      selectedScenarioId === "custom-case" && customMessage.trim()
        ? customMessage.trim()
        : currentScenario.defaultMessage;

    // Adapt photographer in default messages if customized
    if (selectedScenarioId === "novia-indecisa" && selectedPhotographer.name !== "Sofía Morales") {
      messageToSend = messageToSend.replace(
        "Sofía en Set A",
        `${selectedPhotographer.name} en ${selectedPhotographer.assignedRoom}`,
      );
    }
    if (
      selectedScenarioId === "custom-case" &&
      !customMessage.trim() &&
      selectedPhotographer.name !== "Mateo Hernández"
    ) {
      messageToSend = messageToSend.replace("Mateo Hernández", selectedPhotographer.name);
    }

    const config: ScenarioConfig = {
      scenarioId: selectedScenarioId,
      scenarioTitle: currentScenario.title,
      customBasePrice: basePrice,
      customAddOns: addOns,
      photographerId: selectedPhotographer.id,
      photographerName: selectedPhotographer.name,
      assignedSet: selectedPhotographer.assignedRoom,
      aiObjective: selectedObjective,
      customUserMessage: messageToSend,
    };

    onLaunchScenario(config);
    onClose();
  };

  const basePricePresets = [1800, 2400, 2800, 3200, 4200];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg max-h-[92dvh] sm:max-h-[88dvh] overflow-y-auto overflow-x-hidden rounded-t-3xl sm:rounded-3xl border border-pink-200 bg-[#fffdfb] shadow-[0_25px_60px_-15px_rgba(224,68,110,0.3)] text-[#2d1822] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden" aria-hidden="true">
          <div className="h-1.5 w-12 rounded-full bg-pink-200" />
        </div>

        {/* Header with Title and Step Navigation */}
        <div className="border-b border-pink-100 px-4 sm:px-6 py-3 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#e0446e] to-[#c52752] text-white shadow-xs">
                🎯
              </span>
              <div className="min-w-0">
                <h3 id={titleId} className="text-sm sm:text-base font-extrabold text-[#2d1822] truncate">
                  Constructor de Escenarios en Vivo
                </h3>
                <p className="text-[10px] sm:text-xs text-[#7b5965] truncate">
                  Personaliza tu estudio en Nogales, Sonora y simula en tiempo real
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-pink-200 bg-pink-50/70 text-[#7b5965] hover:bg-pink-100 hover:text-[#9e193e] active:scale-95 transition min-h-[44px] min-w-[44px]"
              aria-label="Cerrar constructor de escenarios"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 3-Step Wizard Navigation Pills */}
          <nav aria-label="Pasos del constructor" className="mt-3 flex rounded-xl bg-pink-100/60 p-1 border border-pink-200/60">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition min-h-[44px] ${
                currentStep === 1
                  ? "bg-white text-[#c52752] shadow-xs"
                  : "text-[#7b5965] hover:text-[#2d1822]"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-200 text-[10px] font-black">
                1
              </span>
              <span className="truncate">Escenario</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition min-h-[44px] ${
                currentStep === 2
                  ? "bg-white text-[#c52752] shadow-xs"
                  : "text-[#7b5965] hover:text-[#2d1822]"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-200 text-[10px] font-black">
                2
              </span>
              <span className="truncate">Tus Números</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition min-h-[44px] ${
                currentStep === 3
                  ? "bg-white text-[#c52752] shadow-xs"
                  : "text-[#7b5965] hover:text-[#2d1822]"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-200 text-[10px] font-black">
                3
              </span>
              <span className="truncate">Objetivo IA</span>
            </button>
          </nav>
        </div>

        {/* Wizard Step Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs text-[#2d1822]">
          {/* =========================================================================
              STEP 1: SCENARIO SELECTION
              ========================================================================= */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-[#2d1822] uppercase tracking-wider">
                    Paso 1: Elige el Escenario a Simular
                  </h4>
                  <p className="text-[11px] text-[#7b5965]">
                    Selecciona una situación típica de tu estudio fotográfico
                  </p>
                </div>
                <span className="rounded-full bg-pink-100 px-2.5 py-0.5 text-[10px] font-bold text-[#c52752]">
                  5 opciones
                </span>
              </div>

              <div className="flex flex-col gap-2.5 mt-1">
                {SCENARIOS.map((scenario) => {
                  const Icon = scenario.icon;
                  const isSelected = selectedScenarioId === scenario.id;
                  return (
                    <button
                      key={scenario.id}
                      type="button"
                      onClick={() => handleSelectScenario(scenario)}
                      className={`text-left rounded-2xl p-3 border transition active:scale-[0.99] min-h-[58px] ${
                        isSelected
                          ? "border-[#e0446e] bg-gradient-to-r from-pink-50/90 via-[#fffdfb] to-rose-50/70 shadow-xs ring-1 ring-[#e0446e]"
                          : "border-pink-200/70 bg-[#faf3ec]/40 hover:bg-[#faf3ec] hover:border-pink-300"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                            isSelected
                              ? "bg-[#e0446e] text-white shadow-xs"
                              : "bg-pink-100 text-[#c52752]"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="font-extrabold text-xs text-[#2d1822]">
                              {scenario.title}
                            </span>
                            <span className="rounded-full bg-pink-100/80 px-2 py-0.2 text-[9px] font-bold text-[#c52752]">
                              {scenario.tag}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-[#5e3347] leading-relaxed">
                            {scenario.desc}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Free-form text input for custom case */}
              {selectedScenarioId === "custom-case" && (
                <div className="mt-2 rounded-2xl border border-pink-200 bg-white p-3 shadow-xs">
                  <label htmlFor="custom-case-input" className="block text-[11px] font-bold text-[#c52752] mb-1">
                    ✍️ Escribe el mensaje que enviará el cliente simulado:
                  </label>
                  <textarea
                    id="custom-case-input"
                    rows={3}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Ejemplo: Hola Camila, queremos cotizar una sesión de graduación con toga y fotos extra para este fin de semana..."
                    className="w-full rounded-xl border border-pink-200 p-2.5 text-xs text-[#2d1822] focus:border-[#e0446e] focus:outline-hidden min-h-[60px]"
                  />
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              STEP 2: CUSTOM STUDIO NUMBERS
              ========================================================================= */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-[#2d1822] uppercase tracking-wider">
                    Paso 2: Personaliza los Números de Tu Estudio
                  </h4>
                  <p className="text-[11px] text-[#7b5965]">
                    Ajusta precios, complementos y set en Nogales, Sonora
                  </p>
                </div>
                {onOpenRoiSandbox && (
                  <button
                    type="button"
                    onClick={onOpenRoiSandbox}
                    className="text-[10px] font-bold text-[#c52752] hover:underline"
                  >
                    Ver Sandbox ROI →
                  </button>
                )}
              </div>

              {/* 1. Base Session Price Slider & Numeric Editor */}
              <div className="rounded-2xl border border-pink-200 bg-[#fffdfb] p-3 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-[#2d1822]">
                    Precio Base de la Sesión Insignia:
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs font-mono font-bold text-[#7b5965]">$</span>
                    <input
                      type="number"
                      step={100}
                      min={1500}
                      max={5000}
                      value={basePrice}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!Number.isNaN(val)) setBasePrice(val);
                      }}
                      onBlur={() =>
                        setBasePrice((prev) => Math.max(1500, Math.min(5000, prev || 2800)))
                      }
                      className="w-20 rounded-xl bg-pink-100 px-2 py-1 text-center font-mono font-black text-sm text-[#c52752] border border-pink-200 focus:outline-hidden min-h-[44px]"
                      aria-label="Precio base numérico"
                    />
                    <span className="text-[10px] font-mono text-[#a0828c]">MXN</span>
                  </div>
                </div>

                {/* Presets */}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {basePricePresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBasePrice(preset)}
                      className={`rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition active:scale-95 min-h-[38px] flex items-center justify-center ${
                        basePrice === preset
                          ? "bg-[#e0446e] text-white shadow-xs"
                          : "bg-pink-50 border border-pink-200 text-[#5e3347] hover:bg-pink-100"
                      }`}
                    >
                      ${preset.toLocaleString("es-MX")}
                    </button>
                  ))}
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min={1500}
                  max={5000}
                  step={100}
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className="mt-3 w-full accent-[#e0446e] cursor-pointer"
                  aria-label="Precio base de sesión"
                />
                <div className="flex justify-between text-[9px] text-[#a0828c] font-mono mt-0.5">
                  <span>$1,500 MXN (Mínimo)</span>
                  <span>$2,800 Prom. Nogales</span>
                  <span>$5,000 MXN (Tope)</span>
                </div>
              </div>

              {/* 2. Toggleable Add-Ons with Custom Price */}
              <div className="rounded-2xl border border-pink-200 bg-[#fffdfb] p-3 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-[#2d1822]">
                    Complementos (Add-Ons) &amp; Precios en tu Menú:
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-800">
                    {activeAddOns.length} activos
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {addOns.map((addon) => (
                    <div
                      key={addon.id}
                      className={`flex items-center justify-between gap-2 rounded-xl p-2.5 border transition ${
                        addon.enabled
                          ? "border-pink-300 bg-pink-50/50"
                          : "border-pink-100 bg-[#faf3ec]/30 opacity-70"
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 min-h-[44px]">
                        <input
                          type="checkbox"
                          checked={addon.enabled}
                          onChange={() => handleToggleAddOn(addon.id)}
                          className="h-4 w-4 rounded-md accent-[#e0446e] cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="block font-bold text-xs text-[#2d1822] truncate">
                            {addon.name}
                          </span>
                          <span className="block text-[10px] text-[#7b5965]">
                            {addon.extraMinutes ? `+${addon.extraMinutes}m camerino • ` : ""}Margen alto
                          </span>
                        </div>
                      </label>

                      {/* Price editor */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] font-mono text-[#7b5965]">$</span>
                        <input
                          type="number"
                          step={50}
                          min={100}
                          max={10000}
                          value={addon.price || ""}
                          disabled={!addon.enabled}
                          onChange={(e) =>
                            handleUpdateAddOnPrice(addon.id, Number(e.target.value))
                          }
                          onBlur={() => handleBlurAddOnPrice(addon.id)}
                          className="w-20 rounded-xl border border-pink-200 bg-white px-2 py-1 text-center font-mono font-extrabold text-xs text-[#c52752] focus:border-[#e0446e] focus:outline-hidden disabled:bg-gray-100 disabled:text-gray-400 min-h-[44px]"
                          aria-label={`Precio para ${addon.name}`}
                        />
                        <span className="text-[9px] font-mono text-[#a0828c]">MXN</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Photographer & Set Selector in Nogales */}
              <div className="rounded-2xl border border-pink-200 bg-[#fffdfb] p-3 shadow-xs">
                <span className="font-bold text-xs text-[#2d1822] block mb-2">
                  📸 Fotógrafo &amp; Set Asignado en Nogales, Sonora:
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {STUDIO_PHOTOGRAPHERS.map((photog) => {
                    const isSelected = selectedPhotographerId === photog.id;
                    return (
                      <button
                        key={photog.id}
                        type="button"
                        onClick={() => setSelectedPhotographerId(photog.id)}
                        className={`text-left rounded-xl p-2.5 border transition min-h-[44px] ${
                          isSelected
                            ? "border-[#e0446e] bg-pink-100/60 ring-1 ring-[#e0446e]"
                            : "border-pink-100 bg-[#faf3ec]/50 hover:bg-pink-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-[#2d1822]">
                            {photog.name}
                          </span>
                          <span className="text-[9px] font-semibold text-[#c52752]">
                            {photog.role.split("&")[0].trim()}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#7b5965] block mt-0.5">
                          📍 {photog.assignedRoom}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Ticket Potential Summary Strip */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-center">
                <span className="text-[10px] font-bold text-emerald-900 block">
                  Ticket Potencial de este Escenario:
                </span>
                <div className="mt-0.5 flex items-baseline justify-center gap-1.5">
                  <span className="text-lg font-black text-emerald-800">
                    ${potentialTicket.toLocaleString("es-MX")} MXN
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700">
                    (Base ${basePrice.toLocaleString("es-MX")} + ${addOnsTotal.toLocaleString("es-MX")} add-ons)
                  </span>
                </div>
                <span className="text-[10px] text-emerald-800 block mt-0.5">
                  💰 Margen neto estimado para tu estudio: ~${netMarginEstimate.toLocaleString("es-MX")} MXN
                </span>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 3: AI OBJECTIVE
              ========================================================================= */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-[#2d1822] uppercase tracking-wider">
                    Paso 3: Selecciona el Objetivo de la IA
                  </h4>
                  <p className="text-[11px] text-[#7b5965]">
                    Define la prioridad operativa de Camila para este cliente
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  Comportamiento IA
                </span>
              </div>

              <div className="flex flex-col gap-2.5 mt-1">
                {OBJECTIVES.map((obj) => {
                  const Icon = obj.icon;
                  const isSelected = selectedObjective === obj.id;
                  return (
                    <button
                      key={obj.id}
                      type="button"
                      onClick={() => setSelectedObjective(obj.id)}
                      className={`text-left rounded-2xl p-3 border transition active:scale-[0.99] min-h-[58px] ${
                        isSelected
                          ? "border-[#e0446e] bg-gradient-to-r from-pink-50/90 via-[#fffdfb] to-rose-50/70 shadow-xs ring-1 ring-[#e0446e]"
                          : "border-pink-200/70 bg-[#faf3ec]/40 hover:bg-[#faf3ec] hover:border-pink-300"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                            isSelected
                              ? "bg-[#e0446e] text-white shadow-xs"
                              : "bg-pink-100 text-[#c52752]"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="font-extrabold text-xs text-[#2d1822]">
                              {obj.title}
                            </span>
                            <span className="rounded-full bg-pink-100/90 px-2 py-0.2 text-[9px] font-bold text-[#c52752]">
                              {obj.badge}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-[#5e3347] leading-relaxed">
                            {obj.desc}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Ready to Launch Summary Box */}
              <div className="mt-2 rounded-2xl border border-pink-200 bg-white p-3 shadow-2xs">
                <span className="font-bold text-xs text-[#2d1822] block mb-1">
                  Resumen de la Simulación que se Ejecutará:
                </span>
                <ul className="flex flex-col gap-1 text-[10px] text-[#5e3347]">
                  <li>
                    • <strong>Escenario:</strong> {currentScenario.title}
                  </li>
                  <li>
                    • <strong>Inversión Base:</strong> ${basePrice.toLocaleString("es-MX")} MXN + {activeAddOns.length} add-ons (${addOnsTotal.toLocaleString("es-MX")} MXN) = <strong>${potentialTicket.toLocaleString("es-MX")} MXN</strong>
                  </li>
                  <li>
                    • <strong>Fotógrafo &amp; Set:</strong> {selectedPhotographer.name} ({selectedPhotographer.assignedRoom})
                  </li>
                  <li>
                    • <strong>Objetivo IA:</strong> {OBJECTIVES.find((o) => o.id === selectedObjective)?.title}
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer with Step Nav & Launch CTA */}
        <div className="border-t border-pink-100 bg-[#fffdfb] p-3 sm:p-4 shrink-0 flex items-center justify-between gap-2">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)}
              className="inline-flex items-center gap-1 rounded-xl border border-pink-200 bg-white px-3 py-2 text-xs font-bold text-[#7b5965] hover:bg-pink-50 active:scale-95 transition min-h-[44px]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Atrás</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-xs font-bold text-[#7b5965] hover:bg-pink-50 active:scale-95 transition min-h-[44px]"
            >
              Cancelar
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3)}
              className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#e0446e] to-[#c52752] px-4 py-2 text-xs font-extrabold text-white shadow-xs active:scale-95 transition min-h-[44px]"
            >
              <span>Continuar</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLaunch}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#e0446e] via-[#c52752] to-[#9e193e] px-4 py-2 text-xs font-black text-white shadow-md active:scale-95 transition min-h-[44px]"
            >
              <Sparkles className="h-4 w-4" />
              <span>Lanzar Escenario en Vivo 🚀</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
