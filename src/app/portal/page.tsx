"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Receipt, 
  KeyRound, 
  FileSignature, 
  Upload, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Building2,
  DollarSign
} from "lucide-react";
import { api } from "~/trpc/react";
import { formatCurrency, formatDate } from "~/lib/utils/format";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { AppRoutes } from "~/config/routes";
import { UploadReceiptModal } from "./components/UploadReceiptModal";

export default function PortalOverviewPage() {
  const { data: overview, isLoading } = api.portal.getOverview.useQuery();
  const { data: licenses } = api.portal.getLicenses.useQuery();
  const { data: contracts } = api.portal.getContracts.useQuery();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState<any>(null);

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge variant="success">Paid</Badge>;
      case "PAYMENT_PENDING_VERIFICATION":
        return <Badge variant="verification">Verification Pending</Badge>;
      case "OVERDUE":
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-muted-foreground text-xs">
        Loading client portal data...
      </div>
    );
  }

  const hasOverdue = (overview?.stats.totalDue ?? 0) > 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Client Welcome & Outstanding Balance Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Banner 1: Account Status & Balance */}
        <Card className="md:col-span-2 overflow-hidden border-border bg-gradient-to-br from-card to-muted/20">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
                Account Health
              </span>
              {hasOverdue ? (
                <Badge variant="warning" className="gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Payment Due</span>
                </Badge>
              ) : (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Account in Good Standing</span>
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-foreground mt-1">
              Welcome back, {overview?.customer.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your software services, download statements, and submit payment verifications.
            </p>
          </CardHeader>
          <CardContent className="p-5 pt-2 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs text-muted-foreground">Outstanding Balance</span>
              <p className="text-3xl sm:text-4xl font-mono font-bold text-foreground tracking-tight mt-0.5">
                {formatCurrency(overview?.stats.totalDue ?? 0, overview?.issuerCompany.currency ?? "USD")}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {overview?.stats.pendingCount} unpaid invoice(s) •{" "}
                {overview?.stats.verificationCount} currently in verification
              </p>
            </div>
            <Button
              render={<Link href={AppRoutes.PORTAL_INVOICES} />}
              nativeButton={false}
              size="sm"
              className="gap-1.5 self-start sm:self-auto"
            >
              <span>View All Invoices</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Banner 2: Bank Remittance Details */}
        <Card className="p-5 flex flex-col justify-between border-border bg-card">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-foreground mb-3">
              <CreditCard className="w-4 h-4 text-primary" />
              <span>Remittance &amp; Wire Info</span>
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-sans">Bank Name</p>
                <p className="font-semibold text-foreground">{overview?.issuerCompany.bankName || "Not configured"}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-sans">Account Beneficiary</p>
                <p className="text-foreground">{overview?.issuerCompany.bankAccountName || overview?.issuerCompany.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-sans">Account / IBAN</p>
                <p className="text-foreground">{overview?.issuerCompany.bankAccountNumber || "Provided in statement"}</p>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-4">
            Upload transfer confirmation slips below to clear billing holds.
          </p>
        </Card>
      </div>

      {/* Grid Section: Invoices & Software Licenses */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Recent Invoices & Receipt Submissions */}
        <Card className="lg:col-span-7 overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-border flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              <div>
                <CardTitle className="text-base font-bold">Recent Invoices &amp; Receipts</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Submit payment proofs to accelerate verification</p>
              </div>
            </div>
            <Button
              render={<Link href={AppRoutes.PORTAL_INVOICES} />}
              nativeButton={false}
              variant="ghost"
              size="sm"
              className="text-xs gap-1 text-primary hover:text-primary"
            >
              <span>View ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  <th className="py-3 px-5">Invoice #</th>
                  <th className="py-3 px-5">Due Date</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Amount</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {!overview?.recentInvoices || overview.recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-xs text-muted-foreground">
                      No invoices on record for this account.
                    </td>
                  </tr>
                ) : (
                  overview.recentInvoices.map((inv) => {
                    const isPaid = inv.status === "PAID";
                    const isVerification = inv.status === "PAYMENT_PENDING_VERIFICATION";

                    return (
                      <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-5 font-mono text-xs font-semibold text-foreground">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                          {formatDate(inv.dueDate)}
                        </td>
                        <td className="py-3.5 px-5">
                          {getStatusBadge(inv.status)}
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono font-semibold text-xs sm:text-sm text-foreground">
                          {formatCurrency(inv.totalAmount, inv.currency)}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          {isPaid ? (
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                              <Check className="w-3.5 h-3.5" /> Paid
                            </span>
                          ) : isVerification ? (
                            <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">
                              Reviewing
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedInvoiceForReceipt(inv)}
                              className="text-xs h-7 gap-1"
                            >
                              <Upload className="w-3 h-3" />
                              <span>Upload Receipt</span>
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right 5 Cols: Active Software Licenses & Service Leases */}
        <Card className="lg:col-span-5 overflow-hidden flex flex-col">
          <CardHeader className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" />
              <div>
                <CardTitle className="text-base font-bold">Active Software Licenses</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Runtime access keys &amp; domain locks</p>
              </div>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {licenses?.length ?? 0} provisioned
            </Badge>
          </CardHeader>

          <CardContent className="p-4 flex-1 divide-y divide-border space-y-3">
            {!licenses || licenses.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No active software licenses assigned.
              </p>
            ) : (
              licenses.map((lic) => (
                <div key={lic.id} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground">{lic.name}</span>
                    <Badge variant={lic.status === "ACTIVE" ? "success" : "destructive"}>
                      {lic.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/60 border border-border">
                    <span className="font-mono text-[11px] text-foreground truncate select-all">
                      {lic.keyPrefix}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Domain: {lic.allowedDomain || "Any domain"}</span>
                    <span>Last heartbeat: {lic.lastCheckedAt ? formatDate(lic.lastCheckedAt) : "N/A"}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contracts & SLAs Section */}
      <Card>
        <CardHeader className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-primary" />
            <div>
              <CardTitle className="text-base font-bold">Signed Contracts &amp; Service Agreements</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Legal binding agreements and billing cycles</p>
            </div>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="py-3 px-5">Contract Title</th>
                <th className="py-3 px-5">Billing Cycle</th>
                <th className="py-3 px-5">Effective Date</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Commitment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!contracts || contracts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                    No contracts recorded.
                  </td>
                </tr>
              ) : (
                contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-5">
                      <p className="font-semibold text-xs sm:text-sm text-foreground">{c.title}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{c.contractNumber}</p>
                    </td>
                    <td className="py-3 px-5 font-mono text-xs text-muted-foreground">
                      {c.billingCycle}
                    </td>
                    <td className="py-3 px-5 font-mono text-xs text-muted-foreground">
                      {formatDate(c.startDate)}
                    </td>
                    <td className="py-3 px-5">
                      <Badge variant={c.status === "ACTIVE" ? "success" : "secondary"}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-5 text-right font-mono font-semibold text-xs sm:text-sm text-foreground">
                      {formatCurrency(c.value, c.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Upload Receipt Modal */}
      <UploadReceiptModal
        isOpen={!!selectedInvoiceForReceipt}
        onClose={() => setSelectedInvoiceForReceipt(null)}
        invoice={selectedInvoiceForReceipt}
      />
    </div>
  );
}
