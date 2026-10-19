import { financialFields } from "../planning";
import type { RuleSet } from "./rules";

export type FieldKey = (typeof financialFields)[number][0];
export type StudioInputs = Record<FieldKey, number>;
export type ScenarioKey = "conservative" | "baseline" | "stress";
export const scenarioLabels: Record<ScenarioKey, string> = {
  conservative: "Conservative",
  baseline: "Baseline",
  stress: "Stress",
};
const keys: ScenarioKey[] = ["conservative", "baseline", "stress"];

function assertValid(i: StudioInputs) {
  for (const [key] of financialFields)
    if (!Number.isFinite(i[key]) || i[key] < 0)
      throw new Error(
        "Every amount must be known and non-negative. Unknown amounts cannot be treated as zero.",
      );
}

// Same arithmetic as calculateDemo in planning.ts (maintenance-planning-v1.0).
export function computeNeed(i: StudioInputs) {
  return Math.max(
    0,
    i.applicantEssentialExpenses +
      i.childCosts +
      i.housingCost +
      i.medicalCosts +
      i.educationCosts +
      i.litigationCosts -
      i.applicantIncome -
      i.applicantAssetsIncome -
      i.existingSupport,
  );
}
export function computeCapacity(i: StudioInputs) {
  return Math.max(
    0,
    i.respondentIncome +
      i.respondentAssetsIncome -
      i.respondentEssentialExpenses -
      i.respondentLiabilities -
      i.existingSupport,
  );
}

export type ScenarioResult = {
  key: ScenarioKey;
  label: string;
  factor: number;
  monthly: number;
  surplusAfter: number;
};
export type MaintenanceResult = {
  ruleId: string;
  ruleLabel: string;
  ruleVersion: string;
  ruleStatus: RuleSet["status"];
  need: number;
  capacity: number;
  cappedCapacity: number;
  scenarios: ScenarioResult[];
  assumptions: string[];
  disclaimer: string;
};

export function calculateMaintenance(
  input: StudioInputs,
  rule: RuleSet,
): MaintenanceResult {
  assertValid(input);
  const need = computeNeed(input);
  const capacity = computeCapacity(input);
  const cappedCapacity = capacity * rule.capacityCapShare;
  const scenarios = keys.map((key) => {
    const factor = rule.scenarioFactors[key];
    const monthly = Math.round(Math.min(need * factor, cappedCapacity));
    return {
      key,
      label: scenarioLabels[key],
      factor,
      monthly,
      surplusAfter: Math.round(capacity) - monthly,
    };
  });
  return {
    ruleId: rule.id,
    ruleLabel: rule.label,
    ruleVersion: rule.version,
    ruleStatus: rule.status,
    need: Math.round(need),
    capacity: Math.round(capacity),
    cappedCapacity: Math.round(cappedCapacity),
    scenarios,
    assumptions: [
      "All amounts are monthly INR and entered by the user.",
      `Rule set: ${rule.label} v${rule.version} (${rule.status === "demo" ? "illustrative, not approved" : "approved"}).`,
      `Each scenario applies ${rule.scenarioFactors.conservative}x, ${rule.scenarioFactors.baseline}x and ${rule.scenarioFactors.stress}x to the need gap, capped at ${Math.round(rule.capacityCapShare * 100)}% of the other party's capacity.`,
      "These are scenario assumptions, not legal percentages.",
    ],
    disclaimer:
      "Illustrative planning only. This does not predict a court order or determine entitlement.",
  };
}

export function projectTotals(result: MaintenanceResult, months: number) {
  return result.scenarios.map((s) => ({
    key: s.key,
    label: s.label,
    monthly: s.monthly,
    total: s.monthly * months,
  }));
}
