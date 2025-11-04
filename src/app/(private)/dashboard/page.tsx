import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/logout-button";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user.name ?? user.email}
          </h1>
          <LogoutButton />
        </div>
        <div className="px-4 py-2 sm:px-0">
          <p className="mt-2 text-gray-600">This is a protected route.</p>
        </div>
      </div>
    </div>
  );
}
