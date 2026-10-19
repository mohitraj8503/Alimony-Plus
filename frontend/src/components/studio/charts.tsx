const money = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const tones = {
  green: "var(--green)",
  amber: "var(--amber)",
  muted: "#9aa595",
} as const;

export type Bar = { label: string; value: number; tone?: keyof typeof tones };

export function BarChart({ title, data }: { title: string; data: Bar[] }) {
  const width = 640;
  const left = 200;
  const right = 120;
  const row = 34;
  const max = Math.max(1, ...data.map((d) => d.value));
  const summary = data.map((d) => `${d.label} ${money(d.value)}`).join(", ");
  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${width} ${data.length * row + 8}`}
        role="img"
        aria-label={`${title}: ${summary}`}
        className="h-auto w-full"
      >
        {data.map((d, i) => {
          const y = i * row + 4;
          const w = Math.max(((width - left - right) * d.value) / max, 2);
          return (
            <g key={d.label}>
              <text x={0} y={y + 19} fontSize="13" fill="var(--ink)">
                {d.label}
              </text>
              <rect
                x={left}
                y={y + 4}
                width={w}
                height={20}
                rx={4}
                fill={tones[d.tone ?? "green"]}
              />
              <text x={left + w + 8} y={y + 19} fontSize="13" fill="var(--ink)">
                {money(d.value)}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

export type SplitRow = { label: string; left: number; right: number };

export function SplitBars({
  title,
  rows,
  leftLabel,
  rightLabel,
}: {
  title: string;
  rows: SplitRow[];
  leftLabel: string;
  rightLabel: string;
}) {
  const width = 640;
  const left = 200;
  const right = 20;
  const row = 40;
  const max = Math.max(1, ...rows.map((r) => r.left + r.right));
  const scale = (width - left - right) / max;
  const summary = rows
    .map(
      (r) =>
        `${r.label}: ${leftLabel} ${money(r.left)}, ${rightLabel} ${money(r.right)}`,
    )
    .join("; ");
  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${width} ${rows.length * row + 34}`}
        role="img"
        aria-label={`${title}. ${summary}`}
        className="h-auto w-full"
      >
        <rect x={left} y={4} width={12} height={12} rx={2} fill={tones.green} />
        <text x={left + 18} y={15} fontSize="12" fill="var(--ink)">
          {leftLabel}
        </text>
        <rect x={left + 140} y={4} width={12} height={12} rx={2} fill={tones.amber} />
        <text x={left + 158} y={15} fontSize="12" fill="var(--ink)">
          {rightLabel}
        </text>
        {rows.map((r, i) => {
          const y = i * row + 30;
          const lw = r.left * scale;
          const rw = r.right * scale;
          return (
            <g key={r.label}>
              <text x={0} y={y + 20} fontSize="13" fill="var(--ink)">
                {r.label}
              </text>
              <rect x={left} y={y + 4} width={lw} height={22} fill={tones.green} />
              <rect x={left + lw} y={y + 4} width={rw} height={22} fill={tones.amber} />
              <text x={left + lw + rw + 8} y={y + 20} fontSize="12" fill="var(--ink)">
                {money(r.left + r.right)}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
