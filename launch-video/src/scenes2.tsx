import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

import { count, progress, useLayout, usePop } from "./anim";
import { C } from "./brand";
import { cue } from "./timeline";
import { Card, Chip, Confetti, DesignMock, DESIGN_H, DESIGN_W, Pin, PopWords, Scaled, Split, SPOTS, Stage } from "./ui";

/* ------------------------------------------------------------- 5. sentiment */

const TABS = ["Sentiment", "Recommendations", "Key Takeaways", "UX Score", "Assistant"];
const SPOT_ORDER = ["headline", "subtitle", "button", "card", "links"] as const;

function Tabs({ activeIndex, size, frame }: { activeIndex: number; size: number; frame: number }) {
  const pop = usePop(frame, 4, { damping: 12 });
  return (
    <div style={{ display: "flex", gap: size * 0.4, padding: size * 0.35, borderRadius: size, background: C.night900, border: `2px solid ${C.night800}`, transform: `scale(${pop})` }}>
      {TABS.map((tab, index) => (
        <span key={tab} style={{ padding: `${size * 0.3}px ${size * 0.7}px`, borderRadius: size, fontSize: size, fontWeight: 700, background: index === activeIndex ? C.chip : "transparent", color: index === activeIndex ? C.night950 : C.night400, whiteSpace: "nowrap" }}>
          {tab}
        </span>
      ))}
    </div>
  );
}

export function SentimentScene() {
  const frame = useCurrentFrame();
  const { portrait } = useLayout();
  const scale = portrait ? 1.42 : 1.12;
  const cues = SPOT_ORDER.map((_, index) => cue("sentiment", `p${index + 1}`));
  // The most recent finding, for the note under the design.
  const shown = cues.filter((at) => frame >= at).length - 1;
  const spot = shown >= 0 ? SPOTS[SPOT_ORDER[shown] as (typeof SPOT_ORDER)[number]] : null;
  const noteStart = shown >= 0 ? (cues[shown] as number) : 0;
  const note = usePop(frame, noteStart + 2, { damping: 11, stiffness: 220 });
  const tabSize = portrait ? 22 : 20;

  return (
    <Stage>
      <Split
        portrait={portrait}
        gap={portrait ? 40 : 60}
        caption={
          <div style={{ display: "flex", flexDirection: "column", gap: 26, alignItems: portrait ? "center" : "flex-start", textAlign: portrait ? "center" : "left" }}>
            <Chip>Step 3</Chip>
            <PopWords text="Likes and dislikes, pinned right on your design." size={portrait ? 88 : 80} start={4} highlight={["pinned"]} align={portrait ? "center" : "left"} />
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: portrait ? 36 : 30 }}>
          <Tabs activeIndex={0} size={tabSize} frame={frame} />
          <div style={{ position: "relative" }}>
            <Scaled scale={scale} width={DESIGN_W} height={DESIGN_H}>
              <DesignMock />
              {SPOT_ORDER.map((key, index) => {
                const s = SPOTS[key];
                return (
                  <div key={key} style={{ position: "absolute", left: s.x, top: s.y }}>
                    <Pin kind={s.kind} size={50} start={cues[index] as number} />
                  </div>
                );
              })}
            </Scaled>
          </div>
          <div style={{ height: portrait ? 190 : 150, width: DESIGN_W * scale, display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
            {spot ? (
              <Card style={{ width: "100%", padding: "24px 30px", display: "flex", alignItems: "center", gap: 24, transform: `translateY(${(1 - note) * 30}px) scale(${0.9 + note * 0.1})`, opacity: Math.min(1, note * 2), borderColor: spot.kind === "like" ? C.like : C.dislike }}>
                <div style={{ width: 62, height: 62, borderRadius: 62, background: spot.kind === "like" ? C.like : C.dislike, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d={spot.kind === "like" ? "M8 14s1.5 2 4 2 4-2 4-2" : "M16 16s-1.5-2-4-2-4 2-4 2"} />
                    <path d="M9 9h.01M15 9h.01" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: portrait ? 36 : 32, fontWeight: 700 }}>{spot.title}</div>
                  <div style={{ fontSize: portrait ? 28 : 25, color: C.night300, marginTop: 4 }}>{spot.note}</div>
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      </Split>
    </Stage>
  );
}

/* ----------------------------------------------------------------- 6. score */

const DIALS = [
  { label: "Intuitive", value: 82, color: C.blue300 },
  { label: "Trusted", value: 74, color: C.like },
  { label: "Valuable", value: 88, color: C.warn },
];

function Ring({ size, value, color, frame, start, label }: { size: number; value: number; color: string; frame: number; start: number; label: string }) {
  const pop = usePop(frame, start - 4, { damping: 12 });
  const fill = interpolate(frame, [start, start + 46], [0, value / 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });
  const radius = size / 2 - 14;
  const circumference = 2 * Math.PI * radius;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, transform: `scale(${pop})` }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={radius} stroke={C.night800} strokeWidth="14" fill="none" />
          <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth="14" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - fill)} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.34, fontWeight: 800 }}>{count(frame, start, start + 46, 0, value)}</div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: C.night300 }}>{label}</div>
    </div>
  );
}

