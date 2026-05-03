import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تواصل معنا | Contactez-nous",
  description:
    "تواصل مع فريق درسي — أسئلة، اقتراحات أو شراكات. Contactez l'équipe Darsy pour toute question, suggestion ou partenariat.",
  openGraph: {
    title: "تواصل معنا | Darsy",
    description: "تواصل مع فريق درسي — أسئلة، اقتراحات أو شراكات.",
    type: "website",
    url: "/contact",
  },
  twitter: {
    card: "summary",
    title: "تواصل معنا | Darsy",
    description: "تواصل مع فريق درسي.",
  },
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
