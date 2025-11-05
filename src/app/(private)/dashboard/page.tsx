import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user.name ?? user.email}
          </h1>
          <p className="mt-2 text-gray-600">
            This is your dashboard. Here you can manage your prescriptions,
            medications, and supplements.
          </p>
        </div>
      </div>
    </div>
  );
}
