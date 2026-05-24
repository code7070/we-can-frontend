import { createContext, useContext } from "react";
import type { Company } from "@/api/types";

const CompanyContext = createContext<Company | null>(null);

export function CompanyProvider({
  company,
  children,
}: {
  company: Company;
  children: React.ReactNode;
}) {
  return (
    <CompanyContext.Provider value={company}>{children}</CompanyContext.Provider>
  );
}

export function useCompany(): Company {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompany must be used inside a company route (/c/...)");
  return ctx;
}

export function useCompanyOptional(): Company | null {
  return useContext(CompanyContext);
}
