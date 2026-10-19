"use client";
import Link from "next/link";
import { useMemo, useReducer, useRef, useState } from "react";
import { Download, RotateCcw, ShieldCheck } from "lucide-react";
import { PageHeading } from "../ui";
import { SliderField } from "./slider-field";
import { BarChart, SplitBars } from "./charts";
import { financialFields } from "@/lib/planning";
import {
  calculateMaintenance,
  projectTotals,
  type FieldKey,
} from "@/lib/studio/engine";
import {
  assetFields,
  debtFields,
  distributeAssets,
  type AssetsInput,
} from "@/lib/studio/distribution";
import { RULE_SETS, getRuleSet } from "@/lib/studio/rules";
import { validateStudio } from "@/lib/studio/schema";
import { defaultState, type StudioState } from "@/lib/studio/state";
import {
  buildReport,
  reportPdf,
  verifyReportText,
} from "@/lib/studio/report";
import { downloadBytes } from "@/lib/studio/pdf";

type Action =
  | { type: "input"; key: FieldKey; value: number }
  | { type: "asset"; key: keyof AssetsInput; value: number }
  | { type: "horizon"; value: number }
  | { type: "rule"; id: string }
  | { type: "reset" };

function reducer(s: StudioState, a: Action): StudioState {
  switch (a.type) {
    case "input":
      return { ...s, inputs: { ...s.inputs, [a.key]: a.value } };
    case "asset":
      return { ...s, assets: { ...s.assets, [a.key]: a.value } };
    case "horizon":
      return { ...s, horizonMonths: a.value };
    case "rule":
      return { ...s, ruleId: a.id };
    case "reset":
      return defaultState;
  }
}

