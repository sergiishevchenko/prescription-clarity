import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function WeekPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="text-3xl font-semibold text-gray-900">
            Weekly Overview
          </h1>
          <p className="mt-2 text-gray-600">
            Visualize your adherence and upcoming doses for the week. Add charts
            and summaries here to mirror the design system.
          </p>
        </div>
      </div>
    </div>
  );
}

