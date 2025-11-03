import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login"); // или "/register"
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">
        Welcome, {user.name ?? user.email}
      </h1>
      {/* контент */}
    </main>
  );
}
