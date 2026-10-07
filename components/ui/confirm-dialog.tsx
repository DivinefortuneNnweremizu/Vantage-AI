"use client";

import { useEffect, useId, useRef } from "react";

import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  isLoading?: boolean;
  tone?: "primary" | "destructive";
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal confirmation built on the native <dialog> element, which traps focus, closes on Esc,
 * and returns focus to the trigger. Max width 440px per design.md.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  isLoading = false,
  tone = "destructive",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!isLoading) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-[440px] rounded-xl border border-line bg-surface p-6 text-fg shadow-xs backdrop:bg-overlay/40"
    >
      <div className="flex flex-col gap-4">
        <h2 id={titleId} className="cv01 text-lg font-semibold">
          {title}
        </h2>
        <p id={descriptionId} className="text-sm leading-relaxed text-fg-muted">
          {description}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant={tone === "destructive" ? "destructive" : "primary"} onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
