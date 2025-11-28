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
    <header className="z-50 border-b border-slate-200 bg-white shadow-sm backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-2 sm:px-3 lg:px-4">
        <div className="flex items-center justify-between py-3 sm:py-4 lg:py-5">
          <div className="flex min-w-0 flex-shrink-0 items-center gap-2 sm:gap-3 lg:gap-4">
            <Image
              src="/logo.svg"
              alt="Prescription Clarity Logo"
              width={64}
              height={64}
              className="h-8 w-8 flex-shrink-0 sm:h-12 sm:w-12 lg:h-16 lg:w-16"
              style={{ objectFit: "contain" }}
            />
            <div className="min-w-0 flex-shrink-0">
              <Link href={homeHref}>
                <h1 className="truncate text-xs font-bold tracking-tight text-slate-900 sm:text-lg lg:text-xl">
                  Prescription Clarity
                </h1>
                <p className="mt-0.5 hidden text-xs text-slate-500 sm:text-sm md:block">
                  Medication Management Made Simple
                </p>
              </Link>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
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
                    className="h-10 min-w-[70px] cursor-pointer rounded-lg border-2 border-slate-300 px-2.5 text-sm text-slate-900 transition-colors hover:bg-slate-50 sm:h-14 sm:min-w-[100px] sm:px-4 sm:text-base lg:h-16 lg:min-w-[120px] lg:px-6 lg:text-lg"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="h-10 min-w-[70px] cursor-pointer rounded-lg bg-blue-600 px-2.5 text-sm text-white shadow-lg transition-colors hover:bg-blue-700 sm:h-14 sm:min-w-[100px] sm:px-4 sm:text-base lg:h-16 lg:min-w-[120px] lg:px-6 lg:text-lg">
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
