"use client";

import React from "react";
import Link from "next/link";
import { 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  FileText,
  ArrowRight
} from "lucide-react";
import { api } from "~/trpc/react";
import { formatCurrency, formatDate } from "~/lib/utils/format";
import { DashboardLayout } from "~/components/layout/DashboardLayout";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

export default function DashboardPage() {
  const { data: metrics, isLoading: loadingMetrics } = api.invoice.getMetrics.useQuery(undefined, {
    retry: false,
  });

  const { data: recentData, isLoading: loadingInvoices } = api.invoice.getAll.useQuery(
    { page: 1, pageSize: 5 },
    { retry: false }
  );

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

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Financial Overview</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Track your invoices, revenue, and pending collections</p>
          </div>
          <Button
            render={<Link href="/invoices/new" />}
            nativeButton={false}
            className="self-start sm:self-auto gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </Button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Invoiced */}
          <Card className="hover:border-border/80 transition-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Invoiced</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 font-mono">
                  {loadingMetrics ? "..." : formatCurrency(metrics?.totalInvoiced ?? 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{metrics?.counts.total ?? 0} invoices</p>
              </div>
            </CardContent>
          </Card>

          {/* Paid */}
          <Card className="hover:border-border/80 transition-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl shrink-0">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Collected</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 font-mono">
                  {loadingMetrics ? "..." : formatCurrency(metrics?.totalPaid ?? 0)}
                </p>
                <p className="text-xs text-emerald-600 font-medium mt-0.5">{metrics?.counts.paid ?? 0} paid</p>
              </div>
            </CardContent>
          </Card>

          {/* Pending */}
          <Card className="hover:border-border/80 transition-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pending</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 font-mono">
                  {loadingMetrics ? "..." : formatCurrency(metrics?.totalPending ?? 0)}
                </p>
                <p className="text-xs text-amber-600 font-medium mt-0.5">{metrics?.counts.pending ?? 0} awaiting</p>
              </div>
            </CardContent>
          </Card>

          {/* Overdue */}
          <Card className="hover:border-border/80 transition-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-destructive/10 text-destructive rounded-xl shrink-0">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Overdue</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 font-mono">
                  {loadingMetrics ? "..." : formatCurrency(metrics?.totalOverdue ?? 0)}
                </p>
                <p className="text-xs text-destructive font-medium mt-0.5">{metrics?.counts.overdue ?? 0} overdue</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Invoices Card */}
        <Card className="overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">Recent Invoices</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Latest billing activity and updates</p>
            </div>
            <Button
              render={<Link href="/invoices" />}
              nativeButton={false}
              variant="ghost"
              size="sm"
              className="text-xs gap-1 text-primary hover:text-primary"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>

          {/* Desktop Table View (hidden on mobile) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <th className="py-3 px-5">Invoice</th>
                  <th className="py-3 px-5">Client</th>
                  <th className="py-3 px-5">Due Date</th>
                  <th className="py-3 px-5">Amount</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loadingInvoices ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                      Loading invoices...
                    </td>
                  </tr>
                ) : !recentData?.invoices || recentData.invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="max-w-sm mx-auto space-y-3">
                        <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                        <p className="text-muted-foreground text-sm font-medium">No invoices created yet</p>
                        <Button
                          render={<Link href="/invoices/new" />}
                          nativeButton={false}
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Create your first invoice
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentData.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-foreground">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-5 text-muted-foreground">
                        {inv.receiverName}
                      </td>
                      <td className="py-3.5 px-5 text-muted-foreground text-xs">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-foreground font-mono">
                        {formatCurrency(inv.totalAmount, inv.currency)}
                      </td>
                      <td className="py-3.5 px-5">
                        {getStatusBadge(inv.status)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Button
                          render={<Link href={`/invoices/${inv.id}/edit`} />}
                          nativeButton={false}
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-primary"
                        >
                          View / Edit
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (visible only on mobile) */}
          <div className="md:hidden divide-y divide-border">
            {loadingInvoices ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                Loading invoices...
              </div>
            ) : !recentData?.invoices || recentData.invoices.length === 0 ? (
              <div className="text-center py-10 px-4 space-y-3">
                <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <p className="text-muted-foreground text-sm">No invoices created yet</p>
                <Button
                  render={<Link href="/invoices/new" />}
                  nativeButton={false}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Create invoice
                </Button>
              </div>
            ) : (
              recentData.invoices.map((inv) => (
                <div key={inv.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">{inv.invoiceNumber}</span>
                    {getStatusBadge(inv.status)}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">{inv.receiverName}</span>
                    <span className="font-bold text-foreground font-mono">{formatCurrency(inv.totalAmount, inv.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Due {formatDate(inv.dueDate)}</span>
                    <Link
                      href={`/invoices/${inv.id}/edit`}
                      className="text-primary font-semibold hover:underline"
                    >
                      View / Edit →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
