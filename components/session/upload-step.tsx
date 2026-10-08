"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, RefreshCw, Trash2, UploadCloud } from "lucide-react";

import { AssetImage } from "@/components/ui/asset-image";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { ACCEPT_ATTRIBUTE, checkFileBeforeUpload, deleteRequest, messageFor, uploadAsset } from "@/lib/client/api";
import { cn } from "@/lib/cn";

export interface UploadStepAsset {
  id: string;
  name: string;
}

interface UploadStepProps {
  sessionId: string;
  pageScope: "SINGLE_PAGE" | "JOURNEY";
  assets: UploadStepAsset[];
  maxPages: number;
  /** Number of files the previous screen could not add. */
  skipped: number;
}

export function UploadStep({ sessionId, pageScope, assets, maxPages, skipped }: UploadStepProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(assets[0]?.id ?? null);
  const [busy, setBusy] = useState<null | "add" | "replace" | "delete" | "continue">(null);
  const [error, setError] = useState<string | null>(
    skipped > 0 ? `${skipped} ${skipped === 1 ? "file" : "files"} could not be added. Check the type and size and try again.` : null,
  );
  const addInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const [notice, setNotice] = useState<string | null>(null);

  const isJourney = pageScope === "JOURNEY";
  // The add tile is always there, as in the design. Adding a second page makes it a journey.
  const canAddMore = assets.length < maxPages;

  // Keep the selection valid when images are added, replaced, or deleted.
  useEffect(() => {
    if (!assets.some((asset) => asset.id === selectedId)) {
      setSelectedId(assets[0]?.id ?? null);
    }
  }, [assets, selectedId]);

  const selected = assets.find((asset) => asset.id === selectedId) ?? assets[0];

  async function addFiles(files: File[]): Promise<void> {
    if (files.length === 0 || busy) return;
    setError(null);

    const room = maxPages - assets.length;
    const usable = files.slice(0, Math.max(room, 0));
    if (usable.length === 0) {
      setError(`A journey can have up to ${maxPages} pages.`);
      return;
    }
    if (usable.length < files.length) {
      setNotice(`Only the first ${usable.length} ${usable.length === 1 ? "file was" : "files were"} added. A journey can have up to ${maxPages} pages.`);
    } else {
      setNotice(null);
    }

    const problem = usable.map(checkFileBeforeUpload).find((value) => value !== null);
    if (problem) {
      setError(problem);
      return;
    }

    setBusy("add");
    let failures = 0;
    let added = 0;
    let lastMessage = "";
    for (const file of usable) {
      try {
        await uploadAsset(sessionId, file);
        added += 1;
      } catch (uploadError) {
        failures += 1;
        lastMessage = messageFor(uploadError);
      }
    }
    if (failures > 0) {
      setError(failures === usable.length ? lastMessage : `${failures} of ${usable.length} files could not be added. ${lastMessage}`);
    }
    if (!isJourney && assets.length + added > 1) {
      setNotice("You added more than one page, so this is now a Multiple page journey. All pages will be analyzed together.");
    }
    router.refresh();
    setBusy(null);
  }

  async function replaceSelected(file: File | undefined): Promise<void> {
    if (!file || !selected || busy) return;
    setError(null);
    const problem = checkFileBeforeUpload(file);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy("replace");
    try {
      const replacement = await uploadAsset(sessionId, file, selected.id);
      setSelectedId(replacement.id);
      router.refresh();
    } catch (replaceError) {
      setError(messageFor(replaceError));
    }
    setBusy(null);
  }

  async function deleteSelected(): Promise<void> {
    if (!selected || busy) return;
    setError(null);
    setBusy("delete");
    try {
      await deleteRequest(`/api/sessions/${sessionId}/assets/${selected.id}`);
      router.refresh();
    } catch (deleteError) {
      setError(messageFor(deleteError));
    }
    setBusy(null);
  }

  function goToGoal(): void {
    if (assets.length === 0 || busy) return;
    setBusy("continue");
    router.push(`/sessions/${sessionId}/goal`);
  }

  const hiddenInputs = (
    <>
      <input
        ref={addInput}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        multiple
        className="hidden"
        aria-label="Add design images"
        onChange={(event) => {
          void addFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      <input
        ref={replaceInput}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        className="hidden"
        aria-label="Choose a replacement image"
        onChange={(event) => {
          void replaceSelected(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </>
  );

  const errorMessage = (
    <p id={errorId} role="alert" className={cn("text-sm text-error-fg", error ? "" : "sr-only")}>
      {error}
    </p>
  );

  if (assets.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-[720px] flex-col items-center gap-4 pt-10">
        {hiddenInputs}
        <button
          type="button"
          onClick={() => addInput.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void addFiles(Array.from(event.dataTransfer.files));
          }}
          disabled={busy !== null}
          className="flex min-h-[260px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line-strong bg-surface p-8 text-center text-fg-muted transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {busy === "add" ? <Loader2 className="size-8 animate-spin" aria-hidden="true" /> : <UploadCloud className="size-8" aria-hidden="true" />}
          <span className="cv01 text-base font-medium text-fg">Drop your design here, or choose a file</span>
          <span className="text-sm">PNG, JPG, or WebP, up to 10 MB</span>
        </button>
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 pt-6 lg:pt-10">
      {hiddenInputs}

      <div className="flex w-full max-w-[1000px] flex-col gap-4 lg:flex-row lg:items-start">
        <ul className="flex shrink-0 gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible" aria-label="Pages in this design">
          {assets.map((asset, index) => {
            const isSelected = asset.id === selected?.id;
            return (
              <li key={asset.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(asset.id)}
                  aria-pressed={isSelected}
                  aria-label={`Page ${index + 1}: ${asset.name}`}
                  className={cn(
                    "block h-32 w-28 overflow-hidden rounded-xl border-2 bg-subtle transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    isSelected ? "border-accent" : "border-line hover:border-line-strong",
                  )}
                >
                  <AssetImage assetId={asset.id} size="thumb" alt="" className="size-full object-cover object-top" />
                </button>
              </li>
            );
          })}
          {canAddMore ? (
            <li>
              <button
                type="button"
                onClick={() => addInput.current?.click()}
                disabled={busy !== null}
                aria-label="Add another page"
                className="flex h-32 w-28 items-center justify-center rounded-xl border-2 border-dashed border-line-strong text-fg-muted transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {busy === "add" ? <Loader2 className="size-6 animate-spin" aria-hidden="true" /> : <Plus className="size-6" aria-hidden="true" />}
              </button>
            </li>
          ) : null}
        </ul>

        {selected ? (
          <div className="relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-line bg-subtle">
            <AssetImage assetId={selected.id} alt={`Preview of ${selected.name}`} priority className="mx-auto max-h-[62vh] w-auto object-contain" />
            <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => replaceInput.current?.click()}
                isLoading={busy === "replace"}
                disabled={busy !== null}
                className="bg-surface/90 backdrop-blur-none"
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                Replace
              </Button>
              <IconButton
                aria-label="Delete this image"
                onClick={() => void deleteSelected()}
                disabled={busy !== null}
                className="size-9 bg-error-500 text-white hover:bg-error-700"
              >
                {busy === "delete" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
              </IconButton>
            </div>
          </div>
        ) : null}
      </div>

      {errorMessage}
      <p role="status" className={cn("max-w-[720px] text-center text-sm text-fg-muted", notice ? "" : "sr-only")}>
        {notice}
      </p>

      <Button size="lg" onClick={goToGoal} isLoading={busy === "continue"} disabled={busy !== null && busy !== "continue"}>
        Continue to analysis
      </Button>
    </div>
  );
}
