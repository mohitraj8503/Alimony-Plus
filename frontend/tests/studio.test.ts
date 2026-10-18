import { describe, expect, it } from "vitest";
import { calculateMaintenance, calculateScenario } from "../src/lib/studio/engine";
import { DEFAULT_INPUTS, RULE_SETS, getRuleSet, newScenario } from "../src/lib/studio/rules";
import { validateInputs } from "../src/lib/studio/schema";

const needRule = RULE_SETS[0];
const state75 = RULE_SETS[1];
const incomeRule = RULE_SETS[2];

describe("maintenance engine", () => {
  it("covers the full need gap when capacity allows", () => {
    const r = calculateMaintenance(DEFAULT_INPUTS, needRule);
    expect(r.needGap).toBe(17000);
    expect(r.payerCapacity).toBe(42000);
    expect(r.amount).toBe(17000);
    expect(r.capped).toBe(false);
  });

  it("applies the percentage of a rule", () => {
    expect(calculateMaintenance(DEFAULT_INPUTS, state75).amount).toBe(12750);
  });

  it("uses the income gap for an income-gap rule", () => {
    const r = calculateMaintenance(DEFAULT_INPUTS, incomeRule);
    expect(r.incomeGap).toBe(65000);
    expect(r.amount).toBe(16250);
  });

  it("never asks for more than the payer can afford", () => {
    const inputs = structuredClone(DEFAULT_INPUTS);
    inputs.income = { payer: 50000, recipient: 10000 };
    inputs.essentialExpenses.payer = 45000;
    inputs.payerDebtPayments = 3000;
    const r = calculateMaintenance(inputs, needRule);
    expect(r.payerCapacity).toBe(2000);
    expect(r.amount).toBe(2000);
    expect(r.capped).toBe(true);
  });

  it("returns zero when the recipient needs nothing", () => {
    const inputs = structuredClone(DEFAULT_INPUTS);
    inputs.income.recipient = 200000;
    expect(calculateMaintenance(inputs, needRule).amount).toBe(0);
  });

  it("uses the debt payments of the paying party", () => {
    const inputs = structuredClone(DEFAULT_INPUTS);
    inputs.payerDebtPayments = 40000;
    expect(calculateMaintenance(inputs, needRule).payerCapacity).toBe(10000);
  });
});

describe("settlement", () => {
  it("splits net assets and adds maintenance over the duration", () => {
    const r = calculateScenario(newScenario(1)).settlement;
    expect(r.netEstate).toBe(2100000);
    expect(r.recipientShare).toBe(1050000);
    expect(r.payerShare).toBe(1050000);
    expect(r.maintenanceTotal).toBe(612000);
    expect(r.recipientTotal).toBe(1662000);
  });

  it("flags debts that exceed assets and shares nothing", () => {
    const s = newScenario(1);
    s.inputs.totalAssets = 100000;
    s.inputs.totalDebts = 300000;
    const r = calculateScenario(s).settlement;
    expect(r.debtsExceedAssets).toBe(true);
    expect(r.netEstate).toBe(-200000);
    expect(r.recipientShare).toBe(0);
    expect(r.payerShare).toBe(0);
  });

  it("falls back to the first rule set for an unknown id", () => {
    expect(getRuleSet("does-not-exist").id).toBe(RULE_SETS[0].id);
  });
});

describe("zod validation", () => {
  it("accepts the default inputs", () => {
    expect(validateInputs(DEFAULT_INPUTS).ok).toBe(true);
  });

  it("rejects negative money with a readable message", () => {
    const bad = structuredClone(DEFAULT_INPUTS);
    bad.income.payer = -5;
    const r = validateInputs(bad);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors["income.payer"]).toContain("0 or more");
  });

  it("does not treat an empty number as zero", () => {
    const bad = structuredClone(DEFAULT_INPUTS);
    bad.childCosts = Number.NaN;
    const r = validateInputs(bad);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.childCosts).toContain("as a number");
  });

  it("rejects a share above 100 and fractional months", () => {
    const bad = structuredClone(DEFAULT_INPUTS);
    bad.recipientAssetSharePercent = 101;
    bad.durationMonths = 12.5;
    const r = validateInputs(bad);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.recipientAssetSharePercent).toBeDefined();
      expect(r.errors.durationMonths).toContain("whole months");
    }
  });
});