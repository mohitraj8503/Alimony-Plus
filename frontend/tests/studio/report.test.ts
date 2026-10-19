import { describe, expect, it } from "vitest";
import {
  buildReport,
  reportPdf,
  stableStringify,
  verifyReportText,
} from "../../src/lib/studio/report";
import { defaultState } from "../../src/lib/studio/state";

describe("settlement report", () => {
  it("hashes the same report the same way regardless of key order", () => {
    expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe(
      stableStringify({ a: { c: 3, d: 2 }, b: 1 }),
    );
  });
  it("verifies an untouched report and rejects an edited one", async () => {
    const signed = await buildReport(defaultState, "2026-10-19");
    expect((await verifyReportText(JSON.stringify(signed))).ok).toBe(true);
    const tampered = structuredClone(signed);
    tampered.report.maintenance.scenarios[1].monthly += 1000;
    expect((await verifyReportText(JSON.stringify(tampered))).ok).toBe(false);
  });
  it("produces a PDF carrying the watermark and fingerprint", async () => {
    const signed = await buildReport(defaultState, "2026-10-19");
    const bytes = reportPdf(signed);
    const text = new TextDecoder("latin1").decode(bytes);
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
    expect(text).toContain("ILLUSTRATIVE");
    expect(text).toContain(signed.fingerprint.slice(0, 24));
  });
});
