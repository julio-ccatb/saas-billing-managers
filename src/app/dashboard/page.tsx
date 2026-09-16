"use client";

import React from "react";
import Link from "next/link";
import {
  DollarSign,
  AlertCircle,
  Activity,
  CheckCircle2,
  Plus,
  FileSignature,
  Building2,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { api } from "~/trpc/react";
import { formatCurrency } from "~/lib/utils/format";
import { Button } from "~/components/ui/button";
import { AppRoutes } from "~/config/routes";
import { RecentInvoicesTable } from "~/features/billing/components/RecentInvoicesTable";
import { AuditFeed } from "~/features/audit/components/AuditFeed";

export default function DashboardPage() {
  const { data: invoiceMetrics, isLoading: loadingInvoiceMetrics } =
    api.invoice.getMetrics.useQuery(undefined, { retry: false });

  const { data: contractMetrics, isLoading: loadingContractMetrics } =
    api.contract.getMetrics.useQuery(undefined, { retry: false });

  const { data: licenseMetrics, isLoading: loadingLicenseMetrics } =
    api.license.getMetrics.useQuery(undefined, { retry: false });

  const { data: recentInvoices, isLoading: loadingInvoices } =
    api.invoice.getAll.useQuery(
      { page: 1, pageSize: 6 },
      { retry: false }
    );

  const { data: recentAuditLogs, isLoading: loadingAudit } =
    api.audit.getRecent.useQuery({ limit: 6 }, { retry: false });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Command Center Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
              Command Center
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mt-0.5">
            Operations &amp; Billing Controller
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time client runtime status, subscription contracts, and financial ledgers
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            render={<Link href={AppRoutes.CUSTOMER_NEW} />}
            nativeButton={false}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <Building2 className="w-4 h-4" />
            <span>Onboard Client</span>
          </Button>
          <Button
            render={<Link href={AppRoutes.CONTRACTS} />}
            nativeButton={false}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <FileSignature className="w-4 h-4" />
            <span>New Contract</span>
          </Button>
          <Button
            render={<Link href={AppRoutes.INVOICE_NEW()} />}
            nativeButton={false}
            size="sm"
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </Button>
        </div>
      </div>

      {/* CSOC Bento Grid: Metrics & Intelligence */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="hover:border-border/80 transition-shadow rounded-xl border border-border bg-card p-5 flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Monthly Recurring Revenue
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground font-mono tracking-tight">
              {loadingContractMetrics ? "..." : formatCurrency(contractMetrics?.estimatedMRR ?? 0)}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 font-mono">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span>
                {contractMetrics?.activeCount ?? 0} active contracts (ARR:{" "}
                {formatCurrency((contractMetrics?.estimatedMRR ?? 0) * 12)})
              </span>
            </div>
          </div>
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Overdue Collections */}
        <div className="hover:border-border/80 transition-shadow rounded-xl border border-border bg-card p-5 flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Overdue Collections
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-destructive font-mono tracking-tight">
              {loadingInvoiceMetrics ? "..." : formatCurrency(invoiceMetrics?.totalOverdue ?? 0)}
            </p>
            <div className="flex items-center gap-2 text-xs pt-1">
              <span className="font-mono text-muted-foreground">
                {invoiceMetrics?.counts.overdue ?? 0} past due
              </span>
              {Boolean(invoiceMetrics?.aging.over60) && (
                <span className="px-1.5 py-0.5 rounded bg-destructive/10 text-destructive text-[10px] font-semibold font-mono">
                  {formatCurrency(invoiceMetrics?.aging.over60 ?? 0)} &gt;60d
                </span>
              )}
            </div>
          </div>
          <div className="p-2.5 bg-destructive/10 text-destructive rounded-xl shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Service Switchboard */}
        <div className="hover:border-border/80 transition-shadow rounded-xl border border-border bg-card p-5 flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Service Switchboard
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground font-mono tracking-tight">
              {loadingLicenseMetrics ? "..." : licenseMetrics?.active ?? 0}
              <span className="text-sm font-normal text-muted-foreground ml-1">active</span>
            </p>
            <div className="flex items-center gap-2 text-xs pt-1 font-mono">
              {Boolean(licenseMetrics?.suspended) ? (
                <span className="inline-flex items-center gap-1 text-destructive font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {licenseMetrics?.suspended} suspended
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  All systems online
                </span>
              )}
              <span className="text-muted-foreground/60">•</span>
              <span className="text-muted-foreground">
                {(licenseMetrics?.totalChecks ?? 0).toLocaleString()} pings
              </span>
            </div>
          </div>
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Collected Ledger */}
        <div className="hover:border-border/80 transition-shadow rounded-xl border border-border bg-card p-5 flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Collected Ledger
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-foreground font-mono tracking-tight">
              {loadingInvoiceMetrics ? "..." : formatCurrency(invoiceMetrics?.totalPaid ?? 0)}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 font-mono">
              <span>{invoiceMetrics?.counts.paid ?? 0} paid</span>
              <span>•</span>
              <span>{formatCurrency(invoiceMetrics?.totalPending ?? 0)} pending</span>
            </div>
          </div>
          <div className="p-2.5 bg-secondary text-secondary-foreground rounded-xl shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentInvoicesTable invoices={recentInvoices?.invoices} isLoading={loadingInvoices} />
        <AuditFeed logs={recentAuditLogs} isLoading={loadingAudit} />
      </div>
    </div>
  );
}
