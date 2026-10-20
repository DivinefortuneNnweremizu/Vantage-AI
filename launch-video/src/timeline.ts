import data from "./timeline.json";

/**
 * The single source of truth for the film. Scene lengths and every sound cue live in timeline.json.
 * The scenes read their animation moments from here, and scripts/soundtrack.py reads the same file,
 * so a sound can never drift away from the picture it belongs to.
 */
export const FPS = data.fps;
export const BPM = data.bpm;

export type SceneId = (typeof data.scenes)[number]["id"];

interface SceneTiming {
  id: SceneId;
  start: number;
  frames: number;
}

let cursor = 0;
export const SCENES: SceneTiming[] = data.scenes.map((scene) => {
  const frames = Math.round(scene.seconds * FPS);
  const timing = { id: scene.id as SceneId, start: cursor, frames };
  cursor += frames;
  return timing;
});

export const TOTAL_FRAMES = cursor;

export function sceneTiming(id: SceneId): SceneTiming {
  const found = SCENES.find((scene) => scene.id === id);
  if (!found) throw new Error(`Unknown scene ${id}`);
  return found;
}

/** The frame, counted from the start of the scene, where a named cue happens. */
export function cue(scene: SceneId, id: string): number {
  const found = data.cues.find((entry) => entry.scene === scene && entry.id === id);
  if (!found) throw new Error(`Unknown cue ${scene}.${id}`);
  return Math.round(found.at * FPS);
}
