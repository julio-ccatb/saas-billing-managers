"use client";

import React, { useState } from "react";
import { 
  History, 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  KeyRound, 
  FileSignature, 
  Receipt, 
  User, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Info
} from "lucide-react";
import { api } from "~/trpc/react";
import { formatDate } from "~/lib/utils/format";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

export default function AuditTrailPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [inspectLog, setInspectLog] = useState<any>(null);

  const pageSize = 20;

  const { data, isLoading } = api.audit.getAll.useQuery({
    page,
    pageSize,
    action: actionFilter !== "ALL" ? actionFilter : undefined,
    entityType: entityFilter !== "ALL" ? entityFilter : undefined,
    search: searchTerm,
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "SERVICE_SUSPENDED":
        return <Badge variant="destructive">Service Suspended</Badge>;
      case "SERVICE_ACTIVATED":
        return <Badge variant="success">Service Activated</Badge>;
      case "SERVICE_DELETED":
        return <Badge variant="destructive">Service Deleted</Badge>;
      case "KEY_REGENERATED":
        return <Badge variant="warning">Key Rotated</Badge>;
      case "CONTRACT_CREATED":
        return <Badge variant="secondary">Contract Created</Badge>;
      case "CONTRACT_TERMINATED":
        return <Badge variant="destructive">Contract Terminated</Badge>;
      case "BILLING_OVERRIDE":
        return <Badge variant="outline">Billing Override</Badge>;
      case "CUSTOMER_DELETED":
        return <Badge variant="destructive">Customer Deleted</Badge>;
      default:
        return <Badge variant="secondary">{action.replace(/_/g, " ")}</Badge>;
    }
  };

  const parseMetadata = (raw?: string | null) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
              Immutable Governance
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mt-0.5">
            Operations &amp; Security Audit Ledger
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Chronological, immutable audit trail of operator actions, status overrides, and service revocations
          </p>
        </div>
        <div className="font-mono text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg self-start sm:self-auto">
          Total Recorded: <span className="font-bold text-foreground">{data?.total ?? 0}</span> events
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search by rationale, operator, or ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Action Filter */}
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 rounded-md border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Actions</option>
              <option value="SERVICE_SUSPENDED">Service Suspended</option>
              <option value="SERVICE_ACTIVATED">Service Activated</option>
              <option value="KEY_REGENERATED">Key Rotated</option>
              <option value="SERVICE_DELETED">Service Deleted</option>
              <option value="CONTRACT_CREATED">Contract Created</option>
              <option value="CONTRACT_TERMINATED">Contract Terminated</option>
              <option value="BILLING_OVERRIDE">Billing Override</option>
            </select>

            {/* Entity Filter */}
            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 px-3 rounded-md border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Entities</option>
              <option value="LICENSE">License / Service</option>
              <option value="CONTRACT">Contract</option>
              <option value="INVOICE">Invoice</option>
              <option value="CUSTOMER">Customer</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Audit Data Table */}
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
              ) : !data?.items || data.items.length === 0 ? (
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
                data.items.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      {getActionBadge(log.action)}
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
                          onClick={() => setInspectLog(log)}
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

        {/* Pagination Footer */}
        {Boolean(data && data.totalPages > 1) && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Showing page <span className="font-bold text-foreground font-mono">{page}</span> of{" "}
              <span className="font-bold text-foreground font-mono">{data?.totalPages ?? 1}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="gap-1 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!data || page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="gap-1 text-xs"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* INSPECT METADATA MODAL */}
      <Dialog open={!!inspectLog} onOpenChange={() => setInspectLog(null)}>
        <DialogContent className="sm:max-w-lg border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <History className="w-5 h-5 text-primary" />
              <span>Audit Log Details</span>
            </DialogTitle>
          </DialogHeader>

          {inspectLog && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-xl font-mono">
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase">Action</p>
                  <p className="font-bold text-foreground mt-0.5">{inspectLog.action}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase">Timestamp</p>
                  <p className="text-foreground mt-0.5">{formatDate(inspectLog.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase">Operator</p>
                  <p className="text-foreground mt-0.5">{inspectLog.operatorId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase">Entity</p>
                  <p className="text-foreground mt-0.5">
                    {inspectLog.entityType} ({inspectLog.entityId})
                  </p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-foreground mb-1">Operator Rationale:</p>
                <p className="p-3 bg-muted/20 border border-border rounded-lg text-foreground leading-relaxed">
                  {inspectLog.reason}
                </p>
              </div>

              {Boolean(inspectLog.metadata) && (
                <div>
                  <p className="font-semibold text-foreground mb-1">Captured Metadata Payload:</p>
                  <pre className="p-3 bg-card border border-border rounded-lg font-mono text-[11px] overflow-x-auto text-foreground">
                    {JSON.stringify(parseMetadata(inspectLog.metadata), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
