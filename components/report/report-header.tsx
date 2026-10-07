"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IconButton } from "@/components/ui/icon-button";
import { deleteRequest, messageFor, patchJson } from "@/lib/client/api";
import { cn } from "@/lib/cn";
import { tabHref, type ReportTabId } from "@/components/report/tabs";

interface ReportHeaderProps {
  sessionId: string;
  title: string;
  tab: ReportTabId;
  currentIteration: number;
  iterations: Array<{ iteration: number; overall: number }>;
}

export function ReportHeader({ sessionId, title, tab, currentIteration, iterations }: ReportHeaderProps) {
  const router = useRouter();
  const [isRenaming, setIsRenaming] = useState(false);
  const [draft, setDraft] = useState(title);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const inputId = useId();
  const selectId = useId();
  const latest = iterations[iterations.length - 1]?.iteration ?? currentIteration;

  useEffect(() => {
    if (isRenaming) inputRef.current?.select();
  }, [isRenaming]);

  useEffect(() => {
    setDraft(title);
  }, [title]);

  async function save(): Promise<void> {
    const next = draft.trim();
    if (!next || next === title) {
      cancel();
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await patchJson(`/api/sessions/${sessionId}`, { title: next });
      setIsRenaming(false);
      router.refresh();
      editButtonRef.current?.focus();
    } catch (saveError) {
      setError(messageFor(saveError));
    }
    setIsSaving(false);
  }

  function cancel(): void {
    setDraft(title);
    setError(null);
    setIsRenaming(false);
    // Return focus after the button is rendered again.
    requestAnimationFrame(() => editButtonRef.current?.focus());
  }

  async function remove(): Promise<void> {
    setIsDeleting(true);
    try {
      await deleteRequest(`/api/sessions/${sessionId}`);
      router.push("/library");
      router.refresh();
    } catch (deleteError) {
      setError(messageFor(deleteError));
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {isRenaming ? (
            <form
              className="flex min-w-0 items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <label htmlFor={inputId} className="sr-only">
                Design name
              </label>
              <input
                id={inputId}
                ref={inputRef}
                value={draft}
                maxLength={80}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") cancel();
                }}
                className="min-h-11 w-64 max-w-full rounded-md border border-line-strong bg-surface px-3 text-base text-fg shadow-xs outline-none focus:border-accent focus:ring-2 focus:ring-focus"
              />
              <IconButton type="submit" tone="primary" aria-label="Save name" disabled={isSaving}>
                <Check className="size-5" aria-hidden="true" />
              </IconButton>
              <IconButton tone="filled" aria-label="Cancel renaming" onClick={cancel}>
                <X className="size-5" aria-hidden="true" />
              </IconButton>
            </form>
          ) : (
            <>
              <IconButton ref={editButtonRef} tone="filled" aria-label="Rename this design" onClick={() => setIsRenaming(true)}>
                <Pencil className="size-4" aria-hidden="true" />
              </IconButton>
              <h1 className="cv01 truncate text-xl font-semibold text-fg-strong">{title} Design Analysis</h1>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {iterations.length > 1 ? (
            <div className="flex items-center gap-2">
              <label htmlFor={selectId} className="text-sm text-fg-muted">
                Version
              </label>
              <select
                id={selectId}
                value={currentIteration}
                onChange={(event) => router.push(tabHref(sessionId, tab, Number(event.target.value)), { scroll: false })}
                className="min-h-11 rounded-md border border-line-strong bg-surface px-3 text-sm text-fg shadow-xs outline-none focus:border-accent focus:ring-2 focus:ring-focus"
              >
                {iterations.map((entry) => (
                  <option key={entry.iteration} value={entry.iteration}>
                    Version {entry.iteration}
                    {entry.iteration === latest ? " (latest)" : ""} · {entry.overall}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <Link href={`/sessions/${sessionId}/upload`} className={cn(buttonVariants({ variant: "secondary" }), "min-h-11")}>
            <Plus className="size-4" aria-hidden="true" />
            New version
          </Link>
          <IconButton tone="filled" aria-label="Delete this design" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="size-4" aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-error-fg">
          {error}
        </p>
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this design?"
        description="It will be removed from your Design Library and sidebar."
        confirmLabel="Delete design"
        isLoading={isDeleting}
        onConfirm={() => void remove()}
        onCancel={() => setConfirmDelete(false)}
      />
    </header>
  );
}

