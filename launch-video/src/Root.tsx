import React from "react";
import { Composition } from "remotion";

import { Launch } from "./Launch";
import { FPS, TOTAL_FRAMES } from "./timeline";

/** The same film in two shapes. Every scene reads the frame size and lays itself out for it. */
export function RemotionRoot() {
  return (
    <>
      <Composition id="Landscape" component={Launch} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} />
      <Composition id="Portrait" component={Launch} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1080} height={1920} />
    </>
  );
}
