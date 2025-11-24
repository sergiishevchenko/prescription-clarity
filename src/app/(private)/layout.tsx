import type { ReactNode } from "react";
import { MobileLayoutClient } from "@/components/navigation/MobileLayoutClient";
import { getCurrentUser } from "@/lib/auth/current-user";
import styles from "./layout.module.css";

export const revalidate = 0;

export default async function PrivateLayout({
  children,
}: {
  children: ReactNode;
}) {
  const currentUser = await getCurrentUser();

  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}>
        <MobileLayoutClient user={currentUser} />
      </div>
      <main className={styles.main}>
        <div className={styles.mainContent}>{children}</div>
      </main>
    </div>
  );
}
