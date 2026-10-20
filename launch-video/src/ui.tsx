import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";

import { progress, usePop } from "./anim";
import { C, FONT } from "./brand";

/* ------------------------------------------------------------------ backdrop */

const GRID = `linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)`;

/** The background of every scene: a colour, a faint grid, and two soft glows. */
export function Stage({ background = C.night950, glow = true, grid = true, children }: { background?: string; glow?: boolean; grid?: boolean; children: React.ReactNode }) {
  return (
    <AbsoluteFill style={{ background, fontFamily: FONT, color: C.white, overflow: "hidden" }}>
      {grid ? <AbsoluteFill style={{ backgroundImage: GRID, backgroundSize: "64px 64px", opacity: 0.8 }} /> : null}
      {glow ? (
        <>
          <div style={{ position: "absolute", top: -260, right: -200, width: 900, height: 900, borderRadius: 900, background: `radial-gradient(circle, ${C.blue500}CC 0%, transparent 65%)` }} />
          <div style={{ position: "absolute", bottom: -320, left: -240, width: 900, height: 900, borderRadius: 900, background: `radial-gradient(circle, ${C.blue400}66 0%, transparent 65%)` }} />
        </>
      ) : null}
      {children}
    </AbsoluteFill>
  );
}

/* --------------------------------------------------------------------- words */

/** Text where every word bounces in, one after another. */
export function PopWords({ text, start = 0, size = 72, color = C.white, weight = 700, stagger = 3, align = "left", highlight, highlightColor = C.blue300 }: {
  text: string;
  start?: number;
  size?: number;
  color?: string;
  weight?: number;
  stagger?: number;
  align?: "left" | "center";
  highlight?: string[];
  highlightColor?: string;
}) {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: `0 ${size * 0.26}px`, justifyContent: align === "center" ? "center" : "flex-start", fontSize: size, fontWeight: weight, lineHeight: 1.08, letterSpacing: -size * 0.02, textAlign: align }}>
      {words.map((word, index) => (
        <Word key={`${word}-${index}`} frame={frame} start={start + index * stagger} color={highlight?.includes(word.replace(/[^A-Za-z]/g, "")) ? highlightColor : color}>
          {word}
        </Word>
      ))}
    </div>
  );
}

function Word({ frame, start, color, children }: { frame: number; start: number; color: string; children: React.ReactNode }) {
  const pop = usePop(frame, start, { damping: 10, stiffness: 210 });
  return (
    <span style={{ display: "inline-block", color, transform: `translateY(${(1 - pop) * 40}px) scale(${0.6 + pop * 0.4})`, opacity: Math.min(1, pop * 1.6) }}>{children}</span>
  );
}

/* ---------------------------------------------------------------------- logo */

/** The Vantage mark: a "V" (a vantage point) with a pin on its right arm. */
export function LogoGlyph({ size = 120, pinScale = 1, pinY = 0 }: { size?: number; pinScale?: number; pinY?: number }) {
  return (
    <svg width={size} height={size} viewBox="6 5 30 30" fill="none" style={{ overflow: "visible" }}>
      <path d="M11 13.5 20 29.5 27.5 16" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <g transform={`translate(0 ${pinY})`}>
        <circle cx="29" cy="12" r={4.5 * pinScale} fill={C.blue300} />
      </g>
    </svg>
  );
}

