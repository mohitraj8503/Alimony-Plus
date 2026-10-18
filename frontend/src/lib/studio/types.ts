export interface PartyAmounts {
  payer: number;
  recipient: number;
}

export interface ScenarioInputs {
  income: PartyAmounts; // monthly, INR
  essentialExpenses: PartyAmounts; // monthly, INR
  payerDebtPayments: number; // monthly, INR
  childCosts: number; // monthly, INR
  totalAssets: number; // INR
  totalDebts: number; // INR
  recipientAssetSharePercent: number; // 0 to 100
  durationMonths: number; // whole months
}

export type RuleMethod = "need-gap" | "income-gap";

export interface RuleSet {
  id: string;
  label: string;
  scope: "central" | "state";
  method: RuleMethod;
  sharePercent: number;
  capPercentOfCapacity: number;
  note: string;
}

export interface Scenario {
  id: string;
  name: string;
  ruleSetId: string;
  inputs: ScenarioInputs;
}

export interface MaintenanceResult {
  needGap: number;
  incomeGap: number;
  payerCapacity: number;
  rawAmount: number;
  amount: number;
  capped: boolean;
}

export interface SettlementResult {
  netEstate: number;
  debtsExceedAssets: boolean;
  recipientShare: number;
  payerShare: number;
  maintenanceTotal: number;
  recipientTotal: number;
}

export interface ScenarioResult {
  maintenance: MaintenanceResult;
  settlement: SettlementResult;
}