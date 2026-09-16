"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "~/trpc/react";

export interface CompanyInfo {
  id: string;
  name: string;
  role: string;
  currency: string;
  logoUrl?: string | null;
}

interface CompanyContextType {
  activeCompanyId: string | null;
  activeCompany: CompanyInfo | null;
  companies: CompanyInfo[];
  isLoading: boolean;
  switchCompany: (companyId: string) => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  isMembersModalOpen: boolean;
  setIsMembersModalOpen: (open: boolean) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const match = document.cookie.match(/active_company_id=([^;]+)/);
      if (match?.[1]) return decodeURIComponent(match[1]);
      return localStorage.getItem("active_company_id");
    }
    return null;
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  const utils = api.useUtils();
  const { data: companiesData, isLoading } = api.company.list.useQuery();

  // Normalize companies list
  const companies: CompanyInfo[] = React.useMemo(() => {
    if (!companiesData) return [];
    return companiesData.map((c) => ({
      id: c.id,
      name: c.name,
      role: c.role,
      currency: c.currency,
      logoUrl: c.logoUrl,
    }));
  }, [companiesData]);

  // Sync activeCompanyId when companies load
  useEffect(() => {
    if (companies.length > 0) {
      if (!activeCompanyId || !companies.some((c) => c.id === activeCompanyId)) {
        const defaultId = companies[0]!.id;
        setActiveCompanyId(defaultId);
        if (typeof window !== "undefined") {
          document.cookie = `active_company_id=${encodeURIComponent(defaultId)}; path=/; max-age=31536000; SameSite=Lax`;
          localStorage.setItem("active_company_id", defaultId);
        }
      }
    }
  }, [companies, activeCompanyId]);

  const switchCompany = (newCompanyId: string) => {
    setActiveCompanyId(newCompanyId);
    if (typeof window !== "undefined") {
      document.cookie = `active_company_id=${encodeURIComponent(newCompanyId)}; path=/; max-age=31536000; SameSite=Lax`;
      localStorage.setItem("active_company_id", newCompanyId);
    }
    // Invalidate all tRPC queries to reflect newly active company data
    void utils.invalidate();
  };

  const activeCompany = companies.find((c) => c.id === activeCompanyId) ?? companies[0] ?? null;

  return (
    <CompanyContext.Provider
      value={{
        activeCompanyId,
        activeCompany,
        companies,
        isLoading,
        switchCompany,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isMembersModalOpen,
        setIsMembersModalOpen,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}


export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}
