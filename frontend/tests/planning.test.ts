
import { describe, expect, it } from "vitest";
import { calculateDemo } from "../src/lib/planning";

describe("calculateDemo", () => {
  it("includes applicant monthly debt payments in the remaining need", () => {
    const result = calculateDemo({
      applicantIncome: 8000,
      respondentIncome: 60000,
      applicantEssentialExpenses: 12000,
      respondentEssentialExpenses: 20000,
      childCosts: 2000,
      housingCost: 8000,
      medicalCosts: 1000,
      educationCosts: 3000,
      applicantLiabilities: 2000,
      respondentLiabilities: 5000,
      applicantAssetsIncome: 0,
      respondentAssetsIncome: 0,
      existingSupport: 0,
      litigationCosts: 1000,
    });

    expect(result.applicantNeed).toBe(21000);
  });
  expect(
  calculateDemo({
    applicantIncome: 8000,
    respondentIncome: 60000,
    applicantEssentialExpenses: 12000,
    respondentEssentialExpenses: 20000,
    childCosts: 2000,
    housingCost: 8000,
    medicalCosts: 1000,
    educationCosts: 3000,
    applicantLiabilities: 0,
    respondentLiabilities: 5000,
    applicantAssetsIncome: 0,
    respondentAssetsIncome: 0,
    existingSupport: 0,
    litigationCosts: 1000,
  }).applicantNeed
).toBe(19000);
});
