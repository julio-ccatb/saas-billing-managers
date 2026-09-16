"use client";

import React, { useState } from "react";
import { KeyRound, Copy, Check, ShieldCheck, Globe, Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "~/components/ui/empty";
import { formatDate } from "~/lib/utils/format";

interface PortalLicensesSectionProps {
  licenses?: any[];
}

export function PortalLicensesSection({ licenses }: PortalLicensesSectionProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const hasLicenses = licenses && licenses.length > 0;

  return (
    <Card className="lg:col-span-5 overflow-hidden flex flex-col border-border/80 shadow-xs">
      <CardHeader className="p-4 sm:p-5 border-b border-border/60 flex flex-row items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-foreground">Software Licenses</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Runtime access keys &amp; domain locks</p>
          </div>
        </div>
        <Badge variant="outline" className="font-mono text-[11px] px-2 py-0.5">
          {licenses?.length ?? 0} active
        </Badge>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 flex-1 space-y-3.5">
        {!hasLicenses ? (
          <Empty className="py-8">
            <EmptyMedia variant="icon">
              <KeyRound className="w-4 h-4 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>No Licenses Provisioned</EmptyTitle>
            <EmptyDescription>
              No active software licenses or API keys are currently assigned to this account.
            </EmptyDescription>
          </Empty>
        ) : (
          licenses.map((lic) => {
            const isActive = lic.status === "ACTIVE";
            return (
              <div 
                key={lic.id} 
                className="p-3.5 rounded-xl border border-border/70 bg-card/60 hover:bg-muted/20 transition-colors space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-semibold text-xs text-foreground truncate">{lic.name}</span>
                  </div>
                  <Badge variant={isActive ? "success" : "destructive"} className="text-[10px] px-2 py-0.5">
                    {lic.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-muted/60 border border-border/60 font-mono text-xs">
                  <span className="text-foreground truncate select-all">
                    {lic.keyPrefix}••••••••••••
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyKey(lic.keyPrefix, lic.id)}
                    className="text-muted-foreground hover:text-foreground ml-2 p-1 cursor-pointer transition-colors"
                    title="Copy Key Prefix"
                  >
                    {copiedId === lic.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-0.5">
                  <span className="flex items-center gap-1 truncate" title={lic.allowedDomain || "Any domain"}>
                    <Globe className="w-3 h-3 text-muted-foreground/80 shrink-0" />
                    <span className="truncate">{lic.allowedDomain || "Any domain"}</span>
                  </span>
                  <span className="flex items-center gap-1 justify-end font-mono text-[10px]">
                    <Activity className="w-3 h-3 text-muted-foreground/80 shrink-0" />
                    <span>{lic.lastCheckedAt ? formatDate(lic.lastCheckedAt) : "No ping"}</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
