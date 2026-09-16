"use client";

import { KeyRound } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { formatDate } from "~/lib/utils/format";

interface PortalLicensesSectionProps {
  licenses?: any[];
}

export function PortalLicensesSection({ licenses }: PortalLicensesSectionProps) {
  return (
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
  );
}
