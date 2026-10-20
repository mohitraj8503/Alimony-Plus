import type { ScenarioInputs } from "@/lib/studio/types";

export function inr(value: number): string {
  if (!Number.isFinite(value)) return "not available";
  const sign = value < 0 ? "-" : "";
  return `${sign}Rs. ${Math.abs(Math.round(value)).toLocaleString("en-IN")}`;
}

export type InputKey =
  | "income.payer"
  | "income.recipient"
  | "essentialExpenses.payer"
  | "essentialExpenses.recipient"
  | "payerDebtPayments"
  | "childCosts"
  | "totalAssets"
  | "totalDebts"
  | "recipientAssetSharePercent"
  | "durationMonths";

export function getValue(inputs: ScenarioInputs, key: InputKey): number {
  const [a, b] = key.split(".");
  const root = inputs as unknown as Record<string, unknown>;
  if (b) return (root[a] as Record<string, number>)[b];
  return root[a] as number;
}

export function setValue(inputs: ScenarioInputs, key: InputKey, value: number): ScenarioInputs {
  const next = structuredClone(inputs);
  const [a, b] = key.split(".");
  const root = next as unknown as Record<string, unknown>;
  if (b) (root[a] as Record<string, number>)[b] = value;
  else root[a] = value;
  return next;
}