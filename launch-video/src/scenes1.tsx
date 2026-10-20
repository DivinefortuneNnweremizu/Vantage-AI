import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

import { progress, useLayout, usePop } from "./anim";
import { C, FONT } from "./brand";
import { cue } from "./timeline";
import { Card, Chip, Confetti, DesignMock, DESIGN_H, DESIGN_W, LogoBadge, PopWords, Scaled, Split, Stage } from "./ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ------------------------------------------------------------------ 1. hook */

const BUBBLES = [
  { text: "🔥 Love it!!", cue: "bubble1", landscape: { x: 0.2, y: 0.34, r: -6 }, portrait: { x: 0.34, y: 0.3, r: -6 } },
  { text: "😍 So clean", cue: "bubble2", landscape: { x: 0.74, y: 0.3, r: 5 }, portrait: { x: 0.66, y: 0.43, r: 5 } },
  { text: "👏 Amazing work", cue: "bubble3", landscape: { x: 0.46, y: 0.62, r: -3 }, portrait: { x: 0.4, y: 0.56, r: -3 } },
] as const;

export function HookScene() {
  const frame = useCurrentFrame();
  const { width, height, portrait } = useLayout();
  const slam = cue("hook", "slam");
  const after = frame - slam;
  const shake = after >= 0 ? Math.sin(after * 2.6) * Math.max(0, 14 - after) : 0;
  const flash = frame < slam ? 0 : interpolate(frame, [slam, slam + 7], [0.9, 0], clamp);
  const bubblesOut = interpolate(frame, [slam - 5, slam + 2], [1, 0], clamp);

  return (
    <Stage background={C.blue500} glow={false}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 40%, transparent 30%, ${C.night950}99 100%)` }} />

      <div style={{ position: "absolute", top: portrait ? 190 : 120, width, display: "flex", justifyContent: "center", opacity: bubblesOut }}>
        <PopWords text="Everyone says..." size={portrait ? 84 : 78} align="center" />
      </div>

      {BUBBLES.map((bubble) => {
        const pos = portrait ? bubble.portrait : bubble.landscape;
        const pop = usePop(frame, cue("hook", bubble.cue), { damping: 9, stiffness: 200 });
        return (
          <div
            key={bubble.cue}
            style={{
              position: "absolute",
              left: pos.x * width,
              top: pos.y * height,
              transform: `translate(-50%, -50%) rotate(${pos.r}deg) scale(${pop * bubblesOut})`,
              background: "#fff",
              color: C.night950,
              padding: "26px 44px",
              borderRadius: 999,
              fontSize: portrait ? 62 : 58,
              fontWeight: 700,
              boxShadow: "0 24px 50px rgba(0,0,0,0.35)",
              whiteSpace: "nowrap",
            }}
          >
            {bubble.text}
          </div>
        );
      })}

      {after >= -2 ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, transform: `translateX(${shake}px)`, padding: "0 70px", textAlign: "center" }}>
          <Slam frame={frame} start={slam} size={portrait ? 96 : 100} color={C.white}>
            ...but what should you
          </Slam>
          <Slam frame={frame} start={slam + 4} size={portrait ? 190 : 210} color={C.night950} background={C.white}>
            ACTUALLY FIX?
          </Slam>
        </div>
      ) : null}

      <div style={{ position: "absolute", inset: 0, background: "#fff", opacity: flash }} />
    </Stage>
  );
}

function Slam({ frame, start, size, color, background, children }: { frame: number; start: number; size: number; color: string; background?: string; children: React.ReactNode }) {
  const pop = usePop(frame, start, { damping: 8, stiffness: 260, mass: 0.6 });
  return (
    <div style={{ fontSize: size, fontWeight: 800, lineHeight: 1, letterSpacing: -size * 0.03, color, background, padding: background ? `${size * 0.1}px ${size * 0.22}px` : 0, borderRadius: size * 0.16, transform: `scale(${0.3 + pop * 0.7}) rotate(${(1 - pop) * -6}deg)`, opacity: Math.min(1, pop * 3), whiteSpace: "nowrap" }}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ 2. logo */

export function LogoScene() {
  const frame = useCurrentFrame();
  const { width, height, portrait } = useLayout();
  const badge = usePop(frame, 0, { damping: 9, stiffness: 150, mass: 0.9 });
  const pinStart = cue("logo", "pin");
  const pin = usePop(frame, pinStart, { damping: 7, stiffness: 240 });
  const pinY = (1 - Math.min(1, progress(frame, pinStart - 8, 8))) * -120;
  const ring = progress(frame, pinStart, 26);
  const letters = "Vantage".split("");
  const size = portrait ? 330 : 300;

  return (
    <Stage>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: portrait ? 70 : 54 }}>
        <div style={{ position: "relative", transform: `scale(${badge})`, rotate: `${(1 - badge) * -25}deg` }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: size * 0.26, border: `6px solid ${C.blue300}`, opacity: pin > 0 ? 1 - ring : 0, transform: `scale(${1 + ring * 0.9})` }} />
          <LogoBadge size={size} pinScale={Math.max(0.001, pin)} pinY={pinY} />
        </div>

        <div style={{ display: "flex" }}>
          {letters.map((letter, index) => {
            const p = usePop(frame, 10 + index * 2, { damping: 10, stiffness: 220 });
            return (
              <span key={index} style={{ display: "inline-block", fontSize: portrait ? 200 : 170, fontWeight: 800, letterSpacing: -6, transform: `translateY(${(1 - p) * 90}px) scale(${0.5 + p * 0.5})`, opacity: Math.min(1, p * 2) }}>
                {letter}
              </span>
            );
          })}
        </div>

        <div style={{ maxWidth: portrait ? 860 : 1200 }}>
          <PopWords text="Design critique that tells you what to fix." start={cue("logo", "tagline")} size={portrait ? 66 : 56} color={C.night300} weight={600} align="center" stagger={2} highlight={["fix"]} highlightColor={C.blue300} />
        </div>
      </div>
      <Confetti x={width / 2} y={height / 2 - (portrait ? 150 : 100)} start={cue("logo", "sparkle")} power={1.15} />
    </Stage>
  );
}

/* ---------------------------------------------------------------- 3. upload */

function Segmented({ options, active, activeFrom, frame, size = 30 }: { options: string[]; active: number; activeFrom: number; frame: number; size?: number }) {
  const slide = progress(frame, activeFrom, 8);
  const current = frame >= activeFrom ? active : -1;
  return (
    <div style={{ display: "flex", background: C.night800, borderRadius: 999, padding: 6, gap: 6 }}>
      {options.map((option, index) => {
        const on = current === index;
        return (
          <span key={option} style={{ whiteSpace: "nowrap", padding: `${size * 0.36}px ${size * 0.9}px`, borderRadius: 999, fontSize: size, fontWeight: 700, background: on ? "#fff" : "transparent", color: on ? C.night950 : C.night400, transform: on ? `scale(${0.94 + slide * 0.06})` : undefined }}>
            {option}
          </span>
        );
      })}
    </div>
  );
}

function Cursor({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <svg width="54" height="54" viewBox="0 0 24 24" style={{ position: "absolute", left: x, top: y, transform: `scale(${scale})`, filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.5))" }}>
      <path d="M5 3l14 8-6 2 4 7-3 1.5-4-7-5 4z" fill="#fff" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

export function UploadScene() {
  const frame = useCurrentFrame();
  const { portrait } = useLayout();
  const drop = cue("upload", "drop");
  const send = cue("upload", "send");
  const fly = progress(frame, 12, drop - 12);
  const thud = usePop(frame, drop, { damping: 6, stiffness: 300 });
  const sendPress = usePop(frame, send, { damping: 7, stiffness: 300 });
  const sent = progress(frame, send + 2, 12);

  const x = interpolate(fly, [0, 1], [-330, 72]);
  const y = interpolate(fly, [0, 1], [320, 246]);
  const settle = frame >= drop ? 1 + (1 - thud) * -0.08 : 1;
  const w = 720;

  return (
    <Stage>
      <Split
        portrait={portrait}
        caption={
          <div style={{ display: "flex", flexDirection: "column", gap: 26, alignItems: portrait ? "center" : "flex-start", textAlign: portrait ? "center" : "left" }}>
            <Chip>Step 1</Chip>
            <PopWords text="Drop in your design." size={portrait ? 104 : 96} start={4} highlight={["design"]} align={portrait ? "center" : "left"} />
          </div>
        }
      >
        <div style={{ position: "relative", width: w, margin: portrait ? "110px 0" : 0, transform: `scale(${portrait ? 1.28 : 1})` }}>
          <Card style={{ padding: 44, display: "flex", flexDirection: "column", gap: 28 }}>
            <div>
              <div style={{ fontSize: 56, fontWeight: 700, color: C.night400 }}>Hi Ada,</div>
              <div style={{ fontSize: 40, fontWeight: 700, marginTop: 4 }}>What should we look at today?</div>
            </div>
            <div style={{ position: "relative", height: 250, borderRadius: 30, border: `2px solid ${C.night700}`, background: C.night950, padding: 26, boxSizing: "border-box" }}>
              <div style={{ position: "absolute", left: 26, bottom: 22, fontSize: 28, color: C.night500 }}>Add your goal (optional)...</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
              <div style={{ display: "flex", gap: 14 }}>
                <Segmented options={["Single Page", "Journey"]} active={0} activeFrom={cue("upload", "pill1")} frame={frame} size={26} />
                <Segmented options={["App", "Web"]} active={1} activeFrom={cue("upload", "pill2")} frame={frame} size={26} />
              </div>
              <div style={{ flex: "0 0 auto", width: 84, height: 84, borderRadius: 84, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${frame >= send ? 1 - (1 - sendPress) * 0.2 : 1})` }}>
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke={C.night950} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `translate(${sent * 70}px, ${sent * -70}px)`, opacity: 1 - sent }}>
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </div>
            </div>
          </Card>

          <div style={{ position: "absolute", left: x, top: y, transform: `scale(${settle}) rotate(${(1 - fly) * -8}deg)`, opacity: frame < 8 ? 0 : 1 }}>
            <div style={{ borderRadius: 18, overflow: "hidden", border: `3px solid ${C.blue300}`, boxShadow: "0 18px 40px rgba(0,0,0,0.5)" }}>
              <Scaled scale={0.4} width={DESIGN_W} height={DESIGN_H}>
                <DesignMock />
              </Scaled>
            </div>
          </div>
          {frame < drop + 8 ? <Cursor x={x + 190} y={y + 130} scale={frame >= drop ? 1 - (frame - drop) * 0.06 : 1} /> : null}
        </div>
      </Split>
    </Stage>
  );
}

