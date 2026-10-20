// Puts the soundtrack under each silent render, and checks the result.
import { spawnSync } from "node:child_process";

for (const shape of ["landscape", "portrait"]) {
  const output = `out/vantage-launch-${shape}.mp4`;
  const result = spawnSync(
    "ffmpeg",
    ["-y", "-i", `out/silent-${shape}.mp4`, "-i", "out/soundtrack.wav", "-c:v", "copy", "-af", "volume=-1.5dB", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", output],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    console.error(`ffmpeg failed for ${shape}`);
    process.exit(1);
  }
  const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,width,height,duration", "-of", "compact", output], { encoding: "utf8" });
  console.log(`\n${output}\n${probe.stdout}`);
}
