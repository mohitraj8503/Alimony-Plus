"use client";

import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import {
  calculateSettlement,
  defaultSettlementRules,
  type SettlementInput,
  type SettlementRules,
} from "@/lib/settlement";
import { money } from "@/lib/ledger";
import { PageHeading } from "./ui";

const initialInput: SettlementInput = {
  applicantIncome: 8000,
  respondentIncome: 60000,
  applicantExpenses: 12000,
  respondentExpenses: 20000,
  childCosts: 2000,
  housingCosts: 8000,
  medicalCosts: 1000,
  educationCosts: 3000,
  existingSupport: 0,
  applicantAssets: 200000,
  respondentAssets: 500000,
  applicantDebts: 0,
  respondentDebts: 50000,
};

const fields: { key: keyof SettlementInput; label: string }[] = [
  { key: "applicantIncome", label: "Applicant monthly income" },
  { key: "respondentIncome", label: "Respondent monthly income" },
  { key: "applicantExpenses", label: "Applicant essential expenses" },
  { key: "respondentExpenses", label: "Respondent essential expenses" },
  { key: "childCosts", label: "Dependent care costs" },
  { key: "housingCosts", label: "Housing costs" },
  { key: "medicalCosts", label: "Medical costs" },
  { key: "educationCosts", label: "Education costs" },
  { key: "existingSupport", label: "Existing monthly support" },
  { key: "applicantAssets", label: "Applicant assets" },
  { key: "respondentAssets", label: "Respondent assets" },
  { key: "applicantDebts", label: "Applicant debts" },
  { key: "respondentDebts", label: "Respondent debts" },
];

