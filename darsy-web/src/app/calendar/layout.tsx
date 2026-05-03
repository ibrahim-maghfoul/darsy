import type { Metadata } from "next";
import "./calendar.css";

export const metadata: Metadata = {
  title: "التقويم الدراسي | Calendrier Scolaire",
  description:
    "نظم جدولك الدراسي، مواعيدك والمهام اليومية مع تقويم درسي. Gérez vos événements, to-dos et calendrier académique avec Darsy.",
  openGraph: {
    title: "التقويم الدراسي | Darsy",
    description:
      "نظم جدولك الدراسي، مواعيدك والمهام اليومية مع تقويم درسي.",
    type: "website",
    url: "/calendar",
  },
  twitter: {
    card: "summary",
    title: "التقويم الدراسي | Darsy",
    description: "نظم جدولك الدراسي مع تقويم درسي.",
  },
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
