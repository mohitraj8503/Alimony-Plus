import { calculateScenario } from "@/lib/studio/engine";
import { validateInputs } from "@/lib/studio/schema";
import type { Scenario } from "@/lib/studio/types";
import { inr } from "./format";

interface Bar {
  label: string;
  value: number;
  tone: "green" | "amber" | "muted";
}

function BarChart({ id, title, bars }: { id: string; title: string; bars: Bar[] }) {
  const max = Math.max(1, ...bars.map((b) => Math.abs(b.value)));
  const left = 230;
  const area = 220;
  const rowH = 40;
  const height = bars.length * rowH + 8;
  const desc = bars.map((b) => `${b.label}: ${inr(b.value)}`).join(". ");
  return (
    <section className="s-card" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="s-h2">
        {title}
      </h2>
      <svg
        className="s-chart"
        viewBox={`0 0 640 ${height}`}
        role="img"
        aria-labelledby={`${id}-t ${id}-d`}
      >
        <title id={`${id}-t`}>{title}</title>
        <desc id={`${id}-d`}>{desc}</desc>

        {bars.map((b, i) => {
          const y = i * rowH + 6;
          const w = Math.max(2, (Math.abs(b.value) / max) * area);
          return (
            <g key={b.label}>
              <text x={0} y={y + 20}>
                {b.label}
              </text>
              <rect x={left} y={y + 4} width={w} height={22} rx={4} className={`s-bar-${b.tone}`} />
              <text x={left + w + 8} y={y + 20}>
                {inr(b.value)}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

export function AssetChart({ scenario }: { scenario: Scenario }) {
  const { maintenance: m, settlement: s } = calculateScenario(scenario);
  const i = scenario.inputs;
  return (
    <BarChart
      id={`chart-${scenario.id}`}
      title={`Assets, debts and maintenance for ${scenario.name}`}
      bars={[
        { label: "Total assets", value: i.totalAssets, tone: "green" },
        { label: "Total debts", value: i.totalDebts, tone: "amber" },
        { label: "Net assets", value: s.netEstate, tone: s.netEstate < 0 ? "amber" : "muted" },
        { label: "Receiving party's asset share", value: s.recipientShare, tone: "green" },

        { label: "Paying party's asset share", value: s.payerShare, tone: "muted" },
        { label: "Maintenance over the duration", value: m.amount * i.durationMonths, tone: "green" },
      ]}
    />
  );
}

export function ComparisonChart({ scenarios }: { scenarios: Scenario[] }) {
  const bars: Bar[] = [];
  for (const sc of scenarios) {
    if (!validateInputs(sc.inputs).ok) continue;
    const r = calculateScenario(sc);
    bars.push({ label: `${sc.name}: receiving party total`, value: r.settlement.recipientTotal, tone: "green" });
    bars.push({ label: `${sc.name}: paying party share`, value: r.settlement.payerShare, tone: "muted" });
  }
  if (bars.length === 0) return null;
  return <BarChart id="chart-compare" title="Alimony and asset comparison across scenarios" bars={bars} />;
}