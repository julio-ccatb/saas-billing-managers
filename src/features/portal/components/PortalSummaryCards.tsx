"use client";

import Link from "next/link";
import { Clock, CheckCircle2, CreditCard, ArrowRight } from "lucide-react";
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

  return (
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
  );
}
