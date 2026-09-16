"use client";

import React from "react";
import { FileSignature, Calendar, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "~/components/ui/table";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "~/components/ui/empty";
import { formatCurrency, formatDate } from "~/lib/utils/format";

interface PortalContractsSectionProps {
  contracts?: any[];
}

export function PortalContractsSection({ contracts }: PortalContractsSectionProps) {
  const hasContracts = contracts && contracts.length > 0;

  return (
    <Card className="overflow-hidden border-border/80 shadow-xs">
      <CardHeader className="p-4 sm:p-5 border-b border-border/60 flex flex-row items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <FileSignature className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-foreground">Service Agreements &amp; Contracts</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Active enterprise commitments and terms</p>
          </div>
        </div>
      </CardHeader>

      {!hasContracts ? (
        <div className="p-8">
          <Empty className="py-6">
            <EmptyMedia variant="icon">
              <FileSignature className="w-4 h-4 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>No Contracts on Record</EmptyTitle>
            <EmptyDescription>
              There are no service level agreements or signed enterprise contracts associated with your account.
            </EmptyDescription>
          </Empty>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 text-xs font-semibold text-muted-foreground border-border/60">
                <TableHead className="py-3 px-5">Contract Title</TableHead>
                <TableHead className="py-3 px-5">Billing Cycle</TableHead>
                <TableHead className="py-3 px-5">Effective Date</TableHead>
                <TableHead className="py-3 px-5">Status</TableHead>
                <TableHead className="py-3 px-5 text-right">Commitment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/60">
              {contracts.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="py-3.5 px-5">
                    <p className="font-semibold text-xs sm:text-sm text-foreground">{c.title}</p>
                    <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{c.contractNumber}</p>
                  </TableCell>
                  <TableCell className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                    {c.billingCycle}
                  </TableCell>
                  <TableCell className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
                    {formatDate(c.startDate)}
                  </TableCell>
                  <TableCell className="py-3.5 px-5">
                    <Badge variant={c.status === "ACTIVE" ? "success" : "secondary"} className="text-[10px] px-2 py-0.5">
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3.5 px-5 text-right font-mono font-semibold text-xs sm:text-sm text-foreground tabular-nums">
                    {formatCurrency(c.value, c.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
