"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./add-dependent.module.css";

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function UserPlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function HelpCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const YEARS = Array.from(
  { length: 100 },
  (_, i) => new Date().getFullYear() - i,
);

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];
const RELATIONSHIPS = [
  "Parent",
  "Child",
  "Spouse",
  "Sibling",
  "Grandparent",
  "Grandchild",
  "Other Family",
  "Non-Family",
];

export default function AddDependentPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [relationship, setRelationship] = useState("");

  return (
    <div className={styles.container}>
      <div className={styles.pageWrapper}>
        <div className={styles.backLink}>
          <Link href="/dependents" className={styles.backButton}>
            <ArrowLeftIcon className={styles.backIcon} />
            Back to Dashboard
          </Link>
        </div>

        <header className={styles.header}>
          <div className={styles.headerIcon}>
            <UserPlusIcon className={styles.userPlusIcon} />
          </div>
          <div className={styles.headerText}>
            <h1 className={styles.title}>Add Dependent</h1>
            <p className={styles.subtitle}>
              Add a family member you&apos;ll be caring for
            </p>
          </div>
        </header>

        <div className={styles.formContainer}>
          <form className={styles.form}>
            {/* Profile Photo Section */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <label className={styles.sectionLabel}>
                  Profile Photo (Optional)
                </label>
                <button
                  type="button"
                  className={styles.helpButton}
                  aria-label="Help for Profile Photo"
                >
                  <HelpCircleIcon className={styles.helpIcon} />
                </button>
              </div>

              <div className={styles.photoUploadContainer}>
                <span className={styles.photoLabel}>Profile Photo</span>
                <div className={styles.photoUploadWrapper}>
                  <div className={styles.photoCircle}>
                    <CameraIcon className={styles.cameraIcon} />
                  </div>
                  <button
                    type="button"
                    className={styles.uploadButton}
                    aria-label="Upload photo"
                  >
                    <UploadIcon className={styles.uploadIcon} />
                  </button>
                </div>
                <div className={styles.photoHint}>
                  <span>Click to upload a photo</span>
                  <span>Maximum size: 5MB</span>
                </div>
              </div>
            </div>

            {/* Name Fields */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor="firstName" className={styles.label}>
                    First Name <span className={styles.required}>*</span>
                  </label>
                  <button
                    type="button"
                    className={styles.helpButton}
                    aria-label="Help for First Name"
                  >
                    <HelpCircleIcon className={styles.helpIcon} />
                  </button>
                </div>
                <input
                  type="text"
                  id="firstName"
                  className={styles.input}
                  placeholder="Enter first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor="lastName" className={styles.label}>
                    Last Name <span className={styles.required}>*</span>
                  </label>
                  <button
                    type="button"
                    className={styles.helpButton}
                    aria-label="Help for Last Name"
                  >
                    <HelpCircleIcon className={styles.helpIcon} />
                  </button>
                </div>
                <input
                  type="text"
                  id="lastName"
                  className={styles.input}
                  placeholder="Enter last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div className={styles.formSection}>
              <div className={styles.labelRow}>
                <label className={styles.label}>
                  Date of Birth <span className={styles.required}>*</span>
                </label>
                <button
                  type="button"
                  className={styles.helpButton}
                  aria-label="Help for Date of Birth"
                >
                  <HelpCircleIcon className={styles.helpIcon} />
                </button>
              </div>

              <div className={styles.dateRow}>
                <div className={styles.dateGroup}>
                  <label htmlFor="birthDay" className={styles.dateLabel}>
                    Day
                  </label>
                  <div className={styles.selectWrapper}>
                    <select
                      id="birthDay"
                      className={styles.select}
                      value={birthDay}
                      onChange={(e) => setBirthDay(e.target.value)}
                    >
                      <option value="">--</option>
                      {DAYS.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className={styles.selectIcon} />
                  </div>
                </div>

                <div className={styles.dateGroup}>
                  <label htmlFor="birthMonth" className={styles.dateLabel}>
                    Month
                  </label>
                  <div className={styles.selectWrapper}>
                    <select
                      id="birthMonth"
                      className={styles.select}
                      value={birthMonth}
                      onChange={(e) => setBirthMonth(e.target.value)}
                    >
                      <option value="">--</option>
                      {MONTHS.map((month, index) => (
                        <option key={month} value={index + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className={styles.selectIcon} />
                  </div>
                </div>

                <div className={styles.dateGroup}>
                  <label htmlFor="birthYear" className={styles.dateLabel}>
                    Year
                  </label>
                  <div className={styles.selectWrapper}>
                    <select
                      id="birthYear"
                      className={styles.select}
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                    >
                      <option value="">----</option>
                      {YEARS.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className={styles.selectIcon} />
                  </div>
                </div>
              </div>
            </div>

            {/* Gender */}
            <div className={styles.formSection}>
              <div className={styles.labelRow}>
                <label htmlFor="gender" className={styles.label}>
                  Gender <span className={styles.required}>*</span>
                </label>
                <button
                  type="button"
                  className={styles.helpButton}
                  aria-label="Help for Gender"
                >
                  <HelpCircleIcon className={styles.helpIcon} />
                </button>
              </div>
              <div className={styles.selectWrapper}>
                <select
                  id="gender"
                  className={styles.select}
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">Select gender</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className={styles.selectIcon} />
              </div>
            </div>

            {/* Relationship */}
            <div className={styles.formSection}>
              <div className={styles.labelRow}>
                <label htmlFor="relationship" className={styles.label}>
                  Relationship <span className={styles.required}>*</span>
                </label>
                <button
                  type="button"
                  className={styles.helpButton}
                  aria-label="Help for Relationship"
                >
                  <HelpCircleIcon className={styles.helpIcon} />
                </button>
              </div>
              <div className={styles.selectWrapper}>
                <select
                  id="relationship"
                  className={styles.select}
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                >
                  <option value="">Select relationship</option>
                  {RELATIONSHIPS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className={styles.selectIcon} />
              </div>
            </div>

            {/* Dependent Access Info */}
            <div className={styles.infoBox}>
              <div className={styles.infoIconWrapper}>
                <UsersIcon className={styles.infoIcon} />
              </div>
              <div className={styles.infoContent}>
                <h3 className={styles.infoTitle}>Dependent Access</h3>
                <p className={styles.infoText}>
                  You&apos;ll be able to manage medications and track adherence
                  for this person. They can also use their own account to view
                  their schedule.
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className={styles.formActions}>
              <Link href="/dependents" className={styles.cancelButton}>
                Cancel
              </Link>
              <button type="submit" className={styles.submitButton}>
                Add Dependent
              </button>
            </div>
          </form>

          <p className={styles.requiredNote}>* Required field</p>
        </div>
      </div>
    </div>
  );
}