/* --------------------------------------------------------------- 4. analyze */

const STEPS = ["Reading your design", "Checking visual hierarchy", "Checking accessibility", "Checking interaction", "Scoring and mapping"];

export function AnalyzeScene() {
  const frame = useCurrentFrame();
  const { portrait } = useLayout();
  const done = cue("analyze", "done");
  const ready = usePop(frame, done, { damping: 8, stiffness: 240 });
  const spin = frame * 9;

  return (
    <Stage>
      <Split
        portrait={portrait}
        caption={
          <div style={{ display: "flex", flexDirection: "column", gap: 26, alignItems: portrait ? "center" : "flex-start", textAlign: portrait ? "center" : "left" }}>
            <Chip>Step 2</Chip>
            <PopWords text="A senior-level critique, in seconds." size={portrait ? 96 : 88} start={4} highlight={["seconds"]} align={portrait ? "center" : "left"} />
          </div>
        }
      >
        <Card style={{ width: 720, margin: portrait ? "120px 0" : 0, padding: 44, transform: `scale(${portrait ? 1.28 : 1})`, display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22, height: 80 }}>
            {frame < done ? (
              <svg width="68" height="68" viewBox="0 0 50 50" style={{ transform: `rotate(${spin}deg)` }}>
                <circle cx="25" cy="25" r="20" fill="none" stroke={C.night800} strokeWidth="6" />
                <path d="M25 5a20 20 0 0 1 20 20" fill="none" stroke={C.blue300} strokeWidth="6" strokeLinecap="round" />
              </svg>
            ) : (
              <div style={{ width: 68, height: 68, borderRadius: 68, background: C.like, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${ready})` }}>
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </div>
            )}
            <div style={{ fontSize: 44, fontWeight: 700 }}>{frame < done ? "Fetching your insights..." : "Your report is ready!"}</div>
          </div>

          {STEPS.map((step, index) => {
            const at = cue("analyze", `t${index + 1}`);
            const check = usePop(frame, at, { damping: 8, stiffness: 260 });
            const show = progress(frame, 2 + index * 3, 10);
            return (
              <div key={step} style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 34, fontWeight: 600, color: frame >= at ? C.white : C.night500, opacity: show, transform: `translateX(${(1 - show) * 40}px)` }}>
                <div style={{ width: 46, height: 46, borderRadius: 46, border: `3px solid ${frame >= at ? C.like : C.night700}`, background: frame >= at ? C.like : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `scale(${check})` }}>
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </div>
                {step}
              </div>
            );
          })}
        </Card>
      </Split>
    </Stage>
  );
}

export { FONT };
