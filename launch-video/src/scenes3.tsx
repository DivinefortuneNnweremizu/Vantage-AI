import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

import { count, progress, useLayout, usePop } from "./anim";
import { C } from "./brand";
import { cue } from "./timeline";
import { Card, Chip, Confetti, DesignMock, DESIGN_H, DESIGN_W, LogoBadge, LogoGlyph, Pin, PopWords, Scaled, Split, SPOTS, Stage } from "./ui";

/* ------------------------------------------------------------- 8. assistant */

const QUESTION = "What should I fix first?";
const REPLY_OPENING = "The headline works great. Here is what I would change first:";
const REPLY_TITLE = "1. Make the button easier to read";
const REPLY_BULLET = "Use a darker shade of blue so the white text pops.";

/** How many characters of `text` are showing, when typing starts at `start` and runs for `frames`. */
function typed(text: string, frame: number, start: number, frames: number): string {
  const shown = Math.floor(interpolate(frame, [start, start + frames], [0, text.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return text.slice(0, shown);
}

export function AssistantScene() {
  const frame = useCurrentFrame();
  const { portrait } = useLayout();
  const typing = cue("assistant", "typing");
  const send = cue("assistant", "send");
  const reply = cue("assistant", "reply");
  const image = cue("assistant", "image");
  const asked = usePop(frame, send, { damping: 10, stiffness: 220 });
  const picture = usePop(frame, image, { damping: 9, stiffness: 190 });
  const cursor = Math.floor(frame / 8) % 2 === 0;

  const opening = typed(REPLY_OPENING, frame, reply, 38);
  const title = typed(REPLY_TITLE, frame, reply + 38, 18);
  const bullet = typed(REPLY_BULLET, frame, reply + 56, 26);
  const button = SPOTS.button;

  return (
    <Stage>
      <Split
        portrait={portrait}
        gap={portrait ? 40 : 70}
        caption={
          <div style={{ display: "flex", flexDirection: "column", gap: 26, alignItems: portrait ? "center" : "flex-start", textAlign: portrait ? "center" : "left" }}>
            <Chip>Step 6</Chip>
            <PopWords text="Ask anything. Get answers with pictures." size={portrait ? 96 : 84} start={4} highlight={["pictures"]} align={portrait ? "center" : "left"} />
          </div>
        }
      >
        <Card style={{ width: portrait ? "100%" : 820, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "24px 32px", borderBottom: `2px solid ${C.night800}` }}>
            <div style={{ width: 54, height: 54, borderRadius: 16, background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LogoGlyph size={38} />
            </div>
            <div style={{ fontSize: 34, fontWeight: 700 }}>Assistant</div>
          </div>

          <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20, minHeight: portrait ? 760 : 560 }}>
            {frame >= send ? (
              <div style={{ alignSelf: "flex-end", background: C.chip, color: C.night950, fontSize: 32, fontWeight: 700, padding: "18px 30px", borderRadius: 28, transform: `scale(${asked})`, transformOrigin: "right bottom" }}>{QUESTION}</div>
            ) : null}

            {frame >= reply ? (
              <div style={{ alignSelf: "flex-start", maxWidth: "94%", background: C.night800, borderRadius: 28, padding: "24px 30px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontSize: 29, lineHeight: 1.3, color: C.night100 }}>{opening}</div>
                {title ? <div style={{ fontSize: 33, fontWeight: 700 }}>{title}</div> : null}
                {bullet ? <div style={{ fontSize: 29, lineHeight: 1.3, color: C.night100 }}>• {bullet}</div> : null}
                {frame >= image ? (
                  <div style={{ position: "relative", width: 460, height: 230, borderRadius: 18, overflow: "hidden", border: `3px solid ${C.night700}`, transform: `scale(${picture})`, transformOrigin: "left center" }}>
                    <div style={{ position: "absolute", left: -20, top: -215, width: DESIGN_W, height: DESIGN_H, transform: "scale(1.15)", transformOrigin: "top left" }}>
                      <DesignMock />
                      <div style={{ position: "absolute", left: button.x, top: button.y }}>
                        <Pin kind="dislike" size={46} start={image + 4} />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div style={{ margin: "0 28px 28px", display: "flex", alignItems: "center", gap: 14, borderRadius: 999, border: `2px solid ${C.night700}`, padding: "14px 18px 14px 30px", background: C.night950 }}>
            <div style={{ flex: 1, fontSize: 31, color: frame >= send ? C.night500 : C.white, minHeight: 44 }}>
              {frame >= send ? "Ask about your designs" : `${typed(QUESTION, frame, typing, 28)}${cursor && frame >= typing ? "|" : ""}`}
            </div>
            <div style={{ width: 64, height: 64, borderRadius: 64, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.night950} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </div>
          </div>
        </Card>
      </Split>
    </Stage>
  );
}

/* --------------------------------------------------------------- 9. iterate */

export function IterateScene() {
  const frame = useCurrentFrame();
  const { portrait, width } = useLayout();
  const climb = cue("iterate", "climb");
  const done = cue("iterate", "done");
  const fixed = progress(frame, climb, 34);
  const score = count(frame, climb, climb + 34, 62, 88);
  const badge = usePop(frame, done, { damping: 7, stiffness: 250 });
  const arrow = progress(frame, climb, 34);
  const scale = portrait ? 0.95 : 0.9;

  return (
    <Stage>
      <Split
        portrait={portrait}
        caption={
          <div style={{ display: "flex", flexDirection: "column", gap: 26, alignItems: portrait ? "center" : "flex-start", textAlign: portrait ? "center" : "left" }}>
            <Chip>Step 7</Chip>
            <PopWords text="Fix it. Re-analyze. Watch it climb." size={portrait ? 104 : 90} start={4} highlight={["climb."]} align={portrait ? "center" : "left"} />
          </div>
        }
      >
        <Card style={{ padding: 40, display: "flex", flexDirection: portrait ? "column" : "row", alignItems: "center", gap: 44 }}>
          <Scaled scale={scale} width={DESIGN_W} height={DESIGN_H}>
            <DesignMock fixed={fixed} />
          </Scaled>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, minWidth: 250 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.night400 }}>Version 1 · 62</div>
            <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke={C.like} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `translateY(${(1 - arrow) * 30}px)`, opacity: arrow }}>
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            <div style={{ fontSize: 150, fontWeight: 800, lineHeight: 1, color: score > 80 ? C.like : C.white }}>{score}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: C.night400 }}>Version 2</div>
            <div style={{ marginTop: 6, padding: "14px 30px", borderRadius: 999, background: C.like, color: C.night950, fontSize: 30, fontWeight: 800, transform: `scale(${badge})`, opacity: frame >= done ? 1 : 0 }}>3 issues fixed ✓</div>
          </div>
        </Card>
      </Split>
      <Confetti x={portrait ? width / 2 : width * 0.72} y={portrait ? 1200 : 700} start={done} count={36} power={1} />
    </Stage>
  );
}

/* -------------------------------------------------------------------- 10. end */

export function EndScene() {
  const frame = useCurrentFrame();
  const { width, height, portrait } = useLayout();
  const badge = usePop(frame, 0, { damping: 8, stiffness: 160, mass: 0.9 });
  const cta = usePop(frame, cue("end", "cta"), { damping: 8, stiffness: 230 });
  const pulse = 1 + Math.sin(frame * 0.28) * 0.025 * (frame >= cue("end", "cta") ? 1 : 0);
  const floats = [
    { kind: "like" as const, x: 0.12, y: 0.2, at: 14 },
    { kind: "dislike" as const, x: 0.88, y: 0.24, at: 20 },
    { kind: "like" as const, x: 0.9, y: 0.78, at: 26 },
    { kind: "dislike" as const, x: 0.1, y: 0.8, at: 32 },
  ];

  return (
    <Stage>
      {floats.map((float, index) => (
        <div key={index} style={{ position: "absolute", left: float.x * width, top: float.y * height + Math.sin(frame * 0.1 + index) * 12 }}>
          <Pin kind={float.kind} size={portrait ? 84 : 76} start={float.at} />
        </div>
      ))}

      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: portrait ? 56 : 44, textAlign: "center", padding: "0 60px" }}>
        <div style={{ transform: `scale(${badge})` }}>
          <LogoBadge size={portrait ? 230 : 200} />
        </div>
        <div style={{ maxWidth: portrait ? 940 : 1760 }}>
          <PopWords text="Know exactly what to fix." size={portrait ? 128 : 112} start={8} highlight={["fix."]} highlightColor={C.blue300} align="center" stagger={3} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26, transform: `scale(${cta * pulse})`, opacity: Math.min(1, cta * 2) }}>
          <div style={{ padding: portrait ? "34px 76px" : "30px 70px", borderRadius: 999, background: "#fff", color: C.night950, fontSize: portrait ? 58 : 52, fontWeight: 800 }}>Try Vantage free →</div>
          <div style={{ fontSize: portrait ? 40 : 36, fontWeight: 600, color: C.night300 }}>vantage-ai-eta.vercel.app</div>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", opacity: cta }}>
          {["Principle-based", "Plain language", "Pinned to your design"].map((label) => (
            <Chip key={label} size={portrait ? 28 : 26}>
              {label}
            </Chip>
          ))}
        </div>
      </div>
      <Confetti x={width / 2} y={height / 2 - 80} start={cue("end", "sparkle")} count={60} power={1.3} />
    </Stage>
  );
}

export { Scaled };