export function LogoBadge({ size = 140, pinScale = 1, pinY = 0, radius = 0.26 }: { size?: number; pinScale?: number; pinY?: number; radius?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * radius, background: "#000", border: `2px solid ${C.night800}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <LogoGlyph size={size * 0.7} pinScale={pinScale} pinY={pinY} />
    </div>
  );
}

/* ---------------------------------------------------------------------- pins */

/** A smile (like) or frown (dislike) marker, the same ones the Sentiment Map puts on a design. */
export function Pin({ kind, size = 56, start }: { kind: "like" | "dislike"; size?: number; start: number }) {
  const frame = useCurrentFrame();
  const pop = usePop(frame, start, { damping: 8, stiffness: 220 });
  const ring = progress(frame, start, 20);
  const color = kind === "like" ? C.like : C.dislike;
  return (
    <div style={{ position: "absolute", width: size, height: size, transform: `translate(-50%, -50%) scale(${pop})` }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: size, border: `4px solid ${color}`, opacity: 1 - ring, transform: `scale(${1 + ring * 1.1})` }} />
      <div style={{ width: size, height: size, borderRadius: size, background: color, border: "4px solid #fff", boxShadow: "0 8px 22px rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d={kind === "like" ? "M8 14s1.5 2 4 2 4-2 4-2" : "M16 16s-1.5-2-4-2-4 2-4 2"} />
          <path d="M9 9h.01M15 9h.01" />
        </svg>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- the design */

export const DESIGN_W = 640;
export const DESIGN_H = 420;

/** Where each finding sits on the example design, in its own 640 by 420 pixels. */
export const SPOTS = {
  headline: { x: 372, y: 108, kind: "like" as const, title: "Clear, confident headline", note: "The biggest thing on the page tells people what it does." },
  subtitle: { x: 338, y: 236, kind: "dislike" as const, title: "The subtitle is hard to read", note: "Light grey on white fades away." },
  button: { x: 172, y: 266, kind: "dislike" as const, title: "The button text is faint", note: "White on a pale blue is easy to miss." },
  card: { x: 596, y: 100, kind: "like" as const, title: "Friendly, balanced hero card", note: "Good use of space and colour." },
  links: { x: 420, y: 386, kind: "dislike" as const, title: "The links are tiny", note: "Hard to tap on a phone." },
};

/** A made-up landing page for the made-up app "Flowboard". It is the design being critiqued in the film. */
export function DesignMock({ fixed = 0 }: { fixed?: number }) {
  // `fixed` goes from 0 to 1 as the problems are fixed: the subtitle darkens, the button deepens, the links grow.
  const subtitle = `rgb(${Math.round(190 - fixed * 120)}, ${Math.round(190 - fixed * 120)}, ${Math.round(196 - fixed * 120)})`;
  const button = `rgb(${Math.round(150 - fixed * 100)}, ${Math.round(160 - fixed * 118)}, ${Math.round(245 - fixed * 40)})`;
  return (
    <div style={{ position: "relative", width: DESIGN_W, height: DESIGN_H, background: "#fff", borderRadius: 18, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.5)", color: "#16161A", fontFamily: FONT }}>
      <div style={{ position: "absolute", left: 28, top: 18, display: "flex", alignItems: "center", gap: 8, fontSize: 17, fontWeight: 700 }}>
        <span style={{ width: 22, height: 22, borderRadius: 7, background: "#16161A", display: "inline-block" }} />
        Flowboard
      </div>
      <div style={{ position: "absolute", right: 28, top: 22, display: "flex", gap: 20, fontSize: 13, color: "#9A9AA3" }}>
        <span>Features</span>
        <span>Pricing</span>
        <span>Log in</span>
      </div>
      <div style={{ position: "absolute", left: 28, top: 92, width: 340, fontSize: 40, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1 }}>Plan your week in one tap</div>
      <div style={{ position: "absolute", left: 28, top: 196, width: 300, fontSize: 15, lineHeight: 1.45, color: subtitle }}>Flowboard keeps your tasks, notes and deadlines in one calm place.</div>
      <div style={{ position: "absolute", left: 28, top: 262, padding: "13px 26px", borderRadius: 12, background: button, color: "#fff", fontSize: 15, fontWeight: 600, opacity: 0.95 }}>Get started</div>
      <div style={{ position: "absolute", left: 392, top: 92, width: 216, height: 236, borderRadius: 20, background: "linear-gradient(145deg, #5B4BEA 0%, #8F7CF5 55%, #C7B8FF 100%)", padding: 20, boxSizing: "border-box" }}>
        {["Design review", "Ship v2 notes", "Team sync"].map((row, index) => (
          <div key={row} style={{ marginBottom: 12, padding: "11px 14px", borderRadius: 12, background: "rgba(255,255,255,0.92)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 10, opacity: 1 - index * 0.08 }}>
            <span style={{ width: 16, height: 16, borderRadius: 8, border: "2px solid #5B4BEA", display: "inline-block", background: index === 0 ? "#5B4BEA" : "transparent" }} />
            {row}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 380 - fixed * 4, display: "flex", justifyContent: "center", gap: 14 + fixed * 22, fontSize: 9 + fixed * 6, color: "#8A8A93" }}>
        <span>Terms</span>
        <span>Privacy</span>
        <span>Help</span>
        <span>Contact</span>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- confetti */

const CONFETTI_COLORS = [C.blue300, C.blue400, C.like, C.warn, C.white, C.dislike];

/** A burst of confetti from a point, starting at `start`. Positions are worked out from the frame, not stored. */
export function Confetti({ x, y, start, count = 46, power = 1 }: { x: number; y: number; start: number; count?: number; power?: number }) {
  const frame = useCurrentFrame();
  const t = frame - start;
  if (t < 0 || t > 75) return null;
  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const angle = random(`a${start}-${index}`) * Math.PI * 2;
        const speed = (6 + random(`s${start}-${index}`) * 15) * power;
        const px = x + Math.cos(angle) * speed * t * 1.1;
        const py = y + Math.sin(angle) * speed * t * 1.1 + 0.34 * t * t;
        const size = 10 + random(`z${start}-${index}`) * 14;
        const round = random(`r${start}-${index}`) > 0.55;
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: px,
              top: py,
              width: size,
              height: round ? size : size * 0.5,
              borderRadius: round ? size : 3,
              background: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
              transform: `rotate(${t * (6 + random(`w${index}`) * 14)}deg)`,
              opacity: interpolate(t, [45, 75], [1, 0], { extrapolateLeft: "clamp" }),
            }}
          />
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------- common panels */

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: C.night900, border: `2px solid ${C.night800}`, borderRadius: 28, boxShadow: "0 24px 60px rgba(0,0,0,0.4)", ...style }}>{children}</div>;
}

/** A small label chip, like the step names above each scene. */
export function Chip({ children, color = C.blue300, size = 26 }: { children: React.ReactNode; color?: string; size?: number }) {
  return <span style={{ display: "inline-block", padding: `${size * 0.32}px ${size * 0.8}px`, borderRadius: 999, background: `${color}26`, border: `2px solid ${color}`, color, fontSize: size, fontWeight: 700 }}>{children}</span>;
}

/** Shows `children` full size in a box of the given size, scaled to fit. Used to shrink the design for portrait. */
export function Scaled({ scale, width, height, children }: { scale: number; width: number; height: number; children: React.ReactNode }) {
  return (
    <div style={{ position: "relative", width: width * scale, height: height * scale }}>
      <div style={{ position: "absolute", left: 0, top: 0, width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}>{children}</div>
    </div>
  );
}

/** Two-column layout in landscape (caption left, content right), stacked in portrait. */
export function Split({ portrait, caption, children, gap = 70 }: { portrait: boolean; caption: React.ReactNode; children: React.ReactNode; gap?: number }) {
  const { width, height } = useVideoConfig();
  return (
    <div style={{ position: "absolute", inset: 0, padding: portrait ? "110px 70px 110px" : "0 110px", display: "flex", flexDirection: portrait ? "column" : "row", alignItems: "center", justifyContent: "center", gap, width, height, boxSizing: "border-box" }}>
      <div style={{ flex: portrait ? "0 0 auto" : "0 0 42%", width: portrait ? "100%" : undefined }}>{caption}</div>
      <div style={{ flex: portrait ? "0 0 auto" : "1 1 auto", display: "flex", alignItems: "center", justifyContent: "center", width: portrait ? "100%" : undefined, minHeight: 0 }}>{children}</div>
    </div>
  );
}
