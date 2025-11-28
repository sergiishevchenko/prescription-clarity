import Link from "next/link";
import Image from "next/image";
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
    <header className="border-b border-slate-200 bg-white backdrop-blur-md z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4">
        <div className="flex items-center justify-between py-3 sm:py-4 lg:py-5">
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-shrink-0 min-w-0">
            <Image
              src="/logo.svg"
              alt="Prescription Clarity Logo"
              width={64}
              height={64}
              className="flex-shrink-0 w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16"
              style={{ objectFit: "contain" }}
            />
            <div className="flex-shrink-0 min-w-0">
              <Link href={homeHref}>
                <h1 className="text-xs sm:text-lg lg:text-xl font-bold tracking-tight truncate text-slate-900">
                  Prescription Clarity
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 hidden md:block mt-0.5">
                  Medication Management Made Simple
                </p>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {isLoggedIn ? (
              <>
                <Link
                  href="/profile"
                  className="text-sm font-medium text-gray-700 transition-colors hover:text-blue-600"
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
                    className="h-10 sm:h-14 lg:h-16 min-w-[70px] sm:min-w-[100px] lg:min-w-[120px] border-2 border-slate-300 text-slate-900 text-sm sm:text-base lg:text-lg px-2.5 sm:px-4 lg:px-6 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="h-10 sm:h-14 lg:h-16 min-w-[70px] sm:min-w-[100px] lg:min-w-[120px] bg-blue-600 hover:bg-blue-700 shadow-lg text-sm sm:text-base lg:text-lg px-2.5 sm:px-4 lg:px-6 rounded-lg text-white transition-colors cursor-pointer">
                    <span className="xl:hidden">Start</span>
                    <span className="hidden xl:inline">Get Started</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
