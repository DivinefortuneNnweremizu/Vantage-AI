import { Check, Frown, Smile, Sparkles } from "lucide-react";

import { cn } from "@/lib/cn";

/**
 * The right-hand panel on the Log in, Sign up, and Welcome screens, in the style of Linktree's sign-up.
 * It is always dark (black, grey, white, and the project blue), whatever theme the form uses.
 * The picture is a small hand-built example of a Design Analysis Report. It is marked as an example.
 */

const POINTS = ["Every finding names its design principle", "Fixes ranked by impact", "An assistant that knows your report"];

const SCORES = [
  { label: "Intuitive", value: 86 },
  { label: "Trusted", value: 78 },
  { label: "Valuable", value: 82 },
] as const;

/** A faint grid, drawn from the white token, so the black panel is not flat. */
const GRID_STYLE = {
  backgroundImage:
    "linear-gradient(to right, color-mix(in srgb, var(--color-white) 6%, transparent) 1px, transparent 1px), " +
    "linear-gradient(to bottom, color-mix(in srgb, var(--color-white) 6%, transparent) 1px, transparent 1px)",
  backgroundSize: "44px 44px",
  maskImage: "radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)",
} as const;

function Marker({ kind, className }: { kind: "like" | "dislike"; className: string }) {
  const Icon = kind === "like" ? Smile : Frown;
  return (
    <span
      className={cn(
        "absolute flex size-8 items-center justify-center rounded-lg border-2 border-white shadow-lg",
        kind === "like" ? "bg-night-950 text-white" : "bg-primary-500 text-white",
        className,
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
    </span>
  );
}

export function AuthShowcase() {
  return (
    <section
      aria-label="What Vantage gives you"
      className="relative flex h-full min-h-[640px] flex-col justify-between overflow-hidden bg-night-950 p-12 text-white xl:p-16"
    >
      {/* Background: grid and two soft blue glows. */}
      <div aria-hidden="true" className="absolute inset-0" style={GRID_STYLE} />
      <div aria-hidden="true" className="absolute -top-24 -right-24 size-[28rem] rounded-full bg-primary-500/45 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-32 -left-24 size-[26rem] rounded-full bg-primary-400/25 blur-3xl" />

      <div className="relative flex flex-col gap-5">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-night-700 bg-night-900/60 px-3 py-1.5 text-sm text-night-300 backdrop-blur">
          <Sparkles className="size-4 text-primary-300" aria-hidden="true" />
          Design critique, on demand
        </span>
        <h2 className="cv01 max-w-[18ch] text-4xl leading-tight font-semibold xl:text-5xl">Know exactly what to fix in your design.</h2>
        <p className="max-w-[44ch] text-base text-night-300">
          Upload a mock-up. Get a Design Analysis Report with what works, what does not, why, and how to fix it.
        </p>
      </div>

      {/* The example report. It is a picture, so it is hidden from screen readers. */}
      <div aria-hidden="true" className="relative my-8 min-h-[320px] flex-1">
        <span className="absolute top-0 left-0 z-10 rounded-full bg-white/10 px-2.5 py-1 text-xs text-night-300 backdrop-blur">Example report</span>

        {/* The design being reviewed, with a like and a dislike marker. It fills the height it is given. */}
        <div className="showcase-float absolute top-9 bottom-0 left-[3%] w-[44%] max-w-[300px] rounded-3xl border border-night-700 bg-night-900 p-2.5 shadow-2xl">
          <div className="relative flex h-full flex-col items-center gap-3 overflow-hidden rounded-2xl bg-white px-4 pt-5 pb-4 text-night-900">
            <div className="h-1.5 w-10 shrink-0 rounded-full bg-night-300" />
            <div className="mt-1 h-20 w-full shrink-0 rounded-xl bg-primary-500" />
            <div className="flex w-full shrink-0 flex-col items-center gap-1.5">
              <div className="h-2.5 w-4/5 rounded-full bg-night-900" />
              <div className="h-2 w-3/5 rounded-full bg-night-300" />
            </div>
            <div className="grid w-full shrink-0 grid-cols-3 gap-2">
              <div className="h-10 rounded-lg bg-night-150" />
              <div className="h-10 rounded-lg bg-night-150" />
              <div className="h-10 rounded-lg bg-night-150" />
            </div>
            <div className="mt-auto flex h-9 w-full shrink-0 items-center justify-center rounded-full bg-primary-500 text-xs font-medium text-white">Get Started</div>
            <Marker kind="like" className="top-[100px] right-2" />
            <Marker kind="dislike" className="right-3 bottom-[44px]" />
          </div>
        </div>

        {/* Score card. */}
        <div className="showcase-float absolute top-0 right-0 w-[52%] rounded-2xl bg-white p-4 text-night-900 shadow-2xl [animation-delay:-2s]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-night-600">UX Score</span>
            <span className="cv01 text-2xl font-semibold">82</span>
          </div>
          <div className="mt-3 flex flex-col gap-2.5">
            {SCORES.map((score) => (
              <div key={score.label} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs text-night-600">
                  <span>{score.label}</span>
                  <span>{score.value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-night-150">
                  <div className="h-full rounded-full bg-primary-500" style={{ width: `${score.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* A finding. */}
        <div className="showcase-float absolute right-[2%] bottom-0 w-[54%] rounded-2xl border border-night-700 bg-night-900/90 p-4 shadow-2xl backdrop-blur [animation-delay:-4s]">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary-500">
              <Frown className="size-3.5" aria-hidden="true" />
            </span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-night-300">WCAG 2.1 AA</span>
          </div>
          <p className="mt-2.5 text-sm font-medium">Secondary text is hard to read</p>
          <p className="mt-1 text-xs text-night-300">Raise its contrast to at least 4.5:1 against the background.</p>
        </div>
      </div>

      <ul className="relative flex flex-col gap-2.5 [@media(max-height:780px)]:hidden">
        {POINTS.map((point) => (
          <li key={point} className="flex items-center gap-3 text-sm text-night-300">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
              <Check className="size-3" aria-hidden="true" />
            </span>
            {point}
          </li>
        ))}
      </ul>
    </section>
  );
}
