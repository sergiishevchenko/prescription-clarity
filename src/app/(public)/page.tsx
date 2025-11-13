import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl py-12 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Welcome to Prescription Clarity
            </h1>
            <p className="mx-auto mt-3 max-w-md text-base text-gray-500 sm:text-lg md:mt-5 md:max-w-3xl md:text-xl">
              Your digital adherence companion for medications and supplements.
              Never miss a dose again.
            </p>
            <div className="mx-auto mt-5 max-w-md gap-3 sm:flex sm:justify-center md:mt-8">
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full cursor-pointer border-indigo-600 text-indigo-600 hover:bg-indigo-50 sm:w-auto"
                >
                  Get Started
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="lg"
                  className="w-full cursor-pointer bg-indigo-600 hover:bg-indigo-700 sm:w-auto"
                >
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