export function ScoreScene() {
  const frame = useCurrentFrame();
  const { portrait, width } = useLayout();
  const sweep = cue("score", "sweep");
  const done = cue("score", "done");
  const overall = usePop(frame, done, { damping: 7, stiffness: 240 });
  const ringSize = portrait ? 250 : 210;

  return (
    <Stage>
      <Split
        portrait={portrait}
        caption={
          <div style={{ display: "flex", flexDirection: "column", gap: 26, alignItems: portrait ? "center" : "flex-start", textAlign: portrait ? "center" : "left" }}>
            <Chip>Step 4</Chip>
            <PopWords text="Scores that show their work." size={portrait ? 104 : 92} start={4} highlight={["work"]} align={portrait ? "center" : "left"} />
          </div>
        }
      >
        <Card style={{ padding: portrait ? "50px 40px" : "46px 50px", display: "flex", flexDirection: "column", alignItems: "center", gap: 36 }}>
          <div style={{ display: "flex", gap: portrait ? 26 : 40 }}>
            {DIALS.map((dial, index) => (
              <Ring key={dial.label} size={ringSize} value={dial.value} color={dial.color} frame={frame} start={sweep + index * 5} label={dial.label} />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 22, padding: "20px 46px", borderRadius: 999, background: C.blue500, transform: `scale(${overall})`, opacity: frame >= done ? 1 : 0 }}>
            <span style={{ fontSize: 34, fontWeight: 700, color: C.blue100 }}>Overall</span>
            <span style={{ fontSize: 76, fontWeight: 800, lineHeight: 1 }}>81</span>
            <span style={{ fontSize: 30, fontWeight: 600, color: C.blue100 }}>/ 100</span>
          </div>
        </Card>
      </Split>
      <Confetti x={portrait ? width / 2 : width * 0.7} y={portrait ? 1180 : 760} start={done} count={34} power={0.9} />
    </Stage>
  );
}

/* ----------------------------------------------------------------- 7. fixes */

const FIXES = [
  { cue: "r1", title: "Use a darker grey for the subtitle", why: "So everyone can read it.", from: "#BEBEC4", to: "#4E4E56", kind: "colour" },
  { cue: "r2", title: "Make the blue on the button a darker shade", why: "So the white text pops.", from: "#96A0F5", to: "#3C42D2", kind: "colour" },
  { cue: "r3", title: "Make the small links bigger", why: "So they are easy to tap.", from: "9", to: "15", kind: "size" },
] as const;

function Swatch({ fix, change }: { fix: (typeof FIXES)[number]; change: number }) {
  if (fix.kind === "size") {
    const size = interpolate(change, [0, 1], [Number(fix.from), Number(fix.to)]);
    return <div style={{ width: 96, textAlign: "center", fontSize: size * 2.2, fontWeight: 700, color: C.white }}>Aa</div>;
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: fix.from, border: "3px solid #fff" }} />
      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.night300} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: change > 0.5 ? fix.to : fix.from, border: "3px solid #fff", transition: "none", transform: `scale(${1 + Math.sin(change * Math.PI) * 0.25})` }} />
    </div>
  );
}

export function FixesScene() {
  const frame = useCurrentFrame();
  const { portrait, width } = useLayout();
  const glow = cue("fixes", "glow");
  const change = progress(frame, glow, 16);
  const glowPulse = frame >= glow ? 0.5 + 0.5 * Math.sin((frame - glow) * 0.45) : 0;

  return (
    <Stage>
      <Split
        portrait={portrait}
        caption={
          <div style={{ display: "flex", flexDirection: "column", gap: 26, alignItems: portrait ? "center" : "flex-start", textAlign: portrait ? "center" : "left" }}>
            <Chip>Step 5</Chip>
            <PopWords text="Plain-language fixes. No jargon." size={portrait ? 104 : 92} start={4} highlight={["fixes."]} align={portrait ? "center" : "left"} />
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24, width: portrait ? "100%" : 780 }}>
          {FIXES.map((fix, index) => {
            const pop = usePop(frame, cue("fixes", fix.cue), { damping: 10, stiffness: 190 });
            return (
              <Card
                key={fix.cue}
                style={{
                  padding: "28px 34px",
                  display: "flex",
                  alignItems: "center",
                  gap: 26,
                  transform: `translateX(${(1 - pop) * 160}px) scale(${0.92 + pop * 0.08})`,
                  opacity: Math.min(1, pop * 2),
                  borderColor: frame >= glow ? `rgba(135,124,235,${0.4 + glowPulse * 0.6})` : C.night800,
                }}
              >
                <div style={{ width: 64, height: 64, borderRadius: 64, background: C.blue500, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 800, flex: "0 0 auto" }}>{index + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: portrait ? 38 : 36, fontWeight: 700, lineHeight: 1.12 }}>{fix.title}</div>
                  <div style={{ fontSize: 27, color: C.night300, marginTop: 6 }}>{fix.why}</div>
                </div>
                <Swatch fix={fix} change={change} />
              </Card>
            );
          })}
        </div>
      </Split>
      <Confetti x={portrait ? width - 170 : width * 0.88} y={portrait ? 1000 : 520} start={glow} count={22} power={0.7} />
    </Stage>
  );
}

export { Scaled };
