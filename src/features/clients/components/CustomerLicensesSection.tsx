"use client";

import Link from "next/link";
import { KeyRound, ExternalLink, ShieldAlert, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { formatDate } from "~/lib/utils/format";
import { AppRoutes } from "~/config/routes";

interface CustomerLicensesSectionProps {
  licenses?: any[];
  onOpenKillSwitch: (license: any) => void;
}

export function CustomerLicensesSection({
  licenses,
  onOpenKillSwitch,
}: CustomerLicensesSectionProps) {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-5 border-b border-border flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            <span>Managed Software Licenses &amp; Kill-Switch</span>
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Client software leases, heartbeat verification, and remote revocation switchboard
          </p>
        </div>
        <Button
          render={<Link href={AppRoutes.LICENSES} />}
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
        >
          <span>All Licenses</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Button>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              <th className="py-3 px-5">Service</th>
              <th className="py-3 px-5">License Key</th>
              <th className="py-3 px-5">Domain Lock</th>
              <th className="py-3 px-5">Heartbeat</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5 text-right">Switchboard</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!licenses || licenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                  No software licenses provisioned for this customer.
                </td>
              </tr>
            ) : (
              licenses.map((lic) => {
                const isActive = lic.status === "ACTIVE";
                return (
                  <tr key={lic.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-foreground text-xs sm:text-sm">
                      {lic.name}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="inline-flex items-center gap-1.5 bg-muted/60 px-2 py-1 rounded font-mono text-xs text-foreground">
                        <span>{lic.keyPrefix}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                      {lic.allowedDomain || "Any domain"}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                      {lic.lastCheckedAt ? formatDate(lic.lastCheckedAt) : "Never verified"}
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge variant={isActive ? "success" : "destructive"}>
                        {lic.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Button
                        variant={isActive ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => onOpenKillSwitch(lic)}
                        className="text-xs gap-1"
                      >
                        {isActive ? (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Suspend</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Reactivate</span>
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
