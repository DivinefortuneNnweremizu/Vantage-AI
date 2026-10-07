interface ScoreDonutProps {
  scores: { intuitive: number; trusted: number; valuable: number; overall: number };
}

const SIZE = 220;
const CENTER = SIZE / 2;
const RADIUS = 86;
const STROKE = 26;
const GAP_DEGREES = 6;
const SECTOR_DEGREES = 120 - GAP_DEGREES;

const SERIES = [
  { key: "intuitive", color: "var(--chart-1-color)" },
  { key: "trusted", color: "var(--chart-2-color)" },
  { key: "valuable", color: "var(--chart-3-color)" },
] as const;

function polar(angleDegrees: number): { x: number; y: number } {
  const radians = ((angleDegrees - 90) * Math.PI) / 180;
  return { x: CENTER + RADIUS * Math.cos(radians), y: CENTER + RADIUS * Math.sin(radians) };
}

function arc(startDegrees: number, sweepDegrees: number): string {
  const start = polar(startDegrees);
  const end = polar(startDegrees + sweepDegrees);
  const largeArc = sweepDegrees > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

/**
 * Three equal sectors, one per dimension. Each sector fills in proportion to its score out of 100,
 * so the chart reads the same way as the three progress bars. The numbers are always shown as text too.
 */
export function ScoreDonut({ scores }: ScoreDonutProps) {
  const summary = `Overall ${scores.overall} out of 100. Intuitive ${scores.intuitive}, Trusted ${scores.trusted}, Valuable ${scores.valuable}.`;

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={summary} className="mx-auto w-full max-w-[260px]">
      {SERIES.map((series, index) => {
        const start = index * 120 + GAP_DEGREES / 2;
        const score = Math.max(0, Math.min(100, scores[series.key]));
        const filled = (SECTOR_DEGREES * score) / 100;
        return (
          <g key={series.key}>
            <path d={arc(start, SECTOR_DEGREES)} fill="none" stroke="var(--surface-subtle-color)" strokeWidth={STROKE} strokeLinecap="butt" />
            {filled > 0.5 ? (
              <path d={arc(start, filled)} fill="none" stroke={series.color} strokeWidth={STROKE} strokeLinecap="butt" />
            ) : null}
          </g>
        );
      })}
      <text x={CENTER} y={CENTER - 2} textAnchor="middle" fontSize="40" fontWeight="600" fill="var(--text-strong-color)">
        {scores.overall}
      </text>
      <text x={CENTER} y={CENTER + 22} textAnchor="middle" fontSize="13" fill="var(--text-secondary-color)">
        overall
      </text>
    </svg>
  );
}
