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
      className={`mt-auto mb-0 mx-auto w-full sm:my-auto sm:w-[92vw] ${maxWidthClass} max-h-[88dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-white/15 bg-[#10131e]/98 p-0 text-slate-100 shadow-2xl`}
    >
      {/* Mobile Bottom-Sheet Pill Indicator */}
      <div className="flex justify-center pt-3 sm:hidden" aria-hidden="true">
        <div className="h-1.5 w-10 rounded-full bg-white/20" />
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 id={titleId} className="text-base font-bold tracking-tight text-white sm:text-lg">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/15 hover:text-white"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </dialog>
  );
}
