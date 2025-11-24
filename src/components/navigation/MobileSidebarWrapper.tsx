"use client";

import { useEffect } from "react";
import { SidebarNav } from "./SidebarNav";
import type { SessionUser } from "@/lib/auth/session";
import styles from "./MobileSidebarWrapper.module.css";

type MobileSidebarWrapperProps = {
  user: SessionUser | null;
  isOpen: boolean;
  onClose: () => void;
};

export function MobileSidebarWrapper({
  user,
  isOpen,
  onClose,
}: MobileSidebarWrapperProps) {
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay - visible on mobile when menu is open */}
      {isOpen && (
        <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <div
        className={`${styles.sidebarWrapper} ${isOpen ? styles.sidebarOpen : ""}`}
      >
        <SidebarNav user={user} onClose={onClose} />
      </div>
    </>
  );
}
