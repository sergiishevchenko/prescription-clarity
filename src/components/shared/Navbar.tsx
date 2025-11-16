import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getSessionUserFromCookies } from "@/lib/auth/session";
import { LogoutButton } from "./LogoutButton";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function Navbar() {
  // Force re-evaluation by reading cookies
  await cookies();

  const sessionUser = await getSessionUserFromCookies();
  const isLoggedIn = Boolean(sessionUser);
  const homeHref = isLoggedIn ? "/dashboard" : "/";

  return (
    <nav className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center">
            <Link href={homeHref} className="text-xl font-bold text-gray-900">
              Prescription Clarity
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link
                  href="/profile"
                  className="text-sm font-medium text-gray-700 transition-colors hover:text-indigo-600"
                >
                  Profile
                </Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="cursor-pointer border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="cursor-pointer bg-indigo-600 hover:bg-indigo-700">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
