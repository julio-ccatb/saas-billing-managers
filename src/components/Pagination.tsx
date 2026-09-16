"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
      <div>
        Showing page{" "}
        <span className="font-bold text-foreground font-mono">{page}</span> of{" "}
        <span className="font-bold text-foreground font-mono">{totalPages}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="gap-1 text-xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="gap-1 text-xs"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
