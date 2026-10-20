"use client";

import { useState } from "react";
import { calculateScenario } from "@/lib/studio/engine";
import { buildReportPayload, formatFingerprint, sha256Hex } from "@/lib/studio/fingerprint";
import { RULES_NOTICE, getRuleSet } from "@/lib/studio/rules";
import { validateInputs } from "@/lib/studio/schema";
import type { Scenario } from "@/lib/studio/types";
import { inr } from "./format";

interface Prepared {
  hash: string;
  at: string;
  payload: string;
}

export function Report({ scenarios }: { scenarios: Scenario[] }) {
  const valid = scenarios.filter((s) => validateInputs(s.inputs).ok);
  const skipped = scenarios.length - valid.length;
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [error, setError] = useState("");
  const current = valid.length > 0 ? buildReportPayload(valid) : "";
  const stale = prepared !== null && prepared.payload !== current;
  const ready = prepared !== null && !stale;

  async function prepare() {
    setError("");
    try {
      const hash = await sha256Hex(current);
      setPrepared({ hash, at: new Date().toLocaleString("en-IN"), payload: current });
    } catch {
      setError("This browser cannot create the fingerprint. Open the page over https or on localhost.");
    }
  }

  return (
    <div className="s-report-wrap">
      <section className="s-card s-noprint" aria-labelledby="report-h">
        <h2 id="report-h" className="s-h2">Report</h2>
        <p className="s-muted">
          Prepare a printable summary of all valid scenarios. It carries a fingerprint (SHA-256)
          worked out from its figures, so any later change to a number shows up as a different code.
        </p>
        {skipped > 0 ? (
          <p className="s-warn" role="status">
            {skipped} {skipped === 1 ? "scenario has" : "scenarios have"} invalid inputs and will
            be left out.
          </p>
        ) : null}
        {stale ? (
          <p className="s-warn" role="status">
            The inputs changed after this report was prepared. Prepare it again before printing.
          </p>
        ) : null}
        {error ? (
          <p className="s-warn" role="alert">{error}</p>
        ) : null}
        <div className="s-actions">
          <button type="button" className="s-btn" onClick={prepare} disabled={valid.length === 0}>
            Prepare report
          </button>
          <button type="button" className="s-btn" onClick={() => window.print()} disabled={!ready}>
            Print / Save as PDF
          </button>
        </div>
      </section>

      {ready && prepared ? (
        <article className="s-report" aria-label="Settlement report">
          <div className="s-watermark" aria-hidden="true">
            {prepared.hash.slice(0, 12)} · SAMPLE RULES · NOT LEGAL ADVICE
          </div>
          <h2 className="s-h2">Settlement summary</h2>
          <p className="s-muted">Prepared on {prepared.at}. All amounts are in rupees.</p>
          {valid.map((sc) => {
            const { maintenance: m, settlement: s } = calculateScenario(sc);
            const i = sc.inputs;
            const rule = getRuleSet(sc.ruleSetId);
            const rows: [string, string][] = [
              ["Rule set", rule.label],
              ["Paying party monthly income", inr(i.income.payer)],
              ["Receiving party monthly income", inr(i.income.recipient)],
              ["Paying party essential expenses", inr(i.essentialExpenses.payer)],
              ["Receiving party essential expenses", inr(i.essentialExpenses.recipient)],
              ["Paying party monthly debt payments", inr(i.payerDebtPayments)],
              ["Monthly child costs", inr(i.childCosts)],
              ["Total assets", inr(i.totalAssets)],
              ["Total debts", inr(i.totalDebts)],
              ["Receiving party share of net assets", `${i.recipientAssetSharePercent}%`],
              ["Duration of maintenance", `${i.durationMonths} months`],
              ["Monthly maintenance", inr(m.amount)],
              ["Net assets", inr(s.netEstate)],
              ["Receiving party asset share", inr(s.recipientShare)],
              ["Paying party asset share", inr(s.payerShare)],
              ["Maintenance over the duration", inr(s.maintenanceTotal)],
              ["Total to receiving party", inr(s.recipientTotal)],
            ];
            return (
              <section key={sc.id} className="s-report-block">
                <h3>{sc.name}</h3>
                <table className="s-report-table">
                  <tbody>
                    {rows.map(([label, value]) => (
                      <tr key={label}>
                        <th scope="row">{label}</th>
                        <td>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {s.debtsExceedAssets ? (
                  <p>Debts are higher than assets, so no assets are shared.</p>
                ) : null}
              </section>
            );
          })}
          <p>{RULES_NOTICE}</p>
          <p>
            This is a planning aid, not legal advice and not a prediction of a court order.
          </p>
          <h3>Fingerprint (SHA-256)</h3>
          <p className="s-fp">{formatFingerprint(prepared.hash)}</p>
          <p className="s-muted">
            The code is worked out from the figures in this report. If any figure is changed, the
            code no longer matches. It is a content check, not a legal digital signature.
          </p>
        </article>
      ) : null}
    </div>
  );
}