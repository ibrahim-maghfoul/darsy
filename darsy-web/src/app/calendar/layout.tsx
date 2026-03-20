import type { Metadata } from "next";
import "./calendar.css";

export const metadata: Metadata = {
  title: "Calendar | Darsy",
  description: "Manage your events, to-dos and academic schedule with the Darsy Calendar.",
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
