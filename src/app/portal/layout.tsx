"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Receipt,
  KeyRound,
  FileSignature,
  Building2,
  LogOut,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { AppRoutes } from "~/config/routes";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: overview, isLoading } = api.portal.getOverview.useQuery();

  const navItems = [
    { label: "Overview", href: AppRoutes.PORTAL },
    { label: "Invoices & Payments", href: AppRoutes.PORTAL_INVOICES },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Customer identifier */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {overview?.issuerCompany.name || "Client Software Operations"}
                </span>
                <span className="text-muted-foreground/40 text-xs">/</span>
                <span className="text-xs font-semibold text-primary">Portal</span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-foreground truncate leading-tight">
                {overview?.customer.name || "My Account"}
              </h1>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Sign out */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: AppRoutes.PORTAL_LOGIN })}
              className="gap-1.5 text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center gap-1 px-4 py-2 border-t border-border/50 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1 rounded-md text-xs font-semibold shrink-0 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground bg-muted/40"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {children}
      </main>

      {/* Client Portal Footer */}
      <footer className="border-t border-border bg-card/40 py-6 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} {overview?.issuerCompany.name || "Operations & Billing"}. Secure Client Portal.</p>
          <p className="font-mono text-[11px]">
            Billing queries: {overview?.issuerCompany.email || "support@company.com"}
          </p>
        </div>
      </footer>
    </div>
  );
}
