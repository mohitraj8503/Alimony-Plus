
import { z } from "zod";

const amountSchema = z.number().finite().min(0);

export const settlementInputSchema = z.object({
  applicantIncome: amountSchema,
  respondentIncome: amountSchema,
  applicantExpenses: amountSchema,
  respondentExpenses: amountSchema,
  childCosts: amountSchema,
  housingCosts: amountSchema,
  medicalCosts: amountSchema,
  educationCosts: amountSchema,
  existingSupport: amountSchema,
  applicantAssets: amountSchema,
  respondentAssets: amountSchema,
  applicantDebts: amountSchema,
  respondentDebts: amountSchema,
});

export const settlementRulesSchema = z.object({
  ruleSetName: z.string().trim().min(1).max(100),
  ruleVersion: z.string().trim().min(1).max(30),
  conservativeMultiplier: z.number().finite().min(0).max(2),
  baselineMultiplier: z.number().finite().min(0).max(2),
  stressMultiplier: z.number().finite().min(0).max(2),
  applicantAssetSharePercent: z.number().finite().min(0).max(100),
});

export type SettlementInput = z.infer<typeof settlementInputSchema>;
export type SettlementRules = z.infer<typeof settlementRulesSchema>;

export const defaultSettlementRules: SettlementRules = {
  ruleSetName: "Illustrative Planning Rules",
  ruleVersion: "1.0.0",
  conservativeMultiplier: 0.75,
  baselineMultiplier: 1,
  stressMultiplier: 1.25,
  applicantAssetSharePercent: 50,
};

export type SettlementResult = {
  ruleSetName: string;
  ruleVersion: string;
  monthlyNeed: number;
  monthlyCapacity: number;
  scenarios: {
    conservative: number;
    baseline: number;
    stress: number;
  };
  assets: {
    totalAssets: number;
    totalDebts: number;
    netAssets: number;
    applicantShare: number;
    respondentShare: number;
  };
  disclaimer: string;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateSettlement(
  rawInput: unknown,
  rawRules: unknown = defaultSettlementRules,
): SettlementResult {
  const inputResult = settlementInputSchema.safeParse(rawInput);

  if (!inputResult.success) {
    throw new Error(
      `Invalid financial inputs: ${inputResult.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`,
    );
  }

  const rulesResult = settlementRulesSchema.safeParse(rawRules);

  if (!rulesResult.success) {
    throw new Error(
      `Invalid settlement rules: ${rulesResult.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`,
    );
  }

  const input = inputResult.data;
  const rules = rulesResult.data;

  const monthlyNeed = Math.max(
    0,
    input.applicantExpenses +
      input.childCosts +
      input.housingCosts +
      input.medicalCosts +
      input.educationCosts -
      input.applicantIncome -
      input.existingSupport,
  );

  const monthlyCapacity = Math.max(
  0,
  input.respondentIncome -
    input.respondentExpenses -
    input.existingSupport,
);

  const scenarioAmount = (multiplier: number) =>
    roundMoney(Math.min(monthlyNeed * multiplier, monthlyCapacity));

  const totalAssets = input.applicantAssets + input.respondentAssets;
  const totalDebts = input.applicantDebts + input.respondentDebts;
  const netAssets = Math.max(0, totalAssets - totalDebts);

  const applicantShare = roundMoney(
    (netAssets * rules.applicantAssetSharePercent) / 100,
  );

  const respondentShare = roundMoney(netAssets - applicantShare);

  return {
    ruleSetName: rules.ruleSetName,
    ruleVersion: rules.ruleVersion,
    monthlyNeed: roundMoney(monthlyNeed),
    monthlyCapacity: roundMoney(monthlyCapacity),
    scenarios: {
      conservative: scenarioAmount(rules.conservativeMultiplier),
      baseline: scenarioAmount(rules.baselineMultiplier),
      stress: scenarioAmount(rules.stressMultiplier),
    },
    assets: {
      totalAssets: roundMoney(totalAssets),
      totalDebts: roundMoney(totalDebts),
      netAssets: roundMoney(netAssets),
      applicantShare,
      respondentShare,
    },
    disclaimer:
      "Illustrative financial planning only. These configurable assumptions are not verified statutory rules, legal advice, or a prediction of a court decision.",
  };
}
