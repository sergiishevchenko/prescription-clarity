"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import type { SessionUser } from "@/lib/auth/session";
import { clearMedicationWizard } from "@/lib/medicationWizardStorage";
import styles from "./SidebarNav.module.css";

type IconProps = {
  className?: string;
};

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: (props: IconProps) => ReactNode;
  trailingIcon?: (props: IconProps) => ReactNode;
  match?: "exact" | "startsWith";
};

type NavGroup = {
  id: string;
  label: string;
  defaultOpen?: boolean;
  items: NavItem[];
};

type SidebarNavProps = {
  user: SessionUser | null;
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    defaultOpen: true,
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
        icon: DashboardIcon,
        trailingIcon: ChevronRightIcon,
        match: "exact",
      },
      {
        id: "today",
        label: "Today",
        href: "/today",
        icon: CalendarIcon,
        match: "exact",
      },
      {
        id: "week",
        label: "Week View",
        href: "/week",
        icon: CalendarDaysIcon,
        match: "exact",
      },
    ],
  },
  {
    id: "tracking",
    label: "Tracking",
    defaultOpen: false,
    items: [
      {
        id: "medications",
        label: "Medications",
        href: "/medications",
        icon: PillIcon,
        match: "startsWith",
      },
      {
        id: "schedule",
        label: "Schedule",
        href: "/schedule",
        icon: ClockIcon,
        match: "startsWith",
      },
    ],
  },
  {
    id: "personal",
    label: "Personal",
    defaultOpen: false,
    items: [
      {
        id: "profile",
        label: "Profile",
        href: "/profile",
        icon: UserIcon,
        match: "startsWith",
      },
      {
        id: "support",
        label: "Support",
        href: "/support",
        icon: LifeBuoyIcon,
        match: "startsWith",
      },
    ],
  },
];

export function SidebarNav({ user }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const defaults = NAV_GROUPS.filter((group) => group.defaultOpen).map(
      (group) => group.id,
    );
    return new Set(defaults);
  });
  const [signingOut, setSigningOut] = useState(false);

  const preferredName = user?.name?.trim() || user?.email?.split("@")[0] || "";
  const initials = useMemo(() => {
    if (!preferredName) return "PC";
    const parts = preferredName.split(/\s+/).filter(Boolean);
    if (!parts.length) return preferredName[0]!.toUpperCase();
    if (parts.length === 1) {
      return parts[0]!.slice(0, 2).toUpperCase();
    }
    return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
  }, [preferredName]);

  const handleToggleGroup = (groupId: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const isGroupOpen = (groupId: string) => openGroups.has(groupId);

  const isItemActive = (item: NavItem) => {
    if (!pathname) return false;

    const normalizedPath =
      pathname === "/" ? pathname : pathname.replace(/\/$/, "");
    const normalizedTarget =
      item.href === "/" ? item.href : item.href.replace(/\/$/, "");

    const matchesPath =
      item.match === "startsWith"
        ? normalizedPath === normalizedTarget ||
          normalizedPath.startsWith(`${normalizedTarget}/`)
        : normalizedPath === normalizedTarget;

    return matchesPath;
  };

  const handleAddMedication = () => {
    clearMedicationWizard();
    router.push("/medications/new");
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to sign out", error);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoSection}>
        <div className={styles.logoRow}>
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
      </div>

      <div className={styles.userSection}>
        <div className={styles.userRow}>
          <span className={styles.userAvatar}>
            <span className={styles.avatarFallback}>{initials}</span>
          </span>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{preferredName || "Guest User"}</p>
            <button
              type="button"
              className={styles.switchRoleButton}
              aria-label="Switch role"
            >
              Patient • Switch Role
            </button>
          </div>
        </div>
      </div>

      <nav className={clsx(styles.nav, styles.scrollArea)} aria-label="Sidebar">
        <div className={styles.navSections}>
          {NAV_GROUPS.map((group) => {
            const open = isGroupOpen(group.id);
            return (
              <div key={group.id} className={styles.collapse}>
                <button
                  type="button"
                  className={styles.collapseHeader}
                  onClick={() => handleToggleGroup(group.id)}
                  aria-expanded={open}
                  aria-controls={`${group.id}-content`}
                >
                  <span className={styles.collapseLabel}>{group.label}</span>
                  <ChevronDownIcon
                    className={clsx(
                      styles.collapseIcon,
                      open && styles.collapseIconOpen,
                    )}
                  />
                </button>
                {open && (
                  <div
                    id={`${group.id}-content`}
                    className={styles.collapseContent}
                  >
                    {group.items.map((item) => {
                      const active = isItemActive(item);

                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          className={clsx(
                            styles.navItem,
                            active && styles.navItemActive,
                          )}
                        >
                          {item.icon({ className: styles.navItemIcon })}
                          <span className={styles.navItemLabel}>
                            {item.label}
                          </span>
                          {item.trailingIcon
                            ? item.trailingIcon({
                                className: styles.navItemTrailing,
                              })
                            : null}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className={styles.cta}>
            <button
              type="button"
              className={styles.ctaButton}
              onClick={handleAddMedication}
            >
              <PlusIcon className={styles.navItemIcon} />
              Add Medication
            </button>
          </div>
        </div>
      </nav>

      <div className={styles.footer}>
        <button type="button" className={styles.accountButton}>
          <span className={styles.accountAvatar}>
            <span className={styles.avatarFallback}>{initials}</span>
          </span>
          <span className={styles.accountInfo}>
            <p className={styles.accountName}>
              {preferredName || "Patient Account"}
            </p>
            <p className={styles.accountRole}>Patient</p>
          </span>
        </button>
        <button
          type="button"
          className={styles.signOutButton}
          onClick={handleSignOut}
          disabled={signingOut}
        >
          <LogOutIcon className={styles.navItemIcon} />
          <span>{signingOut ? "Signing Out..." : "Sign Out"}</span>
        </button>
      </div>
    </aside>
  );
}

function DashboardIcon({ className }: IconProps) {
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
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function CalendarIcon({ className }: IconProps) {
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
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function CalendarDaysIcon({ className }: IconProps) {
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
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
      <path d="M16 18h.01" />
    </svg>
  );
}

function PillIcon({ className }: IconProps) {
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
      <path d="m10.5 19.5 6-6" />
      <path d="M7.1 10.6 5 8.5a4 4 0 0 1 5.6-5.6l2.1 2.1" />
      <path d="M14.5 12.1 16.6 14.2a4 4 0 0 1-5.6 5.6L8.9 17.7" />
    </svg>
  );
}

function ClockIcon({ className }: IconProps) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l3 3" />
    </svg>
  );
}

function UserIcon({ className }: IconProps) {
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
      <circle cx="12" cy="8" r="4" />
      <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6" />
    </svg>
  );
}

function LifeBuoyIcon({ className }: IconProps) {
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
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <path d="m4.93 4.93 3.54 3.54" />
      <path d="m15.53 15.53 3.54 3.54" />
      <path d="m4.93 19.07 3.54-3.54" />
      <path d="m15.53 8.47 3.54-3.54" />
    </svg>
  );
}

function PlusIcon({ className }: IconProps) {
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
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ChevronDownIcon({ className }: IconProps) {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function LogOutIcon({ className }: IconProps) {
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
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    </svg>
  );
}
