"use client";

import { Building2, FileSignature, KeyRound, Receipt, Rocket, ArrowLeft, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { formatCurrency } from "~/lib/utils/format";

interface StepReviewProps {
  profile: any;
  contract: any;
  license: any;
  invoice: any;
  onBack: () => void;
  onLaunch: () => void;
  isPending: boolean;
}

export function StepReview({
  profile,
  contract,
  license,
  invoice,
  onBack,
  onLaunch,
  isPending,
}: StepReviewProps) {
  return (
    <Card className="border-border">
      <CardHeader className="p-5 border-b border-border">
        <CardTitle className="text-base flex items-center gap-2">
          <Rocket className="w-5 h-5 text-primary" />
          <span>Onboarding Summary &amp; Confirmation</span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Review configured client resources before atomic deployment
        </p>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Bento Review Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Profile Overview */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-primary" /> Client Profile
              </span>
              <Badge variant="success">Ready</Badge>
            </div>
            <div className="space-y-1 font-mono text-muted-foreground pt-1">
              <p className="font-bold text-foreground text-sm">{profile.name}</p>
              <p>{profile.email || "No email"}</p>
              <p>{profile.phone || "No phone"}</p>
              {profile.taxId && <p>Tax ID: {profile.taxId}</p>}
            </div>
          </div>

          {/* Contract Overview */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <FileSignature className="w-4 h-4 text-primary" /> Contract
              </span>
              {contract.enabled ? (
                <Badge variant="success">Included</Badge>
              ) : (
                <Badge variant="secondary">Skipped</Badge>
              )}
            </div>
            {contract.enabled ? (
              <div className="space-y-1 font-mono text-muted-foreground pt-1">
                <p className="font-bold text-foreground text-sm">
                  {formatCurrency(contract.value, contract.currency)}{" "}
                  <span className="text-xs font-normal">/ {contract.billingCycle.toLowerCase()}</span>
                </p>
                <p className="truncate">{contract.title}</p>
                <p>Starts: {contract.startDate instanceof Date ? contract.startDate.toISOString().split("T")[0] : ""}</p>
              </div>
            ) : (
              <p className="text-muted-foreground pt-1">No contract will be created.</p>
            )}
          </div>

          {/* License Overview */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-primary" /> Runtime License
              </span>
              {license.enabled ? (
                <Badge variant="success">Provisioning</Badge>
              ) : (
                <Badge variant="secondary">Skipped</Badge>
              )}
            </div>
            {license.enabled ? (
              <div className="space-y-1 font-mono text-muted-foreground pt-1">
                <p className="font-bold text-foreground">{license.name}</p>
                <p>Domain: {license.allowedDomain || "Unrestricted"}</p>
                <p>Lease: {license.leaseTtlMinutes}m (Grace: {license.gracePeriodHours}h)</p>
              </div>
            ) : (
              <p className="text-muted-foreground pt-1">No license key will be generated.</p>
            )}
          </div>

          {/* Invoice Overview */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-primary" /> Initial Bill
              </span>
              {invoice.enabled ? (
                <Badge variant="success">Included</Badge>
              ) : (
                <Badge variant="secondary">Skipped</Badge>
              )}
            </div>
            {invoice.enabled ? (
              <div className="space-y-1 font-mono text-muted-foreground pt-1">
                <p className="font-bold text-foreground text-sm">
                  {formatCurrency(invoice.amount, contract.currency)}
                </p>
                <p className="truncate">{invoice.description}</p>
                <p>Due: {invoice.dueDate instanceof Date ? invoice.dueDate.toISOString().split("T")[0] : ""}</p>
              </div>
            ) : (
              <p className="text-muted-foreground pt-1">No initial invoice will be generated.</p>
            )}
          </div>
        </div>

        {/* Audit Notice */}
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-2.5 text-xs text-primary">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Clicking <strong>Launch Client Operations</strong> will atomically commit all configured records and log an immutable record to the Audit Ledger. You will be redirected immediately to the client&apos;s new 360° Operations Hub.
          </p>
        </div>
      </CardContent>

      <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
        <Button
          size="sm"
          disabled={isPending}
          onClick={onLaunch}
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 shadow-sm"
        >
          <Rocket className="w-4 h-4" />
          <span>{isPending ? "Deploying Client..." : "Launch Client Operations"}</span>
        </Button>
      </div>
    </Card>
  );
}
