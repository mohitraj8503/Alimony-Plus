"use client";

import { useState } from "react";
import jsPDF from "jspdf";

type FormData = {
  fullName: string;
  caseNumber: string;
  employment: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  assets: string;
  liabilities: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const initialForm: FormData = {
  fullName: "",
  caseNumber: "",
  employment: "",
  monthlyIncome: "",
  monthlyExpenses: "",
  assets: "",
  liabilities: "",
};

const fields: {
  key: keyof FormData;
  label: string;
  placeholder: string;
  type: "text" | "number";
  required?: boolean;
}[] = [
  {
    key: "fullName",
    label: "Full name",
    placeholder: "Enter your full name",
    type: "text",
    required: true,
  },
  {
    key: "caseNumber",
    label: "Case number",
    placeholder: "Enter case number",
    type: "text",
    required: true,
  },
  {
    key: "employment",
    label: "Employment / occupation",
    placeholder: "Enter occupation",
    type: "text",
  },
  {
    key: "monthlyIncome",
    label: "Monthly income (₹)",
    placeholder: "Enter monthly income",
    type: "number",
    required: true,
  },
  {
    key: "monthlyExpenses",
    label: "Monthly expenses (₹)",
    placeholder: "Enter monthly expenses",
    type: "number",
    required: true,
  },
  {
    key: "assets",
    label: "Assets and property",
    placeholder: "Describe assets and property",
    type: "text",
  },
  {
    key: "liabilities",
    label: "Loans and liabilities",
    placeholder: "Describe loans and liabilities",
    type: "text",
  },
];

export function Form136View() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});

  function update(field: keyof FormData, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
    }));
  }

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    if (!form.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!form.caseNumber.trim()) {
      nextErrors.caseNumber = "Case number is required.";
    }

    for (const field of [
      "monthlyIncome",
      "monthlyExpenses",
    ] as const) {
      const value = form[field].trim();
      const amount = Number(value);

      if (!value) {
        nextErrors[field] = "This field is required.";
      } else if (
        !Number.isFinite(amount) ||
        amount < 0 ||
       !/^\d+(\.\d{1,2})?$/.test(value)
      ) {
        nextErrors[field] =
          "Enter a valid non-negative amount (up to 2 decimal places).";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

function downloadDraft() {
  if (!validate()) return;

  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let y = 25;

  const addField = (label: string, value: string) => {
    const lines = pdf.splitTextToSize(
      value || "Not provided",
      pageWidth - margin * 2 - 5
    );

    if (y + 12 + lines.length * 6 > 275) {
      pdf.addPage();
      y = 20;
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(label, margin, y);
    y += 7;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(lines, margin, y);
    y += lines.length * 6 + 7;
  };

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("FINANCIAL DISCLOSURE", pageWidth / 2, y, {
    align: "center",
  });

  y += 9;
  pdf.setFontSize(11);
  pdf.text("FORM 136 - DEMO DRAFT", pageWidth / 2, y, {
    align: "center",
  });

  y += 16;

  addField("Full Name", form.fullName);
  addField("Case Number", form.caseNumber);
  addField("Employment / Occupation", form.employment);
  addField(
    "Monthly Income",
    `INR ${Number(form.monthlyIncome).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  );
  addField(
    "Monthly Expenses",
    `INR ${Number(form.monthlyExpenses).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  );
  addField("Assets and Property", form.assets);
  addField("Loans and Liabilities", form.liabilities);

  if (y + 35 > 280) {
    pdf.addPage();
    y = 20;
  }

  y += 5;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("IMPORTANT DISCLAIMER", margin, y);

  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  const disclaimer = pdf.splitTextToSize(
    "This is a demonstration draft, not an official court form or a filed legal document. Verify the applicable official form and all details before use. This file is generated locally and is not saved to a database.",
    pageWidth - margin * 2
  );

  pdf.text(disclaimer, margin, y);
  pdf.save("form-136-demo-draft.pdf");
}


  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-8">
      <header>
        <p className="text-sm font-medium text-emerald-700">
          ALIMONY PLUS / DOCUMENTS
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Financial Disclosure
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Complete the available details. This is a draft,
          not an official court form.
        </p>
      </header>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          downloadDraft();
        }}
        className="space-y-5 rounded-2xl border p-5 md:p-7"
      >
        <h2 className="text-lg font-semibold">
          Personal and financial details
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <label
                htmlFor={field.key}
                className="block text-sm font-medium"
              >
                {field.label}
                {field.required && (
                  <span className="text-red-600"> *</span>
                )}
              </label>

              <input
                id={field.key}
                name={field.key}
                type={field.type}
                value={form[field.key]}
                onChange={(event) =>
                  update(field.key, event.target.value)
                }
                placeholder={field.placeholder}
                required={field.required}
                min={field.type === "number" ? 0 : undefined}
                step={field.type === "number" ? "0.01" : undefined}
                inputMode={
                  field.type === "number" ? "decimal" : undefined
                }
                aria-invalid={Boolean(errors[field.key])}
                aria-describedby={
                  errors[field.key]
                    ? `${field.key}-error`
                    : undefined
                }
                className="w-full rounded-lg border px-3 py-3 outline-none focus:ring-2 focus:ring-emerald-600"
              />

              {errors[field.key] && (
                <p
                  id={`${field.key}-error`}
                  role="alert"
                  className="text-sm text-red-600"
                >
                  {errors[field.key]}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 pt-3">
          <button
            type="submit"
            className="rounded-lg bg-emerald-800 px-5 py-3 font-medium text-white"
          >
            Download draft
          </button>

          <button
            type="button"
            onClick={() => {
              setForm({ ...initialForm });
              setErrors({});
            }}
            className="rounded-lg border px-5 py-3"
          >
            Clear form
          </button>
        </div>
      </form>

      <p className="text-sm text-gray-500">
        Privacy reminder: use demo data while testing. This
        version does not save entries to a database or generate
        a PDF. Verify all legal details before using a disclosure
        in a real case.
      </p>
    </main>
  );
}