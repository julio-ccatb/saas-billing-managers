"use client";

import { History, Info } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Pagination } from "~/components/Pagination";
import { AuditActionBadge } from "~/features/audit/components/AuditActionBadge";
import { formatDate } from "~/lib/utils/format";

interface AuditItem {
  id: string;
  action: string;
  createdAt: Date | string;
  operatorId: string;
  entityType: string;
  entityId: string;
  reason?: string | null;
  metadata?: string | null;
}

interface AuditTableProps {
  items: AuditItem[] | undefined;
  isLoading: boolean;
  searchTerm: string;
  actionFilter: string;
  entityFilter: string;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onInspect: (log: AuditItem) => void;
}

export function AuditTable({
  items,
  isLoading,
  searchTerm,
  actionFilter,
  entityFilter,
  page,
  totalPages,
  onPageChange,
  onInspect,
}: AuditTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              <th className="py-3 px-5">Timestamp</th>
              <th className="py-3 px-5">Action</th>
              <th className="py-3 px-5">Entity</th>
              <th className="py-3 px-5">Operator</th>
              <th className="py-3 px-5">Rationale</th>
              <th className="py-3 px-5 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  Loading audit records...
                </td>
              </tr>
            ) : !items || items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-muted-foreground space-y-2">
                  <History className="w-8 h-8 mx-auto text-muted-foreground/40" />
                  <p className="text-sm font-semibold">No audit entries found</p>
                  <p className="text-xs">
                    {searchTerm || actionFilter !== "ALL" || entityFilter !== "ALL"
                      ? "Try clearing filters to see recorded actions."
                      : "Actions will appear here as services and contracts are managed."}
                  </p>
                </td>
              </tr>
            ) : (
              items.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <AuditActionBadge action={log.action} />
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <span className="font-semibold text-foreground">{log.entityType}</span>
                      <span className="text-muted-foreground/70 text-[11px] truncate max-w-[120px]">
                        ({log.entityId.slice(-8)})
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 font-mono text-xs text-foreground whitespace-nowrap">
                    {log.operatorId.split("@")[0]}
                  </td>
                  <td className="py-3.5 px-5">
                    <p className="text-xs text-foreground font-medium max-w-md line-clamp-2">
                      {log.reason || "No explicit reason logged"}
                    </p>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    {Boolean(log.metadata) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onInspect(log)}
                        className="h-7 px-2 text-xs text-primary gap-1"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </Card>
  );
}
