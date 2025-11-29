"use client";

import { useState, createContext, useContext } from "react";

const FilterToggleContext = createContext<{
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
} | null>(null);

export function FilterToggleWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <FilterToggleContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </FilterToggleContext.Provider>
  );
}

export function useFilterToggle() {
  const context = useContext(FilterToggleContext);
  if (!context) {
    throw new Error("useFilterToggle must be used within FilterToggleWrapper");
  }
  return context;
}
