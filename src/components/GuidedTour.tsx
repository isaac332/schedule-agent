"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import {
  Compass,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Play,
  Minimize2,
  Maximize2,
} from "lucide-react";
import type { MobileTab } from "@/lib/studio/types";

export interface GuidedTourStep {
  id: string;
  targetId: string;
  targetTab: MobileTab;
  badge: string;
  title: string;
  description: string;
  highlights: string[];
  actionLabel?: string;
  onAction?: () => void;
}

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  currentStepIndex: number;
  onStepChange: (index: number) => void;
  onSelectTab: (tab: MobileTab) => void;
  steps: GuidedTourStep[];
}

export function GuidedTour({
  isOpen,
  onClose,
  currentStepIndex,
  onStepChange,
  onSelectTab,
  steps,
}: GuidedTourProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [executedStepIndex, setExecutedStepIndex] = useState<number | null>(null);

  const currentStep = steps[currentStepIndex] || steps[0];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const actionExecuted = executedStepIndex === currentStepIndex;

  // Sync tab and scroll target element into view whenever current step changes
  useEffect(() => {
    if (!isOpen || !currentStep) return;

    // Switch to corresponding mobile tab
    onSelectTab(currentStep.targetTab);

    // Give DOM a frame to switch views, then scroll into view & highlight
    const timer = setTimeout(() => {
      const targetElement = document.getElementById(currentStep.targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        // Add temporary pulsing highlight ring
        targetElement.classList.add("tour-target-highlight");
      }

      // Shift programmatic focus with preventScroll: true to avoid fighting scrollIntoView
      if (nextButtonRef.current) {
        nextButtonRef.current.focus({ preventScroll: true });
      } else if (cardRef.current) {
        cardRef.current.focus({ preventScroll: true });
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      const targetElement = document.getElementById(currentStep.targetId);
      if (targetElement) {
        targetElement.classList.remove("tour-target-highlight");
      }
    };
  }, [isOpen, currentStepIndex, currentStep, onSelectTab]);

  // Keyboard navigation: Escape to close, Arrow keys to navigate steps (when not typing in inputs)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      const activeEl = document.activeElement;
      const isEditable =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute("contenteditable") === "true";

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        if (isEditable) return;
        e.preventDefault();
        if (!isLastStep) {
          onStepChange(currentStepIndex + 1);
        } else {
          onClose();
        }
      } else if (e.key === "ArrowLeft") {
        if (isEditable) return;
        e.preventDefault();
        if (!isFirstStep) {
          onStepChange(currentStepIndex - 1);
        }
      }
    },
    [isOpen, isLastStep, isFirstStep, currentStepIndex, onStepChange, onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !currentStep) return null;

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-end sm:justify-center items-center p-3 sm:p-4 pb-20 sm:pb-4 animate-in fade-in duration-200"
      aria-live="polite"
    >
      {/* Dimmed backdrop - subtle scrim without blur so background content is crisp and visible */}
      <div
        className="fixed inset-0 bg-black/25 pointer-events-auto transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Floating Tour Card (Docked Bottom on Mobile, Centered on Tablet/Desktop) */}
      <div
        ref={cardRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-step-title"
        aria-describedby="tour-step-desc"
        className="pointer-events-auto relative z-10 w-full max-w-md rounded-3xl border border-pink-200 bg-[#fffdfb] p-4 sm:p-5 shadow-[0_20px_50px_rgba(224,68,110,0.3)] outline-none transition-all duration-200"
      >
        {/* Progress header bar */}
        <div className="flex items-center justify-between border-b border-pink-100 pb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-gradient-to-tr from-[#e0446e] to-[#f06a8f] text-white shadow-xs">
              <Compass className="h-3.5 w-3.5 stroke-[2.2]" />
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#9e193e]">
              Tour Guiado juntosxsiempre
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-[#c52752]">
              {currentStepIndex + 1}/{steps.length}
            </span>
            <button
              type="button"
              onClick={() => setIsMinimized((prev) => !prev)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-xl border border-pink-200 bg-pink-50/70 text-[#7b5965] hover:bg-pink-100 hover:text-[#9e193e] active:scale-95 transition"
              aria-label={isMinimized ? "Expandir tour guiado" : "Minimizar tour guiado"}
              title={isMinimized ? "Expandir tour" : "Minimizar tour"}
            >
              {isMinimized ? (
                <Maximize2 className="h-3.5 w-3.5" />
              ) : (
                <Minimize2 className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-7 w-7 items-center justify-center rounded-xl border border-pink-200 bg-pink-50/70 text-[#7b5965] hover:bg-pink-100 hover:text-[#9e193e] active:scale-95 transition"
              aria-label="Cerrar tour guiado"
              title="Cerrar tour (Escape)"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Minimized Compact View for Mobile screen inspection */}
        {isMinimized ? (
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-[#c52752] shrink-0">
                {currentStep.badge}
              </span>
              <span className="text-xs font-bold text-[#2d1822] truncate">
                {currentStep.title}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (!isLastStep) {
                    onStepChange(currentStepIndex + 1);
                  } else {
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-[#e0446e] to-[#c52752] px-2.5 py-1 text-[11px] font-bold text-white shadow-xs"
              >
                <span>{isLastStep ? "Finalizar" : "Siguiente"}</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Step dots visual indicator */}
            <div className="mt-2.5 flex items-center gap-1.5">
              {steps.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onStepChange(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStepIndex
                      ? "w-8 bg-gradient-to-r from-[#e0446e] to-[#c52752]"
                      : idx < currentStepIndex
                        ? "w-3 bg-pink-300"
                        : "w-3 bg-pink-100"
                  }`}
                  title={`Ir a paso ${idx + 1}: ${s.title}`}
                  aria-label={`Paso ${idx + 1}`}
                />
              ))}
            </div>

            {/* Content Body */}
            <div className="mt-3">
              <div className="inline-flex items-center gap-1 rounded-full bg-pink-100/80 px-2 py-0.5 text-[10px] font-bold text-[#c52752] mb-1">
                <Sparkles className="h-3 w-3 text-[#e0446e]" />
                <span>{currentStep.badge}</span>
              </div>

              <h3
                id="tour-step-title"
                className="text-sm sm:text-base font-extrabold tracking-tight text-[#2d1822]"
              >
                {currentStep.title}
              </h3>

              <p
                id="tour-step-desc"
                className="mt-1 text-xs text-[#7b5965] leading-relaxed"
              >
                {currentStep.description}
              </p>

              {/* Highlights checklist */}
              {currentStep.highlights && currentStep.highlights.length > 0 && (
                <div className="mt-2.5 rounded-2xl border border-pink-100 bg-[#faf3ec]/60 p-2.5 space-y-1 text-[11px] text-[#5e3347]">
                  {currentStep.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-[#e0446e] font-bold">✓</span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Interactive Try-It Action Button */}
              {currentStep.actionLabel && currentStep.onAction && (
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setExecutedStepIndex(currentStepIndex);
                      currentStep.onAction?.();
                    }}
                    className={`w-full inline-flex items-center justify-center gap-1.5 rounded-xl border py-2 px-3 text-xs font-bold active:scale-95 transition ${
                      actionExecuted
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-pink-300 bg-pink-50/90 hover:bg-pink-100 text-[#c52752]"
                    }`}
                  >
                    {actionExecuted ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>✓ ¡Demostración Activada!</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 fill-current" />
                        <span>{currentStep.actionLabel}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Navigation Footer */}
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-pink-100 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] font-semibold text-[#7b5965] hover:text-[#2d1822] hover:underline"
              >
                Saltar Tour
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={isFirstStep}
                  onClick={() => onStepChange(currentStepIndex - 1)}
                  className={`inline-flex items-center gap-1 rounded-xl border border-pink-200 px-3 py-1.5 text-xs font-semibold transition ${
                    isFirstStep
                      ? "opacity-40 cursor-not-allowed bg-pink-50/50 text-[#a0828c]"
                      : "bg-white text-[#7b5965] hover:bg-pink-50 active:scale-95"
                  }`}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Anterior</span>
                </button>

                <button
                  ref={nextButtonRef}
                  type="button"
                  onClick={() => {
                    if (!isLastStep) {
                      onStepChange(currentStepIndex + 1);
                    } else {
                      onClose();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#e0446e] to-[#c52752] px-4 py-1.5 text-xs font-bold text-white shadow-sm shadow-pink-500/25 hover:from-[#d03b64] hover:to-[#b52048] active:scale-95 transition"
                >
                  <span>{isLastStep ? "¡Entendido, Comenzar!" : "Siguiente"}</span>
                  {isLastStep ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
