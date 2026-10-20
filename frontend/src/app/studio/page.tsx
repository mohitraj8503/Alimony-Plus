import type { Metadata } from "next";
import { Studio } from "@/components/studio/studio";
import "./studio.css";

export const metadata: Metadata = {
  title: "Settlement studio · Alimony Plus",
};

export default function StudioPage() {
  return (
    <main className="studio">
      <Studio />
    </main>
  );
}