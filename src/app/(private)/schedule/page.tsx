import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import Link from "next/link";

export default async function SchedulePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="text-3xl font-semibold text-gray-900">
            Schedule Planner
          </h1>
          <p className="mt-2 text-gray-600">
            Generate and review your medication schedule. Use the generator to
            create new reminders or adjust existing plans.
          </p>
          <div className="mt-4">
            <Link
              href="/medications/new"
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Add Medication
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