export function SettlementStudio() {
  const [input, setInput] = useState(initialInput);
  const [rules, setRules] = useState<SettlementRules>(defaultSettlementRules);
  const [error, setError] = useState("");

  const result = useMemo(() => {
    try {
      setError("");
      return calculateSettlement(input, rules);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid financial inputs.",
      );
      return null;
    }
  }, [input, rules]);

  function updateInput(key: keyof SettlementInput, value: number) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function updateRule(key: keyof SettlementRules, value: number) {
    setRules((current) => ({ ...current, [key]: value }));
  }

  async function exportReport() {
    if (!result) return;

    const reportData = {
      generatedAt: new Date().toISOString(),
      inputs: input,
      rules,
      result,
    };

    const canonicalData = JSON.stringify(reportData);

    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(canonicalData),
    );

    const hash = Array.from(new Uint8Array(hashBuffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    const pdf = new jsPDF();
    let y = 20;

    const addLine = (text: string) => {
      const safeText = text.replace(/₹/g, "INR ").replace(/\u00A0/g, " ");

      const lines = pdf.splitTextToSize(safeText, 180);

      if (y + lines.length * 7 > 280) {
        pdf.addPage();
        y = 20;
      }

      pdf.text(lines, 15, y);
      y += lines.length * 7 + 2;
    };

    addLine("ALIMONY+ - SETTLEMENT STUDIO");
    addLine("Illustrative Financial Planning Report");
    addLine(`Generated: ${reportData.generatedAt}`);
    addLine("");

    addLine("MONTHLY FINANCIAL SUMMARY");
    addLine(`Monthly need: ${money(result.monthlyNeed)}`);
    addLine(`Monthly capacity: ${money(result.monthlyCapacity)}`);
    addLine(`Conservative scenario: ${money(result.scenarios.conservative)}`);
    addLine(`Baseline scenario: ${money(result.scenarios.baseline)}`);
    addLine(`Stress scenario: ${money(result.scenarios.stress)}`);
    addLine("");

    addLine("ASSETS AND DEBTS");
    addLine(`Total assets: ${money(result.assets.totalAssets)}`);
    addLine(`Total debts: ${money(result.assets.totalDebts)}`);
    addLine(`Net assets: ${money(result.assets.netAssets)}`);
    addLine(`Rule configuration: ${result.ruleSetName} v${result.ruleVersion}`);
    addLine("");

    addLine("DISCLAIMER");
    addLine(result.disclaimer);
    addLine(
      "This report is illustrative planning only, not legal advice or a prediction of a court decision.",
    );
    addLine("");

    addLine("SHA-256 REPORT DATA HASH");
    addLine(hash);
    addLine("");
    addLine(
      "Verification note: this hash identifies the report data used during export. It is not a digital signature or proof of legal authenticity.",
    );

    pdf.save("alimony-settlement-report.pdf");
  }

  return (
    <>
      <PageHeading
        eyebrow="INTERACTIVE FINANCIAL PLANNING"
        title="Settlement Studio"
        description="Explore financial scenarios and compare how different assumptions affect the estimates."
      />

      <div className="callout mb-6" role="note">
        Illustrative planning only. These configurable assumptions are not
        verified statutory rules, legal advice, or predictions of court
        decisions. The initial figures are synthetic examples.
      </div>

      <section className="panel mb-6">
        <h2 className="mb-2 text-xl font-semibold">Financial inputs</h2>
        <p className="muted mb-5">
          Amounts are in INR. Adjust any value to update the scenarios.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {fields.map(({ key, label }) => (
            <label key={key} className="form-stack">
              <span>{label}</span>
              <input
                type="number"
                min="0"
                step="100"
                value={input[key]}
                onChange={(event) =>
                  updateInput(key, Number(event.target.value))
                }
                aria-label={label}
              />
              {key === "applicantIncome" || key === "respondentIncome" ? (
                <input
                  type="range"
                  min="0"
                  max="200000"
                  step="1000"
                  value={Math.min(input[key], 200000)}
                  onChange={(event) =>
                    updateInput(key, Number(event.target.value))
                  }
                  aria-label={`${label} slider`}
                />
              ) : null}
            </label>
          ))}
        </div>
      </section>

      <section className="panel mb-6">
        <h2 className="mb-2 text-xl font-semibold">
          Configurable scenario rules
        </h2>
        <p className="muted mb-5">
          These are user-adjustable planning assumptions, not legal percentages.
        </p>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {(
            [
              ["conservativeMultiplier", "Conservative multiplier", 0, 2, 0.05],
              ["baselineMultiplier", "Baseline multiplier", 0, 2, 0.05],
              ["stressMultiplier", "Stress multiplier", 0, 2, 0.05],
            ] as const
          ).map(([key, label, min, max, step]) => (
            <label key={key} className="form-stack">
              <span>
                {label}: {rules[key].toFixed(2)}×
              </span>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={rules[key]}
                onChange={(event) =>
                  updateRule(key, Number(event.target.value))
                }
                aria-label={label}
              />
            </label>
          ))}

          <label className="form-stack">
            <span>
              Applicant illustrative asset share:{" "}
              {rules.applicantAssetSharePercent}%
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={rules.applicantAssetSharePercent}
              onChange={(event) =>
                updateRule(
                  "applicantAssetSharePercent",
                  Number(event.target.value),
                )
              }
              aria-label="Applicant illustrative asset share"
            />
          </label>
        </div>
      </section>

      {error && (
        <p className="form-error mb-4" role="alert">
          {error}
        </p>
      )}

      {result && (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {(
              [
                ["Conservative", result.scenarios.conservative],
                ["Baseline", result.scenarios.baseline],
                ["Stress scenario", result.scenarios.stress],
              ] as const
            ).map(([label, amount]) => (
              <article className="panel" key={label}>
                <p className="muted mb-2">{label}</p>
                <p className="text-2xl font-semibold">{money(amount)}</p>
                <p className="small muted">Illustrative monthly amount</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{
                      width: `${
                        result.monthlyCapacity > 0
                          ? Math.min(
                              100,
                              (amount / result.monthlyCapacity) * 100,
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </article>
            ))}
          </section>

          <section className="panel mt-6">
            <h2 className="mb-4 text-xl font-semibold">Financial overview</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="muted">Monthly need</dt>
                <dd className="text-xl font-semibold">
                  {money(result.monthlyNeed)}
                </dd>
              </div>
              <div>
                <dt className="muted">Monthly capacity</dt>
                <dd className="text-xl font-semibold">
                  {money(result.monthlyCapacity)}
                </dd>
              </div>
              <div>
                <dt className="muted">Total assets</dt>
                <dd className="text-xl font-semibold">
                  {money(result.assets.totalAssets)}
                </dd>
              </div>
              <div>
                <dt className="muted">Total debts</dt>
                <dd className="text-xl font-semibold">
                  {money(result.assets.totalDebts)}
                </dd>
              </div>
              <div>
                <dt className="muted">Net assets</dt>
                <dd className="text-xl font-semibold">
                  {money(result.assets.netAssets)}
                </dd>
              </div>
              <div>
                <dt className="muted">Rule configuration</dt>
                <dd className="font-semibold">
                  {result.ruleSetName} · v{result.ruleVersion}
                </dd>
              </div>
            </dl>

            <h3 className="mb-3 mt-6 font-semibold">
              Illustrative asset distribution
            </h3>
            <div className="mb-3">
              <div className="mb-1 flex justify-between gap-3">
                <span>Applicant share</span>
                <strong>{money(result.assets.applicantShare)}</strong>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${rules.applicantAssetSharePercent}%` }}
                />
              </div>
            </div>
            <div className="mb-4 flex justify-between gap-3">
              <span>Respondent share</span>
              <strong>{money(result.assets.respondentShare)}</strong>
            </div>
            <p className="callout" role="note">
              {result.disclaimer}
            </p>
          </section>
        </>
      )}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void exportReport()}
          disabled={!result}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Download Settlement Report (PDF)
        </button>
        <span className="muted text-sm">
          Includes scenario estimates and a SHA-256 report-data hash.
        </span>
      </div>
    </>
  );
}
