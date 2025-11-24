"use client";

import styles from "./MobileHeader.module.css";

type MobileHeaderProps = {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
};

export function MobileHeader({ onMenuToggle, isMenuOpen }: MobileHeaderProps) {
  return (
    <header className={styles.mobileHeader}>
      <div className={styles.headerContent}>
        <div className={styles.logoSection}>
          <div className={styles.logoMark}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Prescription Clarity Logo"
              className={styles.logoImage}
            />
          </div>
          <div className={styles.logoTitle}>
            <h1>Prescription</h1>
            <p>Clarity</p>
          </div>
        </div>
        <button
          type="button"
          className={styles.hamburgerButton}
          onClick={onMenuToggle}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          <HamburgerIcon className={styles.hamburgerIcon} />
        </button>
      </div>
    </header>
  );
}

function HamburgerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
