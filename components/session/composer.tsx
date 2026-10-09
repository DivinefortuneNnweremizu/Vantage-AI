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
 * The New Session screen, laid out like ChatGPT.
 *
 * - Desktop: the greeting and the chat box sit together in the middle of the page, centered.
 * - Mobile: the greeting is centered in the free space and the chat box is pinned to the bottom.
 *   The box has the text on top, then "+" at the bottom left and the primary button at the bottom right.
 *
 * Adding images creates a draft session and moves to the Upload step.
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

    // Choosing several images means a journey, whatever was selected above.
    const effectiveScope: PageScope = selected.length > 1 ? "JOURNEY" : scope;
    if (effectiveScope !== scope) setScope(effectiveScope);
    const usable = selected.slice(0, MAX_JOURNEY_FILES);
    const problems = usable.map(checkFileBeforeUpload).filter((problem): problem is string => problem !== null);
    if (problems.length > 0) {
      setMessage(problems[0] ?? "Choose a PNG, JPG, or WebP image.");
      return;
    }

    setIsBusy(true);
    try {
      const session = await postJson<{ id: string }>("/api/sessions", { pageScope: effectiveScope, platform });

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

  function openPicker(): void {
    fileInput.current?.click();
  }

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault();
    if (!text.trim()) {
      openPicker();
      return;
    }
    setMessage("Website and Figma links are coming soon. For now, upload an image of your design.");
  }

  const addIcon = isBusy ? (
    <Loader2 className="size-5 animate-spin" aria-hidden="true" />
  ) : (
    <Plus className="size-5" aria-hidden="true" />
  );

  return (
    // The page area is as tall as the screen under the header, so the greeting can be centered
    // and the chat box can sit at the bottom on mobile.
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] w-full max-w-[768px] flex-col sm:justify-center sm:gap-10">
      <div className="flex flex-1 flex-col items-center justify-center text-center sm:flex-none">
        <h1 className="cv01 text-2xl font-semibold text-fg-muted sm:text-3xl">Hi {firstName},</h1>
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
          "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-2xl border bg-surface p-3 shadow-xs transition-colors sm:gap-y-4 sm:rounded-xl sm:p-4",
          "focus-within:border-accent focus-within:ring-2 focus-within:ring-focus",
          isDragging ? "border-accent bg-selected" : "border-line",
        )}
      >
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          multiple
          className="hidden"
          aria-label="Choose design images"
          onChange={(event) => {
            void startWithFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />

        {/* One "+" and one image button. The grid moves them: beside the text on desktop, under it on mobile. */}
        <IconButton
          tone="inline"
          aria-label="Add images"
          onClick={openPicker}
          disabled={isBusy}
          className="col-start-1 row-start-2 size-11 sm:row-start-1 sm:size-9"
        >
          {addIcon}
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
          className="col-span-3 col-start-1 row-start-1 min-h-11 w-full bg-transparent px-1 text-base text-fg outline-none placeholder:text-fg-subtle sm:col-span-1 sm:col-start-2"
        />

        {/* The two choices. Icon-only on mobile so they fit between the two buttons. */}
        <div className="col-start-2 row-start-2 flex min-w-0 items-center justify-center gap-3 overflow-x-auto sm:col-span-3 sm:col-start-1 sm:justify-between sm:overflow-visible">
          <SegmentedControl
            label="Page scope"
            value={scope}
            options={SCOPE_OPTIONS}
            onChange={setScope}
            iconOnlyOnMobile
            className="flex-nowrap gap-1 sm:flex-wrap sm:gap-2"
          />
          <SegmentedControl
            label="Platform"
            value={platform}
            options={PLATFORM_OPTIONS}
            onChange={setPlatform}
            iconOnlyOnMobile
            className="flex-nowrap gap-1 sm:flex-wrap sm:gap-2"
          />
        </div>

        {/* On mobile this is the round primary button, like ChatGPT's. On desktop it is a plain icon. */}
        <IconButton
          tone="inline"
          aria-label="Choose images from your files"
          onClick={openPicker}
          disabled={isBusy}
          className="col-start-3 row-start-2 size-11 bg-action text-on-action hover:bg-action-hover active:bg-action-pressed sm:row-start-1 sm:size-9 sm:bg-transparent sm:text-fg-muted sm:hover:bg-subtle"
        >
          <ImageIcon className="size-5" aria-hidden="true" />
        </IconButton>

        <p
          id={messageId}
          role="status"
          aria-live="polite"
          className={cn("col-span-3 text-xs", message ? "text-error-fg" : "text-fg-subtle sr-only sm:not-sr-only")}
        >
          {message ?? "Drop PNG, JPG, or WebP images here, or use the plus button. Up to 10 MB each."}
        </p>
      </form>
    </div>
  );
}
