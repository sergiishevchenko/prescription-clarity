import Link from "next/link";
import styles from "./dependents.module.css";

type Medication = {
  id: string;
  name: string;
  dosage: string;
  time: string;
  taken: boolean;
};

type Dependent = {
  id: string;
  name: string;
  age: number;
  adherence: number;
  medicationCount: number;
  avatar: string;
  isActive: boolean;
  medications: Medication[];
};

const DEPENDENTS: Dependent[] = [
  {
    id: "1",
    name: "Anna Williams",
    age: 10,
    adherence: 95,
    medicationCount: 1,
    avatar: "/avatars/anna.jpg",
    isActive: true,
    medications: [
      {
        id: "m1",
        name: "Vitamin D3",
        dosage: "400 IU",
        time: "8:00 AM",
        taken: true,
      },
    ],
  },
  {
    id: "2",
    name: "Hans Müller",
    age: 75,
    adherence: 91,
    medicationCount: 2,
    avatar: "/avatars/hans.jpg",
    isActive: true,
    medications: [
      {
        id: "m2",
        name: "Metformin",
        dosage: "500 mg",
        time: "8:00 AM",
        taken: true,
      },
      {
        id: "m3",
        name: "Lisinopril",
        dosage: "10 mg",
        time: "9:00 AM",
        taken: false,
      },
    ],
  },
  {
    id: "3",
    name: "Maria Garcia",
    age: 68,
    adherence: 96,
    medicationCount: 2,
    avatar: "/avatars/maria.jpg",
    isActive: false,
    medications: [
      {
        id: "m4",
        name: "Omeprazole",
        dosage: "20 mg",
        time: "7:00 AM",
        taken: true,
      },
      {
        id: "m5",
        name: "Aspirin",
        dosage: "81 mg",
        time: "8:00 AM",
        taken: true,
      },
    ],
  },
];

function HeartIcon({ className }: { className?: string }) {
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
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function TrendingUpIcon({ className }: { className?: string }) {
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
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function AlertCircleIcon({ className }: { className?: string }) {
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
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function BarChartIcon({ className }: { className?: string }) {
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
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function PrinterIcon({ className }: { className?: string }) {
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
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
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
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
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
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
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
      <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
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
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
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

function DependentCard({ dependent }: { dependent: Dependent }) {
  const initials = dependent.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className={styles.dependentCard}>
      <div className={styles.cardHeader}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatarFallback}>{initials}</div>
            {dependent.isActive && (
              <span className={styles.statusIndicator} aria-label="Active" />
            )}
          </div>
        </div>
        <div className={styles.cardInfo}>
          <h3 className={styles.dependentName}>{dependent.name}</h3>
          <p className={styles.dependentMeta}>
            {dependent.age} years • {dependent.adherence}% adherence •{" "}
            {dependent.medicationCount} medication
            {dependent.medicationCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className={styles.cardActions}>
          <button
            type="button"
            className={styles.printButton}
            aria-label="Print Schedule"
          >
            <PrinterIcon className={styles.actionIcon} />
          </button>
          <button type="button" className={styles.editButton}>
            <EditIcon className={styles.editButtonIcon} />
            Edit
          </button>
          <button
            type="button"
            className={styles.expandButton}
            aria-label="Expand"
          >
            <ChevronDownIcon className={styles.expandIcon} />
          </button>
        </div>
      </div>

      <div className={styles.medicationsList}>
        {dependent.medications.map((med) => (
          <div key={med.id} className={styles.medicationItem}>
            <div className={styles.medicationStatus}>
              <CheckCircleIcon
                className={`${styles.checkIcon} ${med.taken ? styles.checkIconTaken : styles.checkIconPending}`}
              />
            </div>
            <div className={styles.medicationInfo}>
              <span className={styles.medicationName}>{med.name}</span>
              <span className={styles.medicationDetails}>
                {med.dosage} •{" "}
                <span className={styles.medTime}>{med.time}</span>
              </span>
            </div>
            <div className={styles.medicationActions}>
              <button
                type="button"
                className={styles.medActionButton}
                aria-label="Edit medication"
              >
                <PencilIcon className={styles.medActionIcon} />
              </button>
              <button
                type="button"
                className={styles.medActionButton}
                aria-label="Delete medication"
              >
                <TrashIcon className={styles.medActionIcon} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DependentsPage() {
  const totalDependents = DEPENDENTS.length;
  const averageAdherence = Math.round(
    DEPENDENTS.reduce((sum, d) => sum + d.adherence, 0) / totalDependents,
  );
  const totalMedications = DEPENDENTS.reduce(
    (sum, d) => sum + d.medicationCount,
    0,
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <HeartIcon className={styles.heartIcon} />
          </div>
          <div className={styles.headerText}>
            <h1 className={styles.title}>My Dependents</h1>
            <p className={styles.subtitle}>
              {totalDependents} Dependents • {averageAdherence}% Adherence •{" "}
              {totalMedications} Rx
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button type="button" className={styles.filterButton}>
            <TrendingUpIcon className={styles.filterIcon} />
            All
          </button>
          <button
            type="button"
            className={`${styles.filterButton} ${styles.filterButtonRisk}`}
          >
            <AlertCircleIcon className={styles.filterIcon} />
            Risk
          </button>
          <Link
            href="/dependents/new"
            className={`${styles.filterButton} ${styles.filterButtonAdd}`}
          >
            <PlusIcon className={styles.filterIcon} />
            Add
          </Link>
          <button type="button" className={styles.analyticsButton}>
            <BarChartIcon className={styles.filterIcon} />
            Analytics
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.dependentsList}>
          {DEPENDENTS.map((dependent) => (
            <DependentCard key={dependent.id} dependent={dependent} />
          ))}
        </div>
      </main>

      <Link
        href="/dependents/new"
        className={styles.fab}
        aria-label="Add Dependent"
      >
        <UsersIcon className={styles.fabIcon} />
      </Link>
    </div>
  );
}
