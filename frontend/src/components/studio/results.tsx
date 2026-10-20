import { calculateScenario } from "@/lib/studio/engine";
import { getRuleSet } from "@/lib/studio/rules";
import { validateInputs } from "@/lib/studio/schema";
import type { Scenario, ScenarioResult } from "@/lib/studio/types";
import { inr } from "./format";

export function ResultCards({ scenario }: { scenario: Scenario }) {
  const { maintenance: m, settlement: s } = calculateScenario(scenario);
  const rule = getRuleSet(scenario.ruleSetId);
  return (
    <section className="s-card" aria-labelledby={`res-${scenario.id}`}>
      <h2 id={`res-${scenario.id}`} className="s-h2">
        Results for {scenario.name}
      </h2>
      <p className="s-muted">
        {rule.label}. {rule.note}
      </p>
      <p className="s-big" role="status">
        Monthly maintenance: <strong>{inr(m.amount)}</strong>
      </p>
      {m.capped ? (
        <p className="s-warn">
          Limited by what the paying party can afford. The rule alone would give {inr(m.rawAmount)}.
        </p>
      ) : null}
      <dl className="s-stats">
        <div><dt>Receiving party's need gap</dt><dd>{inr(m.needGap)}</dd></div>
        <div><dt>Income gap</dt><dd>{inr(m.incomeGap)}</dd></div>
        <div><dt>Paying party's capacity</dt><dd>{inr(m.payerCapacity)}</dd></div>
        <div><dt>Net assets</dt><dd>{inr(s.netEstate)}</dd></div>
        <div><dt>Receiving party's asset share</dt><dd>{inr(s.recipientShare)}</dd></div>
        <div><dt>Paying party's asset share</dt><dd>{inr(s.payerShare)}</dd></div>
        <div><dt>Maintenance over the duration</dt><dd>{inr(s.maintenanceTotal)}</dd></div>
        <div><dt>Total to receiving party</dt><dd>{inr(s.recipientTotal)}</dd></div>
      </dl>
      {s.debtsExceedAssets ? (
        <p className="s-warn">Debts are higher than assets, so there is nothing to share.</p>
      ) : null}
    </section>
  );
}

export function ComparisonTable({ scenarios }: { scenarios: Scenario[] }) {
  const cols = scenarios.map((sc) => ({
    sc,
    result: validateInputs(sc.inputs).ok ? calculateScenario(sc) : null,
  }));
  const line = (label: string, pick: (r: ScenarioResult) => string) => (
    <tr>
      <th scope="row">{label}</th>
      {cols.map(({ sc, result }) => (
        <td key={sc.id}>{result ? pick(result) : "Fix the inputs"}</td>
      ))}
    </tr>
  );
  return (
    <section className="s-card" aria-labelledby="compare-h">
      <h2 id="compare-h" className="s-h2">Scenario comparison</h2>
      <div className="s-scroll" tabIndex={0} role="region" aria-label="Scenario comparison table">
        <table className="s-table">
          <caption className="s-sr">Results for each scenario side by side</caption>
          <thead>
            <tr>
              <th scope="col">Measure</th>
              {cols.map(({ sc }) => (
                <th key={sc.id} scope="col">{sc.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Rule set</th>
              {cols.map(({ sc }) => (
                <td key={sc.id}>{getRuleSet(sc.ruleSetId).label}</td>
              ))}
            </tr>
            {line("Monthly maintenance", (r) => inr(r.maintenance.amount))}
            {line("Maintenance over the duration", (r) => inr(r.settlement.maintenanceTotal))}
            {line("Receiving party's asset share", (r) => inr(r.settlement.recipientShare))}
            {line("Paying party's asset share", (r) => inr(r.settlement.payerShare))}
            {line("Total to receiving party", (r) => inr(r.settlement.recipientTotal))}
          </tbody>
        </table>
      </div>
    </section>
  );
}