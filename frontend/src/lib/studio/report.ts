import { financialFields } from "../planning";
import { calculateMaintenance, projectTotals } from "./engine";
import { distributeAssets } from "./distribution";
import { getRuleSet } from "./rules";
import { buildPdf, wrap, type PdfLine } from "./pdf";
import type { StudioState } from "./state";

export async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// JSON with sorted keys at every level so the same report always hashes the same.
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

export type StudioReport = {
  schema: "alimony-plus-settlement-report/1";
  generatedOn: string;
  state: StudioState;
  maintenance: ReturnType<typeof calculateMaintenance>;
  projection: ReturnType<typeof projectTotals>;
  distribution: ReturnType<typeof distributeAssets>;
};
export type SignedReport = {
  reportId: string;
  fingerprint: string;
  report: StudioReport;
};

/** Call only with a state that passed validation. */
export async function buildReport(
  state: StudioState,
  generatedOn: string,
): Promise<SignedReport> {
  const rule = getRuleSet(state.ruleId);
  if (!rule) throw new Error("Unknown rule set.");
  const maintenance = calculateMaintenance(state.inputs, rule);
  const report: StudioReport = {
    schema: "alimony-plus-settlement-report/1",
    generatedOn,
    state,
    maintenance,
    projection: projectTotals(maintenance, state.horizonMonths),
    distribution: distributeAssets(state.assets),
  };
  const fingerprint = await sha256Hex(stableStringify(report));
  return {
    reportId: `ASR-${fingerprint.slice(0, 12).toUpperCase()}`,
    fingerprint,
    report,
  };
}

export async function verifyReportText(text: string) {
  try {
    const parsed = JSON.parse(text) as Partial<SignedReport>;
    if (!parsed.report || !parsed.fingerprint)
      return { ok: false, message: "This is not an Alimony+ settlement report file." };
    const again = await sha256Hex(stableStringify(parsed.report));
    return again === parsed.fingerprint
      ? {
          ok: true,
          message: `Verified: report ${parsed.reportId} is unchanged since it was generated.`,
        }
      : {
          ok: false,
          message:
            "Not verified: the report contents do not match its fingerprint. It may have been edited.",
        };
  } catch {
    return { ok: false, message: "Could not read this file as a report." };
  }
}

const rs = (n: number) => `Rs. ${Math.round(n).toLocaleString("en-IN")}`;
const col = (v: string | number, w: number) => String(v).padEnd(w).slice(0, w);

export function reportPdf(signed: SignedReport) {
  const { report: r } = signed;
  const m = r.maintenance;
  const d = r.distribution;
  const lines: PdfLine[] = [];
  const text = (t: string, bold = false) =>
    wrap(t).forEach((x) => lines.push({ text: x, bold }));
  lines.push({ text: "SETTLEMENT STUDIO REPORT", bold: true, size: 15 });
  text(`Report ${signed.reportId}   Generated on ${r.generatedOn}`, true);
  if (m.ruleStatus === "demo")
    text(
      "ILLUSTRATIVE: this report uses demonstration rule parameters that are not approved statutory guidelines.",
      true,
    );
  lines.push({ text: "" });

  text("1. Rule set", true);
  text(`${m.ruleLabel}  version ${m.ruleVersion}  status ${m.ruleStatus}`);
  lines.push({ text: "" });

  text("2. Monthly inputs (INR)", true);
  for (const [key, label] of financialFields)
    lines.push({ text: `${col(label, 46)}${rs(r.state.inputs[key])}` });
  lines.push({ text: "" });

  text("3. Maintenance scenarios", true);
  text(`Applicant need: ${rs(m.need)}   Other party capacity: ${rs(m.capacity)}   Capped capacity: ${rs(m.cappedCapacity)}`);
  lines.push({
    text: `${col("Scenario", 14)}${col("Factor", 8)}${col("Monthly", 16)}${col("Surplus after", 16)}Over ${r.state.horizonMonths} months`,
    bold: true,
  });
  m.scenarios.forEach((s, i) =>
    lines.push({
      text: `${col(s.label, 14)}${col(s.factor + "x", 8)}${col(rs(s.monthly), 16)}${col(rs(s.surplusAfter), 16)}${rs(r.projection[i].total)}`,
    }),
  );
  lines.push({ text: "" });

  text(`4. Asset and debt distribution (applicant ${r.state.assets.applicantSharePct}%)`, true);
  lines.push({
    text: `${col("Item", 24)}${col("Total", 16)}${col("Applicant", 16)}Respondent`,
    bold: true,
  });
  d.rows.forEach((row) =>
    lines.push({
      text: `${col(row.label + (row.kind === "debt" ? " (debt)" : ""), 24)}${col(rs(row.total), 16)}${col(rs(row.applicant), 16)}${rs(row.respondent)}`,
    }),
  );
  text(`Net position   Applicant ${rs(d.applicantNet)}   Respondent ${rs(d.respondentNet)}   Combined ${rs(d.netAssets)}`, true);
  lines.push({ text: "" });

  text("5. Assumptions", true);
  m.assumptions.forEach((a) => text(`- ${a}`));
  text(m.disclaimer);
  lines.push({ text: "" });

  text("Report fingerprint (SHA-256)", true);
  wrap(signed.fingerprint, 80).forEach((x) => lines.push({ text: x }));
  text(
    "Keep the matching .json verification file. Use 'Verify report' in the studio to detect later changes. This is an integrity check, not a court certification or legal signature.",
  );
  return buildPdf(lines, {
    footer: `${signed.reportId}  SHA-256 ${signed.fingerprint.slice(0, 24)}...`,
    watermark: m.ruleStatus === "demo" ? "ILLUSTRATIVE" : "ALIMONY+ REPORT",
  });
}
