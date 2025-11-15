"use client";

import { useState } from "react";
import styles from "./Tooltip.module.css";

type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactNode;
};

export function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={styles.tooltip}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className={styles.trigger}
        tabIndex={0}
        role="button"
        aria-label="Show help"
      >
        {children}
      </div>
      {isVisible && (
        <div className={styles.tooltipContent}>
          <div className={styles.tooltipArrow}></div>
          {content}
        </div>
      )}
    </div>
  );
}
