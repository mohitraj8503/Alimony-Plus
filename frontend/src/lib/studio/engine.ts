import { getRuleSet } from "./rules";
import type {
  MaintenanceResult,
  RuleSet,
  Scenario,
  ScenarioInputs,
  ScenarioResult,
  SettlementResult,
} from "./types";

const rupees = (n: number) => Math.round(n);

export function calculateMaintenance(inputs: ScenarioInputs, rule: RuleSet): MaintenanceResult {
  const recipientNeed = inputs.essentialExpenses.recipient + inputs.childCosts;
  const needGap = Math.max(0, recipientNeed - inputs.income.recipient);
  const incomeGap = Math.max(0, inputs.income.payer - inputs.income.recipient);
  const payerCapacity = Math.max(
    0,
    inputs.income.payer - inputs.essentialExpenses.payer - inputs.payerDebtPayments,
  );
  const base = rule.method === "need-gap" ? needGap : incomeGap;
  const rawAmount = (base * rule.sharePercent) / 100;
  const cap = (payerCapacity * rule.capPercentOfCapacity) / 100;
  const amount = Math.min(rawAmount, cap);
  return {
    needGap: rupees(needGap),
    incomeGap: rupees(incomeGap),
    payerCapacity: rupees(payerCapacity),
    rawAmount: rupees(rawAmount),
    amount: rupees(amount),
    capped: rawAmount > cap,
  };
}

export function calculateSettlement(
  inputs: ScenarioInputs,
  monthlyMaintenance: number,
): SettlementResult {
  const netEstate = inputs.totalAssets - inputs.totalDebts;
  const debtsExceedAssets = netEstate < 0;
  const distributable = Math.max(0, netEstate);
  const recipientShare = rupees((distributable * inputs.recipientAssetSharePercent) / 100);
  const payerShare = rupees(distributable) - recipientShare;
  const maintenanceTotal = monthlyMaintenance * inputs.durationMonths;
  return {
    netEstate: rupees(netEstate),
    debtsExceedAssets,
    recipientShare,
    payerShare,
    maintenanceTotal,
    recipientTotal: recipientShare + maintenanceTotal,
  };
}

export function calculateScenario(scenario: Scenario): ScenarioResult {
  const maintenance = calculateMaintenance(scenario.inputs, getRuleSet(scenario.ruleSetId));
  return {
    maintenance,
    settlement: calculateSettlement(scenario.inputs, maintenance.amount),
  };
}