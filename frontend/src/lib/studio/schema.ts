import { z } from "zod";
import { financialFields } from "../planning";
import { assetFields, debtFields } from "./distribution";
import { getRuleSet } from "./rules";
import type { StudioState } from "./state";

export const MAX_MONTHLY = 10_000_000;
export const MAX_ASSET = 10_000_000_000;

const money = (max: number) =>
  z
    .number({ error: "Enter a number" })
    .min(0, "Cannot be negative")
    .max(max, `Too large (maximum ${max.toLocaleString("en-IN")})`);

const shape = (fields: readonly (readonly [string, string])[], max: number) =>
  Object.fromEntries(fields.map(([key]) => [key, money(max)]));

export const inputsSchema = z.object(shape(financialFields, MAX_MONTHLY));
export const assetsSchema = z.object({
  ...shape([...assetFields, ...debtFields], MAX_ASSET),
  applicantSharePct: z
    .number({ error: "Enter a number" })
    .int("Use a whole percent")
    .min(0, "Cannot be below 0%")
    .max(100, "Cannot be above 100%"),
});
export const studioSchema = z.object({
  ruleId: z.string().refine((id) => !!getRuleSet(id), "Choose a rule set"),
  inputs: inputsSchema,
  assets: assetsSchema,
  horizonMonths: z
    .number({ error: "Enter a number" })
    .int("Use whole months")
    .min(1, "At least 1 month")
    .max(120, "At most 120 months"),
});

export type StudioErrors = Record<string, string>;
export type StudioValidation =
  | { ok: true; errors: StudioErrors }
  | { ok: false; errors: StudioErrors };

/** Returns inline error messages keyed like "inputs.applicantIncome". */
export function validateStudio(state: StudioState): StudioValidation {
  const parsed = studioSchema.safeParse(state);
  if (parsed.success) return { ok: true, errors: {} };
  const errors: StudioErrors = {};
  for (const issue of parsed.error.issues) {
    const path = issue.path.join(".");
    if (!errors[path]) errors[path] = issue.message;
  }
  return { ok: false, errors };
}
