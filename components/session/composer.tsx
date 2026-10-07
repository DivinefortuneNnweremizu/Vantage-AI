"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ImageIcon, Library, Loader2, Monitor, Plus, Smartphone } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { SegmentedControl, type SegmentOption } from "@/components/ui/segmented-control";
import {
  ACCEPT_ATTRIBUTE,
  checkFileBeforeUpload,
  messageFor,
  postJson,
  uploadAsset,
} from "@/lib/client/api";
import { cn } from "@/lib/cn";

type PageScope = "SINGLE_PAGE" | "JOURNEY";
type Platform = "APP" | "WEB";

const SCOPE_OPTIONS: ReadonlyArray<SegmentOption<PageScope>> = [
  { value: "SINGLE_PAGE", label: "Single Page", icon: <BookOpen className="size-5" aria-hidden="true" /> },
  { value: "JOURNEY", label: "Multiple page journey", icon: <Library className="size-5" aria-hidden="true" /> },
];

const PLATFORM_OPTIONS: ReadonlyArray<SegmentOption<Platform>> = [
  { value: "APP", label: "App", icon: <Smartphone className="size-5" aria-hidden="true" /> },
  { value: "WEB", label: "Web", icon: <Monitor className="size-5" aria-hidden="true" /> },
];

const MAX_JOURNEY_FILES = 10;

interface ComposerProps {
  firstName: string;
}

/**
 * The New Session screen. Adding images creates a draft session and moves to the Upload step.
 * Website and Figma links are not connected yet, so pasting one explains that instead of failing silently.
 */
export function Composer({ firstName }: ComposerProps) {
  const router = useRouter();
  const [scope, setScope] = useState<PageScope>("SINGLE_PAGE");
  const [platform, setPlatform] = useState<Platform>("APP");
  const [text, setText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const messageId = useId();

  async function startWithFiles(selected: File[]): Promise<void> {
    if (isBusy || selected.length === 0) return;
    setMessage(null);

    const usable = scope === "SINGLE_PAGE" ? selected.slice(0, 1) : selected.slice(0, MAX_JOURNEY_FILES);
    const problems = usable.map(checkFileBeforeUpload).filter((problem): problem is string => problem !== null);
    if (problems.length > 0) {
      setMessage(problems[0] ?? "Choose a PNG, JPG, or WebP image.");
      return;
    }

    setIsBusy(true);
    try {
      const session = await postJson<{ id: string }>("/api/sessions", { pageScope: scope, platform });

      let skipped = selected.length - usable.length;
      for (const file of usable) {
        try {
          await uploadAsset(session.id, file);
        } catch {
          skipped += 1;
        }
      }

      if (skipped >= selected.length) {
        throw new Error("None of those images could be added. Check the file type and size, then try again.");
      }

      router.push(`/sessions/${session.id}/upload${skipped > 0 ? `?skipped=${skipped}` : ""}`);
    } catch (error) {
      setMessage(messageFor(error));
      setIsBusy(false);
    }
  }

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault();
    if (!text.trim()) {
      fileInput.current?.click();
      return;
    }
    setMessage("Website and Figma links are coming soon. For now, upload an image of your design.");
  }

  return (
    <div className="mx-auto flex w-full max-w-[950px] flex-col gap-10 pt-6 lg:pt-16">
      <div className="flex flex-col">
        <h1 className="cv01 text-2xl font-semibold text-fg-strong sm:text-3xl">Hi {firstName},</h1>
        <p className="cv01 text-3xl font-normal text-fg-strong sm:text-5xl">Where should we start?</p>
      </div>

      <form
        onSubmit={handleSubmit}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void startWithFiles(Array.from(event.dataTransfer.files));
        }}
        className={cn(
          "flex flex-col gap-4 rounded-xl border bg-surface p-4 shadow-xs transition-colors focus-within:border-accent focus-within:ring-2 focus-within:ring-focus",
          isDragging ? "border-accent bg-selected" : "border-line",
        )}
      >
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          multiple={scope === "JOURNEY"}
          className="hidden"
          aria-label="Choose design images"
          onChange={(event) => {
            void startWithFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />

        <div className="flex items-center gap-3">
          <IconButton tone="inline" aria-label="Add images" onClick={() => fileInput.current?.click()} disabled={isBusy}>
            {isBusy ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Plus className="size-5" aria-hidden="true" />}
          </IconButton>
          <label htmlFor={inputId} className="sr-only">
            URL, images, or PDF asset
          </label>
          <input
            id={inputId}
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="URL, Images or PDF asset"
            aria-describedby={message ? messageId : undefined}
            disabled={isBusy}
            className="min-h-11 w-full bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle"
          />
          <IconButton tone="inline" aria-label="Choose images from your files" onClick={() => fileInput.current?.click()} disabled={isBusy}>
            <ImageIcon className="size-5" aria-hidden="true" />
          </IconButton>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SegmentedControl label="Page scope" value={scope} options={SCOPE_OPTIONS} onChange={setScope} />
          <SegmentedControl label="Platform" value={platform} options={PLATFORM_OPTIONS} onChange={setPlatform} />
        </div>

        <p id={messageId} role="status" aria-live="polite" className={cn("text-xs", message ? "text-error-fg" : "text-fg-subtle")}>
          {message ?? "Drop PNG, JPG, or WebP images here, or use the plus button. Up to 10 MB each."}
        </p>
      </form>
    </div>
  );
}
