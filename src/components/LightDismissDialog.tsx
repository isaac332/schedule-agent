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
    let handleBackdropClick: ((event: MouseEvent) => void) | undefined;
    if (!("closedBy" in HTMLDialogElement.prototype)) {
      handleBackdropClick = (event: MouseEvent) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (isDialogContent) return;
        dialog.close();
      };
      dialog.addEventListener("click", handleBackdropClick);
    }

    return () => {
      dialog.removeEventListener("close", handleClose);
      if (handleBackdropClick) {
        dialog.removeEventListener("click", handleBackdropClick);
      }
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: "any" } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      aria-labelledby={titleId}
      className={`mt-auto mb-0 mx-auto w-full sm:my-auto sm:w-[92vw] ${maxWidthClass} max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-pink-200/80 bg-[#fffdfb] p-0 text-[#2d1822] shadow-[0_25px_60px_-15px_rgba(224,68,110,0.25)]`}
    >
      {/* Mobile Bottom-Sheet Drag Handle */}
      <div className="flex justify-center pt-3 pb-1 sm:hidden" aria-hidden="true">
        <div className="h-1.5 w-12 rounded-full bg-pink-200" />
      </div>
      <div className="p-5 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom,1.5rem))]">
        <div className="flex items-start justify-between gap-4 border-b border-pink-100 pb-4">
          <div>
            <h2 id={titleId} className="text-lg font-bold tracking-tight text-[#2d1822]">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-xs leading-relaxed text-[#7b5965]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-pink-200 bg-pink-50/60 text-[#7b5965] transition hover:bg-pink-100 hover:text-[#9e193e]"
            aria-label="Cerrar ventana"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </dialog>
  );
}
