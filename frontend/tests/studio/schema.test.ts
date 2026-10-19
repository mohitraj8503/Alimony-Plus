import { describe, expect, it } from "vitest";
import { validateStudio } from "../../src/lib/studio/schema";
import { defaultState } from "../../src/lib/studio/state";

describe("studio validation (zod)", () => {
  it("accepts the sample state", () => {
    expect(validateStudio(defaultState).ok).toBe(true);
  });
  it("shows an inline error for a negative amount", () => {
    const v = validateStudio({
      ...defaultState,
      inputs: { ...defaultState.inputs, applicantIncome: -5 },
    });
    expect(v.ok).toBe(false);
    expect(v.errors["inputs.applicantIncome"]).toBe("Cannot be negative");
  });
  it("treats a blank (NaN) field as an error, not zero", () => {
    const v = validateStudio({
      ...defaultState,
      inputs: { ...defaultState.inputs, housingCost: NaN },
    });
    expect(v.ok).toBe(false);
    expect(v.errors["inputs.housingCost"]).toBe("Enter a number");
  });
  it("limits the applicant share to 0-100 whole percent", () => {
    const hi = validateStudio({
      ...defaultState,
      assets: { ...defaultState.assets, applicantSharePct: 101 },
    });
    expect(hi.errors["assets.applicantSharePct"]).toBe("Cannot be above 100%");
    const frac = validateStudio({
      ...defaultState,
      assets: { ...defaultState.assets, applicantSharePct: 50.5 },
    });
    expect(frac.ok).toBe(false);
  });
  it("rejects an unknown rule set and an out-of-range horizon", () => {
    const v = validateStudio({ ...defaultState, ruleId: "nope", horizonMonths: 0 });
    expect(v.errors["ruleId"]).toBe("Choose a rule set");
    expect(v.errors["horizonMonths"]).toBe("At least 1 month");
  });
});
