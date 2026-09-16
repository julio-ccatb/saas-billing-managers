"use client";

import { History, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { AuditActionBadge } from "~/features/audit/components/AuditActionBadge";
import { formatDate } from "~/lib/utils/format";
import { AppRoutes } from "~/config/routes";

interface AuditLogEntry {
  id: string;
  action: string;
  createdAt: Date | string;
  operatorId: string;
  entityType: string;
  reason?: string | null;
}

interface AuditFeedProps {
  logs: AuditLogEntry[] | undefined;
  isLoading: boolean;
}

export function AuditFeed({ logs, isLoading }: AuditFeedProps) {
  return (
    <Card className="overflow-hidden flex flex-col">
      <CardHeader className="p-4 sm:p-5 border-b border-border flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <div>
            <CardTitle className="text-base sm:text-lg">Audit Ledger</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Immutable operator trail</p>
          </div>
        </div>
        <Button
          render={<Link href={AppRoutes.AUDIT} />}
          variant="ghost"
          size="sm"
          className="text-xs gap-1 text-primary hover:text-primary"
        >
          <span>Audit Hub</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </CardHeader>

      <CardContent className="p-4 flex-1">
        {isLoading ? (
          <p className="text-xs text-muted-foreground text-center py-8">Loading audit trail...</p>
        ) : !logs || logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground space-y-1">
            <History className="w-8 h-8 mx-auto text-muted-foreground/40" />
            <p className="text-xs">No audit events recorded yet</p>
            <p className="text-[11px] text-muted-foreground/60">
              Destructive actions and status changes will be securely logged here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <AuditActionBadge action={log.action} />
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {formatDate(log.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-foreground font-medium leading-snug">
                  {log.reason || "Action performed by operator"}
                </p>
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-0.5">
                  <span>Operator: {log.operatorId.split("@")[0]}</span>
                  <span className="uppercase">{log.entityType}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
