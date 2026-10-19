import type { Metadata } from "next";
import { SettlementStudio } from "@/components/studio/settlement-studio";

export const metadata: Metadata = {
  title: "Settlement Studio · Alimony Plus",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SettlementStudio />;
}
