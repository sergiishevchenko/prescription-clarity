"use client";

import { useState, useEffect } from "react";
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

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
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
