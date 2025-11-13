import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/components/shared/ToastProvider";

export const metadata: Metadata = {
  title: {
    default: "Prescription Clarity",
    template: "%s | Prescription Clarity",
  },
  description:
    "Prescription Clarity is a digital adherence companion that organizes prescriptions, medications, and supplements, sends smart reminders, and tracks intake to help users follow treatment plans safely and on time.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  icons: { icon: "/favicon.ico" },
  robots: { index: true, follow: true },
};

export const revalidate = 0;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="font-sans antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
