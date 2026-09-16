"use client";

import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { SearchInput } from "~/components/SearchInput";

type ContractStatusFilter = "ALL" | "ACTIVE" | "DRAFT" | "TERMINATED";

interface ContractFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: ContractStatusFilter;
  onStatusFilterChange: (status: ContractStatusFilter) => void;
}

export function ContractFilterBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: ContractFilterBarProps) {
  return (
    <Card className="p-3 sm:p-4">
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Search contract #, title, client..."
          className="w-full md:w-80"
        />
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {(["ALL", "ACTIVE", "DRAFT", "TERMINATED"] as const).map((st) => (
            <Button
              key={st}
              variant={statusFilter === st ? "default" : "outline"}
              size="sm"
              onClick={() => onStatusFilterChange(st)}
              className="text-xs"
            >
              {st === "ALL" ? "All Contracts" : st}
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
