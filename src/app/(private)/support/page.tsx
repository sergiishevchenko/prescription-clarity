import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function SupportPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="text-3xl font-semibold text-gray-900">Support</h1>
          <p className="mt-2 text-gray-600">
            We&apos;re here to help. Reach out if you have any questions about
            your medication plan or need technical assistance.
          </p>
          <ul className="mt-6 space-y-3 text-gray-700">
            <li>
              <strong>Email:</strong> support@prescriptionclarity.com
            </li>
            <li>
              <strong>Knowledge Base:</strong>{" "}
              <a
                href="https://example.com/help-center"
                className="text-indigo-600 hover:text-indigo-700"
              >
                Browse articles
              </a>
            </li>
            <li>
              <strong>Live Chat:</strong> Available weekdays 9am – 6pm.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
