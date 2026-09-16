"use client";

import { Card } from "~/components/ui/card";
import { SearchInput } from "~/components/SearchInput";

interface AuditFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  actionFilter: string;
  onActionFilterChange: (value: string) => void;
  entityFilter: string;
  onEntityFilterChange: (value: string) => void;
}

export function AuditFilterBar({
  searchTerm,
  onSearchChange,
  actionFilter,
  onActionFilterChange,
  entityFilter,
  onEntityFilterChange,
}: AuditFilterBarProps) {
  return (
    <Card className="p-3 sm:p-4">
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Search by rationale, operator, or ID..."
          className="w-full md:w-80"
        />

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => onActionFilterChange(e.target.value)}
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
            onChange={(e) => onEntityFilterChange(e.target.value)}
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
  );
}
