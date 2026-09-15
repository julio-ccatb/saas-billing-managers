"use client";

import React from "react";
import Link from "next/link";
import { 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Activity,
  FileCheck2,
  FileSignature,
  History,
  TrendingUp,
  AlertTriangle,
  Building2
} from "lucide-react";
import { api } from "~/trpc/react";
import { formatCurrency, formatDate } from "~/lib/utils/format";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { AppRoutes } from "~/config/routes";
import { Badge } from "~/components/ui/badge";

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge variant="success">Paid</Badge>;
      case "OVERDUE":
        return <Badge variant="destructive">Overdue</Badge>;
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  const getAuditActionBadge = (action: string) => {
    switch (action) {
      case "SERVICE_SUSPENDED":
        return <Badge variant="destructive">Suspended</Badge>;
      case "SERVICE_ACTIVATED":
        return <Badge variant="success">Activated</Badge>;
      case "KEY_REGENERATED":
        return <Badge variant="warning">Key Rotated</Badge>;
      case "CONTRACT_CREATED":
        return <Badge variant="secondary">Contract</Badge>;
      case "BILLING_OVERRIDE":
        return <Badge variant="outline">Billing Override</Badge>;
      default:
        return <Badge variant="secondary">{action.replace("_", " ")}</Badge>;
    }
  };

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
        {/* Metric 1: Monthly Recurring Revenue (MRR) */}
        <Card className="hover:border-border/80 transition-shadow">
          <CardContent className="p-5 flex items-start justify-between">
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
          </CardContent>
        </Card>

        {/* Metric 2: Overdue Invoices & Aging */}
        <Card className="hover:border-border/80 transition-shadow">
          <CardContent className="p-5 flex items-start justify-between">
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
          </CardContent>
        </Card>

        {/* Metric 3: Active Client Services & Health */}
        <Card className="hover:border-border/80 transition-shadow">
          <CardContent className="p-5 flex items-start justify-between">
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
          </CardContent>
        </Card>

        {/* Metric 4: Collected vs Pending */}
        <Card className="hover:border-border/80 transition-shadow">
          <CardContent className="p-5 flex items-start justify-between">
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
          </CardContent>
        </Card>
      </div>

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Invoices Ledger */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">Recent Invoices &amp; Ledger</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Latest transactions and status changes</p>
            </div>
            <Button
              render={<Link href={AppRoutes.INVOICES} />}
              nativeButton={false}
              variant="ghost"
              size="sm"
              className="text-xs gap-1 text-primary hover:text-primary"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <th className="py-3 px-5">Invoice</th>
                  <th className="py-3 px-5">Customer</th>
                  <th className="py-3 px-5">Due Date</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingInvoices ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-muted-foreground">
                      Loading ledger records...
                    </td>
                  </tr>
                ) : !recentInvoices?.invoices || recentInvoices.invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-muted-foreground">
                      No invoices found. Create your first invoice to populate the ledger.
                    </td>
                  </tr>
                ) : (
                  recentInvoices.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-5">
                        <Link
                          href={AppRoutes.INVOICE_DETAILS(inv.id)}
                          className="font-mono font-medium text-foreground hover:text-primary transition-colors text-xs sm:text-sm"
                        >
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground text-xs sm:text-sm truncate">
                            {inv.receiverName || "Unnamed Client"}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">{inv.receiverEmail}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="py-3.5 px-5">
                        {getStatusBadge(inv.status)}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-semibold text-foreground text-xs sm:text-sm">
                        {formatCurrency(inv.totalAmount, inv.currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right 1 Column: Real-Time Audit Activity Feed */}
        <Card className="overflow-hidden flex flex-col">
          <CardHeader className="p-4 sm:p-5 border-b border-border flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <div>
                <CardTitle className="text-base sm:text-lg">Audit Ledger</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Immutable operator trail</p>
              </div>
            </div>
            <Button
              render={<Link href={AppRoutes.AUDIT} />}
              nativeButton={false}
              variant="ghost"
              size="sm"
              className="text-xs gap-1 text-primary hover:text-primary"
            >
              <span>Audit Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>

          <CardContent className="p-4 flex-1">
            {loadingAudit ? (
              <p className="text-xs text-muted-foreground text-center py-8">Loading audit trail...</p>
            ) : !recentAuditLogs || recentAuditLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground space-y-1">
                <History className="w-8 h-8 mx-auto text-muted-foreground/40" />
                <p className="text-xs">No audit events recorded yet</p>
                <p className="text-[11px] text-muted-foreground/60">
                  Destructive actions and status changes will be securely logged here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {getAuditActionBadge(log.action)}
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-foreground font-medium leading-snug">
                      {log.reason || "Action performed by operator"}
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-0.5">
                      <span>Operator: {log.operatorId.split("@")[0]}</span>
                      <span className="uppercase">{log.entityType}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
