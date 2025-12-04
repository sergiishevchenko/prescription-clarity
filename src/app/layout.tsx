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
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  manifest: "/site.webmanifest",
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
