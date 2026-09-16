"use client";

import React, { useState } from "react";
import { api } from "~/trpc/react";
import { AuditFilterBar } from "~/features/audit/components/AuditFilterBar";
import { AuditTable } from "~/features/audit/components/AuditTable";
import { AuditInspectDialog } from "~/features/audit/components/AuditInspectDialog";

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

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleActionFilterChange = (value: string) => {
    setActionFilter(value);
    setPage(1);
  };

  const handleEntityFilterChange = (value: string) => {
    setEntityFilter(value);
    setPage(1);
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

      <AuditFilterBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        actionFilter={actionFilter}
        onActionFilterChange={handleActionFilterChange}
        entityFilter={entityFilter}
        onEntityFilterChange={handleEntityFilterChange}
      />

      <AuditTable
        items={data?.items}
        isLoading={isLoading}
        searchTerm={searchTerm}
        actionFilter={actionFilter}
        entityFilter={entityFilter}
        page={page}
        totalPages={data?.totalPages ?? 1}
        onPageChange={setPage}
        onInspect={setInspectLog}
      />

      <AuditInspectDialog log={inspectLog} onClose={() => setInspectLog(null)} />
    </div>
  );
}
