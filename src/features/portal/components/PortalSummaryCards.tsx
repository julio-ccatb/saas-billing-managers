"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Clock, 
  CheckCircle2, 
  CreditCard, 
  ArrowRight, 
  Copy, 
  Check, 
  ShieldAlert, 
  Building, 
  FileCheck2 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { formatCurrency } from "~/lib/utils/format";
import { AppRoutes } from "~/config/routes";

interface PortalSummaryCardsProps {
  overview: any;
}

export function PortalSummaryCards({ overview }: PortalSummaryCardsProps) {
  const hasOverdue = (overview?.stats.totalDue ?? 0) > 0;
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
      {/* Bento Main: Account Status & Balance Card (8 cols) */}
      <Card className="lg:col-span-8 overflow-hidden border-border/80 bg-gradient-to-br from-card via-card to-muted/30 shadow-xs relative">
        <div className="p-6 sm:p-7 flex flex-col justify-between h-full gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                  Account Standing
                </span>
                <span className="text-muted-foreground/30">•</span>
                <span className="text-xs text-muted-foreground">ID: {overview?.customer.code || overview?.customer.id.slice(-6).toUpperCase()}</span>
              </div>
              {hasOverdue ? (
                <Badge variant="warning" className="gap-1.5 px-2.5 py-1 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Payment Due</span>
                </Badge>
              ) : (
                <Badge variant="success" className="gap-1.5 px-2.5 py-1 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>All Invoices Cleared</span>
                </Badge>
              )}
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                Welcome, {overview?.customer.name}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
                Access your real-time software licenses, download tax-compliant invoice PDFs, and submit wire transfer confirmations.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-muted-foreground">Outstanding Total Balance</span>
              <p className="text-3xl sm:text-4xl font-mono font-bold text-foreground tracking-tight mt-0.5 tabular-nums">
                {formatCurrency(overview?.stats.totalDue ?? 0, overview?.issuerCompany.currency ?? "USD")}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <span className="size-2 rounded-full bg-amber-500/80" />
                  <strong className="text-foreground font-semibold">{overview?.stats.pendingCount ?? 0}</strong> unpaid
                </span>
                <span className="text-muted-foreground/30">•</span>
                <span className="inline-flex items-center gap-1">
                  <span className="size-2 rounded-full bg-purple-500/80" />
                  <strong className="text-foreground font-semibold">{overview?.stats.verificationCount ?? 0}</strong> in verification
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                render={<Link href={AppRoutes.PORTAL_INVOICES} />}
                size="default"
                className="gap-2 font-medium cursor-pointer shadow-xs text-xs h-9"
              >
                <span>View Invoices &amp; Ledger</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Bento Side: Bank Wire / Remittance Info (4 cols) */}
      <Card className="lg:col-span-4 overflow-hidden border-border/80 bg-card shadow-xs flex flex-col justify-between">
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Bank Remittance
              </span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase bg-muted/60 px-2 py-0.5 rounded">
              Direct Wire
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">
                Beneficiary / Entity
              </span>
              <p className="font-semibold text-foreground truncate">
                {overview?.issuerCompany.bankAccountName || overview?.issuerCompany.name}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">
                Financial Institution
              </span>
              <p className="text-foreground font-medium truncate">
                {overview?.issuerCompany.bankName || "Specified per invoice"}
              </p>
            </div>

            {overview?.issuerCompany.bankAccountNumber && (
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">
                  Account / IBAN
                </span>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/60 border border-border/60 font-mono text-xs text-foreground">
                  <span className="truncate select-all">{overview.issuerCompany.bankAccountNumber}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(overview.issuerCompany.bankAccountNumber, "account")}
                    className="text-muted-foreground hover:text-foreground cursor-pointer ml-2 p-1"
                    title="Copy account number"
                  >
                    {copiedField === "account" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-muted/40 border-t border-border/60 text-[11px] text-muted-foreground flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-primary shrink-0" />
          <span>Upload transfer receipts below to instantly clear service holds.</span>
        </div>
      </Card>
    </div>
  );
}
