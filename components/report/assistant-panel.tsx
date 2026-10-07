"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronRight, Send, Sparkles } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { ApiRequestError, readApiResponse } from "@/lib/client/api";
import { cn } from "@/lib/cn";

export interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
}

interface AssistantPanelProps {
  sessionId: string;
  initialMessages: ChatMessage[];
  suggestedPrompts: string[];
}

const QUESTION_LIMIT = 1000;

/** Reads a text stream and calls back with the full text so far. Throws a safe message on failure. */
async function streamReply(sessionId: string, question: string, onText: (text: string) => void): Promise<string> {
  const response = await fetch(`/api/sessions/${sessionId}/assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("text/plain") || !response.body) {
    await readApiResponse<never>(response);
    throw new ApiRequestError("INTERNAL_ERROR", "The assistant could not answer. Try again.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    onText(text);
  }
  return text + decoder.decode();
}

function TypingDots() {
  return (
    <div className="flex w-fit items-center gap-1.5 rounded-xl border border-line bg-subtle px-4 py-3" role="status" aria-label="Assistant is typing">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          aria-hidden="true"
          className="size-1.5 animate-bounce rounded-full bg-fg-subtle"
          // Staggers the three dots. Not a visual design value.
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

export function AssistantPanel({ sessionId, initialMessages, suggestedPrompts }: AssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<null | { text: string }>(null);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const chips = useRef<HTMLDivElement>(null);
  const inputId = useId();

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages, pending]);

  async function ask(rawQuestion: string): Promise<void> {
    const question = rawQuestion.trim();
    if (!question || pending) return;

    setError(null);
    setDraft("");
    setMessages((current) => [...current, { id: `local-${Date.now()}`, role: "USER", content: question }]);
    setPending({ text: "" });

    try {
      const answer = await streamReply(sessionId, question, (text) => setPending({ text }));
      setMessages((current) => [...current, { id: `reply-${Date.now()}`, role: "ASSISTANT", content: answer }]);
      setAnnouncement(`Assistant replied: ${answer}`);
    } catch (askError) {
      setError(askError instanceof Error ? askError.message : "The assistant could not answer. Try again.");
    }
    setPending(null);
  }

  return (
    <section aria-label="Assistant" className="flex h-[min(78vh,760px)] min-h-[520px] flex-col rounded-xl border border-line bg-surface">
      <header className="flex items-center gap-3 border-b border-line px-6 pt-6 pb-4">
        <span className="flex size-10 items-center justify-center rounded-badge bg-subtle text-fg-heading">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
        <span className="cv01 text-base font-semibold text-fg-heading">Assistant</span>
      </header>

      {/* Focusable so keyboard users can scroll the conversation. aria-live is off so streaming text is not read out word by word. */}
      <div
        ref={scroller}
        role="log"
        aria-live="off"
        aria-label="Conversation"
        tabIndex={0}
        className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-4 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
      >
        <div className="w-fit max-w-[85%] rounded-xl border border-line bg-subtle px-4 py-3 text-sm text-fg">How can I help you today?</div>

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "max-w-[85%] whitespace-pre-wrap rounded-xl px-4 py-3 text-sm leading-relaxed",
              message.role === "USER" ? "self-end border border-selected-line bg-selected text-on-selected" : "border border-line bg-subtle text-fg",
            )}
          >
            <span className="sr-only">{message.role === "USER" ? "You: " : "Assistant: "}</span>
            {message.content}
          </div>
        ))}

        {pending ? (
          pending.text ? (
            <div className="max-w-[85%] whitespace-pre-wrap rounded-xl border border-line bg-subtle px-4 py-3 text-sm leading-relaxed text-fg">
              {pending.text}
            </div>
          ) : (
            <TypingDots />
          )
        ) : null}

        {error ? (
          <p role="alert" className="text-sm text-error-fg">
            {error}
          </p>
        ) : null}
      </div>

      <p role="status" className="sr-only">
        {announcement}
      </p>

      <div className="flex flex-col gap-3 px-6 pb-6">
        {suggestedPrompts.length > 0 ? (
          <div className="relative">
            <div ref={chips} className="flex gap-3 overflow-x-auto pb-1">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={pending !== null}
                  onClick={() => void ask(prompt)}
                  className="w-56 shrink-0 rounded-xl border border-line bg-surface px-4 py-3 text-left text-sm text-fg-heading transition-colors hover:bg-hover disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {prompt}
                </button>
              ))}
            </div>
            {suggestedPrompts.length > 1 ? (
              <IconButton
                tone="filled"
                aria-label="Show more suggestions"
                onClick={() => chips.current?.scrollBy({ left: 240, behavior: "smooth" })}
                className="absolute top-1/2 right-1 size-9 -translate-y-1/2 border border-line"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </IconButton>
            ) : null}
          </div>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void ask(draft);
          }}
          className="flex items-center gap-2 rounded-xl border border-line-strong bg-canvas px-4 py-2 focus-within:border-accent focus-within:ring-2 focus-within:ring-focus"
        >
          <label htmlFor={inputId} className="sr-only">
            Ask about your designs
          </label>
          <input
            id={inputId}
            value={draft}
            maxLength={QUESTION_LIMIT}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about your designs here"
            className="min-h-11 w-full bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle"
          />
          <IconButton type="submit" tone="inline" aria-label="Send question" disabled={pending !== null || draft.trim().length === 0}>
            <Send className="size-5" aria-hidden="true" />
          </IconButton>
        </form>
      </div>
    </section>
  );
}
