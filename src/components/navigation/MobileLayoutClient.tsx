"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MobileHeader } from "./MobileHeader";
import { MobileSidebarWrapper } from "./MobileSidebarWrapper";
import type { SessionUser } from "@/lib/auth/session";

type MobileLayoutClientProps = {
  user: SessionUser | null;
};

export function MobileLayoutClient({ user }: MobileLayoutClientProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);
  const isMenuOpenRef = useRef(isMenuOpen);

  // Keep ref in sync with state
  useEffect(() => {
    isMenuOpenRef.current = isMenuOpen;
  }, [isMenuOpen]);

  // Close menu when route changes
  // This is a valid use case: closing UI state when navigation occurs
  useEffect(() => {
    if (prevPathnameRef.current !== pathname && isMenuOpenRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsMenuOpen(false);
    }
    prevPathnameRef.current = pathname;
  }, [pathname]);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <MobileHeader onMenuToggle={toggleMenu} isMenuOpen={isMenuOpen} />
      <MobileSidebarWrapper
        user={user}
        isOpen={isMenuOpen}
        onClose={closeMenu}
      />
    </>
  );
}
