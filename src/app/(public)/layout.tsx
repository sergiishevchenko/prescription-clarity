import type { ReactNode } from "react";
import { Navbar } from "@/components/shared/Navbar";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
