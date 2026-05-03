import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الإبلاغ عن مشكلة | Signaler un Problème",
  description: "أبلغنا عن أي مشكلة أو اقتراح لتحسين منصة درسي.",
  robots: { index: false, follow: false },
};

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
