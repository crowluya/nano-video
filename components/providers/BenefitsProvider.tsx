"use client";

import { UserBenefits } from "@/actions/usage/benefits";
import { createContext } from "react";

export const BenefitsContext =
  createContext<Promise<UserBenefits | null> | null>(null);
interface BenefitsProviderProps {
  children: React.ReactNode;
  value: Promise<UserBenefits | null> | null;
}

export const BenefitsProvider: React.FC<BenefitsProviderProps> = ({
  children,
  value,
}) => {
  return (
    <BenefitsContext.Provider value={value}>
      {children}
    </BenefitsContext.Provider>
  );
};
