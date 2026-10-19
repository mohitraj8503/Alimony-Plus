// Rule sets drive the maintenance engine. The numbers below are ILLUSTRATIVE
// parameters so the studio works end to end. They are not statutory guidelines.
// Replace or extend RULE_SETS with the mentor-approved central and state rules
// and set status to "approved" once they are confirmed.
export type RuleSet = {
  id: string;
  label: string;
  jurisdiction: "central" | "state";
  region: string;
  version: string;
  status: "demo" | "approved";
  source: string;
  /** Multipliers applied to the remaining need gap for each scenario. */
  scenarioFactors: { conservative: number; baseline: number; stress: number };
  /** Maximum share (0 to 1) of the other party's capacity that can be allocated. */
  capacityCapShare: number;
};

export const RULE_SETS: RuleSet[] = [
  {
    id: "demo-central-v1",
    label: "Central (illustrative)",
    jurisdiction: "central",
    region: "India",
    version: "1.0",
    status: "demo",
    source:
      "Mirrors maintenance-planning-v1.0 used by the planning calculator. Illustrative, not law.",
    scenarioFactors: { conservative: 0.75, baseline: 1, stress: 1.25 },
    capacityCapShare: 1,
  },
  {
    id: "demo-state-template",
    label: "State template (illustrative)",
    jurisdiction: "state",
    region: "Configure per state",
    version: "0.1",
    status: "demo",
    source:
      "Placeholder that shows how a state rule can differ (a lower cap on capacity). Replace with approved parameters.",
    scenarioFactors: { conservative: 0.75, baseline: 1, stress: 1.25 },
    capacityCapShare: 0.5,
  },
];

export const DEFAULT_RULE_ID = RULE_SETS[0].id;

export const getRuleSet = (id: string) => RULE_SETS.find((r) => r.id === id);
