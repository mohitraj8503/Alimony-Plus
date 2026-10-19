export const assetFields = [
  ["propertyValue", "Property"],
  ["savings", "Savings and deposits"],
  ["investments", "Investments"],
  ["vehicles", "Vehicles"],
  ["otherAssets", "Other assets"],
] as const;
export const debtFields = [
  ["loans", "Loans"],
  ["otherDebts", "Other debts"],
] as const;
export type AssetKey = (typeof assetFields)[number][0];
export type DebtKey = (typeof debtFields)[number][0];
export type AssetsInput = Record<AssetKey | DebtKey, number> & {
  /** Share of every asset and debt allocated to the applicant, 0 to 100. */
  applicantSharePct: number;
};

export type DistributionRow = {
  key: string;
  label: string;
  kind: "asset" | "debt";
  total: number;
  applicant: number;
  respondent: number;
};
export type Distribution = {
  rows: DistributionRow[];
  totalAssets: number;
  totalDebts: number;
  applicantAssets: number;
  respondentAssets: number;
  applicantDebts: number;
  respondentDebts: number;
  applicantNet: number;
  respondentNet: number;
  netAssets: number;
};

export function distributeAssets(a: AssetsInput): Distribution {
  const split = (total: number) => {
    const applicant = Math.round((total * a.applicantSharePct) / 100);
    return { applicant, respondent: total - applicant };
  };
  const rows: DistributionRow[] = [
    ...assetFields.map(([key, label]) => ({
      key,
      label,
      kind: "asset" as const,
      total: a[key],
      ...split(a[key]),
    })),
    ...debtFields.map(([key, label]) => ({
      key,
      label,
      kind: "debt" as const,
      total: a[key],
      ...split(a[key]),
    })),
  ];
  const sum = (kind: "asset" | "debt", side?: "applicant" | "respondent") =>
    rows
      .filter((r) => r.kind === kind)
      .reduce((s, r) => s + (side ? r[side] : r.total), 0);
  const applicantAssets = sum("asset", "applicant");
  const respondentAssets = sum("asset", "respondent");
  const applicantDebts = sum("debt", "applicant");
  const respondentDebts = sum("debt", "respondent");
  return {
    rows,
    totalAssets: sum("asset"),
    totalDebts: sum("debt"),
    applicantAssets,
    respondentAssets,
    applicantDebts,
    respondentDebts,
    applicantNet: applicantAssets - applicantDebts,
    respondentNet: respondentAssets - respondentDebts,
    netAssets: sum("asset") - sum("debt"),
  };
}
