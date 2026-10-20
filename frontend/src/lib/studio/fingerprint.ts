import { calculateScenario } from "./engine";
import type { Scenario } from "./types";

export function buildReportPayload(scenarios: Scenario[]): string {
  const rows = scenarios.map((s) => {
    const i = s.inputs;
    const r = calculateScenario(s);
    return [
      s.name,
      s.ruleSetId,
      i.income.payer,
      i.income.recipient,
      i.essentialExpenses.payer,
      i.essentialExpenses.recipient,
      i.payerDebtPayments,
      i.childCosts,
      i.totalAssets,
      i.totalDebts,
      i.recipientAssetSharePercent,
      i.durationMonths,
      r.maintenance.amount,
      r.settlement.netEstate,
      r.settlement.recipientShare,
      r.settlement.payerShare,
      r.settlement.maintenanceTotal,
      r.settlement.recipientTotal,
    ];
  });
  return JSON.stringify({ v: 1, scenarios: rows });
}


export async function sha256Hex(text: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Web Crypto is not available");
  const digest = await subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function formatFingerprint(hex: string): string {
  return hex.match(/.{1,8}/g)?.join(" ") ?? hex;
}