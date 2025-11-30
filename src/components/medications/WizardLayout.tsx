"use client";

import { useEffect, useRef } from "react";

import styles from "./WizardLayout.module.css";

type WizardLayoutProps = {
  step: number;
  totalSteps: number;
  onBack?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  title?: string;
  stepTitle?: string;
  stepSubtitle?: string;
  stepIcon?: React.ReactNode;
  helpText?: string;
  children: React.ReactNode;
  showActions?: boolean;
  showProgressBar?: boolean;
  actionButtons?: React.ReactNode;
};

export function WizardLayout({
  step,
  totalSteps,
  onBack,
  onPrevious,
  onNext,
  nextLabel = "Next",
  title = "Add Medication",
  stepTitle,
  stepSubtitle,
  stepIcon,
  showProgressBar = true,
  helpText,
  children,
  showActions = true,
  actionButtons,
}: WizardLayoutProps) {
  const progress = (step / totalSteps) * 100;
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [step]);

  return (
    <div className={styles.wizard}>
      <div className={styles.container} ref={containerRef}>
        {/* Back Button and Title Row */}
        <div className={styles.titleRow}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className={styles.backButton}
            >
              <svg
                className={styles.backIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M15 18l-6-6 6-6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className={styles.backText}>Back</span>
            </button>
          )}

          {/* Main Title */}
          <h1 className={styles.title}>{title}</h1>

          {/* Spacer for centering on tablet/desktop */}
          <div className={styles.titleSpacer}></div>
        </div>

        {showProgressBar && (
          <>
            {/* Progress Header */}
            <div className={styles.progressHeader}>
              <span className={styles.stepIndicator}>
                Step {step} of {totalSteps}
              </span>
              <span className={styles.progressPercentage}>
                {Math.round(progress)}% Complete
              </span>
            </div>

            {/* Progress Bar */}
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        )}

        {/* Step Header with Icon */}
        {(stepIcon || stepTitle || stepSubtitle) && (
          <div className={styles.stepHeader}>
            {stepIcon && <div className={styles.iconContainer}>{stepIcon}</div>}
            {(stepTitle || stepSubtitle) && (
              <div className={styles.stepHeaderText}>
                {stepTitle && <h2 className={styles.stepTitle}>{stepTitle}</h2>}
                {stepSubtitle && (
                  <p className={styles.stepSubtitle}>{stepSubtitle}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className={styles.content}>{children}</div>

        {/* Actions */}
        {showActions && (
          <div className={styles.actions}>
            {helpText && <p className={styles.helpText}>{helpText}</p>}
            {actionButtons || (
              <div className={styles.buttonGroup}>
                {step > 1 && onPrevious && (
                  <button
                    type="button"
                    onClick={onPrevious}
                    className={`${styles.button} ${styles.buttonSecondary}`}
                  >
                    <svg
                      className={styles.buttonIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M15 18l-6-6 6-6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Previous
                  </button>
                )}
                {onNext && (
                  <button
                    type="button"
                    onClick={onNext}
                    className={`${styles.button} ${styles.buttonPrimary} ${
                      step === 1 ? styles.buttonFullWidth : ""
                    }`}
                  >
                    {nextLabel}
                    <svg
                      className={styles.buttonIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M9 18l6-6-6-6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
