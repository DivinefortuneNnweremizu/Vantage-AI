import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";

import { progress } from "./anim";
import { C } from "./brand";
import { FontGate } from "./fonts";
import { AnalyzeScene, HookScene, LogoScene, UploadScene } from "./scenes1";
import { FixesScene, ScoreScene, SentimentScene } from "./scenes2";
import { AssistantScene, EndScene, IterateScene } from "./scenes3";
import { SCENES, type SceneId } from "./timeline";

const SCENE_COMPONENTS: { [K in SceneId]: React.ComponentType } = {
  hook: HookScene,
  logo: LogoScene,
  upload: UploadScene,
  analyze: AnalyzeScene,
  sentiment: SentimentScene,
  score: ScoreScene,
  fixes: FixesScene,
  assistant: AssistantScene,
  iterate: IterateScene,
  end: EndScene,
};

const WIPE_FRAMES = 16;

/** A bright band that sweeps across the screen to hide the cut between two scenes. */
function Wipe() {
  const frame = useCurrentFrame();
  const t = progress(frame, 0, WIPE_FRAMES);
  const x = -120 + t * 240;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-10%", bottom: "-10%", width: "75%", left: `${x}%`, background: C.blue500, transform: "skewX(-14deg)" }} />
      <div style={{ position: "absolute", top: "-10%", bottom: "-10%", width: "9%", left: `${x - 12}%`, background: C.blue300, transform: "skewX(-14deg)" }} />
      <div style={{ position: "absolute", top: "-10%", bottom: "-10%", width: "5%", left: `${x - 19}%`, background: "#fff", transform: "skewX(-14deg)" }} />
    </AbsoluteFill>
  );
}

export function Launch() {
  return (
    <AbsoluteFill style={{ background: C.night950 }}>
      <FontGate>
        {SCENES.map((scene) => {
          const Scene = SCENE_COMPONENTS[scene.id as SceneId] as React.ComponentType;
          return (
            <Sequence key={scene.id} from={scene.start} durationInFrames={scene.frames} name={scene.id}>
              <Scene />
            </Sequence>
          );
        })}
        {SCENES.slice(1).map((scene) => (
          <Sequence key={`wipe-${scene.id}`} from={scene.start - WIPE_FRAMES / 2} durationInFrames={WIPE_FRAMES} name={`wipe-${scene.id}`}>
            <Wipe />
          </Sequence>
        ))}
      </FontGate>
    </AbsoluteFill>
  );
}
