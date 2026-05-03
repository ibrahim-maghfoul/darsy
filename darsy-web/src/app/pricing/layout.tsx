import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "أسعار الاشتراكات | Tarifs et Abonnements",
  description:
    "اشترك في درسي بدءاً من 100 درهم/شهر — خطط مجانية ومدفوعة للتلاميذ المغاربة. Abonnez-vous à Darsy à partir de 100 MAD/mois — plans gratuits et premium pour les élèves marocains.",
  openGraph: {
    title: "أسعار الاشتراكات | Darsy",
    description:
      "اشترك في درسي بدءاً من 100 درهم/شهر — خطط مجانية ومدفوعة.",
    type: "website",
    url: "/pricing",
  },
  twitter: {
    card: "summary",
    title: "أسعار الاشتراكات | Darsy",
    description: "اشترك في درسي بدءاً من 100 درهم/شهر.",
  },
  alternates: { canonical: "/pricing" },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
