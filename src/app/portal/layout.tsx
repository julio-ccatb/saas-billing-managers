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
    { label: "Overview", href: AppRoutes.PORTAL, icon: ShieldCheck },
    { label: "Invoices & Statements", href: AppRoutes.PORTAL_INVOICES, icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-background/50 flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/80 supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Customer identifier */}
          <div className="flex items-center gap-3.5 min-w-0">
            <Link
              href={AppRoutes.PORTAL}
              className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs font-bold text-sm shrink-0 hover:opacity-90 transition-opacity"
            >
              <ShieldCheck className="w-5 h-5" />
            </Link>
            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-medium truncate max-w-[140px] sm:max-w-xs">
                  {overview?.issuerCompany.name || "Software Operations"}
                </span>
                <span className="text-muted-foreground/30">/</span>
                <span className="font-semibold text-primary/90">Client Portal</span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-foreground truncate tracking-tight">
                {overview?.customer.name || "Client Account"}
              </h1>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-background text-foreground font-semibold shadow-xs border border-border/60"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions & Sign out */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: AppRoutes.PORTAL_LOGIN })}
              className="gap-1.5 text-xs h-8 text-muted-foreground hover:text-foreground border-border/80"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center gap-1.5 px-4 py-2 border-t border-border/60 bg-muted/20 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                  isActive
                    ? "bg-background text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground bg-muted/50"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-primary" : ""}`} />
                <span>{item.label}</span>
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
      <footer className="border-t border-border/80 bg-card/60 py-6 text-xs text-muted-foreground mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <p className="font-medium text-foreground">
              {overview?.issuerCompany.name || "Client Software Operations"}
            </p>
            <span className="text-muted-foreground/40">•</span>
            <span>Secure Operations &amp; Billing Portal</span>
          </div>
          <p className="font-mono text-[11px] text-muted-foreground">
            Support:{" "}
            <a
              href={`mailto:${overview?.issuerCompany.email || "support@company.com"}`}
              className="text-foreground hover:underline"
            >
              {overview?.issuerCompany.email || "support@company.com"}
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
