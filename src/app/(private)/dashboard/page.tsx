import clsx from "clsx";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getScheduleEntries } from "@/lib/schedule";
import { formatWeekRange, getWeekDays } from "@/lib/week";
import { redirect } from "next/navigation";
import type { ScheduleSummary } from "../schedule/types";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = new Date();
  const weekDays = getWeekDays(today);
  const weekStart = new Date(weekDays[0]);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekDays[6]);
  weekEnd.setHours(23, 59, 59, 999);

  const weekEntries = await getScheduleEntries(weekStart, weekEnd, timezone);
  const summary: ScheduleSummary = (() => {
    const totalEntries = weekEntries.length;
    const takenCount = weekEntries.filter((entry) => entry.status === "DONE");
    const plannedCount = totalEntries - takenCount.length;
    const upcomingCount = weekEntries.filter((entry) => {
      const entryDate = new Date(entry.utcDateTime);
      return entryDate > today && entry.status === "PLANNED";
    });
    return {
      weekLabel: formatWeekRange(weekDays[0], weekDays[6]),
      totalEntries,
      takenCount: takenCount.length,
      plannedCount,
      upcomingCount: upcomingCount.length,
    };
  })();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user.name ?? user.email}
          </h1>
          <p className="mt-2 text-gray-600">
            Here’s a quick snapshot of your current schedule performance.
          </p>
        </div>

        <section className="space-y-6 px-4 py-6 sm:px-0">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium tracking-wide text-indigo-600 uppercase">
                  Schedule overview
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  This Week
                </h2>
                <p className="text-sm text-slate-500">{summary.weekLabel}</p>
              </div>
              <a
                href="/schedule"
                className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                Manage schedules
              </a>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <DashboardStat
                label="Planned Entries"
                value={summary.totalEntries}
              />
              <DashboardStat
                label="Taken"
                value={summary.takenCount}
                accent="text-emerald-600"
                helper={`${summary.plannedCount} still planned`}
              />
              <DashboardStat
                label="Still Planned"
                value={summary.plannedCount}
              />
              <DashboardStat
                label="Upcoming"
                value={summary.upcomingCount}
                helper="Next 7 days"
                accent="text-indigo-600"
              />
            </dl>
          </div>
        </section>
      </div>
    </div>
  );
}

type DashboardStatProps = {
  label: string;
  value: number | string;
  helper?: string;
  accent?: string;
};

function DashboardStat({ label, value, helper, accent }: DashboardStatProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </p>
      <p
        className={clsx(
          "mt-2 text-2xl font-semibold text-slate-900",
          accent && accent,
        )}
      >
        {value}
      </p>
      {helper ? (
        <p className="text-xs text-slate-500" aria-live="polite">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
