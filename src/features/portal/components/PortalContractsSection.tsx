"use client";

import { FileSignature } from "lucide-react";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { formatCurrency, formatDate } from "~/lib/utils/format";

interface PortalContractsSectionProps {
  contracts?: any[];
}

export function PortalContractsSection({ contracts }: PortalContractsSectionProps) {
  return (
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
                  <td className="py-3.5 px-5">
                    <p className="font-semibold text-xs sm:text-sm text-foreground">{c.title}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{c.contractNumber}</p>
                  </td>
                  <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                    {c.billingCycle}
                  </td>
                  <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                    {formatDate(c.startDate)}
                  </td>
                  <td className="py-3.5 px-5">
                    <Badge variant={c.status === "ACTIVE" ? "success" : "secondary"}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono font-semibold text-xs sm:text-sm text-foreground">
                    {formatCurrency(c.value, c.currency)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
