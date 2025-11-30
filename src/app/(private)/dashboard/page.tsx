import clsx from "clsx";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getScheduleEntries } from "@/lib/schedule";
import { formatWeekRange, getWeekDays } from "@/lib/week";
import { redirect } from "next/navigation";
import { getCareAccessOverview } from "@/lib/careAccess";
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

  const [weekEntries, careAccess] = await Promise.all([
    getScheduleEntries(weekStart, weekEnd, timezone),
    getCareAccessOverview(),
  ]);
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

  const viewersCount = careAccess?.viewers.length ?? 0;
  const caringForCount = careAccess?.caringFor.length ?? 0;

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

          {careAccess && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium tracking-wide text-indigo-600 uppercase">
                    Access roles
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">
                    Who can view what
                  </h2>
                  <p className="text-sm text-slate-500">
                    You are an <span className="font-medium">owner</span> of
                    your profile and a{" "}
                    <span className="font-medium">viewer</span> for people who
                    shared access with you.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    People who can view my data
                  </h3>
                  <p className="mb-3 text-xs text-slate-500">
                    These users have accepted a share link from you and can see
                    your schedule.
                  </p>
                  {viewersCount === 0 ? (
                    <p className="text-xs text-slate-400">
                      No active viewers yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {careAccess.viewers.slice(0, 3).map((entry) => (
                        <li
                          key={entry.accessId}
                          className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {entry.user?.name ||
                                entry.user?.email ||
                                "Viewer"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {entry.user?.email}
                            </p>
                          </div>
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            Owner
                          </span>
                        </li>
                      ))}
                      {viewersCount > 3 && (
                        <li className="text-xs text-slate-400">
                          + {viewersCount - 3} more viewer
                          {viewersCount - 3 > 1 ? "s" : ""}
                        </li>
                      )}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Profiles I can view
                  </h3>
                  <p className="mb-3 text-xs text-slate-500">
                    These users shared their profile with you. You&apos;re
                    viewing their schedule as a viewer.
                  </p>
                  {caringForCount === 0 ? (
                    <p className="text-xs text-slate-400">
                      You don&apos;t have access to other profiles yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {careAccess.caringFor.slice(0, 3).map((entry) => {
                        const displayName =
                          entry.user?.name || entry.user?.email || "Owner";

                        return (
                          <li
                            key={entry.accessId}
                            className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {displayName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {entry.user?.email}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                                Viewer
                              </span>
                              <a
                                href={`/week?userId=${encodeURIComponent(entry.userId)}&name=${encodeURIComponent(displayName)}`}
                                className="inline-flex items-center rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm hover:bg-indigo-50"
                              >
                                Open week view
                              </a>
                            </div>
                          </li>
                        );
                      })}
                      {caringForCount > 3 && (
                        <li className="text-xs text-slate-400">
                          + {caringForCount - 3} more profile
                          {caringForCount - 3 > 1 ? "s" : ""}
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
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
