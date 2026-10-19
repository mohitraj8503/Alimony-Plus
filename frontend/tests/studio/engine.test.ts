import { describe, expect, it } from "vitest";
import {
  calculateMaintenance,
  computeCapacity,
  computeNeed,
  projectTotals,
} from "../../src/lib/studio/engine";
import { distributeAssets } from "../../src/lib/studio/distribution";
import { RULE_SETS, getRuleSet } from "../../src/lib/studio/rules";
import { calculateDemo } from "../../src/lib/planning";
import { defaultState } from "../../src/lib/studio/state";

const central = RULE_SETS[0];

describe("maintenance engine", () => {
  it("computes need and capacity from the sample inputs", () => {
    expect(computeNeed(defaultState.inputs)).toBe(44000);
    expect(computeCapacity(defaultState.inputs)).toBe(57000);
  });
  it("matches the planning calculator for the central illustrative rule", () => {
    const mine = calculateMaintenance(defaultState.inputs, central);
    const demo = calculateDemo(defaultState.inputs);
    expect(mine.scenarios.map((s) => s.monthly)).toEqual([
      demo.scenarios.conservative.amount,
      demo.scenarios.baseline.amount,
      demo.scenarios.stress.amount,
    ]);
  });
  it("never allocates more than the capped capacity", () => {
    const state = getRuleSet("demo-state-template")!;
    const r = calculateMaintenance(defaultState.inputs, state);
    expect(r.cappedCapacity).toBe(28500);
    for (const s of r.scenarios) expect(s.monthly).toBeLessThanOrEqual(28500);
  });
  it("orders scenarios conservative <= baseline <= stress", () => {
    const [c, b, s] = calculateMaintenance(defaultState.inputs, central).scenarios;
    expect(c.monthly).toBeLessThanOrEqual(b.monthly);
    expect(b.monthly).toBeLessThanOrEqual(s.monthly);
  });
  it("gives zero when income covers expenses", () => {
    const r = calculateMaintenance(
      { ...defaultState.inputs, applicantIncome: 500000 },
      central,
    );
    expect(r.need).toBe(0);
    expect(r.scenarios.every((s) => s.monthly === 0)).toBe(true);
  });
  it("rejects negative or unknown amounts instead of treating them as zero", () => {
    expect(() =>
      calculateMaintenance({ ...defaultState.inputs, childCosts: -1 }, central),
    ).toThrow();
    expect(() =>
      calculateMaintenance({ ...defaultState.inputs, childCosts: NaN }, central),
    ).toThrow();
  });
  it("projects totals over the chosen horizon", () => {
    const r = calculateMaintenance(defaultState.inputs, central);
    const p = projectTotals(r, 12);
    expect(p[1].total).toBe(r.scenarios[1].monthly * 12);
  });
});

describe("asset distribution", () => {
  it("splits by share and always sums back to the total", () => {
    const d = distributeAssets({ ...defaultState.assets, applicantSharePct: 37 });
    for (const row of d.rows) expect(row.applicant + row.respondent).toBe(row.total);
    expect(d.applicantNet + d.respondentNet).toBe(d.netAssets);
    expect(d.netAssets).toBe(5400000 - 1700000);
  });
  it("gives everything to one side at 0% and 100%", () => {
    expect(distributeAssets({ ...defaultState.assets, applicantSharePct: 0 }).applicantAssets).toBe(0);
    const all = distributeAssets({ ...defaultState.assets, applicantSharePct: 100 });
    expect(all.respondentAssets).toBe(0);
  });
});
