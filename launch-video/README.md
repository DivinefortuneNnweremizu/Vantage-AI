# Vantage launch film

A 42-second launch video for Vantage AI, in **landscape (1920x1080)** and **portrait (1080x1920)**.
Everything is made from code: the picture with [Remotion](https://www.remotion.dev) (React), the soundtrack with
Python (numpy and scipy). Built the way the [claude-launchvideo](https://github.com/Leonxlnx/claude-launchvideo)
example is: one timeline file drives both picture and sound, so every sound lands on its frame.

The finished files are written to `out/`:

- `out/vantage-launch-landscape.mp4`
- `out/vantage-launch-portrait.mp4`

## Make it

Needs Node, Python with `numpy` and `scipy`, and `ffmpeg`.

```
cd launch-video
npm install
npm run studio     # preview and scrub it in the browser
npm run render     # soundtrack, both videos, then the sound is added
```

## How it fits together

- `src/timeline.json` is the single source of truth: how long each scene is, and every sound cue (a scene, a moment, a sound).
- `src/timeline.ts` turns that into frames. Scenes ask it where their moments are, for example `cue("sentiment", "p1")`.
- `scripts/soundtrack.py` reads the same file and synthesizes a 150 BPM beat plus the sound effects.
- `src/scenes1.tsx`, `scenes2.tsx`, `scenes3.tsx` hold the ten scenes. They lay themselves out for landscape or portrait.
- `scripts/mux.mjs` puts the soundtrack under each silent render.
- `node scripts/stills.mjs 150 314` renders single frames of both shapes, to check the film without rendering all of it.

To change the story, edit the scenes and `timeline.json`. Keep scene lengths in multiples of 0.4 seconds (one beat) so the music stays in time.
