"use client";

import { History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { formatDate } from "~/lib/utils/format";

interface AuditLog {
  id: string;
  action: string;
  createdAt: Date | string;
  operatorId: string;
  entityType: string;
  entityId: string;
  reason?: string | null;
  metadata?: string | null;
}

interface AuditInspectDialogProps {
  log: AuditLog | null;
  onClose: () => void;
}

function parseMetadata(raw?: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function AuditInspectDialog({ log, onClose }: AuditInspectDialogProps) {
  return (
    <Dialog open={!!log} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <History className="w-5 h-5 text-primary" />
            <span>Audit Log Details</span>
          </DialogTitle>
        </DialogHeader>

        {log && (
          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-xl font-mono">
              <div>
                <p className="text-muted-foreground text-[10px] uppercase">Action</p>
                <p className="font-bold text-foreground mt-0.5">{log.action}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-[10px] uppercase">Timestamp</p>
                <p className="text-foreground mt-0.5">{formatDate(log.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-[10px] uppercase">Operator</p>
                <p className="text-foreground mt-0.5">{log.operatorId}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-[10px] uppercase">Entity</p>
                <p className="text-foreground mt-0.5">
                  {log.entityType} ({log.entityId})
                </p>
              </div>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-1">Operator Rationale:</p>
              <p className="p-3 bg-muted/20 border border-border rounded-lg text-foreground leading-relaxed">
                {log.reason}
              </p>
            </div>

            {Boolean(log.metadata) && (
              <div>
                <p className="font-semibold text-foreground mb-1">Captured Metadata Payload:</p>
                <pre className="p-3 bg-card border border-border rounded-lg font-mono text-[11px] overflow-x-auto text-foreground">
                  {JSON.stringify(parseMetadata(log.metadata), null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
