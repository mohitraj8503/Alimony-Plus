
import { describe, expect, it } from "vitest";
import {
  calculateSettlement,
  defaultSettlementRules,
  type SettlementInput,
} from "../src/lib/settlement";

const input: SettlementInput = {
  applicantIncome: 10000,
  respondentIncome: 60000,
  applicantExpenses: 15000,
  respondentExpenses: 20000,
  childCosts: 3000,
  housingCosts: 5000,
  medicalCosts: 1000,
  educationCosts: 2000,
  existingSupport: 1000,
  applicantAssets: 200000,
  respondentAssets: 800000,
  applicantDebts: 10000,
  respondentDebts: 5000,
};

describe("settlement calculation engine", () => {
  it("calculates need and capacity from supplied figures", () => {
    const result = calculateSettlement(input);

    expect(result.monthlyNeed).toBe(15000);
    expect(result.monthlyCapacity).toBe(39000);
  });

  it("calculates conservative, baseline and stress scenarios", () => {
    const result = calculateSettlement(input);

    expect(result.scenarios).toEqual({
      conservative: 11250,
      baseline: 15000,
      stress: 18750,
    });
  });

  it("caps scenario amounts at available capacity", () => {
    const result = calculateSettlement({
      ...input,
      respondentIncome: 10000,
      respondentExpenses: 9000,
      respondentDebts: 1000,
    });

    expect(result.monthlyCapacity).toBe(0);
    expect(result.scenarios.baseline).toBe(0);
  });

  it("supports configurable scenario multipliers", () => {
    const result = calculateSettlement(input, {
      ...defaultSettlementRules,
      conservativeMultiplier: 0.5,
      baselineMultiplier: 0.8,
      stressMultiplier: 1.5,
    });

    expect(result.scenarios).toEqual({
      conservative: 7500,
      baseline: 12000,
      stress: 22500,
    });
  });

  it("calculates assets, debts and illustrative asset shares", () => {
    const result = calculateSettlement(input);

    expect(result.assets).toEqual({
      totalAssets: 1000000,
      totalDebts: 15000,
      netAssets: 985000,
      applicantShare: 492500,
      respondentShare: 492500,
    });
  });

  it("rejects negative financial amounts", () => {
    expect(() =>
      calculateSettlement({
        ...input,
        applicantIncome: -1,
      }),
    ).toThrow(/Invalid financial inputs/);
  });

  it("rejects non-numeric and missing inputs", () => {
    expect(() =>
      calculateSettlement({
        ...input,
        applicantIncome: "10000",
      }),
    ).toThrow(/Invalid financial inputs/);

    const { applicantIncome: _income, ...missingIncome } = input;

    expect(() => calculateSettlement(missingIncome)).toThrow(
      /Invalid financial inputs/,
    );
  });

  it("rejects invalid rule configuration", () => {
    expect(() =>
      calculateSettlement(input, {
        ...defaultSettlementRules,
        stressMultiplier: 10,
      }),
    ).toThrow(/Invalid settlement rules/);
  });

  it("labels results as illustrative, not legal predictions", () => {
    const result = calculateSettlement(input);

    expect(result.disclaimer).toMatch(
      /Illustrative financial planning only/,
    );
    expect(result.ruleVersion).toBe("1.0.0");
  });
});
