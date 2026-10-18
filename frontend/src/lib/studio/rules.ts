import type { RuleSet, Scenario, ScenarioInputs } from "./types";

export const RULES_NOTICE =
  "Sample rule sets for demonstration. They are not statutory formulas. Real parameters must come from a lawyer or the court.";

export const RULE_SETS: RuleSet[] = [
  {
    id: "sample-central-need",
    label: "Sample central rule: full need gap",
    scope: "central",
    method: "need-gap",
    sharePercent: 100,
    capPercentOfCapacity: 100,
    note: "Covers the recipient's remaining need, capped by what the payer can afford.",
  },
  {
    id: "sample-state-need-75",
    label: "Sample state rule A: 75% of need gap",
    scope: "state",
    method: "need-gap",
    sharePercent: 75,
    capPercentOfCapacity: 100,
    note: "A cautious version that covers three quarters of the remaining need.",
  },
  {
    id: "sample-state-income-share",
    label: "Sample state rule B: share of income gap",
    scope: "state",
    method: "income-gap",
    sharePercent: 25,
    capPercentOfCapacity: 80,
    note: "Uses a share of the income difference and never more than 80% of capacity.",
  },
];

export function getRuleSet(id: string): RuleSet {
  return RULE_SETS.find((r) => r.id === id) ?? RULE_SETS[0];
}

export const DEFAULT_INPUTS: ScenarioInputs = {
  income: { payer: 90000, recipient: 25000 },
  essentialExpenses: { payer: 40000, recipient: 30000 },
  payerDebtPayments: 8000,
  childCosts: 12000,
  totalAssets: 2500000,
  totalDebts: 400000,
  recipientAssetSharePercent: 50,
  durationMonths: 36,
};

export function newScenario(index: number): Scenario {
  return {
    id: `scenario-${index}`,
    name: `Scenario ${String.fromCharCode(64 + index)}`,
    ruleSetId: RULE_SETS[0].id,
    inputs: structuredClone(DEFAULT_INPUTS),
  };
}