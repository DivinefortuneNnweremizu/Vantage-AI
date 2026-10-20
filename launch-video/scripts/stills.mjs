// Renders chosen frames of both formats, bundling only once. For checking the film without rendering all of it.
//   node scripts/stills.mjs 150 314 554
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import path from "node:path";

const frames = process.argv.slice(2).map(Number);
const only = process.env.ONLY; // "Landscape" or "Portrait"
mkdirSync("out/stills", { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
for (const id of ["Landscape", "Portrait"]) {
  if (only && only !== id) continue;
  const composition = await selectComposition({ serveUrl, id, port: 3777 });
  for (const frame of frames) {
    await renderStill({ composition, serveUrl, frame, output: `out/stills/${id[0]}-${frame}.png`, imageFormat: "png", port: 3777 });
  }
  console.log(id, "done");
}
