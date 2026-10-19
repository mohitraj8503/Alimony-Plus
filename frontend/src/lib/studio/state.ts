import { DEFAULT_RULE_ID } from "./rules";
import type { StudioInputs } from "./engine";
import type { AssetsInput } from "./distribution";

export type StudioState = {
  ruleId: string;
  inputs: StudioInputs;
  assets: AssetsInput;
  horizonMonths: number;
};

// Sample figures so the studio opens with something to explore.
export const defaultState: StudioState = {
  ruleId: DEFAULT_RULE_ID,
  inputs: {
    applicantIncome: 15000,
    respondentIncome: 90000,
    applicantEssentialExpenses: 25000,
    respondentEssentialExpenses: 30000,
    childCosts: 12000,
    housingCost: 10000,
    medicalCosts: 3000,
    educationCosts: 6000,
    applicantLiabilities: 2000,
    respondentLiabilities: 8000,
    applicantAssetsIncome: 0,
    respondentAssetsIncome: 5000,
    existingSupport: 0,
    litigationCosts: 3000,
  },
  assets: {
    propertyValue: 4000000,
    savings: 600000,
    investments: 400000,
    vehicles: 300000,
    otherAssets: 100000,
    loans: 1500000,
    otherDebts: 200000,
    applicantSharePct: 50,
  },
  horizonMonths: 24,
};
