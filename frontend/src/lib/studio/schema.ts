import { z } from "zod";
import type { ScenarioInputs } from "./types";

export const FIELD_LABELS: Record<string, string> = {
  "income.payer": "the paying party's monthly income",
  "income.recipient": "the receiving party's monthly income",
  "essentialExpenses.payer": "the paying party's essential expenses",
  "essentialExpenses.recipient": "the receiving party's essential expenses",
  payerDebtPayments: "the paying party's monthly debt payments",
  childCosts: "the monthly child costs",
  totalAssets: "the total assets",
  totalDebts: "the total debts",
  recipientAssetSharePercent: "the receiving party's asset share in percent",
  durationMonths: "the duration in months",
};

const MAX = 1_000_000_000;

const money = (key: string) =>
  z
    .number()
    .min(0, `Enter ${FIELD_LABELS[key]} as 0 or more.`)
    .max(MAX, `The value for ${FIELD_LABELS[key]} is too large.`);

export const inputsSchema = z.object({
  income: z.object({ payer: money("income.payer"), recipient: money("income.recipient") }),
  essentialExpenses: z.object({
    payer: money("essentialExpenses.payer"),
    recipient: money("essentialExpenses.recipient"),
  }),
  payerDebtPayments: money("payerDebtPayments"),
  childCosts: money("childCosts"),
  totalAssets: money("totalAssets"),
  totalDebts: money("totalDebts"),
  recipientAssetSharePercent: z
    .number()
    .min(0, "Enter a share between 0 and 100 percent.")
    .max(100, "Enter a share between 0 and 100 percent."),
  durationMonths: z
    .number()
    .int("Enter the duration as whole months.")
    .min(1, "Enter a duration of at least 1 month.")
    .max(600, "Enter a duration of 600 months or less."),
});

export type ValidationResult =
  | { ok: true; data: ScenarioInputs }
  | { ok: false; errors: Record<string, string> };

function valueAt(input: unknown, path: ReadonlyArray<PropertyKey>): unknown {
  let current: unknown = input;
  for (const part of path) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as Record<PropertyKey, unknown>)[part];
  }
  return current;
}

export function validateInputs(input: unknown): ValidationResult {
  const parsed = inputsSchema.safeParse(input);
  if (parsed.success) return { ok: true, data: parsed.data as ScenarioInputs };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path.map(String).join(".");
    if (errors[key]) continue;
    const value = valueAt(input, issue.path);
    const notANumber = typeof value !== "number" || Number.isNaN(value);
    errors[key] = notANumber
      ? `Enter ${FIELD_LABELS[key] ?? "a value"} as a number.`
      : issue.message;
  }
  return { ok: false, errors };
}