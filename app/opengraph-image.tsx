import { ImageResponse } from "next/og";

export const alt = "Vantage AI: know exactly what to fix in your design";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Image generation cannot read CSS variables, so these are the token values from tokens/color-tokens.json
// (night-950, primary-300, primary-500, primary-400).
const NIGHT = "#131314";
const SOFT_BLUE = "#877CEB";
const BLUE = "#3929CE";
const BRIGHT_BLUE = "#4D3CDF";

/**
 * A soft glow made of stacked, see-through circles. The image renderer supports neither blur nor gradients,
 * so each ring is a little bigger and fainter than the one before it.
 */
function Glow({ x, y, radius, color }: { x: number; y: number; radius: number; color: string }) {
  const rings = 14;
  return (
    <div style={{ position: "absolute", left: x, top: y, display: "flex" }}>
      {Array.from({ length: rings }, (_, index) => {
        const ring = (radius * (rings - index)) / rings;
        return (
          <div
            key={index}
            style={{ position: "absolute", left: -ring, top: -ring, width: ring * 2, height: ring * 2, borderRadius: ring, background: color, opacity: 0.045 }}
          />
        );
      })}
    </div>
  );
}

/** The picture shown when a link to the site is shared. Also used as the Twitter card. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          // Soft glows as gradients: blur filters are not supported when generating the image.
          background: NIGHT,
          color: "#FFFFFF",
          padding: "0 90px",
        }}
      >
        <Glow x={1090} y={20} radius={520} color={BLUE} />
        <Glow x={60} y={640} radius={420} color={BRIGHT_BLUE} />

        <div style={{ display: "flex", alignItems: "center", gap: 64, position: "relative" }}>
          <div
            style={{
              width: 280,
              height: 280,
              borderRadius: 64,
              background: "#000000",
              border: "2px solid #2B2B2E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="200" height="200" viewBox="6 5 30 30" fill="none">
              <path d="M11 13.5 20 29.5 27.5 16" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="29" cy="12" r="4.5" fill={SOFT_BLUE} />
            </svg>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: 104, fontWeight: 700, letterSpacing: -3 }}>Vantage</div>
            <div style={{ fontSize: 40, color: "#C9C9CF", maxWidth: 560, lineHeight: 1.25 }}>Know exactly what to fix in your design.</div>
            <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
              {["Principle-based", "Plain-language fixes"].map((label) => (
                <div
                  key={label}
                  style={{ fontSize: 24, color: "#E4E4E8", padding: "10px 20px", borderRadius: 999, border: "1px solid #3A3A40", background: "rgba(255,255,255,0.06)" }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
