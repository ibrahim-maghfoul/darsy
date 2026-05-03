import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "انضم إلى القاعة الدراسية | Rejoindre la Classe",
  description: "انضم إلى قاعة دراسية على منصة درسي باستخدام رمز الدعوة.",
  robots: { index: false, follow: false },
};

export default function JoinRoomLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
