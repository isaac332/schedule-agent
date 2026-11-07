"use client";

import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

interface LightDismissDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export function LightDismissDialog({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidthClass = "max-w-lg",
}: LightDismissDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      onClose();
    };
    dialog.addEventListener("close", handleClose);

    // Fallback for browsers without native <dialog closedby="any"> support
    let handlePointerDown: ((event: PointerEvent) => void) | undefined;
    let handlePointerUp: ((event: PointerEvent) => void) | undefined;
    if (!("closedBy" in HTMLDialogElement.prototype)) {
      const outside = (e: PointerEvent, dlg: HTMLElement) => {
        const r = dlg.getBoundingClientRect();
        return (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        );
      };

      let pressedOutside = false;
      handlePointerDown = (e: PointerEvent) => {
        pressedOutside = outside(e, dialog);
      };
      handlePointerUp = (e: PointerEvent) => {
        if (pressedOutside && outside(e, dialog)) {
          dialog.close();
        }
      };

      dialog.addEventListener("pointerdown", handlePointerDown);
      dialog.addEventListener("pointerup", handlePointerUp);
    }

    return () => {
      dialog.removeEventListener("close", handleClose);
      if (handlePointerDown) {
        dialog.removeEventListener("pointerdown", handlePointerDown);
      }
      if (handlePointerUp) {
        dialog.removeEventListener("pointerup", handlePointerUp);
      }
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: "any" } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      aria-labelledby={titleId}
      className={`fixed inset-x-0 bottom-0 top-auto m-0 w-full max-w-full sm:inset-0 sm:m-auto sm:w-[92vw] ${maxWidthClass} max-h-[88dvh] sm:max-h-[85dvh] overflow-y-auto overflow-x-hidden rounded-t-3xl sm:rounded-3xl border border-pink-200/80 bg-[#fffdfb] p-0 text-[#2d1822] shadow-[0_25px_60px_-15px_rgba(224,68,110,0.25)]`}
    >
      {/* Mobile Bottom-Sheet Drag Handle */}
      <div className="flex justify-center pt-3 pb-1 sm:hidden" aria-hidden="true">
        <div className="h-1.5 w-10 rounded-full bg-pink-200/90" />
      </div>
      <div className="p-4 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom,1.25rem))]">
        <div className="flex items-start justify-between gap-3 border-b border-pink-100 pb-3">
          <div className="flex-1 min-w-0 pr-1">
            <h2 id={titleId} className="text-sm sm:text-base font-bold tracking-tight text-[#2d1822] truncate sm:whitespace-normal">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-[11px] sm:text-xs text-[#7b5965] line-clamp-1 sm:line-clamp-2 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="inline-flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl border border-pink-200 bg-pink-50/60 text-[#7b5965] transition hover:bg-pink-100 hover:text-[#9e193e] active:scale-95"
            aria-label="Cerrar ventana"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 sm:mt-4">{children}</div>
      </div>
    </dialog>
  );
}
