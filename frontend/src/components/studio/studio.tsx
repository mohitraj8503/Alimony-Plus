"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Field } from "@/components/ui";
import { RULE_SETS, RULES_NOTICE, getRuleSet, newScenario } from "@/lib/studio/rules";
import { validateInputs } from "@/lib/studio/schema";
import type { Scenario } from "@/lib/studio/types";
import { AmountField, type SliderRange } from "./amount-field";
import { type InputKey, getValue, setValue } from "./format";
import { ComparisonTable, ResultCards } from "./results";

const MAX_SCENARIOS = 3;

const FIELDS: { key: InputKey; label: string; slider?: SliderRange }[] = [
  { key: "income.payer", label: "Paying party: monthly income (Rs.)", slider: { min: 0, max: 500000, step: 1000 } },
  { key: "income.recipient", label: "Receiving party: monthly income (Rs.)", slider: { min: 0, max: 500000, step: 1000 } },
  { key: "essentialExpenses.payer", label: "Paying party: essential monthly expenses (Rs.)" },
  { key: "essentialExpenses.recipient", label: "Receiving party: essential monthly expenses (Rs.)" },
  { key: "payerDebtPayments", label: "Paying party: monthly debt payments (Rs.)" },
  { key: "childCosts", label: "Monthly child costs (Rs.)", slider: { min: 0, max: 100000, step: 500 } },
  { key: "totalAssets", label: "Total assets (Rs.)" },
  { key: "totalDebts", label: "Total debts (Rs.)" },
  { key: "recipientAssetSharePercent", label: "Receiving party's share of net assets (%)", slider: { min: 0, max: 100, step: 1 } },
  { key: "durationMonths", label: "Duration of maintenance (months)", slider: { min: 1, max: 120, step: 1 } },
];

function Panel({ scenario, onChange }: { scenario: Scenario; onChange: (next: Scenario) => void }) {
  const check = validateInputs(scenario.inputs);
  const errors: Record<string, string> = check.ok ? {} : check.errors;
  const count = Object.keys(errors).length;
  return (
    <div className="s-grid">
      <section className="s-card" aria-labelledby={`in-${scenario.id}`}>
        <h2 id={`in-${scenario.id}`} className="s-h2">Inputs for {scenario.name}</h2>
        <Field label="Rule set (sample)" hint={getRuleSet(scenario.ruleSetId).note}>
          <select
            value={scenario.ruleSetId}
            onChange={(e) => onChange({ ...scenario, ruleSetId: e.target.value })}
          >
            {RULE_SETS.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </Field>
        {FIELDS.map((f) => (
          <AmountField
            key={f.key}
            label={f.label}
            slider={f.slider}
            value={getValue(scenario.inputs, f.key)}
            error={errors[f.key]}
            onChange={(v) => onChange({ ...scenario, inputs: setValue(scenario.inputs, f.key, v) })}
          />
        ))}
      </section>
      {check.ok ? (
        <ResultCards scenario={scenario} />
      ) : (
        <section className="s-card" role="alert">
          <h2 className="s-h2">Results are paused</h2>
          <p>Please fix {count} {count === 1 ? "field" : "fields"} on the left to see results.</p>
        </section>
      )}
    </div>
  );
}

export function Studio() {
  const [scenarios, setScenarios] = useState<Scenario[]>([newScenario(1)]);
  const [activeId, setActiveId] = useState("scenario-1");

  function replace(next: Scenario) {
    setScenarios((list) => list.map((s) => (s.id === next.id ? next : s)));
  }

  function add() {
    if (scenarios.length >= MAX_SCENARIOS) return;
    const n = scenarios.length + 1;
    const base = scenarios.find((s) => s.id === activeId) ?? scenarios[0];
    const copy: Scenario = {
      ...structuredClone(base),
      id: `scenario-${n}`,
      name: `Scenario ${String.fromCharCode(64 + n)}`,
    };
    setScenarios((list) => [...list, copy]);
    setActiveId(copy.id);
  }

  return (
    <div className="studio-inner">
      <Link href="/dashboard" className="s-back">Back to dashboard</Link>
      <h1 className="s-title">Settlement studio</h1>
      <p className="s-notice">
        {RULES_NOTICE} All amounts are in rupees and are entered by you. This is a planning aid,
        not legal advice or a prediction of a court order.
      </p>
      <Tabs.Root value={activeId} onValueChange={setActiveId}>
        <div className="s-tabbar">
          <Tabs.List className="s-tabs" aria-label="Scenarios">
            {scenarios.map((s) => (
              <Tabs.Trigger key={s.id} value={s.id} className="s-tab">{s.name}</Tabs.Trigger>
            ))}
          </Tabs.List>
          <button type="button" className="s-btn" onClick={add} disabled={scenarios.length >= MAX_SCENARIOS}>
            <Plus size={16} aria-hidden="true" /> Add scenario
          </button>
        </div>
        {scenarios.map((s) => (
          <Tabs.Content key={s.id} value={s.id}>
            <Panel scenario={s} onChange={replace} />
          </Tabs.Content>
        ))}
      </Tabs.Root>
      {scenarios.length > 1 ? (
        <ComparisonTable scenarios={scenarios} />
      ) : (
        <p className="s-muted">Add a second scenario to compare outcomes side by side.</p>
      )}
    </div>
  );
}