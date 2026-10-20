import { describe, expect, it } from "vitest";
import { buildReportPayload, formatFingerprint, sha256Hex } from "../src/lib/studio/fingerprint";
import { newScenario } from "../src/lib/studio/rules";

describe("report fingerprint", () => {
  it("matches the known SHA-256 of abc", async () => {
    expect(await sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("is the same for the same figures", async () => {
    const a = await sha256Hex(buildReportPayload([newScenario(1)]));
    const b = await sha256Hex(buildReportPayload([newScenario(1)]));
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });


  it("changes when one input changes", async () => {
    const changed = newScenario(1);
    changed.inputs.income.payer += 1;
    const a = await sha256Hex(buildReportPayload([newScenario(1)]));
    const b = await sha256Hex(buildReportPayload([changed]));
    expect(a).not.toBe(b);
  });

  it("groups the code in blocks of eight", () => {
    expect(formatFingerprint("abcdef0123456789")).toBe("abcdef01 23456789");
  });
});