const labelOf = Object.fromEntries(financialFields) as Record<FieldKey, string>;
const groups: { title: string; keys: FieldKey[] }[] = [
  {
    title: "Income",
    keys: [
      "applicantIncome",
      "respondentIncome",
      "applicantAssetsIncome",
      "respondentAssetsIncome",
      "existingSupport",
    ],
  },
  {
    title: "Essential costs",
    keys: [
      "applicantEssentialExpenses",
      "respondentEssentialExpenses",
      "childCosts",
      "housingCost",
      "medicalCosts",
      "educationCosts",
      "litigationCosts",
    ],
  },
  {
    title: "Monthly debt payments",
    keys: ["applicantLiabilities", "respondentLiabilities"],
  },
];
const money = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function SettlementStudio() {
  const [state, dispatch] = useReducer(reducer, defaultState);
  const [verifyMessage, setVerifyMessage] =
    useState<{ ok: boolean; message: string }>();
  const verifyInput = useRef<HTMLInputElement>(null);

  const validation = useMemo(() => validateStudio(state), [state]);
  const rule = getRuleSet(state.ruleId);
  const computed = useMemo(() => {
    if (!validation.ok || !rule) return null;
    const maintenance = calculateMaintenance(state.inputs, rule);
    return {
      maintenance,
      projection: projectTotals(maintenance, state.horizonMonths),
      distribution: distributeAssets(state.assets),
    };
  }, [validation.ok, rule, state]);
  const errorCount = Object.keys(validation.errors).length;

  async function download(kind: "pdf" | "json") {
    const signed = await buildReport(state, new Date().toISOString().slice(0, 10));
    if (kind === "pdf")
      downloadBytes(
        `settlement-report-${signed.reportId}.pdf`,
        reportPdf(signed) as BlobPart,
        "application/pdf",
      );
    else
      downloadBytes(
        `settlement-report-${signed.reportId}.json`,
        JSON.stringify(signed, null, 2),
        "application/json",
      );
  }

  return (
    <main className="main-content" style={{ paddingBottom: 48 }}>
      <p>
        <Link href="/dashboard">← Back to workspace</Link>
      </p>
      <PageHeading
        eyebrow="Planning tools"
        title="Settlement Studio"
        description="Move the sliders to compare maintenance scenarios and asset distribution. Results update instantly. Illustrative planning only."
      >
        <button
          className="button secondary"
          onClick={() => dispatch({ type: "reset" })}
        >
          <RotateCcw size={16} /> Reset
        </button>
        <button
          className="button secondary"
          disabled={!validation.ok}
          onClick={() => download("json")}
        >
          <ShieldCheck size={16} /> Verification file
        </button>
        <button
          className="button primary"
          disabled={!validation.ok}
          onClick={() => download("pdf")}
        >
          <Download size={16} /> Report PDF
        </button>
      </PageHeading>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          ref={verifyInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) setVerifyMessage(await verifyReportText(await f.text()));
          }}
        />
        <button
          className="button secondary compact"
          onClick={() => verifyInput.current?.click()}
        >
          <ShieldCheck size={14} /> Verify report
        </button>
        {verifyMessage && (
          <small role="status" className={verifyMessage.ok ? "" : "text-[var(--amber)]"}>
            {verifyMessage.message}
          </small>
        )}
      </div>

      {errorCount > 0 && (
        <p className="callout" role="alert">
          {errorCount} field{errorCount === 1 ? "" : "s"} need attention. Fix the
          highlighted fields to see results and download the report.
        </p>
      )}

      <section className="panel mb-6">
        <div className="panel-heading">
          <div>
            <h2>Rule set</h2>
            <p>The calculation engine reads its parameters from the selected rule set.</p>
          </div>
        </div>
        <div className="grid gap-4 p-6 pt-0 md:grid-cols-2">
          <div className="field">
            <label htmlFor="rule">Rule set</label>
            <select
              id="rule"
              value={state.ruleId}
              onChange={(e) => dispatch({ type: "rule", id: e.target.value })}
            >
              {RULE_SETS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label} · v{r.version}
                </option>
              ))}
            </select>
            {validation.errors.ruleId && (
              <small role="alert">{validation.errors.ruleId}</small>
            )}
          </div>
          {rule && (
            <p className="callout">
              {rule.status === "demo"
                ? "Illustrative parameters, not approved statutory guidelines. "
                : ""}
              {rule.source}
            </p>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Monthly inputs</h2>
              <p>Amounts in INR per month. A blank field is an error, not zero.</p>
            </div>
          </div>
          <div className="grid gap-6 p-6 pt-0">
            {groups.map((g) => (
              <fieldset key={g.title} className="m-0 grid gap-4 border-0 p-0">
                <legend className="overline mb-2">{g.title}</legend>
                {g.keys.map((key) => (
                  <SliderField
                    key={key}
                    id={`in-${key}`}
                    label={labelOf[key]}
                    value={state.inputs[key]}
                    max={200000}
                    step={500}
                    suffix="INR per month"
                    error={validation.errors[`inputs.${key}`]}
                    onChange={(value) => dispatch({ type: "input", key, value })}
                  />
                ))}
              </fieldset>
            ))}
          </div>
        </section>

        <div className="grid content-start gap-6">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Maintenance scenarios</h2>
                <p>Compared with the applicant&rsquo;s need and the other party&rsquo;s capacity.</p>
              </div>
            </div>
            <div className="grid gap-5 p-6 pt-0">
              {computed ? (
                <>
                  <BarChart
                    title="Monthly maintenance scenarios"
                    data={[
                      { label: "Applicant need", value: computed.maintenance.need, tone: "muted" },
                      ...computed.maintenance.scenarios.map((s) => ({
                        label: s.label,
                        value: s.monthly,
                      })),
                      { label: "Other party capacity", value: computed.maintenance.capacity, tone: "amber" as const },
                    ]}
                  />
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Scenario</th>
                          <th>Factor</th>
                          <th>Monthly</th>
                          <th>Surplus after</th>
                          <th>Over {state.horizonMonths} mo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {computed.maintenance.scenarios.map((s, i) => (
                          <tr key={s.key}>
                            <td className="strong">{s.label}</td>
                            <td className="numeric">{s.factor}x</td>
                            <td className="numeric">{money(s.monthly)}</td>
                            <td className="numeric">{money(s.surplusAfter)}</td>
                            <td className="numeric">{money(computed.projection[i].total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ul className="m-0 grid gap-1 pl-5 text-[12px]">
                    {computed.maintenance.assumptions.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="callout">Fix the highlighted fields to see scenarios.</p>
              )}
              <SliderField
                id="horizon"
                label="Projection horizon (months)"
                value={state.horizonMonths}
                max={120}
                step={1}
                suffix="months"
                error={validation.errors.horizonMonths}
                onChange={(value) => dispatch({ type: "horizon", value })}
              />
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Assets and debts</h2>
                <p>One share applies to every asset and debt.</p>
              </div>
            </div>
            <div className="grid gap-4 p-6 pt-0">
              <SliderField
                id="share"
                label={`Applicant share: ${Number.isFinite(state.assets.applicantSharePct) ? state.assets.applicantSharePct : "?"}%`}
                value={state.assets.applicantSharePct}
                max={100}
                step={1}
                suffix="percent"
                error={validation.errors["assets.applicantSharePct"]}
                onChange={(value) =>
                  dispatch({ type: "asset", key: "applicantSharePct", value })
                }
              />
              {[...assetFields, ...debtFields].map(([key, label]) => (
                <SliderField
                  key={key}
                  id={`as-${key}`}
                  label={label}
                  value={state.assets[key]}
                  max={10000000}
                  step={50000}
                  suffix="INR"
                  error={validation.errors[`assets.${key}`]}
                  onChange={(value) => dispatch({ type: "asset", key, value })}
                />
              ))}
              {computed && (
                <>
                  <SplitBars
                    title="Assets by owner"
                    leftLabel="Applicant"
                    rightLabel="Respondent"
                    rows={computed.distribution.rows
                      .filter((r) => r.kind === "asset")
                      .map((r) => ({ label: r.label, left: r.applicant, right: r.respondent }))}
                  />
                  <SplitBars
                    title="Debts by owner"
                    leftLabel="Applicant"
                    rightLabel="Respondent"
                    rows={computed.distribution.rows
                      .filter((r) => r.kind === "debt")
                      .map((r) => ({ label: r.label, left: r.applicant, right: r.respondent }))}
                  />
                  <p className="callout">
                    Net position: applicant {money(computed.distribution.applicantNet)}, respondent{" "}
                    {money(computed.distribution.respondentNet)}, combined{" "}
                    {money(computed.distribution.netAssets)}.
                  </p>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
      <p className="callout mt-6">
        Illustrative planning only. This does not predict a court order or determine
        entitlement. Sample figures are fictional.
      </p>
    </main>
  );
}
